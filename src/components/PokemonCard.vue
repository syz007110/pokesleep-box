<script setup lang="ts">
import type { BoxPokemon } from '../models/types'
import { requirePokemon } from '../game/catalog'
import { pokemonLabel, specialtyLabel, zh, NATURE_NAMES } from '../i18n/names'
import { formatInt, formatNum } from '../utils/format'
import { formatInterval } from '../calc'
import { useBoxStore } from '../stores/box'
import SpeciesAvatar from './SpeciesAvatar.vue'

const props = defineProps<{ member: BoxPokemon }>()
defineEmits<{ open: [] }>()
const box = useBoxStore()
const pokemon = requirePokemon(props.member.speciesId)
const prod = box.productionFor(props.member)
</script>

<template>
  <article class="card poke-card" @click="$emit('open')">
    <SpeciesAvatar :pokemon="pokemon" />
    <div class="meta">
      <div class="row">
        <strong>{{ member.nickname || pokemonLabel(pokemon.name) }}</strong>
        <span class="badge" :class="'badge-' + pokemon.specialty">{{ specialtyLabel(pokemon.specialty) }}</span>
      </div>
      <div class="sub muted">
        Lv.{{ member.level }} · {{ zh(NATURE_NAMES, member.natureId) }} · {{ formatInterval(prod.energyIntervalSec) }}
      </div>
      <div class="yield">
        <span>树果 {{ formatNum(prod.berryAmount) }}</span>
        <span>能量 {{ formatInt(prod.totalStrength) }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.poke-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  align-items: center;
}
.meta { flex: 1; min-width: 0; }
.meta strong { font-size: 16px; }
.sub { font-size: 13px; margin: 4px 0 8px; }
.yield {
  display: flex;
  gap: 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
}
</style>
