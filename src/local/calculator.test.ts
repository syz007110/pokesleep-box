import { describe, expect, it } from 'vitest'
import { calculateTeamLocal } from './calculator'
import { GREENGRASS, getPokemon, type CalculateTeamRequest } from 'sleepapi-common'

describe('local team calculator', () => {
  it('returns production for one helper without a server', () => {
    const pokemon = getPokemon('Pikachu')
    const island = GREENGRASS
    const result = calculateTeamLocal(
      {
        members: [
          {
            externalId: 'pikachu-1',
            pokemon: pokemon.name,
            name: 'Pikachu',
            level: 30,
            ribbon: 0,
            nature: 'Hardy',
            skillLevel: 1,
            shiny: false,
            gender: undefined,
            saved: false,
            sneakySnacking: true,
            ingredients: [
              {
                name: pokemon.ingredient0[0].ingredient.name,
                amount: pokemon.ingredient0[0].amount,
                level: 1
              }
            ],
            subskills: []
          }
        ],
        settings: {
          camp: false,
          bedtime: '21:30',
          wakeup: '06:00',
          stockpiledIngredients: [],
          island: {
            name: island.name,
            shortName: island.shortName,
            areaBonus: 0,
            berries: island.berries
          }
        }
      } as unknown as CalculateTeamRequest,
      8
    )
    expect(result.members).toHaveLength(1)
    expect(result.members[0]?.produceTotal.berries.length).toBeGreaterThan(0)
  })
})
