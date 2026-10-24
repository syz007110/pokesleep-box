import bundledPack from './pack.json'
import type {
  BerryDef,
  DataPack,
  IngredientDef,
  NatureDef,
  SkillDef,
  SpeciesDef,
  SubskillDef
} from '../models/types'

const bundled = bundledPack as DataPack
let current: DataPack = bundled

export function bundledVersion(): string {
  return bundled.version
}

export function currentPack(): DataPack {
  return current
}

export function setPack(pack: DataPack): DataPack {
  current = pack
  return current
}

export function restoreBundledPack(): DataPack {
  current = bundled
  return current
}

export function getSpecies(id: string): SpeciesDef | undefined {
  return current.pokemon.find((p) => p.id === id)
}

export function getBerry(id: string): BerryDef | undefined {
  return current.berries.find((b) => b.id === id)
}

export function getIngredient(id: string): IngredientDef | undefined {
  return current.ingredients.find((i) => i.id === id)
}

export function getNature(id: string): NatureDef | undefined {
  return current.natures.find((n) => n.id === id)
}

export function getSkill(id: string): SkillDef | undefined {
  return current.skills.find((s) => s.id === id)
}

export function getSubskill(id: string): SubskillDef | undefined {
  return current.subskills.find((s) => s.id === id)
}

export function searchPokemon(query: string): SpeciesDef[] {
  const raw = query.trim()
  const lower = raw.toLowerCase()
  if (!raw) return current.pokemon
  return current.pokemon.filter(
    (p) =>
      p.nameZh.includes(raw) ||
      p.nameEn.toLowerCase().includes(lower) ||
      p.id.toLowerCase().includes(lower) ||
      String(p.dex) === lower
  )
}

export function isValidPack(value: unknown): value is DataPack {
  if (!value || typeof value !== 'object') return false
  const pack = value as Partial<DataPack>
  return typeof pack.version === 'string' && Array.isArray(pack.pokemon) && pack.pokemon.length > 0
}
