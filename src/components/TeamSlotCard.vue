<script setup lang="ts">
import { computed } from 'vue'
import { getSpecies, getSubskill } from '../data/catalog'
import { SPECIALTY_COLOR } from '../ui/tokens'
import { unlockedSubskills } from '../calc/production'
import type { BoxPokemon } from '../models/types'
import SpeciesAvatar from './SpeciesAvatar.vue'

const props = defineProps<{
  index: number
  pokemon?: BoxPokemon | null
}>()

const species = computed(() => (props.pokemon ? getSpecies(props.pokemon.speciesId) : undefined))
const unlocked = computed(() =>
  props.pokemon ? unlockedSubskills(props.pokemon.subskills, props.pokemon.level) : new Set<string>()
)
const hb = computed(() => [...unlocked.value].some((id) => getSubskill(id)?.short === 'HB'))
const name = computed(
  () => props.pokemon?.nickname || species.value?.nameZh || `空位 ${props.index + 1}`
)
</script>

<template>
  <button
    type="button"
    class="team-slot"
    :class="{ 'is-empty': !pokemon }"
    :style="pokemon ? { boxShadow: `inset 0 3px 0 ${SPECIALTY_COLOR[species?.specialty ?? 'berry']}` } : undefined"
  >
    <template v-if="pokemon">
      <div class="lv">Lv.{{ pokemon.level }}</div>
      <span v-if="hb" class="badge">HB</span>
      <SpeciesAvatar :species="species" :size="40" />
      <div class="slot-name">{{ name }}</div>
    </template>
    <template v-else>
      <v-icon size="28" color="accent">mdi-plus</v-icon>
      <div class="slot-name muted">空位 {{ index + 1 }}</div>
    </template>
  </button>
</template>

<style scoped>
.slot-name {
  margin-top: 6px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

button.team-slot {
  appearance: none;
  width: 100%;
  font: inherit;
  color: inherit;
}
</style>
