<script setup lang="ts">
import { computed } from 'vue'
import { getNature } from '../data/catalog'
import { NATURE_STAT_LABEL } from '../data/names'

const props = defineProps<{
  natureId?: string
}>()

const nature = computed(() => (props.natureId ? getNature(props.natureId) : undefined))
</script>

<template>
  <span v-if="nature" class="nature-text">
    <span>{{ nature.nameZh }}</span>
    <span v-if="nature.up !== 'neutral'" class="bits">
      <span class="nature-up">{{ NATURE_STAT_LABEL[nature.up] }}↑</span>
      <span class="nature-down">{{ NATURE_STAT_LABEL[nature.down] }}↓</span>
    </span>
    <span v-else class="muted">无修正</span>
  </span>
</template>

<style scoped>
.nature-text {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
}

.bits {
  display: inline-flex;
  gap: 6px;
}
</style>
