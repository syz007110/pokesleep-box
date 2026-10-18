import {
  BASE_FAVORED_BERRY_MULTIPLIER,
  berryPowerForLevel,
  calculateIngredientPercentage,
  calculateNrOfBerriesPerDrop,
  calculateRibbonCarrySize,
  calculateSkillPercentage,
  calculateSkillPercentageWithPityProc,
  calculateSubskillCarrySize,
  CarrySizeUtils,
  EXPERT_MODE_BERRY_BONUS_MULTIPLIER,
  EXPERT_MODE_MAIN_SKILL_LEVEL_BONUS,
  EXPERT_MODE_SKILL_PERCENT_BONUS,
  ingredientIndex,
  limitSubSkillsToLevel,
  MAX_ISLAND_BONUS,
  MAX_POKEMON_LEVEL,
  nature,
  type IngredientSet,
  type Mainskill,
  type Pokemon
} from 'sleepapi-common'

type Nature = nature.Nature
import type { AppSettings, BoxPokemon } from '../models/types'
import { helpsAtFixedEnergy, helpsWithDegradingEnergy, sleepEnergyRecovery } from './energy'
import { calculateFrequencyWithEnergy, calculateHelpSpeedBeforeEnergy, energyFactorFromEnergy } from './help'

export interface IngredientDrop {
  name: string
  longName: string
  amount: number
  value: number
}

export interface SkillProcSummary {
  skillName: string
  procs: number
  activations: { key: string; unit: string; amountPerProc: number; daily: number }[]
}

export interface PokemonProduction {
  speciesId: string
  displayIntervalSec: number
  energyIntervalSec: number
  energyFactor: number
  startingEnergy: number
  bedtimeEnergy: number
  dayHelps: number
  nightHelps: number
  nightHelpsBeforeSpill: number
  sneakyHelps: number
  helps: number
  ingredientPercentage: number
  skillPercentage: number
  skillPercentageWithPity: number
  berriesPerDrop: number
  berryName: string
  berryAmount: number
  berryStrength: number
  favored: boolean
  ingredients: IngredientDrop[]
  ingredientStrength: number
  skill: SkillProcSummary
  skillStrength: number
  totalStrength: number
  carrySize: number
  awakeMinutes: number
  sleepMinutes: number
}

export interface CalcContext {
  pokemon: Pokemon
  nature: Nature
  settings: AppSettings
}

const DAY_MINUTES = 24 * 60
const NIGHT_SKILL_PROC_CAP = 2

export function subskillSetForLevel(subskills: string[], level: number): Set<string> {
  return limitSubSkillsToLevel(new Set(subskills.filter(Boolean)), Math.min(level, MAX_POKEMON_LEVEL))
}

export function pickedIngredientSlots(pokemon: Pokemon, level: number, indexes: [number, number, number]): IngredientSet[] {
  const maxSlot = ingredientIndex(level)
  const bags = [pokemon.ingredient0, pokemon.ingredient30, pokemon.ingredient60]
  const slots: IngredientSet[] = []
  for (let i = 0; i <= maxSlot; i++) {
    const bag = bags[i]
    if (!bag.length) continue
    slots.push(bag[Math.min(indexes[i] ?? 0, bag.length - 1)])
  }
  return slots
}

export function averageIngredientDrop(slots: IngredientSet[]): IngredientDrop[] {
  if (!slots.length) return []
  const p = 1 / slots.length
  const byName = new Map<string, IngredientDrop>()
  for (const slot of slots) {
    const current = byName.get(slot.ingredient.name)
    const add = slot.amount * p
    if (current) {
      current.amount += add
    } else {
      byName.set(slot.ingredient.name, {
        name: slot.ingredient.name,
        longName: slot.ingredient.longName,
        amount: add,
        value: slot.ingredient.value
      })
    }
  }
  return [...byName.values()]
}

function isFavoredBerry(berryName: string, settings: AppSettings, islandBerries: string[]): boolean {
  const list = settings.favoredBerries.length ? settings.favoredBerries : islandBerries
  return list.includes(berryName)
}

function berryMultiplier(favored: boolean, settings: AppSettings): number {
  if (!favored) return 1
  return settings.expertMode ? EXPERT_MODE_BERRY_BONUS_MULTIPLIER : BASE_FAVORED_BERRY_MULTIPLIER
}

function islandFactor(settings: AppSettings): number {
  return 1 + Math.min(MAX_ISLAND_BONUS, Math.max(0, settings.islandBonus)) / 100
}

export function effectiveSkillLevel(pokemon: Pokemon, storedLevel: number, settings: AppSettings, favored: boolean): number {
  const bonus = settings.expertMode && favored ? EXPERT_MODE_MAIN_SKILL_LEVEL_BONUS : 0
  return Math.min(pokemon.skill.maxLevel, Math.max(1, storedLevel + bonus))
}

export function skillActivations(skill: Mainskill, skillLevel: number) {
  const entries = Object.entries(skill.activations)
  const preferred = entries.filter(([key]) => key === 'mean' || key === 'strength' || key === 'energy')
  const picked = preferred.length ? preferred : entries.slice(0, 1)
  return picked.map(([key, activation]) => ({
    key,
    unit: activation.unit,
    amountPerProc: activation.amount({ skillLevel })
  }))
}

function strengthFromActivations(activations: { unit: string; amountPerProc: number }[], procs: number, island: number): number {
  return activations.reduce((sum, act) => {
    if (act.unit === 'strength') return sum + act.amountPerProc * procs * island
    return sum
  }, 0)
}

/**
 * Expected daily production for one of the user's Pokémon.
 *
 * Daytime: inventory is assumed collected, so carry does not clamp.
 * Night: helps fill carry, then sneaky snacking (berries only). Night skill
 * procs are capped at 2, matching Lab's morning collect model.
 */
export function calculatePokemonProduction(
  member: BoxPokemon,
  ctx: CalcContext,
  islandBerries: string[]
): PokemonProduction {
  const { pokemon, nature, settings } = ctx
  const level = Math.min(MAX_POKEMON_LEVEL, Math.max(1, member.level))
  const subskills = subskillSetForLevel(member.subskills, level)
  const helpingBonusOthers = Math.max(0, Math.min(4, settings.helpingBonusOthers))

  const displayIntervalSec = calculateHelpSpeedBeforeEnergy({
    pokemon,
    level,
    nature,
    subskills,
    teamHelpingBonus: helpingBonusOthers,
    ribbonLevel: member.ribbon,
    camp: settings.camp
  })

  const ownErb = subskills.has('Energy Recovery Bonus')
  const ingPct = calculateIngredientPercentage({ pokemon, nature, subskills })
  const skillPct = calculateSkillPercentage(pokemon.skillPercentage, subskills, nature)
  const expertSkillPct = settings.expertMode ? skillPct * (1 + EXPERT_MODE_SKILL_PERCENT_BONUS / 100) : skillPct
  const skillPctPity = calculateSkillPercentageWithPityProc(pokemon, subskills, nature)
  const berriesPerDrop = calculateNrOfBerriesPerDrop(pokemon, subskills)
  const favored = isFavoredBerry(pokemon.berry.name, settings, islandBerries)
  const berryValue = berryPowerForLevel(pokemon.berry, level)
  const berryMult = berryMultiplier(favored, settings) * islandFactor(settings)

  const slots = pickedIngredientSlots(pokemon, level, member.ingredientIndexes)
  const avgIng = averageIngredientDrop(slots)
  const avgIngCount = avgIng.reduce((sum, row) => sum + row.amount, 0)
  const itemsPerHelp = berriesPerDrop * (1 - ingPct) + ingPct * avgIngCount

  const carrySize =
    CarrySizeUtils.calculateCarrySize({
      baseWithEvolutions: CarrySizeUtils.baseCarrySize(pokemon),
      subskillsLevelLimited: subskills,
      ribbon: member.ribbon,
      camp: settings.camp
    }) + member.extraCarry

  const sleepMinutes = Math.max(0, Math.min(DAY_MINUTES, settings.sleepMinutes))
  const awakeMinutes = DAY_MINUTES - sleepMinutes
  const startingEnergy =
    settings.energyMode === 'fixed'
      ? settings.fixedEnergy
      : sleepEnergyRecovery({
          sleepMinutes,
          natureEnergy: nature.energy,
          erbCount: ownErb ? 1 : 0,
          incense: settings.energyIncense,
          ownErb
        })

  let dayHelps: number
  let bedtimeEnergy: number
  if (settings.energyMode === 'fixed') {
    dayHelps = helpsAtFixedEnergy({
      minutes: awakeMinutes,
      energy: settings.fixedEnergy,
      displayIntervalSec
    })
    bedtimeEnergy = settings.fixedEnergy
  } else {
    const day = helpsWithDegradingEnergy({
      startEnergy: startingEnergy,
      awakeMinutes,
      displayIntervalSec
    })
    dayHelps = day.helps
    bedtimeEnergy = day.bedtimeEnergy
  }

  const nightEnergy = settings.energyMode === 'fixed' ? settings.fixedEnergy : bedtimeEnergy
  const nightHelpsRaw = helpsAtFixedEnergy({
    minutes: sleepMinutes,
    energy: nightEnergy,
    displayIntervalSec
  })

  const helpsToFill = itemsPerHelp > 0 ? carrySize / itemsPerHelp : nightHelpsRaw
  const nightHelpsBeforeSpill = Math.min(nightHelpsRaw, helpsToFill)
  const sneakyHelps = Math.max(0, nightHelpsRaw - nightHelpsBeforeSpill)

  const berryHelps = dayHelps * (1 - ingPct) + nightHelpsBeforeSpill * (1 - ingPct) + sneakyHelps
  const ingHelps = dayHelps * ingPct + nightHelpsBeforeSpill * ingPct
  const berryAmount = berryHelps * berriesPerDrop
  const berryStrength = berryAmount * berryValue * berryMult

  const ingredients = avgIng.map((row) => ({
    ...row,
    amount: row.amount * ingHelps
  }))
  const ingredientStrength = ingredients.reduce((sum, row) => sum + row.amount * row.value, 0)

  const daySkillProcs = dayHelps * expertSkillPct
  const nightSkillProcs = Math.min(NIGHT_SKILL_PROC_CAP, nightHelpsRaw * expertSkillPct)
  const procs = daySkillProcs + nightSkillProcs
  const skillLevel = effectiveSkillLevel(pokemon, member.skillLevel, settings, favored)
  const activations = skillActivations(pokemon.skill, skillLevel).map((act) => ({
    ...act,
    daily: act.amountPerProc * procs
  }))
  const skillStrength = strengthFromActivations(activations, procs, islandFactor(settings))

  const representativeEnergy = settings.energyMode === 'fixed' ? settings.fixedEnergy : startingEnergy

  return {
    speciesId: pokemon.name,
    displayIntervalSec,
    energyIntervalSec: calculateFrequencyWithEnergy(displayIntervalSec, representativeEnergy),
    energyFactor: energyFactorFromEnergy(representativeEnergy),
    startingEnergy,
    bedtimeEnergy,
    dayHelps,
    nightHelps: nightHelpsRaw,
    nightHelpsBeforeSpill,
    sneakyHelps,
    helps: dayHelps + nightHelpsRaw,
    ingredientPercentage: ingPct,
    skillPercentage: expertSkillPct,
    skillPercentageWithPity: skillPctPity,
    berriesPerDrop,
    berryName: pokemon.berry.name,
    berryAmount,
    berryStrength,
    favored,
    ingredients,
    ingredientStrength,
    skill: {
      skillName: pokemon.skill.name,
      procs,
      activations
    },
    skillStrength,
    totalStrength: berryStrength + ingredientStrength + skillStrength,
    carrySize,
    awakeMinutes,
    sleepMinutes
  }
}

export function teamHelpingBonusCount(members: BoxPokemon[], focusId: string): number {
  return members.reduce((n, mon) => {
    if (mon.id === focusId) return n
    const unlocked = limitSubSkillsToLevel(new Set(mon.subskills), mon.level)
    return unlocked.has('Helping Bonus') ? n + 1 : n
  }, 0)
}

export function describeCarryParts(pokemon: Pokemon, subskills: Set<string>, ribbon: number, camp: boolean, extraCarry: number) {
  return {
    baseWithEvolutions: CarrySizeUtils.baseCarrySize(pokemon),
    subskills: calculateSubskillCarrySize(subskills),
    ribbon: calculateRibbonCarrySize(ribbon),
    extraCarry,
    camp
  }
}
