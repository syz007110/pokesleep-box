import { loadRecipeLevels } from '@/local/recipe-levels'
import { calculateIv, calculateTeam } from '@src/services/api-service/production/production-service'
import { defaultUserRecipes, type UserRecipes } from '@src/services/simulation-service/team-simulator/cooking-state/cooking-utils'
import { TimeUtils } from '@src/utils/time-utils/time-utils'
import { queryAsBoolean } from '@src/utils/routing/routing-utils'
import type {
  CalculateIvRequest,
  CalculateIvResponse,
  CalculateTeamRequest,
  CalculateTeamResponse,
  IngredientInstanceDto,
  IslandInstance,
  IslandInstanceDto,
  Pokemon,
  PokemonInstanceIdentity,
  RecipeFlat,
  TeamMember,
  TeamSettings,
  TeamSettingsDto
} from 'sleepapi-common'
import {
  CarrySizeUtils,
  MAX_POT_SIZE,
  calculateRecipeValue,
  curry,
  dessert,
  flatToIngredientSet,
  getIngredient,
  getIsland,
  getNature,
  getPokemon,
  ingredientSetToFloatFlat,
  parseTime,
  salad
} from 'sleepapi-common'

/** Lab's server default is 5110. This build runs on the phone UI thread, so the sample is shorter. */
export const LOCAL_TEAM_ITERATIONS = 400
export const LOCAL_IV_ITERATIONS = 200

function readPotSize(): number {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return MAX_POT_SIZE
    const parsed = JSON.parse(raw) as { potSize?: number }
    return typeof parsed.potSize === 'number' ? parsed.potSize : MAX_POT_SIZE
  } catch {
    return MAX_POT_SIZE
  }
}

function recipesWithLevels(): UserRecipes {
  const levels = loadRecipeLevels()
  const apply = (recipeList: RecipeFlat[]) =>
    recipeList
      .map((recipe) => {
        const level = levels[recipe.name] ?? 60
        return {
          ...recipe,
          level,
          valueMax: calculateRecipeValue({
            bonus: recipe.bonus,
            ingredients: flatToIngredientSet(recipe.ingredients),
            level
          })
        }
      })
      .sort((a, b) => b.valueMax - a.valueMax)

  if (Object.keys(levels).length === 0) return defaultUserRecipes()
  return {
    curries: apply(curry.CURRIES_FLAT),
    salads: apply(salad.SALADS_FLAT),
    desserts: apply(dessert.DESSERTS_FLAT)
  }
}

function parseIsland(islandInstance: IslandInstanceDto): IslandInstance {
  const island = getIsland(islandInstance.shortName)
  if (island.expert) {
    return {
      ...island,
      areaBonus: islandInstance.areaBonus,
      berries: islandInstance.berries,
      expertMode: islandInstance.expertMode
    }
  }
  return {
    ...island,
    areaBonus: islandInstance.areaBonus,
    berries: islandInstance.berries
  }
}

function parseSettings(settings: TeamSettingsDto, includeCooking: boolean): TeamSettings {
  const camp = queryAsBoolean(settings.camp)
  const bedtime = parseTime(settings.bedtime)
  const wakeup = parseTime(settings.wakeup)
  const sleepDuration = TimeUtils.calculateDuration({ start: bedtime, end: wakeup })
  const dayDuration = TimeUtils.calculateDuration({ start: wakeup, end: bedtime })
  if (sleepDuration.hour < 1 || dayDuration.hour < 1) {
    throw new Error('Minimum 1 hour of sleep and daytime required')
  }
  const stockpiledIngredients = ingredientSetToFloatFlat(
    settings.stockpiledIngredients?.map(({ name, amount }) => ({
      ingredient: getIngredient(name),
      amount
    })) ?? []
  )
  return {
    camp,
    bedtime,
    wakeup,
    includeCooking,
    stockpiledIngredients,
    potSize: readPotSize(),
    island: parseIsland(settings.island)
  }
}

function ingredientList(level: number, ingredients: IngredientInstanceDto[]) {
  const result = []
  for (const ingredientSet of ingredients) {
    if (ingredientSet.level <= level) {
      result.push({
        amount: ingredientSet.amount,
        ingredient: getIngredient(ingredientSet.name)
      })
    } else break
  }
  return result
}

function parseMembers(members: PokemonInstanceIdentity[], camp: boolean): TeamMember[] {
  return members.map((member) => {
    const pokemon: Pokemon = getPokemon(member.pokemon)
    const subskills = new Set(
      member.subskills.filter((row) => row.level <= member.level).map((row) => row.subskill)
    )
    return {
      pokemonWithIngredients: {
        pokemon,
        ingredientList: ingredientList(member.level, member.ingredients)
      },
      settings: {
        level: member.level,
        ribbon: member.ribbon,
        carrySize: CarrySizeUtils.calculateCarrySize({
          baseWithEvolutions: CarrySizeUtils.baseCarrySize(pokemon),
          subskillsLevelLimited: subskills,
          ribbon: member.ribbon,
          camp
        }),
        nature: getNature(member.nature),
        skillLevel: Math.min(member.skillLevel, pokemon.skill.maxLevel),
        subskills,
        externalId: member.externalId,
        sneakySnacking: member.sneakySnacking
      }
    }
  })
}

export function calculateTeamLocal(body: CalculateTeamRequest, iterations = LOCAL_TEAM_ITERATIONS): CalculateTeamResponse {
  const settings = parseSettings(body.settings, true)
  return calculateTeam(
    {
      settings,
      members: parseMembers(body.members, settings.camp),
      userRecipes: recipesWithLevels()
    },
    iterations
  )
}

export function calculateIvLocal(body: CalculateIvRequest, iterations = LOCAL_IV_ITERATIONS): CalculateIvResponse {
  const settings = parseSettings(body.settings, false)
  if (body.members.length > 4) throw new Error('Max team length allowed is 4')
  if (body.variants.length > 10) throw new Error('Max variants to check is 10')
  return calculateIv(
    {
      settings,
      members: parseMembers(body.members, settings.camp),
      variants: parseMembers(body.variants, settings.camp)
    },
    iterations
  )
}
