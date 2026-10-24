<script setup lang="ts">
import { computed } from 'vue'
import { getSubskill } from '../data/catalog'
import { RARITY_BG, RARITY_FG } from '../ui/tokens'

const props = defineProps<{
  id?: string | null
  compact?: boolean
}>()

const row = computed(() => (props.id ? getSubskill(props.id) : undefined))
const bg = computed(() => RARITY_BG[row.value?.rarity ?? 'white'])
</script>

<template>
  <span v-if="row" class="subskill-chip" :style="{ background: bg, color: RARITY_FG }">
    {{ compact ? row.short : row.nameZh }}
  </span>
</template>
