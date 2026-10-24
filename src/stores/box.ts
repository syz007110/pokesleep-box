import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getSpecies } from '../data/catalog'
import { deletePokemon, listPokemon, putPokemon, replacePokemon } from '../db'
import { emptyPokemon, type BoxPokemon } from '../models/types'

export const useBoxStore = defineStore('box', () => {
  const pokemon = ref<BoxPokemon[]>([])
  const loaded = ref(false)
  const query = ref('')

  const filtered = computed(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return pokemon.value
    return pokemon.value.filter((row) => {
      const species = getSpecies(row.speciesId)
      const label = (row.nickname || species?.nameZh || species?.nameEn || row.speciesId).toLowerCase()
      return (
        label.includes(q) ||
        row.nickname.toLowerCase().includes(q) ||
        row.speciesId.toLowerCase().includes(q) ||
        String(species?.dex ?? '') === q
      )
    })
  })

  async function hydrate() {
    pokemon.value = await listPokemon()
    loaded.value = true
  }

  async function add(speciesId: string) {
    const row = emptyPokemon({ speciesId })
    await putPokemon(row)
    pokemon.value = [row, ...pokemon.value]
    return row
  }

  async function save(row: BoxPokemon) {
    const next = { ...row, updatedAt: Date.now() }
    await putPokemon(next)
    const index = pokemon.value.findIndex((item) => item.id === next.id)
    if (index >= 0) pokemon.value.splice(index, 1, next)
    else pokemon.value.unshift(next)
    return next
  }

  async function remove(id: string) {
    await deletePokemon(id)
    pokemon.value = pokemon.value.filter((item) => item.id !== id)
  }

  async function replaceAll(rows: BoxPokemon[]) {
    await replacePokemon(rows)
    pokemon.value = rows
  }

  function byId(id: string) {
    return pokemon.value.find((item) => item.id === id)
  }

  return { pokemon, loaded, query, filtered, hydrate, add, save, remove, replaceAll, byId }
})
