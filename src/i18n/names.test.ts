import { berry, COMPLETE_POKEDEX, ingredient, nature, subskill } from 'sleepapi-common'
import { describe, expect, it } from 'vitest'
import { BERRY_NAMES, INGREDIENT_NAMES, NATURE_NAMES, POKEMON_NAMES, SKILL_NAMES, SUBSKILL_NAMES } from './names'

describe('localized name tables cover Lab ids', () => {
  it('has zh/ja for every species', () => {
    const missing = COMPLETE_POKEDEX.filter((mon) => !POKEMON_NAMES[mon.name]?.zh).map((m) => m.name)
    expect(missing).toEqual([])
  })

  it('has zh for every berry, ingredient, nature, subskill', () => {
    expect(berry.BERRIES.every((b) => BERRY_NAMES[b.name]?.zh)).toBe(true)
    expect(ingredient.INGREDIENTS.every((i) => INGREDIENT_NAMES[i.name]?.zh)).toBe(true)
    expect(nature.NATURES.every((n) => NATURE_NAMES[n.name]?.zh)).toBe(true)
    expect(subskill.SUBSKILLS.every((s) => SUBSKILL_NAMES[s.name]?.zh)).toBe(true)
  })

  it('has zh for every unique main skill name in the dex', () => {
    const missing = [...new Set(COMPLETE_POKEDEX.map((m) => m.skill.name))].filter((name) => !SKILL_NAMES[name]?.zh)
    expect(missing).toEqual([])
  })
})
