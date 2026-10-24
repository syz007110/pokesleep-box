<script setup lang="ts">
import { computed } from 'vue'
import { getBerry } from '../data/catalog'
import type { SpeciesDef } from '../models/types'

const props = defineProps<{
  species?: SpeciesDef | null
  size?: number
}>()

const typeColor: Record<string, string> = {
  flying: '#A890F0',
  bug: '#A8B820',
  electric: '#F8D030',
  ghost: '#705898',
  fairy: '#EE99AC',
  psychic: '#F85888',
  fire: '#F08030',
  fighting: '#C03028',
  normal: '#A8A878',
  ground: '#E0C068',
  grass: '#78C850',
  rock: '#B8A038',
  water: '#6890F0',
  dark: '#705848',
  poison: '#A040A0',
  ice: '#98D8D8',
  steel: '#B8B8D0',
  dragon: '#7038F8'
}

const berry = computed(() => (props.species ? getBerry(props.species.berry) : undefined))
const background = computed(() => typeColor[berry.value?.type ?? ''] ?? '#7EB8DA')
const initial = computed(() => (props.species?.nameZh || '?').slice(0, 1))
</script>

<template>
  <div
    class="avatar"
    :style="{
      width: `${size ?? 44}px`,
      height: `${size ?? 44}px`,
      background,
      color: '#1B2430'
    }"
  >
    {{ initial }}
  </div>
</template>

<style scoped>
.avatar {
  border-radius: 14px;
  flex: none;
  place-items: center;
  font-weight: 800;
  display: grid;
}
</style>
