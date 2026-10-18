import {
  berryPowerForLevel,
  calculateIngredientPercentage,
  calculateNrOfBerriesPerDrop,
  CarrySizeUtils,
  CHARIZARD,
  nature,
  PIKACHU,
  subskill,
  VICTREEBEL
} from 'sleepapi-common'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../models/types'
import { emptyPokemon } from '../models/types'
import { calculateHelpSpeedBeforeEnergy } from './help'
import { calculatePokemonProduction, pickedIngredientSlots } from './production'

const fixedSettings = {
  ...DEFAULT_SETTINGS,
  energyMode: 'fixed' as const,
  fixedEnergy: 80,
  sleepMinutes: 510,
  camp: false,
  islandBonus: 0,
  favoredBerries: [],
  helpingBonusOthers: 0
}

describe('Lab primitive composition', () => {
  it('Pikachu Lv30 Hardy: interval, ing%, berries/drop, berry power', () => {
    const interval = calculateHelpSpeedBeforeEnergy({
      pokemon: PIKACHU,
      level: 30,
      nature: nature.HARDY,
      subskills: new Set(),
      teamHelpingBonus: 0,
      ribbonLevel: 0,
      camp: false
    })
    expect(interval).toBe(Math.floor(0.942 * PIKACHU.frequency))

    expect(calculateIngredientPercentage({ pokemon: PIKACHU, nature: nature.HARDY, subskills: new Set() })).toBeCloseTo(
      0.207,
      5
    )
    expect(calculateNrOfBerriesPerDrop(PIKACHU, new Set())).toBe(2)
    expect(berryPowerForLevel(PIKACHU.berry, 30)).toBe(54)
  })

  it('Victreebel ingredient finder M × Rash', () => {
    const pct = calculateIngredientPercentage({
      pokemon: VICTREEBEL,
      nature: nature.RASH,
      subskills: new Set([subskill.INGREDIENT_FINDER_M.name])
    })
    expect(pct).toBeCloseTo((VICTREEBEL.ingredientPercentage / 100) * 1.2 * 1.36, 5)
  })

  it('Charizard carry size uses Lab formula', () => {
    const base = CarrySizeUtils.baseCarrySize(CHARIZARD)
    expect(base).toBe(CHARIZARD.carrySize + 5 * CHARIZARD.previousEvolutions)
    expect(
      CarrySizeUtils.calculateCarrySize({
        baseWithEvolutions: base,
        subskillsLevelLimited: new Set([subskill.INVENTORY_L.name]),
        ribbon: 4,
        camp: true
      })
    ).toBe(Math.ceil((base + 18 + 8) * 1.2))
  })
})

describe('daily production', () => {
  it('Pikachu daily helps equal awake+sleep seconds / energy interval', () => {
    const member = emptyPokemon({ id: 'pika', speciesId: 'PIKACHU', level: 30, natureId: 'Hardy', skillLevel: 4 })
    const prod = calculatePokemonProduction(member, {
      pokemon: PIKACHU,
      nature: nature.HARDY,
      settings: fixedSettings
    }, [])

    const interval = calculateHelpSpeedBeforeEnergy({
      pokemon: PIKACHU,
      level: 30,
      nature: nature.HARDY,
      subskills: new Set(),
      teamHelpingBonus: 0,
      ribbonLevel: 0,
      camp: false
    })
    const energyInterval = interval * 0.45
    const expectedHelps = (24 * 3600) / energyInterval
    expect(prod.displayIntervalSec).toBe(interval)
    expect(prod.helps).toBeCloseTo(expectedHelps, 6)
    expect(prod.berriesPerDrop).toBe(2)
    expect(prod.berryStrength).toBeGreaterThan(0)
    expect(prod.ingredients.length).toBeGreaterThan(0)
  })

  it('night sneaky snacking drops ingredients after carry fills', () => {
    const member = emptyPokemon({
      id: 'pika',
      speciesId: 'PIKACHU',
      level: 1,
      natureId: 'Hardy',
      extraCarry: -20
    })
    const prod = calculatePokemonProduction(
      member,
      { pokemon: PIKACHU, nature: nature.HARDY, settings: { ...fixedSettings, sleepMinutes: 720 } },
      []
    )
    expect(prod.sneakyHelps).toBeGreaterThan(0)
    expect(prod.nightHelpsBeforeSpill).toBeLessThan(prod.nightHelps)
  })

  it('favored berry doubles berry energy', () => {
    const member = emptyPokemon({ id: 'pika', speciesId: 'PIKACHU', level: 30 })
    const plain = calculatePokemonProduction(member, {
      pokemon: PIKACHU,
      nature: nature.HARDY,
      settings: fixedSettings
    }, [])
    const favored = calculatePokemonProduction(member, {
      pokemon: PIKACHU,
      nature: nature.HARDY,
      settings: { ...fixedSettings, favoredBerries: [PIKACHU.berry.name] }
    }, [])
    expect(favored.berryStrength).toBeCloseTo(plain.berryStrength * 2, 5)
  })

  it('picks the chosen ingredient path', () => {
    const slots = pickedIngredientSlots(PIKACHU, 60, [0, 1, 2])
    expect(slots).toHaveLength(3)
    expect(slots[0].ingredient.name).toBe(PIKACHU.ingredient0[0].ingredient.name)
    expect(slots[1].ingredient.name).toBe(PIKACHU.ingredient30[1].ingredient.name)
    expect(slots[2].ingredient.name).toBe(PIKACHU.ingredient60[2].ingredient.name)
  })
})
