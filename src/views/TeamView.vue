<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { calculateProduction, toCalcPokemon, type ProductionResult } from '../calc/production'
import { formatNumber } from '../calc/format'
import { getSpecies } from '../data/catalog'
import { SPECIALTY_LABEL } from '../data/names'
import { useBoxStore } from '../stores/box'
import { useSettingsStore } from '../stores/settings'
import { useTeamStore } from '../stores/team'
import SpeciesAvatar from '../components/SpeciesAvatar.vue'
import ProductionPanel from '../components/ProductionPanel.vue'
import TeamSlotCard from '../components/TeamSlotCard.vue'
import type { CalcPokemon } from '../calc/production'
import type { BoxPokemon } from '../models/types'

const teamStore = useTeamStore()
const box = useBoxStore()
const settings = useSettingsStore()
const router = useRouter()
const picking = ref<number | null>(null)
const actionsFor = ref<number | null>(null)
const tab = ref<'overview' | 'members'>('overview')

function helpingBonusCount(members: CalcPokemon[]) {
  return members.filter((member) => member.subskills.has('Helping Bonus')).length
}

function summarizeTeam(
  members: CalcPokemon[],
  ctx: {
    camp: boolean
    islandBonus: number
    favoredBerries: string[]
    dayHours: number
    nightHours: number
    startingEnergy: number
  }
) {
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
const filled = computed(() => {
  const ids = active.value?.memberIds ?? [null, null, null, null, null]
  return ids.map((id) => (id ? box.byId(id) ?? null : null))
})

const members = computed(() => {
  return filled.value
    .filter((row): row is BoxPokemon => Boolean(row))
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

function onSlot(index: number) {
  const id = active.value?.memberIds[index]
  if (id && box.byId(id)) actionsFor.value = index
  else picking.value = index
}

async function pick(id: string | null) {
  if (picking.value == null) return
  await teamStore.setMember(picking.value, id)
  picking.value = null
}

function openPicker(index: number) {
  actionsFor.value = null
  picking.value = index
}

function editMember(index: number) {
  const id = active.value?.memberIds[index]
  actionsFor.value = null
  if (id) router.push(`/pokemon/${id}`)
}

async function clearMember(index: number) {
  actionsFor.value = null
  await teamStore.setMember(index, null)
}

function memberStrength(id: string, result?: ProductionResult) {
  return formatNumber(
    result?.totalStrength ?? summary.value.members.find((row) => row.id === id)?.result.totalStrength ?? 0,
    0
  )
}
</script>

<template>
  <div class="page-shell">
    <div class="d-flex align-center justify-space-between mb-2">
      <div>
        <div class="lab-title">{{ active?.name ?? '队伍' }}</div>
        <div class="muted">5 只帮手 · 帮手奖励最多 5 层</div>
      </div>
      <div v-if="members.length" class="text-right">
        <div class="num strength" style="font-size: 22px">{{ formatNumber(summary.totalStrength, 0) }}</div>
        <div class="muted">队伍能量</div>
      </div>
    </div>

    <div class="team-rail mb-2">
      <TeamSlotCard
        v-for="(row, index) in filled"
        :key="index"
        :index="index"
        :pokemon="row"
        @click="onSlot(index)"
      />
    </div>

    <div v-if="members.length === 0" class="empty-hero">
      <v-icon size="44" color="accent">mdi-account-group-outline</v-icon>
      <h2>还没有上阵</h2>
      <p class="muted">先去盒子添加宝可梦，再点上面的空位编队。点满员格子可更换或编辑。</p>
    </div>
    <template v-else>
      <div class="seg-tabs">
        <button type="button" :class="{ 'is-on': tab === 'overview' }" @click="tab = 'overview'">总览</button>
        <button type="button" :class="{ 'is-on': tab === 'members' }" @click="tab = 'members'">队员</button>
      </div>

      <template v-if="tab === 'overview'">
        <div class="stat-grid mb-2">
          <div class="stat-tile">
            <div class="label">树果能量</div>
            <div class="value num" style="color: var(--lab-berry)">{{ formatNumber(summary.berryEnergy, 0) }}</div>
          </div>
          <div class="stat-tile">
            <div class="label">技能能量</div>
            <div class="value num" style="color: var(--lab-skill)">{{ formatNumber(summary.skillEnergy, 0) }}</div>
          </div>
          <div class="stat-tile">
            <div class="label">合计能量</div>
            <div class="value num strength">{{ formatNumber(summary.totalStrength, 0) }}</div>
            <div class="muted">帮手奖励 ×{{ summary.helpingBonus }}</div>
          </div>
        </div>
        <div class="lab-card">
          <div class="muted mb-2">队伍食材（24h）</div>
          <div v-if="!summary.ingredients.length" class="muted">暂无食材产出。</div>
          <div v-for="row in summary.ingredients" :key="row.id" class="d-flex justify-space-between py-1">
            <span>{{ row.nameZh }}</span>
            <span class="num">{{ formatNumber(row.amount) }}</span>
          </div>
        </div>
      </template>

      <div v-else class="d-flex flex-column ga-2">
        <div v-for="member in summary.members" :key="member.id" class="lab-card">
          <div class="d-flex align-center ga-2 mb-2">
            <SpeciesAvatar :species="getSpecies(box.byId(member.id)?.speciesId ?? '')" :size="36" />
            <div class="flex-grow-1">
              <div class="font-weight-bold">
                {{ box.byId(member.id)?.nickname || getSpecies(box.byId(member.id)?.speciesId ?? '')?.nameZh }}
              </div>
              <div class="muted">
                Lv.{{ box.byId(member.id)?.level }} ·
                {{ SPECIALTY_LABEL[getSpecies(box.byId(member.id)?.speciesId ?? '')?.specialty ?? 'berry'] }}
              </div>
            </div>
            <div class="num strength">{{ memberStrength(member.id, member.result) }}</div>
          </div>
          <ProductionPanel
            :result="member.result"
            :species="getSpecies(box.byId(member.id)?.speciesId ?? '')"
            compact
          />
        </div>
      </div>
    </template>

    <v-dialog :model-value="actionsFor !== null" max-width="360" @update:model-value="(open) => !open && (actionsFor = null)">
      <v-card class="pa-3" color="surface">
        <div class="lab-title mb-3">空位 {{ (actionsFor ?? 0) + 1 }}</div>
        <button type="button" class="lab-card lab-card--press mb-2" @click="openPicker(actionsFor!)">更换帮手</button>
        <button type="button" class="lab-card lab-card--press mb-2" @click="editMember(actionsFor!)">编辑这只</button>
        <button type="button" class="lab-card lab-card--press" @click="clearMember(actionsFor!)">移出队伍</button>
      </v-card>
    </v-dialog>

    <v-dialog :model-value="picking !== null" fullscreen @update:model-value="(open) => !open && (picking = null)">
      <v-card color="background">
        <v-toolbar color="surface" density="comfortable">
          <v-btn icon="mdi-close" @click="picking = null" />
          <v-toolbar-title class="lab-title">选择上阵宝可梦</v-toolbar-title>
        </v-toolbar>
        <div class="page-shell page-shell--overlay">
          <v-btn class="mb-3" variant="tonal" block @click="pick(null)">清空此位置</v-btn>
          <div v-if="box.pokemon.length === 0" class="muted">盒子是空的。</div>
          <div class="sheet-list">
            <button
              v-for="row in box.pokemon"
              :key="row.id"
              type="button"
              class="lab-card lab-card--press d-flex align-center ga-3"
              @click="pick(row.id)"
            >
              <SpeciesAvatar :species="getSpecies(row.speciesId)" :size="40" />
              <div class="text-left flex-grow-1">
                <div class="font-weight-bold">{{ row.nickname || getSpecies(row.speciesId)?.nameZh }}</div>
                <div class="muted">Lv.{{ row.level }}</div>
              </div>
              <v-icon>mdi-chevron-right</v-icon>
            </button>
          </div>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>
