import { describe, expect, it } from 'vitest'
import { ingredientShort, toIngredientSlot } from './labels'

describe('ingredient short labels', () => {
  it('maps known ids and locked slots', () => {
    expect(ingredientShort('apple')).toBe('苹果')
    expect(ingredientShort('locked')).toBe('—')
    expect(ingredientShort(undefined)).toBe('—')
    expect(toIngredientSlot('milk', 2)).toMatchObject({ short: '鲜奶', amount: 2, locked: false })
    expect(toIngredientSlot('locked').locked).toBe(true)
  })
})
