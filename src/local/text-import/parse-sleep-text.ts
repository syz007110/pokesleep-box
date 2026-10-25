import { COMPLETE_POKEDEX } from 'sleepapi-common'
import {
  INGREDIENT_ALIASES,
  NATURE_ALIASES,
  SPECIES_EXTRA,
  SPECIES_ZH,
  SUBSKILL_ALIASES
} from './aliases'

export interface ParsedSubskill {
  name: string
  level: number | null
}

export interface ParsedSleepText {
  speciesName: string | null
  level: number | null
  natureName: string | null
  ingredientNames: string[]
  subskills: ParsedSubskill[]
  skillLevel: number | null
  nickname: string | null
  shiny: boolean | null
  gender: 'male' | 'female' | null
  ribbon: number | null
  warnings: string[]
  skipped: string[]
}

type Field =
  | 'species'
  | 'level'
  | 'nature'
  | 'ingredients'
  | 'subskills'
  | 'skillLevel'
  | 'nickname'
  | 'shiny'
  | 'gender'
  | 'ribbon'
  | 'name'

interface AliasEntry {
  key: string
  value: string
}

interface Span {
  start: number
  end: number
  value: string
}

const LABEL_SOURCE = [
  '技能等级',
  '技能等級',
  '主技能等级',
  '主技能等級',
  'skill\\s*level',
  'main\\s*skill',
  '副技能',
  '子技能',
  'sub\\s*skills?',
  '食材',
  'ingredients?',
  '物种',
  '物種',
  '种类',
  '種類',
  '宝可梦',
  '寶可夢',
  'pokemon',
  'species',
  '昵称',
  '暱稱',
  '外号',
  '外號',
  'nickname',
  '性格',
  'nature',
  '异色',
  '異色',
  '闪光',
  '閃光',
  'shiny',
  '性别',
  '性別',
  'gender',
  '缎带',
  '緞帶',
  'ribbon',
  '等级',
  '等級',
  'level',
  'lv\\.?',
  '名字',
  'name'
].join('|')

const LABEL_RE = new RegExp(`(${LABEL_SOURCE})\\s*[:：]`, 'gi')

const FORM_UPGRADES: Array<{ base: string; next: string; hint: RegExp; note: string }> = [
  {
    base: 'PIKACHU',
    next: 'PIKACHU_HALLOWEEN',
    hint: /万圣节|萬聖節|halloween/i,
    note: '文字里有万圣节，先当成万圣节皮卡丘'
  },
  {
    base: 'PIKACHU',
    next: 'PIKACHU_CAPTAIN',
    hint: /船长|船長|队长|隊長|captain/i,
    note: '文字里有船长/队长，先当成船长皮卡丘'
  },
  {
    base: 'PIKACHU',
    next: 'PIKACHU_HOLIDAY',
    hint: /假日|圣诞|聖誕|holiday/i,
    note: '文字里有假日，先当成假日皮卡丘'
  },
  {
    base: 'EEVEE',
    next: 'EEVEE_HALLOWEEN',
    hint: /万圣节|萬聖節|halloween/i,
    note: '文字里有万圣节，先当成万圣节伊布'
  },
  {
    base: 'EEVEE',
    next: 'EEVEE_HOLIDAY',
    hint: /假日|圣诞|聖誕|holiday/i,
    note: '文字里有假日，先当成假日伊布'
  },
  {
    base: 'NINETALES',
    next: 'NINETALES_ALOLAN',
    hint: /阿罗拉|阿羅拉|alola/i,
    note: '文字里有阿罗拉，先当成阿罗拉九尾'
  },
  {
    base: 'VULPIX',
    next: 'VULPIX_ALOLAN',
    hint: /阿罗拉|阿羅拉|alola/i,
    note: '文字里有阿罗拉，先当成阿罗拉六尾'
  },
  {
    base: 'WOOPER',
    next: 'WOOPER_PALDEAN',
    hint: /帕底亚|帕底亞|paldea/i,
    note: '文字里有帕底亚，先当成帕底亚乌波'
  },
  {
    base: 'SPHEAL',
    next: 'SPHEAL_HOLIDAY',
    hint: /假日海豹|海豹球.{0,4}(假日|圣诞|聖誕)|(假日|圣诞|聖誕).{0,4}海豹球|holiday/i,
    note: '文字里有假日海豹球，先当成假日形态'
  }
]

function entriesFrom(table: Record<string, readonly string[]>): AliasEntry[] {
  const entries: AliasEntry[] = []
  for (const [value, aliases] of Object.entries(table)) {
    for (const alias of aliases) {
      const key = aliasKey(alias)
      if (key) entries.push({ key, value })
    }
    const own = aliasKey(value)
    if (own) entries.push({ key: own, value })
  }
  entries.sort((a, b) => b.key.length - a.key.length)
  return entries
}

const speciesEntries = (() => {
  const entries: AliasEntry[] = []
  for (const pokemon of COMPLETE_POKEDEX) {
    const zh = SPECIES_ZH[pokemon.name]
    for (const alias of [pokemon.displayName, pokemon.name, zh]) {
      if (!alias) continue
      const key = aliasKey(alias)
      if (key) entries.push({ key, value: pokemon.name })
    }
  }
  for (const [alias, value] of SPECIES_EXTRA) {
    const key = aliasKey(alias)
    if (key) entries.push({ key, value })
  }
  entries.sort((a, b) => b.key.length - a.key.length)
  return entries
})()

const natureEntries = entriesFrom(NATURE_ALIASES)
const ingredientEntries = entriesFrom(INGREDIENT_ALIASES)
const subskillEntries = entriesFrom(SUBSKILL_ALIASES)

export function aliasKey(value: string): string {
  return analyze(value.normalize('NFKC')).compact
}

function analyze(text: string): { compact: string; map: number[] } {
  let compact = ''
  const map: number[] = []
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (/[\s·.'’"_:/\\,，;；|@()（）【】\[\]\-+]/.test(ch)) continue
    compact += ch.toLowerCase()
    map.push(i)
  }
  return { compact, map }
}

function findSpans(text: string, entries: AliasEntry[]): Span[] {
  const { compact, map } = analyze(text)
  const spans: Span[] = []
  let index = 0
  while (index < compact.length) {
    let matched: AliasEntry | null = null
    for (const entry of entries) {
      if (compact.startsWith(entry.key, index)) {
        matched = entry
        break
      }
    }
    if (!matched) {
      index += 1
      continue
    }
    const start = map[index]
    const end = map[index + matched.key.length - 1] + 1
    spans.push({ start, end, value: matched.value })
    index += matched.key.length
  }
  return spans
}

function blankRanges(text: string, ranges: Array<{ start: number; end: number }>): string {
  if (ranges.length === 0) return text
  const chars = text.split('')
  for (const range of ranges) {
    for (let i = range.start; i < range.end && i < chars.length; i++) chars[i] = ' '
  }
  return chars.join('')
}

function expandLevelSuffix(text: string, end: number): number {
  const rest = text.slice(end)
  const match = /^(?:[\s,，;；|/]*)(?:(?:lv\.?|等级|等級)\s*)?@?\s*\d{1,3}/i.exec(rest)
  return match ? end + match[0].length : end
}

function firstNumber(value: string): number | null {
  const match = value.match(/\d{1,3}/)
  return match ? Number(match[0]) : null
}

function fieldForLabel(label: string): Field {
  const key = aliasKey(label)
  if (/技能等级|主技能等级|skilllevel|mainskill/.test(key)) return 'skillLevel'
  if (/副技能|子技能|subskill/.test(key)) return 'subskills'
  if (/食材|ingredient/.test(key)) return 'ingredients'
  if (/物种|物種|種類|种类|宝可梦|寶可夢|pokemon|species/.test(key)) return 'species'
  if (/昵称|暱称|暱稱|外号|外號|nickname/.test(key)) return 'nickname'
  if (/性格|nature/.test(key)) return 'nature'
  if (/异色|異色|闪光|閃光|shiny/.test(key)) return 'shiny'
  if (/性别|性別|gender/.test(key)) return 'gender'
  if (/缎带|緞帶|ribbon/.test(key)) return 'ribbon'
  if (key === 'level' || key === 'lv' || key === '等级' || key === '等級') return 'level'
  return 'name'
}

function normalizePaste(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .replace(/、/g, ',')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim()
}

function parseYes(value: string): boolean | null {
  const key = aliasKey(value)
  if (/^(1|yes|true|y|是|有|异色|闪光|shiny)$/.test(key)) return true
  if (/^(0|no|false|n|否|无|没有|不是)$/.test(key)) return false
  return null
}

function parseGender(value: string): 'male' | 'female' | null {
  if (/男|雄|公|male|♂/i.test(value)) return 'male'
  if (/女|雌|母|female|♀/i.test(value)) return 'female'
  return null
}

function parseRibbon(value: string): number | null {
  const hours = value.match(/\d{3,4}/)
  if (hours) {
    const n = Number(hours[0])
    if (n >= 2000) return 4
    if (n >= 1000) return 3
    if (n >= 500) return 2
    if (n >= 200) return 1
    return 0
  }
  const digit = value.match(/\d/)
  if (digit && Number(digit[0]) <= 4) return Number(digit[0])
  return null
}

function parseSubskillValue(value: string): ParsedSubskill[] {
  const spans = findSpans(value, subskillEntries)
  return spans.map((span, index) => {
    const next = spans[index + 1]?.start ?? value.length
    const between = value.slice(span.end, next)
    const inside = value.slice(span.start, span.end)
    return { name: span.value, level: firstNumber(between) ?? firstNumber(inside) }
  })
}

function parseIngredientValue(value: string): string[] {
  const parts = value
    .split(/[/|,，;；]+/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length > 1) {
    const names: string[] = []
    for (const part of parts) {
      const hit = findSpans(part, ingredientEntries)[0]
      if (hit) names.push(hit.value)
    }
    return names.slice(0, 3)
  }
  return findSpans(value, ingredientEntries)
    .map((span) => span.value)
    .slice(0, 3)
}

function applyField(parsed: ParsedSleepText, field: Field, value: string) {
  if (!value) return
  switch (field) {
    case 'species': {
      const hit = findSpans(value, speciesEntries)[0]
      if (hit && !parsed.speciesName) parsed.speciesName = hit.value
      else if (!hit) parsed.warnings.push(`没有认出物种「${value.slice(0, 24)}」`)
      break
    }
    case 'level': {
      const level = firstNumber(value)
      if (level != null && parsed.level == null) parsed.level = level
      break
    }
    case 'nature': {
      const hit = findSpans(value, natureEntries)[0]
      if (hit && !parsed.natureName) parsed.natureName = hit.value
      else if (!hit) parsed.warnings.push(`没有认出性格「${value.slice(0, 24)}」`)
      break
    }
    case 'ingredients': {
      if (parsed.ingredientNames.length === 0) parsed.ingredientNames = parseIngredientValue(value)
      break
    }
    case 'subskills': {
      if (parsed.subskills.length === 0) parsed.subskills = parseSubskillValue(value).slice(0, 5)
      break
    }
    case 'skillLevel': {
      const level = firstNumber(value)
      if (level != null && parsed.skillLevel == null) parsed.skillLevel = level
      break
    }
    case 'nickname': {
      if (!parsed.nickname) parsed.nickname = value.replace(/\s+/g, ' ').trim()
      break
    }
    case 'shiny': {
      if (parsed.shiny == null) parsed.shiny = parseYes(value)
      break
    }
    case 'gender': {
      if (!parsed.gender) parsed.gender = parseGender(value)
      break
    }
    case 'ribbon': {
      if (parsed.ribbon == null) parsed.ribbon = parseRibbon(value)
      break
    }
    case 'name': {
      const hit = findSpans(value, speciesEntries)[0]
      if (hit && !parsed.speciesName) parsed.speciesName = hit.value
      else if (!parsed.nickname) parsed.nickname = value.replace(/\s+/g, ' ').trim()
      break
    }
  }
}

function extractKeyed(text: string, parsed: ParsedSleepText): string {
  const matches = [...text.matchAll(new RegExp(LABEL_RE.source, 'gi'))]
  if (matches.length === 0) return text
  const ranges: Array<{ start: number; end: number }> = []
  matches.forEach((match, index) => {
    const start = match.index ?? 0
    const valueStart = start + match[0].length
    const valueEnd = matches[index + 1]?.index ?? text.length
    const value = text.slice(valueStart, valueEnd).trim()
    applyField(parsed, fieldForLabel(match[1] ?? ''), value)
    ranges.push({ start, end: valueEnd })
  })
  return blankRanges(text, ranges)
}

function consumeSkillLevel(text: string, parsed: ParsedSleepText): string {
  const match =
    /(?:技能等级|技能等級|主技能等级|主技能等級|skill\s*level|main\s*skill|主技能)\s*[:：]?\s*(?:lv\.?\s*)?(\d{1,2})/i.exec(
      text
    )
  if (!match || match.index == null) return text
  if (parsed.skillLevel == null) parsed.skillLevel = Number(match[1])
  return blankRanges(text, [{ start: match.index, end: match.index + match[0].length }])
}

function consumeLevel(text: string, parsed: ParsedSleepText) {
  if (parsed.level != null) return
  const labeled = /(?:等级|等級|level|lv\.?)\s*[:：]?\s*(\d{1,3})/i.exec(text)
  if (labeled) {
    parsed.level = Number(labeled[1])
    return
  }
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (/^\d{1,3}$/.test(trimmed)) {
      const level = Number(trimmed)
      if (level >= 1 && level <= 100) {
        parsed.level = level
        return
      }
    }
  }
}

function noteAmbiguousGrades(text: string, parsed: ParsedSleepText) {
  const checks: Array<{ pattern: RegExp; names: string[]; message: string }> = [
    {
      pattern: /帮忙速度|幫忙速度|帮助速度|帮速/,
      names: ['Helping Speed S', 'Helping Speed M'],
      message: '帮忙速度没看清是 S 还是 M'
    },
    {
      pattern: /食材几率|食材機率|食材概率|食材发现|食材获得/,
      names: ['Ingredient Finder S', 'Ingredient Finder M'],
      message: '食材几率没看清是 S 还是 M'
    },
    {
      pattern: /持有上限|携带上限|攜帶上限|背包/,
      names: ['Inventory Up S', 'Inventory Up M', 'Inventory Up L'],
      message: '持有上限没看清是 S、M 还是 L'
    },
    {
      pattern: /技能几率|技能機率|技能概率|技能发动/,
      names: ['Skill Trigger S', 'Skill Trigger M'],
      message: '技能几率没看清是 S 还是 M'
    },
    {
      pattern: /技能等级提升|技能等級提升/,
      names: ['Skill Level Up S', 'Skill Level Up M'],
      message: '技能等级提升没看清是 S 还是 M'
    }
  ]
  for (const check of checks) {
    if (!check.pattern.test(text)) continue
    if (parsed.subskills.some((subskill) => check.names.includes(subskill.name))) continue
    parsed.warnings.push(check.message)
  }
}

function applyFormHints(text: string, parsed: ParsedSleepText) {
  if (!parsed.speciesName) return
  for (const rule of FORM_UPGRADES) {
    if (parsed.speciesName !== rule.base) continue
    if (!rule.hint.test(text)) continue
    parsed.speciesName = rule.next
    parsed.warnings.push(rule.note)
    return
  }
  if (parsed.speciesName === 'TOXTRICITY_AMPED' && !/高调|低調|低调|amped/i.test(text)) {
    parsed.warnings.push('颤弦蝾螈有高调和低调，先按高调')
  }
  if (
    (parsed.speciesName === 'PUMPKABOO_MEDIUM' || parsed.speciesName === 'GOURGEIST_MEDIUM') &&
    !/小|大|特大|jumbo|small|large|medium/i.test(text)
  ) {
    parsed.warnings.push('这只有体型差别，先按普通尺寸')
  }
}

function leftovers(text: string): string[] {
  const bits: string[] = []
  for (const line of text.split('\n')) {
    const cleaned = line.replace(/[\s\d@.:：,，;/|+_-]+/g, ' ').trim()
    if (cleaned.length < 2) continue
    if (/^(rp|cp|exp|lv|level|pokemon|sleep)$/i.test(cleaned)) continue
    bits.push(cleaned.slice(0, 32))
    if (bits.length >= 8) break
  }
  return bits
}

export function parseSleepText(raw: string): ParsedSleepText {
  const text = normalizePaste(raw)
  const parsed: ParsedSleepText = {
    speciesName: null,
    level: null,
    natureName: null,
    ingredientNames: [],
    subskills: [],
    skillLevel: null,
    nickname: null,
    shiny: null,
    gender: null,
    ribbon: null,
    warnings: [],
    skipped: []
  }
  if (!text) {
    parsed.warnings.push('还没有文字')
    return parsed
  }

  let rest = extractKeyed(text, parsed)

  const speciesHits = findSpans(rest, speciesEntries)
  if (!parsed.speciesName && speciesHits[0]) parsed.speciesName = speciesHits[0].value
  const distinctSpecies = [...new Set(speciesHits.map((hit) => hit.value))]
  if (distinctSpecies.length > 1) {
    parsed.warnings.push(`还看到了其他物种，先用第一个`)
  }
  rest = blankRanges(rest, speciesHits)

  const natureHits = findSpans(rest, natureEntries)
  if (!parsed.natureName && natureHits[0]) parsed.natureName = natureHits[0].value
  rest = blankRanges(rest, natureHits)

  const subskillHits = findSpans(rest, subskillEntries).slice(0, 5)
  if (parsed.subskills.length === 0 && subskillHits.length > 0) {
    parsed.subskills = subskillHits.map((span, index) => {
      const next = subskillHits[index + 1]?.start ?? rest.length
      const between = rest.slice(span.end, next)
      return { name: span.value, level: firstNumber(between) }
    })
  }
  rest = blankRanges(
    rest,
    subskillHits.map((span) => ({ start: span.start, end: expandLevelSuffix(rest, span.end) }))
  )

  const ingredientHits = findSpans(rest, ingredientEntries)
  if (parsed.ingredientNames.length === 0) {
    parsed.ingredientNames = ingredientHits.map((hit) => hit.value).slice(0, 3)
  }
  rest = blankRanges(rest, ingredientHits)

  rest = consumeSkillLevel(rest, parsed)
  consumeLevel(rest, parsed)
  applyFormHints(text, parsed)
  noteAmbiguousGrades(text, parsed)

  if (parsed.shiny == null && /(?:^|\n)\s*(?:异色|異色|闪光|閃光|shiny)\s*(?:$|\n)/i.test(text)) {
    parsed.shiny = true
  }

  if (parsed.subskills.length > 5) parsed.subskills = parsed.subskills.slice(0, 5)
  if (parsed.ingredientNames.length > 3) parsed.ingredientNames = parsed.ingredientNames.slice(0, 3)

  parsed.skipped = leftovers(rest)
  if (!parsed.speciesName) parsed.warnings.push('没有认出物种')
  return parsed
}
