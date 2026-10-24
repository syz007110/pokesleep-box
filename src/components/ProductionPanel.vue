<script setup lang="ts">
import { formatNumber } from '../calc/format'
import { getSkill } from '../data/catalog'
import { skillUnitLabel } from '../data/names'
import type { ProductionResult } from '../calc/production'
import type { SpeciesDef } from '../models/types'

defineProps<{
  result: ProductionResult
  species?: SpeciesDef | null
}>()
</script>

<template>
  <div>
    <div class="stat-grid mb-3">
      <div class="stat-card">
        <div class="label">24h 卡比兽能量</div>
        <div class="value">{{ formatNumber(result.totalStrength, 0) }}</div>
        <div class="muted">树果 {{ formatNumber(result.berryEnergy, 0) }} + 技能 {{ formatNumber(result.skillEnergy, 0) }}</div>
      </div>
      <div class="stat-card">
        <div class="label">显示间隔</div>
        <div class="value">{{ result.displayFrequencyLabel }}</div>
        <div class="muted">{{ result.displayFrequency }} 秒</div>
      </div>
      <div class="stat-card">
        <div class="label">帮忙次数</div>
        <div class="value">{{ formatNumber(result.helps) }}</div>
        <div class="muted">白天 {{ formatNumber(result.dayHelps) }} / 夜间 {{ formatNumber(result.nightHelps) }}</div>
      </div>
      <div class="stat-card">
        <div class="label">树果</div>
        <div class="value">{{ formatNumber(result.berries) }}</div>
        <div class="muted">
          每次 {{ result.berriesPerDrop }} 个 · {{ formatNumber(result.berryEnergyEach, 0) }} 能
          <span v-if="result.favored"> · 喜爱 ×2</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="label">技能发动</div>
        <div class="value">{{ formatNumber(result.skillProcs) }}</div>
        <div class="muted">
          {{ getSkill(species?.skill ?? '')?.nameZh ?? '主技能' }} · {{ (result.skillRateWithPity * 100).toFixed(2) }}%
        </div>
      </div>
      <div class="stat-card">
        <div class="label">携带上限</div>
        <div class="value">{{ result.carrySize }}</div>
        <div class="muted">夜间溢出 {{ formatNumber(result.nightSpilledHelps) }} 次</div>
      </div>
    </div>

    <v-card class="pa-3 mb-3" color="surface-bright">
      <div class="text-caption muted mb-2">食材（24h，含夜间偷吃前）</div>
      <div v-if="!result.ingredients.length" class="muted">当前等级尚未解锁食材栏。</div>
      <div v-for="row in result.ingredients" :key="row.id" class="d-flex justify-space-between py-1">
        <span>{{ row.nameZh }}</span>
        <span class="font-weight-medium">{{ formatNumber(row.amount) }} · {{ formatNumber(row.energy, 0) }} 能</span>
      </div>
      <div class="d-flex justify-space-between pt-2 text-caption">
        <span class="muted">食材能量合计（未做菜）</span>
        <span>{{ formatNumber(result.ingredientEnergy, 0) }}</span>
      </div>
    </v-card>

    <v-alert
      v-if="result.skillUnit && result.skillUnit !== 'strength'"
      type="info"
      variant="tonal"
      density="compact"
    >
      技能效果约 {{ formatNumber(result.skillAmount) }} {{ skillUnitLabel(result.skillUnit) }}
    </v-alert>
  </div>
</template>
