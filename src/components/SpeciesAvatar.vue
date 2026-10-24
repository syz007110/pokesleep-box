<script setup lang="ts">
import { computed } from 'vue'
import { SPECIALTY_COLOR } from '../ui/tokens'
import type { SpeciesDef } from '../models/types'

const props = defineProps<{
  species?: SpeciesDef | null
  size?: number
}>()

const background = computed(() => SPECIALTY_COLOR[props.species?.specialty ?? ''] ?? '#9A95C3')
const initial = computed(() => (props.species?.nameZh || '?').slice(0, 1))
</script>

<template>
  <div
    class="avatar"
    :style="{
      width: `${size ?? 44}px`,
      height: `${size ?? 44}px`,
      background
    }"
  >
    {{ initial }}
  </div>
</template>

<style scoped>
.avatar {
  border-radius: 12px;
  flex: none;
  place-items: center;
  font-weight: 800;
  display: grid;
  color: #191224;
  letter-spacing: 0;
}
</style>
