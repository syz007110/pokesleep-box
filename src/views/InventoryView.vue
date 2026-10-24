<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PokemonCard from '../components/PokemonCard.vue'
import { getSpecies } from '../data/catalog'
import { useBoxStore } from '../stores/box'
import type { Specialty } from '../models/types'

const box = useBoxStore()
const router = useRouter()
const filter = ref<'all' | Specialty | 'favorite'>('all')

const rows = computed(() => {
  return box.filtered.filter((row) => {
    if (filter.value === 'all') return true
    if (filter.value === 'favorite') return row.favorite
    const species = getSpecies(row.speciesId)
    return species?.specialty === filter.value || species?.specialty === 'all'
  })
})

const empty = computed(() => box.loaded && box.pokemon.length === 0)
const noMatch = computed(() => box.loaded && box.pokemon.length > 0 && rows.value.length === 0)
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
    <div class="filter-row">
      <button type="button" class="filter-chip" :class="{ 'is-on': filter === 'all' }" @click="filter = 'all'">
        全部 {{ box.pokemon.length }}
      </button>
      <button
        type="button"
        class="filter-chip is-berry"
        :class="{ 'is-on': filter === 'berry' }"
        @click="filter = 'berry'"
      >
        树果
      </button>
      <button
        type="button"
        class="filter-chip is-ingredient"
        :class="{ 'is-on': filter === 'ingredient' }"
        @click="filter = 'ingredient'"
      >
        食材
      </button>
      <button
        type="button"
        class="filter-chip is-skill"
        :class="{ 'is-on': filter === 'skill' }"
        @click="filter = 'skill'"
      >
        技能
      </button>
      <button
        type="button"
        class="filter-chip"
        :class="{ 'is-on': filter === 'favorite' }"
        @click="filter = 'favorite'"
      >
        常用
      </button>
    </div>

    <div v-if="empty" class="empty-hero">
      <v-icon size="48" color="accent">mdi-pokeball</v-icon>
      <h2>盒子还是空的</h2>
      <p class="muted">把帮手记进来，按 Lab 同款产出卡看每天能量。数据只存在这台手机。</p>
      <v-btn class="mt-4" color="primary" @click="router.push('/pokemon/new')">添加第一只</v-btn>
    </div>
    <div v-else-if="noMatch" class="lab-card muted">没有匹配的宝可梦。</div>
    <div v-else class="d-flex flex-column ga-2">
      <PokemonCard
        v-for="row in rows"
        :key="row.id"
        :row="row"
        @click="router.push(`/pokemon/${row.id}`)"
      />
    </div>
  </div>
</template>
