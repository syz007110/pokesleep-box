<script setup lang="ts">
import { computed, ref } from 'vue'
import { calculateProduction, toCalcPokemon, type ProductionResult } from '../calc/production'
import { formatNumber } from '../calc/format'
import { getSpecies } from '../data/catalog'
import { SPECIALTY_LABEL } from '../data/names'
import { useBoxStore } from '../stores/box'
import { useSettingsStore } from '../stores/settings'
import { useTeamStore } from '../stores/team'
import SpeciesAvatar from '../components/SpeciesAvatar.vue'
import ProductionPanel from '../components/ProductionPanel.vue'
import type { CalcPokemon } from '../calc/production'

const teamStore = useTeamStore()
const box = useBoxStore()
const settings = useSettingsStore()
const picking = ref<number | null>(null)

function helpingBonusCount(members: CalcPokemon[]) {
  return members.filter((member) => member.subskills.has('Helping Bonus')).length
}

function summarizeTeam(members: CalcPokemon[], ctx: {
  camp: boolean
  islandBonus: number
  favoredBerries: string[]
  dayHours: number
  nightHours: number
  startingEnergy: number
}) {
  const helpingBonus = helpingBonusCount(members)
  const results = members.map((member) => ({
    id: memberId(member),
    result: calculateProduction({
      ...ctx,
      ...member,
      teamHelpingBonus: Math.max(0, helpingBonus - (member.subskills.has('Helping Bonus') ? 1 : 0))
    })
  }))
  const ingredients = new Map<string, { id: string; nameZh: string; amount: number }>()
  for (const { result } of results) {
    for (const row of result.ingredients) {
      const existing = ingredients.get(row.id)
      if (existing) existing.amount += row.amount
      else ingredients.set(row.id, { id: row.id, nameZh: row.nameZh, amount: row.amount })
    }
  }
  return {
    helpingBonus,
    members: results,
    berries: results.reduce((sum, row) => sum + row.result.berries, 0),
    berryEnergy: results.reduce((sum, row) => sum + row.result.berryEnergy, 0),
    ingredientEnergy: results.reduce((sum, row) => sum + row.result.ingredientEnergy, 0),
    skillEnergy: results.reduce((sum, row) => sum + row.result.skillEnergy, 0),
    totalStrength: results.reduce((sum, row) => sum + row.result.totalStrength, 0),
    ingredients: [...ingredients.values()].sort((a, b) => b.amount - a.amount)
  }
}

function memberId(member: CalcPokemon & { id?: string }) {
  return (member as CalcPokemon & { id: string }).id
}

const active = computed(() => teamStore.active())
const members = computed(() => {
  if (!active.value) return []
  return active.value.memberIds
    .map((id) => (id ? box.byId(id) : null))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .map((row) => {
      const input = toCalcPokemon(row, settings.settings)
      return input ? { id: row.id, ...input } : null
    })
    .filter((row): row is CalcPokemon & { id: string } => Boolean(row))
})

const summary = computed(() =>
  summarizeTeam(members.value, {
    camp: settings.settings.goodCamp,
    islandBonus: settings.settings.islandBonus,
    favoredBerries: settings.settings.favoredBerries,
    dayHours: settings.settings.dayHours,
    nightHours: settings.settings.nightHours,
    startingEnergy: settings.settings.startingEnergy
  })
)

async function pick(id: string | null) {
  if (picking.value == null) return
  await teamStore.setMember(picking.value, id)
  picking.value = null
}

function memberStrength(id: string, result?: ProductionResult) {
  return formatNumber(result?.totalStrength ?? summary.value.members.find((row) => row.id === id)?.result.totalStrength ?? 0, 0)
}
</script>

<template>
  <div class="page-shell">
    <div class="text-subtitle-1 font-weight-bold mb-1">{{ active?.name ?? '队伍' }}</div>
    <div class="muted mb-3">
      5 只帮手。带「帮手奖励」的成员会缩短全队间隔（最多 5 层、与速度副技能合计 35%）。
    </div>
    <div class="d-flex flex-column ga-2 mb-4">
      <v-card
        v-for="(id, index) in active?.memberIds ?? []"
        :key="index"
        class="pa-3"
        color="surface-bright"
        @click="picking = index"
      >
        <div class="d-flex align-center ga-3">
          <template v-if="id && box.byId(id)">
            <SpeciesAvatar :species="getSpecies(box.byId(id)!.speciesId)" />
            <div class="flex-grow-1">
              <div class="font-weight-bold">
                {{ box.byId(id)!.nickname || getSpecies(box.byId(id)!.speciesId)?.nameZh }}
              </div>
              <div class="muted">
                Lv.{{ box.byId(id)!.level }} ·
                {{ SPECIALTY_LABEL[getSpecies(box.byId(id)!.speciesId)?.specialty ?? 'berry'] }}
              </div>
            </div>
            <div class="text-right">
              <div class="font-weight-bold">{{ memberStrength(id) }}</div>
              <div class="muted">能量</div>
            </div>
          </template>
          <template v-else>
            <v-icon size="36" color="primary">mdi-plus-circle-outline</v-icon>
            <div>
              <div class="font-weight-medium">空位 {{ index + 1 }}</div>
              <div class="muted">从盒子里选一只</div>
            </div>
          </template>
        </div>
      </v-card>
    </div>

    <v-alert v-if="members.length === 0" variant="tonal" color="secondary" class="mb-4">
      还没有上阵帮手。先去盒子添加宝可梦，再点上面的空位编队。
    </v-alert>
    <template v-else>
      <div class="stat-grid mb-3">
        <div class="stat-card">
          <div class="label">队伍树果能量</div>
          <div class="value">{{ formatNumber(summary.berryEnergy, 0) }}</div>
        </div>
        <div class="stat-card">
          <div class="label">技能能量</div>
          <div class="value">{{ formatNumber(summary.skillEnergy, 0) }}</div>
        </div>
        <div class="stat-card">
          <div class="label">合计能量</div>
          <div class="value">{{ formatNumber(summary.totalStrength, 0) }}</div>
          <div class="muted">帮手奖励 ×{{ summary.helpingBonus }}</div>
        </div>
      </div>
      <v-card class="pa-3 mb-4" color="surface-bright">
        <div class="text-caption muted mb-2">队伍食材（24h）</div>
        <div v-if="!summary.ingredients.length" class="muted">暂无食材产出。</div>
        <div v-for="row in summary.ingredients" :key="row.id" class="d-flex justify-space-between py-1">
          <span>{{ row.nameZh }}</span>
          <span>{{ formatNumber(row.amount) }}</span>
        </div>
      </v-card>
      <div class="text-subtitle-2 mb-2">队员明细</div>
      <v-expansion-panels variant="accordion">
        <v-expansion-panel v-for="member in summary.members" :key="member.id">
          <v-expansion-panel-title>
            {{ box.byId(member.id)?.nickname || member.result.displayFrequencyLabel }} ·
            {{ formatNumber(member.result.totalStrength, 0) }}
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <ProductionPanel
              :result="member.result"
              :species="getSpecies(box.byId(member.id)?.speciesId ?? '')"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>

    <v-dialog :model-value="picking !== null" max-width="480" @update:model-value="(open) => !open && (picking = null)">
      <v-card class="pa-3">
        <div class="text-h6 mb-3">选择上阵宝可梦</div>
        <v-btn class="mb-3" variant="tonal" block @click="pick(null)">清空此位置</v-btn>
        <div v-if="box.pokemon.length === 0" class="muted">盒子是空的。</div>
        <v-list>
          <v-list-item
            v-for="row in box.pokemon"
            :key="row.id"
            :title="row.nickname || getSpecies(row.speciesId)?.nameZh"
            :subtitle="`Lv.${row.level}`"
            @click="pick(row.id)"
          >
            <template #prepend>
              <SpeciesAvatar :species="getSpecies(row.speciesId)" :size="36" />
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-dialog>
  </div>
</template>
