<script setup lang="ts">
import { formatNumber } from '../calc/format'
import { getSkill } from '../data/catalog'
import { skillUnitLabel } from '../data/names'
import type { ProductionResult } from '../calc/production'
import type { SpeciesDef } from '../models/types'

defineProps<{
  result: ProductionResult
  species?: SpeciesDef | null
  compact?: boolean
}>()
</script>

<template>
  <div>
    <div class="lab-card mb-2">
      <div class="hero-strength">
        <div class="muted">24h 卡比兽能量</div>
        <div class="value num">{{ formatNumber(result.totalStrength, 0) }}</div>
        <div class="muted">
          树果 {{ formatNumber(result.berryEnergy, 0) }}
          · 技能 {{ formatNumber(result.skillEnergy, 0) }}
        </div>
      </div>
    </div>

    <div class="stat-grid mb-2">
      <div class="stat-tile">
        <div class="label">显示间隔</div>
        <div class="value num">{{ result.displayFrequencyLabel }}</div>
        <div class="muted">{{ result.displayFrequency }} 秒</div>
      </div>
      <div class="stat-tile">
        <div class="label">帮忙次数</div>
        <div class="value num">{{ formatNumber(result.helps) }}</div>
        <div class="muted">
          <span class="day">昼 {{ formatNumber(result.dayHelps) }}</span>
          ·
          <span class="night">夜 {{ formatNumber(result.nightHelps) }}</span>
        </div>
      </div>
      <div class="stat-tile">
        <div class="label">树果</div>
        <div class="value num berry">{{ formatNumber(result.berries) }}</div>
        <div class="muted">
          每次 {{ result.berriesPerDrop }} · {{ formatNumber(result.berryEnergyEach, 0) }} 能
          <span v-if="result.favored"> · 喜爱 ×2</span>
        </div>
      </div>
      <div class="stat-tile">
        <div class="label">技能发动</div>
        <div class="value num skill">{{ formatNumber(result.skillProcs) }}</div>
        <div class="muted">
          {{ getSkill(species?.skill ?? '')?.nameZh ?? '主技能' }} ·
          {{ (result.skillRateWithPity * 100).toFixed(2) }}%
        </div>
      </div>
      <div v-if="!compact" class="stat-tile">
        <div class="label">携带上限</div>
        <div class="value num">{{ result.carrySize }}</div>
        <div class="muted">夜间溢出 {{ formatNumber(result.nightSpilledHelps) }} 次</div>
      </div>
    </div>

    <div class="lab-card">
      <div class="muted mb-2">食材（24h，含夜间偷吃前）</div>
      <div v-if="!result.ingredients.length" class="muted">当前等级尚未解锁食材栏。</div>
      <div v-for="row in result.ingredients" :key="row.id" class="ing-row">
        <span>{{ row.nameZh }}</span>
        <span class="num">{{ formatNumber(row.amount) }} · {{ formatNumber(row.energy, 0) }} 能</span>
      </div>
      <div class="ing-row pt-2">
        <span class="muted">食材能量合计（未做菜）</span>
        <span class="num">{{ formatNumber(result.ingredientEnergy, 0) }}</span>
      </div>
    </div>

    <div
      v-if="result.skillUnit && result.skillUnit !== 'strength'"
      class="lab-card mt-2"
    >
      技能效果约 {{ formatNumber(result.skillAmount) }} {{ skillUnitLabel(result.skillUnit) }}
    </div>
  </div>
</template>

<style scoped>
.day {
  color: var(--lab-day);
}

.night {
  color: var(--lab-night);
}

.berry {
  color: var(--lab-berry);
}

.skill {
  color: var(--lab-skill);
}

.ing-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}
</style>
