<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { calculateProduction, toCalcPokemon } from '../calc/production'
import { currentPack, getSkill, getSubskill, searchPokemon } from '../data/catalog'
import { NATURE_STAT_LABEL, SPECIALTY_LABEL } from '../data/names'
import { emptyPokemon, SUBSKILL_UNLOCK_LEVELS } from '../models/types'
import { useBoxStore } from '../stores/box'
import { useSettingsStore } from '../stores/settings'
import { ingredientShort, toIngredientSlot } from '../ui/labels'
import { RARITY_BG, RARITY_FG } from '../ui/tokens'
import SpeciesAvatar from '../components/SpeciesAvatar.vue'
import SpecialtyBadge from '../components/SpecialtyBadge.vue'
import ProductionPanel from '../components/ProductionPanel.vue'
import NatureText from '../components/NatureText.vue'

const route = useRoute()
const router = useRouter()
const box = useBoxStore()
const settings = useSettingsStore()
const pack = currentPack()

const isNew = computed(() => route.name === 'pokemon-new')
const form = reactive(emptyPokemon({ speciesId: 'PIKACHU' }))
const speciesQuery = ref('')
const pickingSpecies = ref(false)
const pickingSub = ref<number | null>(null)
const toast = ref(false)
const toastText = ref('')
const confirmDelete = ref(false)

const species = computed(() => pack.pokemon.find((row) => row.id === form.speciesId))
const natureItems = pack.natures.map((nature) => ({
  title: `${nature.nameZh}（${NATURE_STAT_LABEL[nature.up]}↑ ${NATURE_STAT_LABEL[nature.down]}↓）`,
  value: nature.id
}))
const matches = computed(() => searchPokemon(speciesQuery.value).slice(0, 40))
const ingredient30Items = computed(() => species.value?.ingredients.lv30 ?? [])
const ingredient60Items = computed(() => species.value?.ingredients.lv60 ?? [])
const production = computed(() => {
  const input = toCalcPokemon(form, settings.settings)
  return input ? calculateProduction(input) : null
})
const skill = computed(() => getSkill(species.value?.skill ?? ''))

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

function pickSub(index: number, id: string | null) {
  form.subskills[index] = id
  pickingSub.value = null
}

function cycleIngredient(level: 30 | 60) {
  const items = level === 30 ? ingredient30Items.value : ingredient60Items.value
  if (!items.length || (level === 30 ? form.level < 30 : form.level < 60)) return
  const current = level === 30 ? form.ingredient30 : form.ingredient60
  let next = (current + 1) % items.length
  if (items[next]?.id === 'locked') next = (next + 1) % items.length
  if (items[next]?.id === 'locked') return
  if (level === 30) form.ingredient30 = next
  else form.ingredient60 = next
}

function rarityBg(id: string | null) {
  if (!id) return 'transparent'
  return RARITY_BG[getSubskill(id)?.rarity ?? 'white']
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
</script>

<template>
  <div class="page-shell page-shell--overlay">
    <div class="d-flex align-center ga-2 mb-3">
      <v-btn icon="mdi-arrow-left" variant="text" aria-label="返回" @click="router.back()" />
      <div class="flex-grow-1">
        <div class="lab-title">{{ isNew ? '添加宝可梦' : '编辑帮手' }}</div>
        <div class="muted">{{ species?.nameZh }} · {{ SPECIALTY_LABEL[species?.specialty ?? 'berry'] }}</div>
      </div>
      <v-btn color="primary" :disabled="!species" @click="save">保存</v-btn>
    </div>

    <div class="lab-card lab-card--press mb-3" @click="pickingSpecies = true">
      <div class="d-flex align-center ga-3">
        <SpeciesAvatar :species="species" :size="56" />
        <div class="flex-grow-1 min-w-0">
          <div class="d-flex align-center ga-2">
            <div class="font-weight-bold text-truncate">{{ species?.nameZh }}</div>
            <SpecialtyBadge :specialty="species?.specialty" />
          </div>
          <div class="muted">图鉴 #{{ species?.dex }} · 基础间隔 {{ species?.frequency }} 秒</div>
        </div>
        <v-btn
          icon
          variant="text"
          :aria-label="form.favorite ? '取消常用' : '标记常用'"
          @click.stop="form.favorite = !form.favorite"
        >
          <v-icon :color="form.favorite ? 'strength' : 'accent'">
            {{ form.favorite ? 'mdi-star' : 'mdi-star-outline' }}
          </v-icon>
        </v-btn>
      </div>
      <v-text-field v-model="form.nickname" label="昵称（可选）" class="mt-3" @click.stop />
    </div>
    <div v-if="production" class="lab-card mb-3">
      <div class="hero-strength">
        <div class="muted">估算 24h 能量</div>
        <div class="value num">{{ Math.round(production.totalStrength).toLocaleString('zh-CN') }}</div>
      </div>
    </div>

    <div class="lab-section-title">等级 / 奖章</div>
    <div class="lab-card mb-2">
      <div class="d-flex align-center justify-space-between">
        <div class="muted">等级</div>
        <div class="num">{{ form.level }}</div>
      </div>
      <v-slider v-model="form.level" :min="1" :max="pack.constants.maxPokemonLevel" :step="1" />
      <div class="d-flex align-center justify-space-between mt-2">
        <div class="muted">睡饱饱奖章</div>
        <div class="num">{{ form.ribbon }}</div>
      </div>
      <v-slider v-model="form.ribbon" :min="0" :max="4" :step="1" />
    </div>

    <div class="lab-section-title">食材</div>
    <div class="lab-card mb-2">
      <div class="slot-grid">
        <div class="slot-btn is-locked">
          <span class="cap">Lv.1</span>
          <span class="main">
            {{ toIngredientSlot(species?.ingredients.lv1[0]?.id, species?.ingredients.lv1[0]?.amount).short }}
            ×{{ species?.ingredients.lv1[0]?.amount ?? 0 }}
          </span>
        </div>
        <button
          type="button"
          class="slot-btn"
          :class="{ 'is-locked': form.level < 30 }"
          :disabled="form.level < 30"
          @click="cycleIngredient(30)"
        >
          <span class="cap">Lv.30</span>
          <span class="main">
            {{
              form.level < 30
                ? '未解锁'
                : `${ingredientShort(ingredient30Items[form.ingredient30]?.id)}×${ingredient30Items[form.ingredient30]?.amount ?? 0}`
            }}
          </span>
        </button>
        <button
          type="button"
          class="slot-btn"
          :class="{ 'is-locked': form.level < 60 }"
          :disabled="form.level < 60"
          @click="cycleIngredient(60)"
        >
          <span class="cap">Lv.60</span>
          <span class="main">
            {{
              form.level < 60 || ingredient60Items[form.ingredient60]?.id === 'locked'
                ? '未解锁'
                : `${ingredientShort(ingredient60Items[form.ingredient60]?.id)}×${ingredient60Items[form.ingredient60]?.amount ?? 0}`
            }}
          </span>
        </button>
      </div>
      <div class="muted mt-2">点食材格循环可选栏位，和 Lab 计算器同一套 A/B/C 选择。</div>
    </div>

    <div class="lab-section-title">性格 / 主技能</div>
    <div class="lab-card mb-2">
      <v-select v-model="form.natureId" :items="natureItems" label="性格" />
      <div class="mt-2"><NatureText :nature-id="form.natureId" /></div>
      <div class="d-flex align-center justify-space-between mt-4">
        <div>
          <div class="muted">主技能</div>
          <div class="font-weight-bold">{{ skill?.nameZh }}</div>
        </div>
        <div class="num">Lv.{{ form.skillLevel }}</div>
      </div>
      <v-slider v-model="form.skillLevel" :min="1" :max="skill?.maxLevel || 6" :step="1" />
    </div>

    <div class="lab-section-title">副技能</div>
    <div class="lab-card mb-2">
      <div class="slot-grid">
        <button
          v-for="(id, index) in form.subskills"
          :key="index"
          type="button"
          class="slot-btn"
          :class="{ 'is-locked': form.level < SUBSKILL_UNLOCK_LEVELS[index] }"
          :style="id ? { background: rarityBg(id), color: RARITY_FG, borderColor: 'transparent' } : undefined"
          :disabled="form.level < SUBSKILL_UNLOCK_LEVELS[index]"
          @click="pickingSub = index"
        >
          <span class="cap">Lv.{{ SUBSKILL_UNLOCK_LEVELS[index] }}</span>
          <span class="main">{{ id ? getSubskill(id)?.short : '空' }}</span>
        </button>
      </div>
    </div>

    <div class="lab-section-title">产出估算</div>
    <p class="muted mb-2">按设置里的白天/夜间、岛屿加成和好露营券计算。活力从起床值按每 10 分钟 -1 衰减。</p>
    <ProductionPanel v-if="production" :result="production" :species="species" />
    <v-btn v-if="!isNew" block color="error" variant="tonal" class="mt-4" @click="confirmDelete = true">
      从盒子删除
    </v-btn>
  </div>

  <v-dialog v-model="pickingSpecies" fullscreen>
    <v-card color="background">
      <v-toolbar color="surface" density="comfortable">
        <v-btn icon="mdi-close" @click="pickingSpecies = false" />
        <v-toolbar-title class="lab-title">选择宝可梦</v-toolbar-title>
      </v-toolbar>
      <div class="page-shell page-shell--overlay">
        <v-text-field
          v-model="speciesQuery"
          placeholder="中文 / 英文 / 图鉴号"
          prepend-inner-icon="mdi-magnify"
          class="mb-3"
        />
        <div class="sheet-list">
          <button
            v-for="row in matches"
            :key="row.id"
            type="button"
            class="lab-card lab-card--press d-flex align-center ga-3"
            @click="chooseSpecies(row.id)"
          >
            <SpeciesAvatar :species="row" :size="40" />
            <div class="text-left flex-grow-1">
              <div class="font-weight-bold">{{ row.nameZh }}</div>
              <div class="muted">#{{ row.dex }} · {{ SPECIALTY_LABEL[row.specialty] }} · {{ row.frequency }}秒</div>
            </div>
            <SpecialtyBadge :specialty="row.specialty" />
          </button>
        </div>
      </div>
    </v-card>
  </v-dialog>

  <v-dialog :model-value="pickingSub !== null" max-width="420" @update:model-value="(open) => !open && (pickingSub = null)">
    <v-card class="pa-3" color="surface">
      <div class="lab-title mb-3">副技能栏 {{ (pickingSub ?? 0) + 1 }}</div>
      <button type="button" class="lab-card lab-card--press mb-2" @click="pickSub(pickingSub!, null)">清空此栏</button>
      <div class="sheet-list">
        <button
          v-for="row in pack.subskills"
          :key="row.id"
          type="button"
          class="lab-card lab-card--press d-flex align-center justify-space-between"
          :style="{ background: RARITY_BG[row.rarity], color: RARITY_FG }"
          @click="pickSub(pickingSub!, row.id)"
        >
          <span class="font-weight-bold">{{ row.nameZh }}</span>
          <span>{{ row.short }}</span>
        </button>
      </div>
    </v-card>
  </v-dialog>

  <v-dialog v-model="confirmDelete" max-width="360">
    <v-card class="pa-4" color="surface">
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

<style scoped>
.slot-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.slot-grid:has(> :nth-child(4)) {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
}
</style>
