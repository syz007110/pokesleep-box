<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { calculateProduction, toCalcPokemon } from '../calc/production'
import { currentPack, getNature, getSkill, getSpecies, searchPokemon } from '../data/catalog'
import { NATURE_STAT_LABEL, SPECIALTY_LABEL } from '../data/names'
import { emptyPokemon, SUBSKILL_UNLOCK_LEVELS } from '../models/types'
import { useBoxStore } from '../stores/box'
import { useSettingsStore } from '../stores/settings'
import SpeciesAvatar from '../components/SpeciesAvatar.vue'
import ProductionPanel from '../components/ProductionPanel.vue'

const route = useRoute()
const router = useRouter()
const box = useBoxStore()
const settings = useSettingsStore()
const pack = currentPack()

const isNew = computed(() => route.name === 'pokemon-new')
const form = reactive(emptyPokemon({ speciesId: 'PIKACHU' }))
const speciesQuery = ref('')
const pickingSpecies = ref(false)
const toast = ref(false)
const toastText = ref('')
const confirmDelete = ref(false)

const species = computed(() => pack.pokemon.find((row) => row.id === form.speciesId))
const natureItems = pack.natures.map((nature) => ({
  title: `${nature.nameZh}（${NATURE_STAT_LABEL[nature.up]}↑ ${NATURE_STAT_LABEL[nature.down]}↓）`,
  value: nature.id
}))
const subskillItems = [{ title: '无', value: null }, ...pack.subskills.map((row) => ({ title: row.nameZh, value: row.id }))]
const matches = computed(() => searchPokemon(speciesQuery.value).slice(0, 40))
const ingredient30Items = computed(() =>
  (species.value?.ingredients.lv30 ?? []).map((row, index) => ({
    title: `${pack.ingredients.find((item) => item.id === row.id)?.nameZh ?? row.id} ×${row.amount}`,
    value: index
  }))
)
const ingredient60Items = computed(() =>
  (species.value?.ingredients.lv60 ?? []).map((row, index) => ({
    title:
      row.id === 'locked'
        ? '未解锁'
        : `${pack.ingredients.find((item) => item.id === row.id)?.nameZh ?? row.id} ×${row.amount}`,
    value: index
  }))
)
const production = computed(() => {
  const input = toCalcPokemon(form, settings.settings)
  return input ? calculateProduction(input) : null
})

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string') {
      const existing = box.byId(id)
      if (existing) Object.assign(form, structuredClone(existing))
    }
  },
  { immediate: true }
)

function chooseSpecies(id: string) {
  form.speciesId = id
  form.ingredient30 = 0
  form.ingredient60 = 0
  pickingSpecies.value = false
}

async function save() {
  if (isNew.value) {
    const created = await box.add(form.speciesId)
    const saved = await box.save({ ...created, ...form, id: created.id })
    toastText.value = '已添加到盒子'
    toast.value = true
    await router.replace(`/pokemon/${saved.id}`)
  } else {
    await box.save(form)
    toastText.value = '已保存'
    toast.value = true
  }
}

async function remove() {
  await box.remove(form.id)
  router.replace('/')
}

function natureHint(id: string) {
  const nature = getNature(id)
  return nature ? `${NATURE_STAT_LABEL[nature.up]}↑ · ${NATURE_STAT_LABEL[nature.down]}↓` : ''
}
</script>

<template>
  <div class="page-shell">
    <div class="d-flex align-center ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" @click="router.back()" />
      <div class="flex-grow-1">
        <div class="text-h6">{{ isNew ? '添加宝可梦' : '编辑帮手' }}</div>
        <div class="muted">{{ species?.nameZh }} · {{ SPECIALTY_LABEL[species?.specialty ?? 'berry'] }}</div>
      </div>
      <v-btn color="primary" :disabled="!species" @click="save">保存</v-btn>
    </div>

    <v-card class="pa-3 mb-3" color="surface-bright" @click="pickingSpecies = true">
      <div class="d-flex align-center ga-3">
        <SpeciesAvatar :species="species" :size="52" />
        <div class="flex-grow-1">
          <div class="font-weight-bold">{{ species?.nameZh }}</div>
          <div class="muted">图鉴 #{{ species?.dex }} · 基础间隔 {{ species?.frequency }} 秒</div>
        </div>
        <v-icon>mdi-chevron-right</v-icon>
      </div>
    </v-card>

    <v-text-field v-model="form.nickname" label="昵称（可选）" class="mb-3" />
    <div class="mb-2 text-caption muted">等级 {{ form.level }}</div>
    <v-slider v-model="form.level" :min="1" :max="pack.constants.maxPokemonLevel" :step="1" class="mb-4" />
    <v-select v-model="form.natureId" :items="natureItems" label="性格" class="mb-3" />
    <div class="muted mb-3">{{ natureHint(form.natureId) }}</div>
    <v-select
      v-model="form.ingredient30"
      :items="ingredient30Items"
      label="30 级食材"
      class="mb-3"
      :disabled="form.level < 30"
    />
    <v-select
      v-model="form.ingredient60"
      :items="ingredient60Items"
      label="60 级食材"
      class="mb-3"
      :disabled="form.level < 60"
    />
    <div class="mb-2 text-caption muted">
      主技能 {{ getSkill(species?.skill ?? '')?.nameZh }} · 等级 {{ form.skillLevel }}
    </div>
    <v-slider
      v-model="form.skillLevel"
      :min="1"
      :max="getSkill(species?.skill ?? '')?.maxLevel || 6"
      :step="1"
      class="mb-4"
    />
    <div class="mb-2 text-caption muted">副技能（按解锁等级）</div>
    <v-select
      v-for="(_, index) in form.subskills"
      :key="index"
      v-model="form.subskills[index]"
      :items="subskillItems"
      :label="`栏位 ${index + 1} · Lv.${SUBSKILL_UNLOCK_LEVELS[index]}`"
      :disabled="form.level < SUBSKILL_UNLOCK_LEVELS[index]"
      class="mb-3"
    />
    <div class="mb-2 text-caption muted">睡饱饱奖章 {{ form.ribbon }}</div>
    <v-slider v-model="form.ribbon" :min="0" :max="4" :step="1" class="mb-4" />
    <v-switch v-model="form.favorite" color="primary" label="标记为常用" hide-details class="mb-4" />

    <div class="text-subtitle-1 font-weight-bold mb-2">产出估算</div>
    <div class="muted mb-3">按设置里的白天/夜间、岛屿加成和好露营券计算。活力从起床值按每 10 分钟 -1 衰减。</div>
    <ProductionPanel v-if="production" :result="production" :species="species" />
    <v-btn v-if="!isNew" block color="error" variant="tonal" class="mt-4" @click="confirmDelete = true">
      从盒子删除
    </v-btn>
  </div>

  <v-dialog v-model="pickingSpecies" fullscreen scrim="background">
    <v-card color="background">
      <v-toolbar color="surface" density="comfortable">
        <v-btn icon="mdi-close" @click="pickingSpecies = false" />
        <v-toolbar-title>选择宝可梦</v-toolbar-title>
      </v-toolbar>
      <div class="page-shell">
        <v-text-field
          v-model="speciesQuery"
          placeholder="中文 / 英文 / 图鉴号"
          prepend-inner-icon="mdi-magnify"
          class="mb-3"
        />
        <v-list bg-color="transparent">
          <v-list-item
            v-for="row in matches"
            :key="row.id"
            :title="row.nameZh"
            :subtitle="`#${row.dex} · ${SPECIALTY_LABEL[row.specialty]} · ${row.frequency}秒`"
            @click="chooseSpecies(row.id)"
          >
            <template #prepend>
              <SpeciesAvatar :species="row" :size="40" />
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-card>
  </v-dialog>

  <v-dialog v-model="confirmDelete" max-width="360">
    <v-card class="pa-4">
      <div class="text-h6 mb-2">删除这只宝可梦？</div>
      <div class="muted mb-4">盒子记录会立刻去掉。可用设置里的备份找回。</div>
      <div class="d-flex justify-end ga-2">
        <v-btn variant="text" @click="confirmDelete = false">取消</v-btn>
        <v-btn color="error" @click="remove">删除</v-btn>
      </div>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="toast" :timeout="1800">{{ toastText }}</v-snackbar>
</template>
