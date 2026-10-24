<script setup lang="ts">
import { SPECIALTY_LABEL } from '../data/names'
import { SPECIALTY_COLOR } from '../ui/tokens'
import type { Specialty } from '../models/types'

defineProps<{
  specialty?: Specialty | null
}>()
</script>

<template>
  <span
    class="specialty-badge"
    :style="{ background: SPECIALTY_COLOR[specialty ?? 'berry'] }"
  >
    {{ SPECIALTY_LABEL[specialty ?? 'berry'] }}
  </span>
</template>
