<script setup lang="ts">
import type { PokemonProduction } from '../calc'
import { formatInterval } from '../calc'
import { BERRY_NAMES, INGREDIENT_NAMES, SKILL_NAMES, zh } from '../i18n/names'
import { UI } from '../i18n/ui'
import { formatInt, formatNum, formatPercent } from '../utils/format'

defineProps<{ prod: PokemonProduction }>()
</script>

<template>
  <section class="card preview">
    <div class="stat-grid">
      <div class="stat">
        <span>{{ UI.production.interval }}</span>
        <b>{{ formatInterval(prod.displayIntervalSec) }}</b>
      </div>
      <div class="stat">
        <span>{{ UI.production.withEnergy }}</span>
        <b>{{ formatInterval(prod.energyIntervalSec) }}</b>
      </div>
      <div class="stat">
        <span>{{ UI.production.helps }}</span>
        <b>{{ formatNum(prod.helps) }}</b>
      </div>
      <div class="stat">
        <span>{{ UI.production.carry }}</span>
        <b>{{ prod.carrySize }}</b>
      </div>
    </div>
    <div class="lines">
      <div class="row">
        <span>{{ UI.production.berries }} · {{ zh(BERRY_NAMES, prod.berryName) }}
          <em v-if="prod.favored">{{ UI.production.favored }}</em>
        </span>
        <b>{{ formatNum(prod.berryAmount) }} / {{ formatInt(prod.berryStrength) }}</b>
      </div>
      <div v-for="ing in prod.ingredients" :key="ing.name" class="row">
        <span>{{ zh(INGREDIENT_NAMES, ing.name, ing.longName) }}</span>
        <b>{{ formatNum(ing.amount) }}</b>
      </div>
      <div class="row">
        <span>{{ zh(SKILL_NAMES, prod.skill.skillName, prod.skill.skillName) }} · {{ formatPercent(prod.skillPercentage) }}</span>
        <b>{{ formatNum(prod.skill.procs) }} 次</b>
      </div>
      <div class="row total">
        <span>{{ UI.production.total }}</span>
        <b>{{ formatInt(prod.totalStrength) }}</b>
      </div>
      <p class="muted tiny">白天 {{ formatNum(prod.dayHelps) }} 次 · 夜间 {{ formatNum(prod.nightHelps) }} 次 · 偷吃 {{ formatNum(prod.sneakyHelps) }}</p>
    </div>
  </section>
</template>

<style scoped>
.preview { padding: 14px; }
.lines { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.lines .row b { font-variant-numeric: tabular-nums; }
.total { padding-top: 8px; border-top: 1px solid var(--line); }
em {
  font-style: normal;
  margin-left: 6px;
  color: var(--accent-2);
  font-size: 11px;
  font-weight: 800;
}
.tiny { font-size: 12px; margin: 4px 0 0; }
</style>
