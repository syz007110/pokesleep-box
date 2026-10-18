<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ProductionPreview from '../components/ProductionPreview.vue'
import { pokemonLabel } from '../i18n/names'
import { UI } from '../i18n/ui'
import { formatInt } from '../utils/format'
import { useBoxStore } from '../stores/box'

const box = useBoxStore()
const router = useRouter()

const ranked = computed(() =>
  [...box.list]
    .map((member) => ({ member, prod: box.productionFor(member) }))
    .sort((a, b) => b.prod.totalStrength - a.prod.totalStrength)
)

const total = computed(() => ranked.value.reduce((sum, row) => sum + row.prod.totalStrength, 0))
</script>

<template>
  <main class="page">
    <header class="topbar">
      <div>
        <div class="eyebrow">{{ UI.appName }}</div>
        <h1>{{ UI.production.title }}</h1>
        <p class="muted">{{ UI.production.teamHint }}</p>
      </div>
    </header>

    <section v-if="!box.list.length" class="card empty">
      <div class="moon" />
      <h2>{{ UI.production.empty }}</h2>
      <button class="btn btn-primary" @click="router.push('/add')">{{ UI.box.add }}</button>
    </section>

    <template v-else>
      <section class="card total-card">
        <span>{{ UI.production.total }}</span>
        <b>{{ formatInt(total) }}</b>
      </section>
      <article v-for="row in ranked" :key="row.member.id" class="stack">
        <button class="row heading" @click="router.push(`/pokemon/${row.member.id}`)">
          <strong>{{ row.member.nickname || pokemonLabel(row.member.speciesId) }}</strong>
          <span class="muted">Lv.{{ row.member.level }}</span>
        </button>
        <ProductionPreview :prod="row.prod" />
      </article>
    </template>
  </main>
</template>

<style scoped>
.total-card {
  padding: 18px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}
.total-card b { font-size: 28px; letter-spacing: -0.04em; }
.stack { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.heading {
  width: 100%;
  min-height: 44px;
  text-align: left;
  font-size: 16px;
}
</style>
