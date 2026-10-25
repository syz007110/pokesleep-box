import {
  CarrySizeUtils,
  RP,
  getNature,
  getPokemon,
  getRandomGender,
  getSubskill,
  nature,
  uuid,
  type IngredientSet,
  type Pokemon,
  type PokemonInstance
} from 'sleepapi-common'
import { INGREDIENT_ALIASES } from './aliases'
import type { ParsedSleepText } from './parse-sleep-text'

const UNLOCK_LEVELS = [10, 25, 50, 75, 100]

export interface ImportSubskill {
  name: string
  level: number
}

export interface ImportDraft {
  speciesName: string | null
  level: number
  natureName: string
  ingredientNames: [string, string, string]
  subskills: ImportSubskill[]
  skillLevel: number
  nickname: string
  shiny: boolean
  gender: 'male' | 'female' | null
  ribbon: number
  notes: string[]
}

function slotSets(pokemon: Pokemon, slot: 0 | 1 | 2): IngredientSet[] {
  if (slot === 0) return pokemon.ingredient0
  if (slot === 1) return pokemon.ingredient30
  return pokemon.ingredient60
}

export function ingredientChoices(speciesName: string, slot: 0 | 1 | 2): IngredientSet[] {
  return slotSets(getPokemon(speciesName), slot)
}

function nearestUnlock(level: number): number {
  return UNLOCK_LEVELS.reduce((best, candidate) =>
    Math.abs(candidate - level) < Math.abs(best - level) ? candidate : best
  )
}

function assignSubskills(parsed: ParsedSleepText, notes: string[]): ImportSubskill[] {
  const used = new Set<number>()
  let missing = 0
  const rows: ImportSubskill[] = []
  for (const subskill of parsed.subskills.slice(0, 5)) {
    let level: number | null = null
    if (subskill.level != null) {
      const snapped = UNLOCK_LEVELS.includes(subskill.level) ? subskill.level : nearestUnlock(subskill.level)
      if (snapped !== subskill.level) {
        notes.push(`${subskillLabel(subskill.name)} 的 ${subskill.level} 级不是解锁档，已改成 ${snapped}`)
      }
      if (!used.has(snapped)) level = snapped
      else notes.push(`${subskillLabel(subskill.name)} 的解锁等级和另一条重复，已顺延`)
    } else {
      missing += 1
    }
    if (level == null) {
      level = UNLOCK_LEVELS.find((candidate) => !used.has(candidate)) ?? 100
    }
    used.add(level)
    rows.push({ name: subskill.name, level })
  }
  if (missing > 0) notes.push('有副技能没写解锁等级，已按 10、25、50、75、100 补上')
  return rows
}

function ingredientLabel(name: string): string {
  const zh = INGREDIENT_ALIASES[name]?.find((alias) => /[\u4e00-\u9fff]/.test(alias))
  return zh ?? name
}

function subskillLabel(name: string): string {
  return getSubskill(name).shortName || name
}

function resolveIngredients(pokemon: Pokemon, names: string[], notes: string[]): [string, string, string] {
  const resolved: [string, string, string] = ['', '', '']
  for (let slot = 0; slot < 3; slot++) {
    const options = slotSets(pokemon, slot as 0 | 1 | 2)
    const wanted = names[slot]
    const match = wanted ? options.find((option) => option.ingredient.name === wanted) : undefined
    if (wanted && !match) {
      notes.push(
        `${slot === 0 ? '1' : slot === 1 ? '30' : '60'} 级栏没有「${ingredientLabel(wanted)}」，先用这项的第一份食材`
      )
    }
    resolved[slot] = (match ?? options[0]).ingredient.name
  }
  if (names.length < 3) notes.push('食材没认全，空着的栏先用该宝可梦的第一份')
  return resolved
}

export function toDraft(parsed: ParsedSleepText): ImportDraft {
  const notes = [...parsed.warnings]
  const speciesName = parsed.speciesName
  const pokemon = speciesName ? safePokemon(speciesName) : null
  if (parsed.speciesName && !pokemon) notes.push('物种不在图鉴里')

  let level = parsed.level ?? 30
  if (parsed.level == null) notes.push('没有认出等级，先按 30')
  else if (parsed.level < 1 || parsed.level > 100) {
    level = Math.min(100, Math.max(1, parsed.level))
    notes.push(`等级 ${parsed.level} 超出 1–100，已改成 ${level}`)
  }

  const natureName = parsed.natureName && safeNature(parsed.natureName) ? parsed.natureName : nature.BASHFUL.name
  if (!parsed.natureName) notes.push('没有认出性格，先按害羞（无修正）')
  else if (!safeNature(parsed.natureName)) notes.push('性格不在列表里，先按害羞')

  const ingredientNames = pokemon
    ? resolveIngredients(pokemon, parsed.ingredientNames, notes)
    : (['Apple', 'Apple', 'Apple'] as [string, string, string])

  const maxSkill = pokemon?.skill.maxLevel ?? 6
  const defaultSkill = pokemon ? pokemon.previousEvolutions + 1 : 1
  let skillLevel = parsed.skillLevel ?? defaultSkill
  if (parsed.skillLevel == null) notes.push(`没有认出主技能等级，先按 ${defaultSkill}`)
  if (skillLevel < 1 || skillLevel > maxSkill) {
    skillLevel = Math.min(maxSkill, Math.max(1, skillLevel))
    notes.push(`主技能等级已改到 1–${maxSkill}`)
  }

  let gender = parsed.gender
  if (pokemon && pokemon.genders.male + pokemon.genders.female === 0) gender = null
  else if (pokemon && gender == null) gender = getRandomGender(pokemon) ?? null

  const ribbon = parsed.ribbon == null ? 0 : Math.min(4, Math.max(0, parsed.ribbon))

  return {
    speciesName: pokemon ? speciesName : null,
    level,
    natureName,
    ingredientNames,
    subskills: assignSubskills(parsed, notes),
    skillLevel,
    nickname: parsed.nickname ?? '',
    shiny: parsed.shiny ?? false,
    gender,
    ribbon,
    notes
  }
}

function safePokemon(name: string): Pokemon | null {
  try {
    return getPokemon(name)
  } catch {
    return null
  }
}

function safeNature(name: string): boolean {
  try {
    getNature(name)
    return true
  } catch {
    return false
  }
}

export function retargetSpecies(draft: ImportDraft, speciesName: string): ImportDraft {
  const pokemon = getPokemon(speciesName)
  const notes = draft.notes.filter((note) => !note.includes('级栏') && !note.includes('食材没认全'))
  const ingredientNames = resolveIngredients(pokemon, draft.ingredientNames, notes)
  const maxSkill = pokemon.skill.maxLevel
  const skillLevel = Math.min(maxSkill, Math.max(1, draft.skillLevel))
  let gender = draft.gender
  if (pokemon.genders.male + pokemon.genders.female === 0) gender = null
  else if (gender == null) gender = getRandomGender(pokemon) ?? null
  return { ...draft, speciesName, ingredientNames, skillLevel, gender, notes }
}

export function buildImportedPokemon(draft: ImportDraft): PokemonInstance {
  if (!draft.speciesName) throw new Error('先选择物种')
  const pokemon = getPokemon(draft.speciesName)
  const ingredients = ([0, 1, 2] as const).map((slot) => {
    const level = slot === 0 ? 0 : slot === 1 ? 30 : 60
    const options = slotSets(pokemon, slot)
    const chosen = options.find((option) => option.ingredient.name === draft.ingredientNames[slot]) ?? options[0]
    return { level, ingredient: chosen.ingredient, amount: chosen.amount }
  })

  const seen = new Set<string>()
  const usedLevels = new Set<number>()
  const subskills = draft.subskills
    .filter((row) => row.name)
    .filter((row) => {
      if (seen.has(row.name)) return false
      seen.add(row.name)
      return true
    })
    .map((row) => {
      let level = UNLOCK_LEVELS.includes(row.level) ? row.level : nearestUnlock(row.level)
      if (usedLevels.has(level)) level = UNLOCK_LEVELS.find((candidate) => !usedLevels.has(candidate)) ?? level
      usedLevels.add(level)
      return { level, subskill: getSubskill(row.name) }
    })
    .sort((a, b) => a.level - b.level)

  const gendered = pokemon.genders.male + pokemon.genders.female > 0
  const instance = {
    version: 0,
    saved: true,
    shiny: pokemon.shinyLocked ? false : draft.shiny,
    gender: gendered ? (draft.gender ?? getRandomGender(pokemon)) : undefined,
    externalId: uuid.v4(),
    pokemon,
    name: draft.nickname.trim() || pokemon.displayName,
    level: Math.min(100, Math.max(1, draft.level)),
    ribbon: Math.min(4, Math.max(0, draft.ribbon)),
    skillLevel: Math.min(pokemon.skill.maxLevel, Math.max(1, draft.skillLevel)),
    nature: getNature(draft.natureName),
    subskills,
    ingredients,
    sneakySnacking: false,
    carrySize: CarrySizeUtils.baseCarrySize(pokemon)
  }
  return { ...instance, rp: new RP(instance).calc() }
}
