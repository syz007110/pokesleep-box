import type { Pokemon } from 'sleepapi-common'
import {
  BERRY_NAMES,
  INGREDIENT_NAMES,
  ISLAND_NAMES,
  NATURE_NAMES,
  NATURE_STAT,
  RECIPE_NAMES,
  SKILL_NAMES,
  SPECIALTY_NAMES,
  SUBSKILL_NAMES,
  TYPE_NAMES
} from './item-names'
import { POKEMON_NAMES, type LocalizedName } from './pokemon-names'

export type { LocalizedName } from './pokemon-names'
export {
  BERRY_NAMES,
  INGREDIENT_NAMES,
  ISLAND_NAMES,
  NATURE_NAMES,
  NATURE_STAT,
  POKEMON_NAMES,
  RECIPE_NAMES,
  SKILL_NAMES,
  SPECIALTY_NAMES,
  SUBSKILL_NAMES,
  TYPE_NAMES
}

export function zh(table: Record<string, LocalizedName>, id: string, fallback?: string): string {
  return table[id]?.zh ?? fallback ?? id
}

export function ja(table: Record<string, LocalizedName>, id: string, fallback?: string): string {
  return table[id]?.ja ?? fallback ?? id
}

export function pokemonLabel(id: string): string {
  return zh(POKEMON_NAMES, id)
}

export function pokemonSearchBlob(id: string, pokedexNumber?: number): string {
  const n = POKEMON_NAMES[id]
  const parts = [id, n?.zh, n?.ja, n?.en, pokedexNumber != null ? String(pokedexNumber) : '']
  return parts.filter(Boolean).join(' ').toLowerCase()
}

export function matchesQuery(blob: string, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return q.split(/\s+/).every((token) => blob.includes(token))
}

/** OCR / screenshot text → Lab id. Exact match first, then includes. */
export function matchLocalizedId(table: Record<string, LocalizedName>, text: string): string | undefined {
  const t = text.trim()
  if (!t) return undefined
  for (const [id, names] of Object.entries(table)) {
    if (names.zh === t || names.ja === t || names.en === t || id === t) return id
  }
  const lower = t.toLowerCase()
  for (const [id, names] of Object.entries(table)) {
    if (names.zh.includes(t) || names.ja.includes(t) || names.en.toLowerCase() === lower) return id
  }
  return undefined
}

export function specialtyLabel(specialty: Pokemon['specialty']): string {
  if (specialty === 'all') return SPECIALTY_NAMES.all.zh
  return SPECIALTY_NAMES[specialty]?.zh ?? specialty
}

export function natureModifierLabel(natureName: string, up: boolean): string {
  // filled by caller with nature.positiveModifier
  return zh(NATURE_STAT, natureName, up ? '上升' : '下降')
}
