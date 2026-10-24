<script setup lang="ts">
import { computed } from 'vue'
import { calculateProduction, toCalcPokemon } from '../calc/production'
import { formatNumber } from '../calc/format'
import { getNature, getSpecies } from '../data/catalog'
import { SPECIALTY_LABEL } from '../data/names'
import { useSettingsStore } from '../stores/settings'
import type { BoxPokemon } from '../models/types'
import SpeciesAvatar from './SpeciesAvatar.vue'

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
</script>

<template>
  <v-card class="pa-3" color="surface-bright" role="button">
    <div class="d-flex align-center ga-3">
      <SpeciesAvatar :species="species" />
      <div class="flex-grow-1 min-w-0">
        <div class="d-flex align-center ga-2">
          <div class="text-subtitle-1 font-weight-bold text-truncate">
            {{ row.nickname || species?.nameZh || row.speciesId }}
          </div>
          <v-icon v-if="row.favorite" size="16" color="primary">mdi-star</v-icon>
        </div>
        <div class="muted">
          Lv.{{ row.level }} · {{ SPECIALTY_LABEL[species?.specialty ?? 'berry'] }} · {{ nature?.nameZh }}
        </div>
      </div>
      <div class="text-right">
        <div class="text-subtitle-2 font-weight-bold">{{ formatNumber(production?.totalStrength ?? 0, 0) }}</div>
        <div class="muted">能量 / 日</div>
      </div>
    </div>
  </v-card>
</template>
