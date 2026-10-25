<template>
  <v-dialog v-model="open" max-width="640" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-text-box-plus-outline" color="primary" class="mr-2" />
        文本导入
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="open = false" />
      </v-card-title>

      <v-card-text>
        <p class="text-body-2 mb-2">
          打开《宝可梦睡眠》的详情，截图，用快捷指令「提取文本」或实况文本复制，再贴到这里。不上传图片。
        </p>
        <p class="text-body-2 mb-3">
          图标上的副技能、异色、性别和缎带经常认不出，下一页可以改。食材份量按图鉴固定，不读文字里的数字。
        </p>

        <template v-if="step === 'paste'">
          <v-textarea
            v-model="rawText"
            label="粘贴文字"
            variant="outlined"
            auto-grow
            rows="8"
            hide-details
            placeholder="物种: 皮卡丘"
          />
          <pre class="import-example mt-3">{{ example }}</pre>
          <v-btn class="mt-2" variant="text" size="small" @click="rawText = example">填入示例</v-btn>
        </template>

        <template v-else-if="draft">
          <v-alert
            v-if="draft.notes.length"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            <div v-for="(note, index) in draft.notes" :key="index">{{ note }}</div>
          </v-alert>
          <p v-if="skipped.length" class="text-caption mb-3">没写进盒子的字：{{ skipped.join('、') }}</p>

          <v-autocomplete
            :model-value="draft.speciesName"
            :items="speciesItems"
            item-title="title"
            item-value="value"
            label="物种"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-3"
            auto-select-first
            @update:model-value="changeSpecies"
          />

          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model.number="draft.level"
                type="number"
                min="1"
                max="100"
                label="等级"
                density="compact"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model.number="draft.skillLevel"
                :items="skillLevels"
                label="主技能等级"
                density="compact"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="12">
              <v-autocomplete
                v-model="draft.natureName"
                :items="natureItems"
                item-title="title"
                item-value="value"
                label="性格"
                density="compact"
                variant="outlined"
                hide-details
              />
            </v-col>
          </v-row>

          <div class="text-subtitle-2 mt-4 mb-2">食材</div>
          <v-row dense>
            <v-col v-for="(label, slot) in ingredientLabels" :key="label" cols="12" sm="4">
              <v-select
                v-model="draft.ingredientNames[slot]"
                :items="ingredientItems(slot as 0 | 1 | 2)"
                item-title="title"
                item-value="value"
                :label="label"
                density="compact"
                variant="outlined"
                hide-details
                :disabled="!draft.speciesName"
              />
            </v-col>
          </v-row>

          <div class="text-subtitle-2 mt-4 mb-2">副技能</div>
          <v-row v-for="(row, index) in subskillRows" :key="index" dense>
            <v-col cols="8">
              <v-autocomplete
                v-model="row.name"
                :items="subskillItems"
                item-title="title"
                item-value="value"
                :label="`副技能 ${index + 1}`"
                density="compact"
                variant="outlined"
                hide-details
                clearable
              />
            </v-col>
            <v-col cols="4">
              <v-select
                v-model.number="row.level"
                :items="unlockLevels"
                label="解锁"
                density="compact"
                variant="outlined"
                hide-details
                :disabled="!row.name"
              />
            </v-col>
          </v-row>
          <p v-if="subskillError" class="text-error text-caption mt-1">{{ subskillError }}</p>

          <v-row dense class="mt-4">
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="draft.nickname"
                label="昵称"
                density="compact"
                variant="outlined"
                hide-details
                :placeholder="speciesDisplay"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <v-select
                v-model.number="draft.ribbon"
                :items="ribbonItems"
                item-title="title"
                item-value="value"
                label="缎带"
                density="compact"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col v-if="gendered" cols="6" sm="3">
              <v-select
                v-model="draft.gender"
                :items="genderItems"
                item-title="title"
                item-value="value"
                label="性别"
                density="compact"
                variant="outlined"
                hide-details
              />
            </v-col>
          </v-row>

          <v-switch
            v-model="draft.shiny"
            class="mt-2"
            color="primary"
            hide-details
            inset
            label="异色"
            :disabled="shinyLocked"
          />
          <p v-if="preview" class="text-body-2 mt-2 mb-0">RP {{ preview.rp }}</p>
        </template>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-btn v-if="step === 'confirm'" variant="text" @click="step = 'paste'">返回修改文字</v-btn>
        <v-spacer />
        <v-btn v-if="step === 'paste'" color="primary" :disabled="!rawText.trim()" @click="parseText">解析</v-btn>
        <v-btn v-else color="primary" :disabled="!canSave" @click="save">存入口袋</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { success } from '@/components/snackbar/snackbar.vue'
import { EXAMPLE_PASTE, NATURE_ALIASES, SUBSKILL_ALIASES, chineseSpeciesName } from '@/local/text-import/aliases'
import { buildImportedPokemon, ingredientChoices, retargetSpecies, toDraft, type ImportDraft, type ImportSubskill } from '@/local/text-import/build-instance'
import { parseSleepText } from '@/local/text-import/parse-sleep-text'
import { usePokemonStore } from '@/stores/pokemon/pokemon-store'
import { COMPLETE_POKEDEX, getPokemon, subskill, type PokemonInstance } from 'sleepapi-common'
import { computed, ref } from 'vue'

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ saved: [pokemon: PokemonInstance] }>()

const example = EXAMPLE_PASTE
const unlockLevels = [10, 25, 50, 75, 100]
const ingredientLabels = ['食材（初始）', '食材（30）', '食材（60）']
const ribbonItems = [
  { title: '无', value: 0 },
  { title: '200 小时', value: 1 },
  { title: '500 小时', value: 2 },
  { title: '1000 小时', value: 3 },
  { title: '2000 小时', value: 4 }
]
const genderItems = [
  { title: '公', value: 'male' },
  { title: '母', value: 'female' }
]

const rawText = ref('')
const step = ref<'paste' | 'confirm'>('paste')
const draft = ref<ImportDraft | null>(null)
const subskillRows = ref<ImportSubskill[]>([])
const skipped = ref<string[]>([])

const speciesItems = COMPLETE_POKEDEX.map((pokemon) => {
  const zh = chineseSpeciesName(pokemon.name)
  return {
    title: zh ? `${zh} · ${pokemon.displayName}` : pokemon.displayName,
    value: pokemon.name
  }
}).sort((a, b) => a.title.localeCompare(b.title, 'zh'))

const natureItems = Object.entries(NATURE_ALIASES).map(([name, aliases]) => {
  const zh = aliases.find((alias) => /[\u4e00-\u9fff]/.test(alias))
  return { title: zh ? `${zh} · ${name}` : name, value: name }
})

const subskillItems = [
  { title: '（空）', value: '' },
  ...subskill.SUBSKILLS.map((entry) => {
    const zh = SUBSKILL_ALIASES[entry.name]?.find((alias) => /[\u4e00-\u9fff]/.test(alias))
    return { title: zh ? `${zh} · ${entry.shortName}` : entry.name, value: entry.name }
  })
]

const pokemon = computed(() => (draft.value?.speciesName ? getPokemon(draft.value.speciesName) : null))
const speciesDisplay = computed(() => pokemon.value?.displayName ?? '')
const gendered = computed(() => !!pokemon.value && pokemon.value.genders.male + pokemon.value.genders.female > 0)
const shinyLocked = computed(() => pokemon.value?.shinyLocked === true)
const skillLevels = computed(() => {
  const max = pokemon.value?.skill.maxLevel ?? 1
  return Array.from({ length: max }, (_, index) => index + 1)
})

const subskillError = computed(() => {
  const filled = subskillRows.value.filter((row) => row.name)
  const names = filled.map((row) => row.name)
  if (new Set(names).size !== names.length) return '副技能不能重复'
  const levels = filled.map((row) => row.level)
  if (new Set(levels).size !== levels.length) return '解锁等级不能重复'
  return ''
})

const preview = computed(() => {
  if (!draft.value?.speciesName || subskillError.value) return null
  if (!Number.isInteger(draft.value.level) || draft.value.level < 1 || draft.value.level > 100) return null
  try {
    return buildImportedPokemon(currentDraft())
  } catch {
    return null
  }
})

const canSave = computed(() => preview.value != null)

function ingredientItems(slot: 0 | 1 | 2) {
  if (!draft.value?.speciesName) return []
  return ingredientChoices(draft.value.speciesName, slot).map((choice) => ({
    title: `${choice.ingredient.longName} ×${choice.amount}`,
    value: choice.ingredient.name
  }))
}

function currentDraft(): ImportDraft {
  if (!draft.value) throw new Error('还没有解析结果')
  return {
    ...draft.value,
    subskills: subskillRows.value.filter((row) => row.name)
  }
}

function changeSpecies(speciesName: string | null) {
  if (!draft.value || !speciesName) return
  draft.value = retargetSpecies(currentDraft(), speciesName)
}

function parseText() {
  const parsed = parseSleepText(rawText.value)
  const next = toDraft(parsed)
  draft.value = next
  subskillRows.value = padSubskills(next.subskills)
  skipped.value = parsed.skipped
  step.value = 'confirm'
}

function padSubskills(rows: ImportSubskill[]): ImportSubskill[] {
  const padded = rows.map((row) => ({ ...row }))
  while (padded.length < 5) padded.push({ name: '', level: unlockLevels[padded.length] ?? 100 })
  return padded
}

function save() {
  const instance = buildImportedPokemon(currentDraft())
  usePokemonStore().upsertServerPokemon(instance)
  success(`已把 ${instance.name} 放进口袋`)
  emit('saved', instance)
  open.value = false
  step.value = 'paste'
  draft.value = null
}
</script>

<style scoped>
.import-example {
  white-space: pre-wrap;
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 0;
}
</style>
