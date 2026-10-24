import { loadRecipeLevels, saveRecipeLevel } from '@/local/recipe-levels'
import serverAxios from '@/router/server-axios'
import { PokemonInstanceUtils } from '@/services/utils/pokemon-instance-utils'
import { usePokemonStore } from '@/stores/pokemon/pokemon-store'
import { useUserStore } from '@/stores/user-store'
import type {
  GetRecipeLevelsResponse,
  IslandShortName,
  PokemonInstance,
  UpdateUserRequest,
  UpsertAreaBonusRequest,
  UpsertRecipeLevelRequest,
  User,
  UserSettingsRequest,
  UserSettingsResponse
} from 'sleepapi-common'

class UserServiceImpl {
  public async getUserSettings() {
    const response = await serverAxios.get<UserSettingsResponse>('user/settings')
    return response.data
  }

  public async getUserPokemon() {
    const pokemonStore = usePokemonStore()
    return Object.values(pokemonStore.pokemon)
      .filter((pokemon) => pokemon.saved)
      .map((pokemon) => pokemonStore.getPokemon(pokemon.externalId))
      .filter((pokemon): pokemon is NonNullable<typeof pokemon> => Boolean(pokemon))
  }

  public async upsertPokemon(pokemonInstance: PokemonInstance) {
    const request = PokemonInstanceUtils.toUpsertTeamMemberRequest(pokemonInstance)
    return serverAxios.put('user/pokemon', request)
  }

  public async deletePokemon(externalId: string) {
    return serverAxios.delete(`user/pokemon/${externalId}`)
  }

  public async updateUser(updated: UpdateUserRequest) {
    const response = (await serverAxios.patch<User>('user', updated)).data
    const userStore = useUserStore()

    userStore.name = response.name
    userStore.externalId = response.external_id
    userStore.role = response.role
    userStore.avatar = response.avatar ?? 'default'
    userStore.friendCode = response.friend_code
  }

  public async getRecipes(): Promise<GetRecipeLevelsResponse> {
    return loadRecipeLevels()
  }

  public async upsertRecipe(recipe: string, level: number) {
    saveRecipeLevel(recipe, level)
    return { recipe, level } satisfies UpsertRecipeLevelRequest
  }

  public async upsertAreaBonus(shortName: IslandShortName, bonus: number) {
    return { area: shortName, bonus } satisfies UpsertAreaBonusRequest
  }

  public async upsertUserSettings(settings: UserSettingsRequest) {
    return settings
  }
}

export const UserService = new UserServiceImpl()
