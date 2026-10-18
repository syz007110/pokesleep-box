import {
  berry,
  COMPLETE_POKEDEX,
  getNature as labGetNature,
  getSubskill as labGetSubskill,
  ingredient,
  ISLANDS,
  nature,
  subskill,
  type Island,
  type Pokemon,
  type Subskill
} from 'sleepapi-common'
import { matchesQuery, pokemonLabel, pokemonSearchBlob } from '../i18n/names'

type Nature = nature.Nature

const byName = new Map(COMPLETE_POKEDEX.map((mon) => [mon.name, mon]))

export function allPokemon(): Pokemon[] {
  return COMPLETE_POKEDEX
}

export function getPokemon(id: string): Pokemon | undefined {
  return byName.get(id)
}

export function requirePokemon(id: string): Pokemon {
  const mon = byName.get(id)
  if (!mon) throw new Error(`Unknown species ${id}`)
  return mon
}

export function getNature(id: string): Nature {
  try {
    return labGetNature(id)
  } catch {
    return labGetNature('Hardy')
  }
}

export function getSubskill(name: string): Subskill | undefined {
  try {
    return labGetSubskill(name)
  } catch {
    return undefined
  }
}

export function searchPokemon(query: string, specialty?: Pokemon['specialty'] | 'mixed'): Pokemon[] {
  return COMPLETE_POKEDEX.filter((mon) => {
    if (specialty && specialty !== 'all') {
      if (specialty === 'mixed') {
        if (mon.specialty !== 'all') return false
      } else if (mon.specialty !== specialty) {
        return false
      }
    }
    return matchesQuery(pokemonSearchBlob(mon.name, mon.pokedexNumber), query)
  }).sort((a, b) => a.pokedexNumber - b.pokedexNumber || pokemonLabel(a.name).localeCompare(pokemonLabel(b.name), 'zh'))
}

export function getIsland(shortName: string): Island {
  return ISLANDS.find((i) => i.shortName === shortName) ?? ISLANDS[0]
}

export function islandBerryNames(shortName: string): string[] {
  return getIsland(shortName).berries.map((b) => b.name)
}

export const BERRIES = berry.BERRIES
export const INGREDIENTS = ingredient.INGREDIENTS
export const NATURES = nature.NATURES
export const SUBSKILLS = subskill.SUBSKILLS
export { ISLANDS }
