<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import SpeciesAvatar from '../components/SpeciesAvatar.vue'
import { searchPokemon } from '../game/catalog'
import { pokemonLabel, specialtyLabel, zh, BERRY_NAMES } from '../i18n/names'
import { UI } from '../i18n/ui'
import { useBoxStore } from '../stores/box'
import type { Pokemon } from 'sleepapi-common'
import type { SpecialtyFilter } from '../models/types'

const router = useRouter()
const box = useBoxStore()
const query = ref('')
const specialty = ref<SpecialtyFilter>('all')

const list = computed(() => searchPokemon(query.value, specialty.value === 'all' ? undefined : specialty.value))

const chips: { id: SpecialtyFilter; label: string }[] = [
  { id: 'all', label: UI.box.all },
  { id: 'berry', label: UI.box.filterBerry },
  { id: 'ingredient', label: UI.box.filterIng },
  { id: 'skill', label: UI.box.filterSkill },
  { id: 'mixed', label: UI.box.filterMixed }
]

async function pick(mon: Pokemon) {
  const draft = box.createDraft(mon.name)
  await box.save(draft)
  await router.replace(`/pokemon/${draft.id}`)
}
</script>

<template>
  <main class="page">
    <header class="topbar">
      <div>
        <div class="eyebrow">{{ UI.box.add }}</div>
        <h1>{{ UI.species.title }}</h1>
      </div>
      <button class="btn btn-ghost" @click="router.back()">{{ UI.common.close }}</button>
    </header>

    <div class="search">
      <span>⌕</span>
      <input v-model="query" :placeholder="UI.species.search" type="search" autofocus />
    </div>
    <div class="chips">
      <button
        v-for="chip in chips"
        :key="chip.id"
        class="chip"
        :class="{ active: specialty === chip.id }"
        @click="specialty = chip.id"
      >
        {{ chip.label }}
      </button>
    </div>

    <p v-if="!list.length" class="muted">{{ UI.species.none }}</p>
    <section class="list">
      <button v-for="mon in list" :key="mon.name" class="card pick" @click="pick(mon)">
        <SpeciesAvatar :pokemon="mon" :size="48" />
        <div class="meta">
          <strong>{{ pokemonLabel(mon.name) }}</strong>
          <div class="muted">
            #{{ mon.pokedexNumber }} · {{ specialtyLabel(mon.specialty) }} · {{ zh(BERRY_NAMES, mon.berry.name) }}
          </div>
        </div>
      </button>
    </section>
  </main>
</template>

<style scoped>
.pick {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  text-align: left;
  width: 100%;
}
.meta strong { display: block; }
</style>
