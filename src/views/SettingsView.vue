<script setup lang="ts">
import { computed } from 'vue'
import { BERRIES, ISLANDS } from '../game/catalog'
import { BERRY_NAMES, ISLAND_NAMES, zh } from '../i18n/names'
import { UI } from '../i18n/ui'
import { downloadJson, exportBackup, importBackup } from '../db'
import { useBoxStore } from '../stores/box'
import { useSettingsStore } from '../stores/settings'
import { sleepLabel } from '../utils/format'
import type { ThemePreference } from '../models/types'

const settings = useSettingsStore()
const box = useBoxStore()
const s = computed(() => settings.settings)

function toggleBerry(name: string) {
  const cur = s.value.favoredBerries
  const next = cur.includes(name) ? cur.filter((b) => b !== name) : [...cur, name].slice(0, 3)
  settings.patch({ favoredBerries: next })
}

async function onExport() {
  const data = await exportBackup()
  downloadJson(`pokesleep-box-${data.exportedAt.slice(0, 10)}.json`, data)
}

async function onImport(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  const payload = JSON.parse(text)
  await importBackup(payload, 'replace')
  await box.hydrate()
  settings.replace(payload.settings ?? settings.settings)
}

const themes: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: UI.settings.themeSystem },
  { id: 'light', label: UI.settings.themeLight },
  { id: 'dark', label: UI.settings.themeDark }
]
</script>

<template>
  <main class="page">
    <header class="topbar">
      <div>
        <div class="eyebrow">{{ UI.appName }}</div>
        <h1>{{ UI.settings.title }}</h1>
      </div>
    </header>

    <section class="card form-card">
      <div class="field">
        <label>{{ UI.settings.island }}</label>
        <select class="select" :value="s.islandId" @change="settings.patch({ islandId: ($event.target as HTMLSelectElement).value })">
          <option v-for="island in ISLANDS" :key="island.shortName" :value="island.shortName">
            {{ zh(ISLAND_NAMES, island.shortName, island.name) }}
          </option>
        </select>
      </div>
      <div class="field">
        <label>{{ UI.settings.favored }}</label>
        <p class="muted hint">{{ UI.settings.favoredHint }}</p>
        <div class="sheet-grid">
          <button
            v-for="berry in BERRIES"
            :key="berry.name"
            class="choice"
            :class="{ active: s.favoredBerries.includes(berry.name) }"
            @click="toggleBerry(berry.name)"
          >
            {{ zh(BERRY_NAMES, berry.name) }}
          </button>
        </div>
      </div>
      <div class="field">
        <label>{{ UI.settings.islandBonus }} · {{ s.islandBonus }}%</label>
        <input class="range" type="range" min="0" max="85" :value="s.islandBonus" @input="settings.patch({ islandBonus: Number(($event.target as HTMLInputElement).value) })" />
      </div>
      <label class="check">
        <input type="checkbox" :checked="s.camp" @change="settings.patch({ camp: ($event.target as HTMLInputElement).checked })" />
        {{ UI.settings.camp }}
      </label>
      <label class="check">
        <input type="checkbox" :checked="s.expertMode" @change="settings.patch({ expertMode: ($event.target as HTMLInputElement).checked })" />
        {{ UI.settings.expert }}
      </label>
    </section>

    <section class="card form-card">
      <div class="field">
        <label>{{ UI.settings.sleep }} · {{ sleepLabel(s.sleepMinutes) }}</label>
        <input class="range" type="range" min="60" max="720" step="10" :value="s.sleepMinutes" @input="settings.patch({ sleepMinutes: Number(($event.target as HTMLInputElement).value) })" />
      </div>
      <div class="field">
        <label>{{ UI.settings.hb }} · {{ s.helpingBonusOthers }}</label>
        <input class="range" type="range" min="0" max="4" :value="s.helpingBonusOthers" @input="settings.patch({ helpingBonusOthers: Number(($event.target as HTMLInputElement).value) })" />
      </div>
      <div class="field">
        <label>{{ UI.settings.energyMode }}</label>
        <div class="sheet-grid">
          <button class="choice" :class="{ active: s.energyMode === 'degrade' }" @click="settings.patch({ energyMode: 'degrade' })">{{ UI.settings.energyDegrade }}</button>
          <button class="choice" :class="{ active: s.energyMode === 'fixed' }" @click="settings.patch({ energyMode: 'fixed' })">{{ UI.settings.energyFixed }}</button>
        </div>
      </div>
      <div v-if="s.energyMode === 'fixed'" class="field">
        <label>{{ UI.settings.fixedEnergy }} · {{ s.fixedEnergy }}</label>
        <input class="range" type="range" min="0" max="150" :value="s.fixedEnergy" @input="settings.patch({ fixedEnergy: Number(($event.target as HTMLInputElement).value) })" />
      </div>
      <label class="check">
        <input type="checkbox" :checked="s.energyIncense" @change="settings.patch({ energyIncense: ($event.target as HTMLInputElement).checked })" />
        {{ UI.settings.incense }}
      </label>
    </section>

    <section class="card form-card">
      <div class="field">
        <label>{{ UI.settings.theme }}</label>
        <div class="sheet-grid">
          <button v-for="theme in themes" :key="theme.id" class="choice" :class="{ active: s.theme === theme.id }" @click="settings.patch({ theme: theme.id })">
            {{ theme.label }}
          </button>
        </div>
      </div>
    </section>

    <section class="card form-card">
      <h2>{{ UI.settings.backup }}</h2>
      <button class="btn btn-primary" @click="onExport">{{ UI.settings.export }}</button>
      <label class="btn btn-ghost">
        {{ UI.settings.importReplace }}
        <input type="file" accept="application/json" hidden @change="onImport" />
      </label>
    </section>

    <section class="card form-card">
      <h2>{{ UI.settings.install }}</h2>
      <p class="muted">{{ UI.settings.installBody }}</p>
      <h2>{{ UI.settings.about }}</h2>
      <p class="muted">{{ UI.settings.licenses }}</p>
    </section>
  </main>
</template>

<style scoped>
.form-card { padding: 16px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 14px; }
.form-card h2 { margin: 0; font-size: 18px; }
.hint { font-size: 12px; margin: 0; }
.check { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 650; }
.check input { width: 22px; height: 22px; }
</style>
