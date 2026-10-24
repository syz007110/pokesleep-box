import { getIngredient, getSubskill } from '../data/catalog'
import { unlockedIngredients } from '../calc/production'
import type { BoxPokemon, SpeciesDef } from '../models/types'

export const INGREDIENT_SHORT: Record<string, string> = {
  apple: '苹果',
  milk: '鲜奶',
  soybean: '大豆',
  honey: '蜂蜜',
  sausage: '肉肠',
  ginger: '暖姜',
  tomato: '番茄',
  egg: '蛋',
  oil: '油',
  potato: '土豆',
  herb: '香料',
  corn: '玉米',
  cacao: '可可',
  coffee: '咖啡',
  avocado: '鳄梨',
  mushroom: '蘑菇',
  leek: '大葱',
  pumpkin: '南瓜',
  tail: '尾巴'
}

export function ingredientShort(id?: string, fallback?: string) {
  if (!id || id === 'locked') return '—'
  return INGREDIENT_SHORT[id] ?? fallback ?? id
}

export interface IngredientSlotView {
  id: string
  nameZh: string
  short: string
  amount: number
  locked: boolean
}

export function toIngredientSlot(id: string | undefined, amount = 0): IngredientSlotView {
  if (!id || id === 'locked') {
    return { id: 'locked', nameZh: '未解锁', short: '—', amount: 0, locked: true }
  }
  const def = getIngredient(id)
  return {
    id,
    nameZh: def?.nameZh ?? id,
    short: ingredientShort(id, def?.nameZh),
    amount,
    locked: false
  }
}

export function pokemonIngredientSlots(
  species: SpeciesDef | undefined,
  row: Pick<BoxPokemon, 'level' | 'ingredient30' | 'ingredient60'>
): IngredientSlotView[] {
  if (!species) return []
  return unlockedIngredients(species, row.level, row.ingredient30, row.ingredient60).map((slot) =>
    toIngredientSlot(slot.id, slot.amount)
  )
}

export function subskillShort(id: string | null | undefined) {
  if (!id) return ''
  const row = getSubskill(id)
  return row?.short ?? id
}

export function subskillRarity(id: string | null | undefined) {
  if (!id) return 'white'
  return getSubskill(id)?.rarity ?? 'white'
}
