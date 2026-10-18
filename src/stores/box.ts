import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { calculatePokemonProduction, teamHelpingBonusCount } from '../calc'
import { listPokemon, removePokemon, upsertPokemon } from '../db'
import { getNature, islandBerryNames, requirePokemon } from '../game/catalog'
import { pokemonLabel, pokemonSearchBlob, matchesQuery } from '../i18n/names'
import type { BoxPokemon, BoxSort, SpecialtyFilter } from '../models/types'
import { emptyPokemon } from '../models/types'
import { useSettingsStore } from './settings'

export const useBoxStore = defineStore('box', () => {
  const list = ref<BoxPokemon[]>([])
  const loaded = ref(false)
  const query = ref('')
  const specialty = ref<SpecialtyFilter>('all')
  const sort = ref<BoxSort>('updated')

  async function hydrate() {
    list.value = await listPokemon()
    loaded.value = true
  }

  async function save(pokemon: BoxPokemon) {
    pokemon.updatedAt = Date.now()
    await upsertPokemon(pokemon)
    const idx = list.value.findIndex((p) => p.id === pokemon.id)
    if (idx >= 0) list.value[idx] = pokemon
    else list.value.unshift(pokemon)
  }

  async function remove(id: string) {
    await removePokemon(id)
    list.value = list.value.filter((p) => p.id !== id)
  }

  function createDraft(speciesId: string): BoxPokemon {
    return emptyPokemon({ id: crypto.randomUUID(), speciesId })
  }

  function productionFor(member: BoxPokemon) {
    const settingsStore = useSettingsStore()
    const pokemon = requirePokemon(member.speciesId)
    const nature = getNature(member.natureId)
    const islandBerries = islandBerryNames(settingsStore.settings.islandId)
    const helpingBonusOthers = Math.max(
      settingsStore.settings.helpingBonusOthers,
      teamHelpingBonusCount(list.value, member.id)
    )
    return calculatePokemonProduction(member, {
      pokemon,
      nature,
      settings: { ...settingsStore.settings, helpingBonusOthers }
    }, islandBerries)
  }

  const filtered = computed(() => {
    const rows = list.value.filter((member) => {
      const mon = requirePokemon(member.speciesId)
      if (specialty.value !== 'all') {
        if (specialty.value === 'mixed' && mon.specialty !== 'all') return false
        if (specialty.value !== 'mixed' && mon.specialty !== specialty.value) return false
      }
      const blob = `${pokemonSearchBlob(mon.name, mon.pokedexNumber)} ${member.nickname}`
      return matchesQuery(blob, query.value)
    })

    const sorted = [...rows]
    sorted.sort((a, b) => {
      if (sort.value === 'level') return b.level - a.level
      if (sort.value === 'name') {
        const an = a.nickname || pokemonLabel(a.speciesId)
        const bn = b.nickname || pokemonLabel(b.speciesId)
        return an.localeCompare(bn, 'zh')
      }
      if (sort.value === 'strength') {
        return productionFor(b).totalStrength - productionFor(a).totalStrength
      }
      return b.updatedAt - a.updatedAt
    })
    return sorted
  })

  return { list, loaded, query, specialty, sort, filtered, hydrate, save, remove, createDraft, productionFor }
})
