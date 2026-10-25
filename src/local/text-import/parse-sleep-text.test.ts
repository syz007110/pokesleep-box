import { describe, expect, it } from 'vitest'
import { COMPLETE_POKEDEX, getPokemon } from 'sleepapi-common'
import { EXAMPLE_PASTE, SPECIES_ZH } from './aliases'
import { buildImportedPokemon, toDraft } from './build-instance'
import { parseSleepText } from './parse-sleep-text'

describe('parseSleepText', () => {
  it('covers every pokedex species with a Chinese name', () => {
    for (const pokemon of COMPLETE_POKEDEX) {
      expect(SPECIES_ZH[pokemon.name], pokemon.name).toBeTruthy()
    }
  })

  it('parses the structured Chinese paste', () => {
    const parsed = parseSleepText(EXAMPLE_PASTE)
    expect(parsed.speciesName).toBe('PIKACHU')
    expect(parsed.level).toBe(30)
    expect(parsed.natureName).toBe('Adamant')
    expect(parsed.ingredientNames).toEqual(['Apple', 'Apple', 'Soybean'])
    expect(parsed.subskills).toEqual([
      { name: 'Berry Finding S', level: 10 },
      { name: 'Helping Speed M', level: 25 }
    ])
    expect(parsed.skillLevel).toBe(2)
  })

  it('accepts fullwidth punctuation and English labels', () => {
    const parsed = parseSleepText(
      'Species：Pikachu\nLevel：30\nNature：Adamant\nIngredients：Apple/Apple/Ginger\nSubskills：Berry Finding S@10, Helping Speed M@25\nSkill level：2'
    )
    expect(parsed.speciesName).toBe('PIKACHU')
    expect(parsed.level).toBe(30)
    expect(parsed.natureName).toBe('Adamant')
    expect(parsed.ingredientNames).toEqual(['Apple', 'Apple', 'Ginger'])
    expect(parsed.skillLevel).toBe(2)
    expect(parsed.subskills.map((row) => row.name)).toEqual(['Berry Finding S', 'Helping Speed M'])
  })

  it('guesses a loose shortcuts dump', () => {
    const parsed = parseSleepText(`皮卡丘
Lv. 30
固执
苹果
苹果
姜
树果数量S
Lv. 10
帮忙速度M
Lv. 25
技能等级 2`)
    expect(parsed.speciesName).toBe('PIKACHU')
    expect(parsed.level).toBe(30)
    expect(parsed.natureName).toBe('Adamant')
    expect(parsed.ingredientNames).toEqual(['Apple', 'Apple', 'Ginger'])
    expect(parsed.subskills).toEqual([
      { name: 'Berry Finding S', level: 10 },
      { name: 'Helping Speed M', level: 25 }
    ])
    expect(parsed.skillLevel).toBe(2)
  })

  it('upgrades a costume when the title is split apart', () => {
    const parsed = parseSleepText('万圣节\n皮卡丘\nLv. 25')
    expect(parsed.speciesName).toBe('PIKACHU_HALLOWEEN')
  })

  it('warns when a speed subskill is missing its grade', () => {
    const parsed = parseSleepText('物种: 皮卡丘\n副技能: 帮忙速度')
    expect(parsed.subskills).toEqual([])
    expect(parsed.warnings.some((warning) => warning.includes('S 还是 M'))).toBe(true)
  })
})

describe('toDraft / buildImportedPokemon', () => {
  it('keeps a mismatched ingredient editable and saves a local box mon', () => {
    const draft = toDraft(parseSleepText(EXAMPLE_PASTE))
    expect(draft.speciesName).toBe('PIKACHU')
    expect(draft.ingredientNames[0]).toBe('Apple')
    expect(draft.ingredientNames[1]).toBe('Apple')
    expect(draft.ingredientNames[2]).not.toBe('Soybean')
    expect(draft.notes.some((note) => note.includes('大豆') || note.includes('Soybean'))).toBe(true)
    expect(draft.subskills).toEqual([
      { name: 'Berry Finding S', level: 10 },
      { name: 'Helping Speed M', level: 25 }
    ])

    const instance = buildImportedPokemon(draft)
    const pikachu = getPokemon('PIKACHU')
    expect(instance.saved).toBe(true)
    expect(instance.pokemon.name).toBe('PIKACHU')
    expect(instance.level).toBe(30)
    expect(instance.nature.name).toBe('Adamant')
    expect(instance.skillLevel).toBe(2)
    expect(instance.ingredients.map((slot) => slot.ingredient.name)).toEqual(draft.ingredientNames)
    expect(instance.ingredients[0].amount).toBe(pikachu.ingredient0[0].amount)
    expect(instance.subskills.map((row) => [row.subskill.name, row.level])).toEqual([
      ['Berry Finding S', 10],
      ['Helping Speed M', 25]
    ])
    expect(instance.externalId).toBeTruthy()
  })

  it('fills unlock levels when the paste only names subskills', () => {
    const draft = toDraft(parseSleepText('物种: 伊布\n副技能: 树果数量S, 帮忙加成'))
    expect(draft.subskills.map((row) => row.level)).toEqual([10, 25])
    expect(draft.notes.some((note) => note.includes('解锁等级'))).toBe(true)
  })
})
