import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, emptyPokemon } from '../models/types'
import { getSpecies } from '../data/catalog'
import {
  berriesPerDrop,
  berryPowerForLevel,
  calculateProduction,
  invertNatureFrequency,
  toCalcPokemon,
  unlockedSubskills
} from './production'

describe('production helpers', () => {
  it('inverts nature frequency the Lab way (1.1 → 0.9)', () => {
    expect(invertNatureFrequency(1.1)).toBe(0.9)
    expect(invertNatureFrequency(0.925)).toBe(1.075)
  })

  it('unlocks subskills at 10 / 25 / 50 / 75 / 100', () => {
    const slots = ['Helping Speed S', 'Berry Finding S', 'Helping Bonus', 'Skill Trigger S', 'Inventory Up S']
    expect([...unlockedSubskills(slots, 9)]).toEqual([])
    expect([...unlockedSubskills(slots, 10)]).toEqual(['Helping Speed S'])
    expect([...unlockedSubskills(slots, 50)]).toHaveLength(3)
    expect([...unlockedSubskills(slots, 75)]).toHaveLength(4)
    expect([...unlockedSubskills(slots, 100)]).toHaveLength(5)
  })

  it('gives berry specialists two berries, plus BFS', () => {
    const pika = getSpecies('PIKACHU')!
    expect(berriesPerDrop(pika, new Set())).toBe(2)
    expect(berriesPerDrop(pika, new Set(['Berry Finding S']))).toBe(3)
  })

  it('uses the 1.025 berry power curve', () => {
    expect(berryPowerForLevel(25, 1)).toBe(25)
    expect(berryPowerForLevel(25, 30)).toBe(Math.round(Math.max(25 + 29, 25 * 1.025 ** 29)))
    expect(berryPowerForLevel(25, 60)).toBeGreaterThan(25 + 59)
  })
})

describe('Pikachu production', () => {
  it('returns daily energy and help counts for the default box Pokémon', () => {
    const row = emptyPokemon({ speciesId: 'PIKACHU', level: 30 })
    const input = toCalcPokemon(row, DEFAULT_SETTINGS)
    expect(input).not.toBeNull()
    const result = calculateProduction(input!)
    expect(result.displayFrequency).toBeGreaterThan(0)
    expect(result.helps).toBeGreaterThan(0)
    expect(result.berries).toBeGreaterThan(0)
    expect(result.totalStrength).toBeGreaterThan(0)
    expect(result.berryEnergy + result.skillEnergy).toBeCloseTo(result.totalStrength, 0)
  })

  it('doubles berry energy when the berry is favored', () => {
    const row = emptyPokemon({ speciesId: 'PIKACHU', level: 30 })
    const plain = calculateProduction(toCalcPokemon(row, DEFAULT_SETTINGS)!)
    const favored = calculateProduction(
      toCalcPokemon(row, { ...DEFAULT_SETTINGS, favoredBerries: ['GREPA'] })!
    )
    expect(favored.berryEnergyEach).toBe(plain.berryEnergyEach * 2)
    expect(favored.favored).toBe(true)
  })

  it('shortens the displayed interval with the good camp ticket', () => {
    const row = emptyPokemon({ speciesId: 'PIKACHU', level: 30 })
    const plain = calculateProduction(toCalcPokemon(row, DEFAULT_SETTINGS)!)
    const camp = calculateProduction(toCalcPokemon(row, { ...DEFAULT_SETTINGS, goodCamp: true })!)
    expect(camp.displayFrequency).toBeLessThan(plain.displayFrequency)
    expect(camp.carrySize).toBeGreaterThan(plain.carrySize)
  })
})
