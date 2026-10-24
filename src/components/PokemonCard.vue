<script setup lang="ts">
import { computed } from 'vue'
import { calculateProduction, toCalcPokemon } from '../calc/production'
import { formatNumber } from '../calc/format'
import { getNature, getSpecies, getSubskill } from '../data/catalog'
import { useSettingsStore } from '../stores/settings'
import { pokemonIngredientSlots } from '../ui/labels'
import { SPECIALTY_COLOR } from '../ui/tokens'
import type { BoxPokemon } from '../models/types'
import SpeciesAvatar from './SpeciesAvatar.vue'
import SpecialtyBadge from './SpecialtyBadge.vue'
import SubskillChip from './SubskillChip.vue'
import NatureText from './NatureText.vue'

const props = defineProps<{
  row: BoxPokemon
}>()

const settings = useSettingsStore()
const species = computed(() => getSpecies(props.row.speciesId))
const nature = computed(() => getNature(props.row.natureId))
const production = computed(() => {
  const input = toCalcPokemon(props.row, settings.settings)
  return input ? calculateProduction(input) : null
})
const ingredients = computed(() => pokemonIngredientSlots(species.value, props.row))
const unlockedSubs = computed(() => {
  const count =
    props.row.level >= 100 ? 5 : props.row.level >= 75 ? 4 : props.row.level >= 50 ? 3 : props.row.level >= 25 ? 2 : props.row.level >= 10 ? 1 : 0
  return props.row.subskills.slice(0, count).filter((id): id is string => Boolean(id))
})
const hb = computed(() => unlockedSubs.value.some((id) => getSubskill(id)?.short === 'HB'))
const stripe = computed(() => SPECIALTY_COLOR[species.value?.specialty ?? ''] ?? '#9A95C3')
</script>

<template>
  <article class="lab-card lab-card--press poke-card" role="button">
    <div class="stripe" :style="{ background: stripe }" />
    <SpeciesAvatar :species="species" :size="48" />
    <div class="min-w-0 flex-grow-1">
      <div class="d-flex align-center ga-2">
        <div class="text-subtitle-2 font-weight-bold text-truncate">
          {{ row.nickname || species?.nameZh || row.speciesId }}
        </div>
        <v-icon v-if="row.favorite" size="14" color="strength">mdi-star</v-icon>
        <span v-if="hb" class="hb-tag">HB</span>
      </div>
      <div class="meta">
        <span class="num">Lv.{{ row.level }}</span>
        <SpecialtyBadge :specialty="species?.specialty" />
        <NatureText v-if="nature" :nature-id="row.natureId" />
      </div>
      <div class="chip-row mt-1">
        <span v-for="ing in ingredients" :key="ing.id + ing.amount" class="ing-pill">
          {{ ing.short }}×{{ ing.amount }}
        </span>
        <SubskillChip v-for="id in unlockedSubs.slice(0, 3)" :key="id" :id="id" compact />
      </div>
    </div>
    <div class="text-right flex-none">
      <div class="num strength">{{ formatNumber(production?.totalStrength ?? 0, 0) }}</div>
      <div class="muted">能量 / 日</div>
    </div>
  </article>
</template>

<style scoped>
.poke-card {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  padding-left: 14px;
  overflow: hidden;
}

.stripe {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  font-size: 12px;
}

.hb-tag {
  background: #ffdf2e;
  color: #191224;
  font-size: 9px;
  font-weight: 800;
  border-radius: 4px;
  padding: 1px 4px;
  letter-spacing: 0.04em;
}
</style>
