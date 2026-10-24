import { getBerry, getIngredient, getNature, getSkill, getSpecies, currentPack } from '../data/catalog'
import { formatInterval, roundTo } from './format'
import { SUBSKILL_UNLOCK_LEVELS, type AppSettings, type BoxPokemon, type NatureDef, type SpeciesDef } from '../models/types'

export interface IngredientResult {
  id: string
  nameZh: string
  amount: number
  energy: number
}

export interface ProductionResult {
  displayFrequency: number
  displayFrequencyLabel: string
  carrySize: number
  ingredientRate: number
  skillRate: number
  skillRateWithPity: number
  berriesPerDrop: number
  berryEnergyEach: number
  favored: boolean
  dayHelps: number
  nightHelps: number
  nightSpilledHelps: number
  helps: number
  berries: number
  berryEnergy: number
  ingredients: IngredientResult[]
  ingredientEnergy: number
  skillProcs: number
  skillAmount: number
  skillUnit: string
  skillEnergy: number
  totalStrength: number
  bedtimeEnergy: number
}

export interface CalcPokemon {
  species: SpeciesDef
  level: number
  nature: NatureDef
  subskills: Set<string>
  skillLevel: number
  ribbon: number
  ingredient30: number
  ingredient60: number
  teamHelpingBonus: number
  camp: boolean
  islandBonus: number
  favoredBerries: string[]
  dayHours: number
  nightHours: number
  startingEnergy: number
}

export function invertNatureFrequency(frequency: number): number {
  return roundTo(2 - frequency, 3)
}

export function helpSpeedMultiplier(input: { subskills: Set<string>; teamHelpingBonus: number }): number {
  const ownBonus = input.subskills.has('Helping Bonus') ? 1 : 0
  const helpingBonus = 0.05 * Math.min(5, input.teamHelpingBonus + ownBonus)
  const speedM = input.subskills.has('Helping Speed M') ? 0.14 : 0
  const speedS = input.subskills.has('Helping Speed S') ? 0.07 : 0
  return roundTo(Math.max(0.65, 1 - speedM - speedS - helpingBonus), 2)
}

export function ribbonFrequency(species: SpeciesDef, ribbonLevel: number): number {
  let factor = 1
  if (ribbonLevel >= 2) {
    if (species.remainingEvolutions === 1) factor -= 0.05
    else if (species.remainingEvolutions === 2) factor -= 0.11
  }
  if (ribbonLevel >= 4) {
    if (species.remainingEvolutions === 1) factor -= 0.07
    else if (species.remainingEvolutions === 2) factor -= 0.14
  }
  return factor
}

export function displayFrequency(input: {
  species: SpeciesDef
  level: number
  nature: NatureDef
  subskills: Set<string>
  teamHelpingBonus: number
  ribbonLevel: number
  camp: boolean
}): number {
  const pack = currentPack()
  const speed = helpSpeedMultiplier(input)
  const levelFactor = 1 - pack.constants.levelFrequencyFactor * (input.level - 1)
  const natureFactor = invertNatureFrequency(input.nature.frequency)
  const ribbon = ribbonFrequency(input.species, input.ribbonLevel)
  const camp = input.camp ? pack.constants.goodCampFactor : 1
  return Math.floor(
    (roundTo(natureFactor * speed * levelFactor * ribbon, 4) * input.species.frequency) / camp
  )
}

export function energyFactor(energy: number): number {
  for (const band of currentPack().constants.energyBands) {
    if (energy >= band.min) return band.factor
  }
  return 1
}

export function isSpecialty(species: SpeciesDef, specialty: SpeciesDef['specialty']): boolean {
  return species.specialty === specialty || species.specialty === 'all'
}

export function ingredientRate(input: { species: SpeciesDef; nature: NatureDef; subskills: Set<string> }): number {
  const bonus =
    (input.subskills.has('Ingredient Finder S') ? 0.18 : 0) +
    (input.subskills.has('Ingredient Finder M') ? 0.36 : 0)
  return (input.species.ingredientRate / 100) * input.nature.ingredient * roundTo(1 + bonus, 2)
}

export function skillRate(input: { species: SpeciesDef; nature: NatureDef; subskills: Set<string> }): number {
  const bonus =
    (input.subskills.has('Skill Trigger S') ? 0.18 : 0) + (input.subskills.has('Skill Trigger M') ? 0.36 : 0)
  return (input.species.skillRate / 100) * input.nature.skill * roundTo(1 + bonus, 2)
}

export function pityHelps(species: SpeciesDef): number {
  return isSpecialty(species, 'skill') ? Math.floor(144000 / species.frequency) : 78
}

export function skillRateWithPity(input: { species: SpeciesDef; nature: NatureDef; subskills: Set<string> }): number {
  const rate = skillRate(input)
  const n = pityHelps(input.species)
  return rate / (1 - (1 - rate) ** (n + 1))
}

export function berriesPerDrop(species: SpeciesDef, subskills: Set<string>): number {
  let count = isSpecialty(species, 'berry') ? 2 : 1
  if (subskills.has('Berry Finding S')) count += 1
  return count
}

export function inventoryBonus(subskills: Set<string>): number {
  return (
    (subskills.has('Inventory Up S') ? 6 : 0) +
    (subskills.has('Inventory Up M') ? 12 : 0) +
    (subskills.has('Inventory Up L') ? 18 : 0)
  )
}

export function ribbonCarry(ribbon: number): number {
  let extra = 0
  if (ribbon >= 1) extra += 1
  if (ribbon >= 2) extra += 2
  if (ribbon >= 3) extra += 3
  if (ribbon >= 4) extra += 2
  return extra
}

export function carrySize(input: { species: SpeciesDef; subskills: Set<string>; ribbon: number; camp: boolean }): number {
  const base = input.species.carrySize + 5 * input.species.previousEvolutions
  return Math.ceil((base + inventoryBonus(input.subskills) + ribbonCarry(input.ribbon)) * (input.camp ? 1.2 : 1))
}

export function berryPowerForLevel(base: number, level: number): number {
  const linear = base + (level - 1)
  const exp = base * 1.025 ** (level - 1)
  return Math.round(Math.max(linear, exp))
}

export function unlockedIngredients(
  species: SpeciesDef,
  level: number,
  ingredient30: number,
  ingredient60: number
) {
  const slots = []
  const first = species.ingredients.lv1[0]
  if (first && first.id !== 'locked') slots.push(first)
  if (level >= 30) {
    const slot = species.ingredients.lv30[ingredient30] ?? species.ingredients.lv30[0]
    if (slot && slot.id !== 'locked') slots.push(slot)
  }
  if (level >= 60) {
    const slot = species.ingredients.lv60[ingredient60] ?? species.ingredients.lv60[0]
    if (slot && slot.id !== 'locked') slots.push(slot)
  }
  return slots
}

export function effectiveSkillLevel(skillLevel: number, subskills: Set<string>): number {
  const bonus = (subskills.has('Skill Level Up S') ? 1 : 0) + (subskills.has('Skill Level Up M') ? 2 : 0)
  const max = currentPack().skills.reduce((acc, skill) => Math.max(acc, skill.maxLevel), 6)
  return Math.min(max, skillLevel + bonus)
}

export function unlockedSubskills(subskills: (string | null)[], level: number): Set<string> {
  const count = level >= 100 ? 5 : level >= 75 ? 4 : level >= 50 ? 3 : level >= 25 ? 2 : level >= 10 ? 1 : 0
  return new Set(subskills.slice(0, count).filter((id): id is string => Boolean(id)))
}

function emptyResult(partial: Partial<ProductionResult> = {}): ProductionResult {
  return {
    displayFrequency: 0,
    displayFrequencyLabel: '—',
    carrySize: 0,
    ingredientRate: 0,
    skillRate: 0,
    skillRateWithPity: 0,
    berriesPerDrop: 1,
    berryEnergyEach: 0,
    favored: false,
    dayHelps: 0,
    nightHelps: 0,
    nightSpilledHelps: 0,
    helps: 0,
    berries: 0,
    berryEnergy: 0,
    ingredients: [],
    ingredientEnergy: 0,
    skillProcs: 0,
    skillAmount: 0,
    skillUnit: '',
    skillEnergy: 0,
    totalStrength: 0,
    bedtimeEnergy: 0,
    ...partial
  }
}

export function calculateProduction(input: CalcPokemon): ProductionResult {
  const pack = currentPack()
  const berry = getBerry(input.species.berry)
  if (!berry) return emptyResult()

  const interval = displayFrequency({
    species: input.species,
    level: input.level,
    nature: input.nature,
    subskills: input.subskills,
    teamHelpingBonus: input.teamHelpingBonus,
    ribbonLevel: input.ribbon,
    camp: input.camp
  })
  const ingRate = ingredientRate(input)
  const pityRate = skillRateWithPity(input)
  const dropCount = berriesPerDrop(input.species, input.subskills)
  const bag = carrySize(input)
  const favored = input.favoredBerries.includes(input.species.berry)
  const favoredMul = favored ? pack.constants.favoredBerryMultiplier : 1
  const islandMul = 1 + Math.min(pack.constants.maxIslandBonus, input.islandBonus) / 100
  const berryEnergyEach = Math.round(berryPowerForLevel(berry.value, input.level) * favoredMul * islandMul)
  const slots = unlockedIngredients(input.species, input.level, input.ingredient30, input.ingredient60)
  const slotCount = Math.max(1, slots.length)
  const avgIngAmount = slots.reduce((sum, slot) => sum + slot.amount, 0) / slotCount
  const fillPerHelp = (1 - ingRate) * dropCount + ingRate * avgIngAmount

  let energy = Math.min(150, Math.max(0, input.startingEnergy))
  let leftover = 0
  let dayHelps = 0
  const daySlices = Math.max(1, Math.round((input.dayHours * 3600) / 600))
  for (let i = 0; i < daySlices; i++) {
    const helpTime = interval * energyFactor(energy)
    leftover += 600 / Math.max(1, helpTime)
    while (leftover >= 1) {
      leftover -= 1
      dayHelps += 1
    }
    energy = Math.max(0, energy - 1)
  }

  const bedtimeEnergy = energy
  const nightSeconds = input.nightHours * 3600
  const nightInterval = interval * energyFactor(bedtimeEnergy)
  const nightHelps = nightSeconds / Math.max(1, nightInterval)
  const nightBeforeSpill = fillPerHelp > 0 ? Math.min(nightHelps, bag / fillPerHelp) : nightHelps
  const nightSpilled = Math.max(0, nightHelps - nightBeforeSpill)
  const collectedHelps = dayHelps + nightBeforeSpill
  const berryHelps = collectedHelps + nightSpilled
  const berries = berryHelps * (1 - ingRate) * dropCount + nightSpilled * ingRate * dropCount
  const berryEnergy = berries * berryEnergyEach

  const ingredients = slots.map((slot) => {
    const def = getIngredient(slot.id)
    const amount = collectedHelps * ingRate * (slot.amount / slotCount)
    const energyValue = amount * (def?.value ?? 0)
    return {
      id: slot.id,
      nameZh: def?.nameZh ?? slot.id,
      amount,
      energy: energyValue
    }
  })
  const ingredientEnergy = ingredients.reduce((sum, row) => sum + row.energy, 0)

  const dayProcs = dayHelps * pityRate
  const skillProcs = dayProcs + Math.min(2, nightBeforeSpill * pityRate)
  const skill = getSkill(input.species.skill)
  const skillLv = effectiveSkillLevel(input.skillLevel, input.subskills)
  const skillAmount = skillProcs * (skill?.amounts[Math.min(skill.maxLevel, skillLv) - 1] ?? 0)
  const skillUnit = skill?.unit ?? ''
  const skillEnergy = skillUnit === 'strength' ? skillAmount * islandMul : 0

  return {
    displayFrequency: interval,
    displayFrequencyLabel: formatInterval(interval),
    carrySize: bag,
    ingredientRate: ingRate,
    skillRate: skillRate(input),
    skillRateWithPity: pityRate,
    berriesPerDrop: dropCount,
    berryEnergyEach,
    favored,
    dayHelps: roundTo(dayHelps, 2),
    nightHelps: roundTo(nightHelps, 2),
    nightSpilledHelps: roundTo(nightSpilled, 2),
    helps: roundTo(dayHelps + nightHelps, 2),
    berries: roundTo(berries, 2),
    berryEnergy: roundTo(berryEnergy, 1),
    ingredients: ingredients.map((row) => ({
      ...row,
      amount: roundTo(row.amount, 2),
      energy: roundTo(row.energy, 1)
    })),
    ingredientEnergy: roundTo(ingredientEnergy, 1),
    skillProcs: roundTo(skillProcs, 2),
    skillAmount: roundTo(skillAmount, 1),
    skillUnit,
    skillEnergy: roundTo(skillEnergy, 1),
    totalStrength: roundTo(berryEnergy + skillEnergy, 1),
    bedtimeEnergy: roundTo(bedtimeEnergy, 1)
  }
}

export function toCalcPokemon(
  pokemon: BoxPokemon,
  settings: AppSettings,
  teamHelpingBonus = 0
): CalcPokemon | null {
  const species = getSpecies(pokemon.speciesId)
  const nature = getNature(pokemon.natureId)
  if (!species || !nature) return null
  return {
    species,
    level: pokemon.level,
    nature,
    subskills: unlockedSubskills(pokemon.subskills, pokemon.level),
    skillLevel: pokemon.skillLevel,
    ribbon: pokemon.ribbon,
    ingredient30: pokemon.ingredient30,
    ingredient60: pokemon.ingredient60,
    teamHelpingBonus,
    camp: settings.goodCamp,
    islandBonus: settings.islandBonus,
    favoredBerries: settings.favoredBerries,
    dayHours: settings.dayHours,
    nightHours: settings.nightHours,
    startingEnergy: settings.startingEnergy
  }
}

export { SUBSKILL_UNLOCK_LEVELS }
