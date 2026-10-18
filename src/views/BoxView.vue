<script setup lang="ts">
import { useRouter } from 'vue-router'
import PokemonCard from '../components/PokemonCard.vue'
import { UI } from '../i18n/ui'
import { useBoxStore } from '../stores/box'
import type { BoxSort, SpecialtyFilter } from '../models/types'

const box = useBoxStore()
const router = useRouter()

const chips: { id: SpecialtyFilter; label: string }[] = [
  { id: 'all', label: UI.box.all },
  { id: 'berry', label: UI.box.filterBerry },
  { id: 'ingredient', label: UI.box.filterIng },
  { id: 'skill', label: UI.box.filterSkill },
  { id: 'mixed', label: UI.box.filterMixed }
]

const sorts: { id: BoxSort; label: string }[] = [
  { id: 'updated', label: UI.box.sortUpdated },
  { id: 'level', label: UI.box.sortLevel },
  { id: 'name', label: UI.box.sortName },
  { id: 'strength', label: UI.box.sortStrength }
]
</script>

<template>
  <main class="page">
    <header class="topbar">
      <div>
        <div class="eyebrow">{{ UI.appFullName }}</div>
        <h1>{{ UI.box.title }}</h1>
        <p class="muted">{{ UI.box.count(box.list.length) }}</p>
      </div>
      <button class="btn btn-primary" @click="router.push('/add')">{{ UI.box.add }}</button>
    </header>

    <div class="search">
      <span aria-hidden="true">⌕</span>
      <input v-model="box.query" :placeholder="UI.box.search" type="search" enterkeyhint="search" />
    </div>

    <div class="chips" role="tablist">
      <button
        v-for="chip in chips"
        :key="chip.id"
        class="chip"
        :class="{ active: box.specialty === chip.id }"
        @click="box.specialty = chip.id"
      >
        {{ chip.label }}
      </button>
    </div>
    <div class="chips">
      <button
        v-for="item in sorts"
        :key="item.id"
        class="chip"
        :class="{ active: box.sort === item.id }"
        @click="box.sort = item.id"
      >
        {{ item.label }}
      </button>
    </div>

    <section v-if="!box.list.length" class="card empty">
      <div class="moon" />
      <h2>{{ UI.box.emptyTitle }}</h2>
      <p>{{ UI.box.emptyBody }}</p>
      <button class="btn btn-primary" @click="router.push('/add')">{{ UI.box.emptyCta }}</button>
    </section>

    <section v-else class="list">
      <PokemonCard
        v-for="member in box.filtered"
        :key="member.id"
        :member="member"
        @open="router.push(`/pokemon/${member.id}`)"
      />
    </section>
  </main>
</template>
