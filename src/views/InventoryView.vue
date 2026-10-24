<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PokemonCard from '../components/PokemonCard.vue'
import { useBoxStore } from '../stores/box'

const box = useBoxStore()
const router = useRouter()
const empty = computed(() => box.loaded && box.pokemon.length === 0)
const noMatch = computed(() => box.loaded && box.pokemon.length > 0 && box.filtered.length === 0)
</script>

<template>
  <div class="page-shell">
    <v-text-field
      v-model="box.query"
      prepend-inner-icon="mdi-magnify"
      placeholder="搜索盒子里的宝可梦"
      clearable
      class="mb-3"
    />
    <v-alert v-if="empty" variant="tonal" color="secondary" class="mb-3">
      盒子是空的。点右上角「+」添加第一只帮手，数据只存在这台手机的 IndexedDB。
    </v-alert>
    <v-alert v-else-if="noMatch" variant="tonal" class="mb-3">没有匹配的宝可梦。</v-alert>
    <div class="d-flex flex-column ga-2">
      <PokemonCard
        v-for="row in box.filtered"
        :key="row.id"
        :row="row"
        @click="router.push(`/pokemon/${row.id}`)"
      />
    </div>
  </div>
</template>
