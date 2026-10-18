<script setup lang="ts">
import type { Pokemon } from 'sleepapi-common'

const TYPE_COLOR: Record<string, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC'
}

const props = defineProps<{ pokemon: Pokemon; size?: number }>()
const color = TYPE_COLOR[props.pokemon.berry.type] ?? '#7dcea0'
</script>

<template>
  <div
    class="avatar"
    :style="{
      width: (size ?? 52) + 'px',
      height: (size ?? 52) + 'px',
      background: `linear-gradient(160deg, ${color}, color-mix(in srgb, ${color} 55%, #1b2a22))`
    }"
    :aria-hidden="true"
  >
    <span>{{ String(pokemon.pokedexNumber).padStart(2, '0').slice(-2) }}</span>
  </div>
</template>

<style scoped>
.avatar {
  border-radius: 18px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 800;
  letter-spacing: -0.04em;
  flex: 0 0 auto;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
}
</style>
