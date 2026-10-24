export const APP_ID = 'neroli-pocket'
export const BACKUP_SCHEMA_VERSION = 1
export const SUBSKILL_UNLOCK_LEVELS = [10, 25, 50, 75, 100] as const

export type Specialty = 'berry' | 'ingredient' | 'skill' | 'all'
export type NatureStat = 'speed' | 'ingredient' | 'skill' | 'energy' | 'exp' | 'neutral'
export type SkillUnit =
  | 'strength'
  | 'energy'
  | 'ingredients'
  | 'helps'
  | 'pot'
  | 'shards'
  | 'berries'
  | 'copy'
  | string

export interface IngredientDrop {
  id: string
  amount: number
}

export interface BerryDef {
  id: string
  nameEn: string
  nameZh: string
  value: number
  type: string
  typeZh: string
}

export interface IngredientDef {
  id: string
  nameEn: string
  nameZh: string
  value: number
}

export interface NatureDef {
  id: string
  nameZh: string
  up: NatureStat
  down: NatureStat
  frequency: number
  ingredient: number
  skill: number
  energy: number
}

export interface SubskillDef {
  id: string
  short: string
  kind: string
  amount: number
  rarity: string
  nameZh: string
}

export interface SkillDef {
  id: string
  nameEn: string
  nameZh: string
  unit: SkillUnit
  amounts: number[]
  maxLevel: number
}

export interface RecipeDef {
  id: string
  nameEn: string
  nameZh: string
  type: string
  bonus: number
  ingredients: IngredientDrop[]
}

export interface SpeciesDef {
  id: string
  nameEn: string
  nameZh: string
  dex: number
  specialty: Specialty
  frequency: number
  ingredientRate: number
  skillRate: number
  berry: string
  carrySize: number
  previousEvolutions: number
  remainingEvolutions: number
  skill: string
  ingredients: {
    lv1: IngredientDrop[]
    lv30: IngredientDrop[]
    lv60: IngredientDrop[]
  }
  evolvesFrom: string | null
}

export interface PackConstants {
  maxPokemonLevel: number
  maxRibbonLevel: number
  maxTeamSize: number
  maxIslandBonus: number
  maxSleepMinutes: number
  mealsInDay: number
  favoredBerryMultiplier: number
  helpSpeedCap: number
  levelFrequencyFactor: number
  goodCampFactor: number
  energyBands: { min: number; factor: number }[]
  recipeLevelBonus: Record<string, number>
}

export interface DataPack {
  version: string
  source: string
  updatedAt: string
  constants: PackConstants
  berries: BerryDef[]
  ingredients: IngredientDef[]
  natures: NatureDef[]
  subskills: SubskillDef[]
  skills: SkillDef[]
  recipes: RecipeDef[]
  pokemon: SpeciesDef[]
}

export interface AppSettings {
  islandBonus: number
  favoredBerries: string[]
  goodCamp: boolean
  dayHours: number
  nightHours: number
  startingEnergy: number
  packUrl: string
  lastPackCheck: string | null
}

export interface BoxPokemon {
  id: string
  speciesId: string
  nickname: string
  level: number
  natureId: string
  subskills: (string | null)[]
  skillLevel: number
  ribbon: number
  ingredient30: number
  ingredient60: number
  favorite: boolean
  createdAt: number
  updatedAt: number
}

export interface Team {
  id: string
  name: string
  memberIds: (string | null)[]
}

export interface BackupFile {
  app: string
  schemaVersion: number
  exportedAt: string
  packVersion: string
  pokemon: BoxPokemon[]
  teams: Team[]
  settings: AppSettings
}

export const DEFAULT_SETTINGS: AppSettings = {
  islandBonus: 0,
  favoredBerries: [],
  goodCamp: false,
  dayHours: 15.5,
  nightHours: 8.5,
  startingEnergy: 100,
  packUrl: '',
  lastPackCheck: null
}

export function emptyPokemon(partial: Pick<BoxPokemon, 'speciesId'> & Partial<BoxPokemon>): BoxPokemon {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    nickname: '',
    level: 30,
    natureId: 'Hardy',
    subskills: [null, null, null, null, null],
    skillLevel: 1,
    ribbon: 0,
    ingredient30: 0,
    ingredient60: 0,
    favorite: false,
    createdAt: now,
    updatedAt: now,
    ...partial
  }
}

export function emptyTeam(name = '第一队'): Team {
  return {
    id: crypto.randomUUID(),
    name,
    memberIds: [null, null, null, null, null]
  }
}
