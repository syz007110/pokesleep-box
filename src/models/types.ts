export type SpecialtyFilter = 'all' | 'berry' | 'ingredient' | 'skill' | 'mixed'
export type ThemePreference = 'system' | 'light' | 'dark'
export type EnergyMode = 'fixed' | 'degrade'
export type BoxSort = 'updated' | 'level' | 'name' | 'strength'

export interface BoxPokemon {
  id: string
  speciesId: string
  nickname: string
  level: number
  natureId: string
  /** Lab subskill names, unlock order (slot 0 = first unlocked). */
  subskills: string[]
  /** Chosen option index in ingredient0 / ingredient30 / ingredient60. */
  ingredientIndexes: [number, number, number]
  /** In-game displayed main skill level (already includes Skill Level Up). */
  skillLevel: number
  ribbon: number
  extraCarry: number
  shiny: boolean
  createdAt: number
  updatedAt: number
}

export interface AppSettings {
  theme: ThemePreference
  islandId: string
  favoredBerries: string[]
  islandBonus: number
  camp: boolean
  sleepMinutes: number
  helpingBonusOthers: number
  energyMode: EnergyMode
  fixedEnergy: number
  energyIncense: boolean
  expertMode: boolean
}

export const SETTINGS_KEY = 'app'
export const BACKUP_VERSION = 1

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  islandId: 'greengrass',
  favoredBerries: [],
  islandBonus: 0,
  camp: false,
  sleepMinutes: 510,
  helpingBonusOthers: 0,
  energyMode: 'degrade',
  fixedEnergy: 80,
  energyIncense: false,
  expertMode: false
}

export interface BackupFile {
  version: number
  exportedAt: string
  pokemon: BoxPokemon[]
  settings: AppSettings
}

export function emptyPokemon(partial: Pick<BoxPokemon, 'id' | 'speciesId'> & Partial<BoxPokemon>): BoxPokemon {
  const now = Date.now()
  return {
    nickname: '',
    level: 30,
    natureId: 'Hardy',
    subskills: [],
    ingredientIndexes: [0, 0, 0],
    skillLevel: 1,
    ribbon: 0,
    extraCarry: 0,
    shiny: false,
    createdAt: now,
    updatedAt: now,
    ...partial
  }
}
