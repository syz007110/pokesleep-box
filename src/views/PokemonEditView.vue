<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductionPreview from '../components/ProductionPreview.vue'
import { getNature, getPokemon, NATURES, requirePokemon, SUBSKILLS } from '../game/catalog'
import { BERRY_NAMES, INGREDIENT_NAMES, NATURE_NAMES, NATURE_STAT, SKILL_NAMES, SUBSKILL_NAMES, pokemonLabel, zh } from '../i18n/names'
import { INGREDIENT_UNLOCKS, SUBSKILL_UNLOCKS, UI } from '../i18n/ui'
import { MAX_POKEMON_LEVEL } from 'sleepapi-common'
import { useBoxStore } from '../stores/box'
import type { BoxPokemon } from '../models/types'

const route = useRoute()
const router = useRouter()
const box = useBoxStore()

const member = computed(() => box.list.find((p) => p.id === route.params.id))
const form = reactive<BoxPokemon>(box.createDraft('PIKACHU'))
const ready = computed(() => box.loaded && Boolean(member.value))

watch(
  member,
  (row) => {
    if (!row) return
    Object.assign(form, row, {
      ingredientIndexes: [...row.ingredientIndexes] as [number, number, number],
      subskills: [...row.subskills]
    })
  },
  { immediate: true }
)

watch([() => box.loaded, member], ([loaded, row]) => {
  if (loaded && !row) router.replace('/')
})

const pokemon = computed(() => getPokemon(form.speciesId) ?? requirePokemon('PIKACHU'))
const nature = computed(() => getNature(form.natureId))
const prod = computed(() => box.productionFor(form))
const skillMax = computed(() => pokemon.value.skill.maxLevel)

function slotOptions(levelIndex: 0 | 1 | 2) {
  const bags = [pokemon.value.ingredient0, pokemon.value.ingredient30, pokemon.value.ingredient60]
  return bags[levelIndex]
}

function subskillAt(index: number) {
  return form.subskills[index] ?? ''
}

function setSubskill(index: number, name: string) {
  const next = [...form.subskills]
  while (next.length < 5) next.push('')
  next[index] = name
  form.subskills = next.filter((s, i) => s || i < index)
}

async function save() {
  form.subskills = form.subskills.filter(Boolean)
  await box.save({ ...form, ingredientIndexes: [...form.ingredientIndexes] as [number, number, number] })
  router.push('/')
}

async function duplicate() {
  const copy = box.createDraft(form.speciesId)
  Object.assign(copy, form, { id: copy.id, nickname: form.nickname ? `${form.nickname} 副本` : '', createdAt: copy.createdAt })
  await box.save(copy)
  router.replace(`/pokemon/${copy.id}`)
}

async function remove() {
  if (!confirm('确定从盒子里删掉这只宝可梦？')) return
  await box.remove(form.id)
  router.push('/')
}

function natureNote(n: (typeof NATURES)[number]) {
  if (n.positiveModifier === 'neutral') return NATURE_STAT.neutral.zh
  return `+${zh(NATURE_STAT, n.positiveModifier)} / −${zh(NATURE_STAT, n.negativeModifier)}`
}
</script>

<template>
  <main v-if="ready" class="page">
    <header class="topbar">
      <div>
        <div class="eyebrow">{{ pokemonLabel(form.speciesId) }}</div>
        <h1>{{ form.nickname || UI.edit.title }}</h1>
      </div>
      <button class="btn btn-ghost" @click="router.push('/')">{{ UI.common.close }}</button>
    </header>

    <section class="card form-card">
      <div class="field">
        <label>{{ UI.edit.nickname }}</label>
        <input v-model="form.nickname" class="input" :placeholder="UI.edit.nicknamePh" />
      </div>

      <div class="field">
        <label>{{ UI.edit.level }} · {{ form.level }}</label>
        <input v-model.number="form.level" class="range" type="range" min="1" :max="MAX_POKEMON_LEVEL" />
      </div>

      <div class="field">
        <label>{{ UI.edit.nature }}</label>
        <select v-model="form.natureId" class="select">
          <option v-for="n in NATURES" :key="n.name" :value="n.name">
            {{ zh(NATURE_NAMES, n.name) }}（{{ natureNote(n) }}）
          </option>
        </select>
      </div>

      <div class="field">
        <label>{{ UI.edit.skillLevel }} · {{ form.skillLevel }} / {{ skillMax }}</label>
        <p class="muted hint">{{ zh(SKILL_NAMES, pokemon.skill.name, pokemon.skill.name) }} · {{ UI.edit.skillLevelHint }}</p>
        <input v-model.number="form.skillLevel" class="range" type="range" min="1" :max="skillMax" />
      </div>

      <div class="field">
        <label>{{ UI.edit.ribbon }} · {{ form.ribbon }}</label>
        <input v-model.number="form.ribbon" class="range" type="range" min="0" max="4" />
      </div>

      <label class="check">
        <input v-model="form.shiny" type="checkbox" />
        {{ UI.edit.shiny }}
      </label>
    </section>

    <section class="card form-card">
      <h2>{{ UI.edit.subskills }}</h2>
      <p class="muted hint">{{ UI.edit.subskillHint }}</p>
      <div v-for="(lv, index) in SUBSKILL_UNLOCKS" :key="lv" class="field">
        <label>{{ UI.edit.slot(lv) }} {{ form.level < lv ? UI.edit.locked : '' }}</label>
        <select :value="subskillAt(index)" class="select" :disabled="form.level < lv" @change="setSubskill(index, ($event.target as HTMLSelectElement).value)">
          <option value="">—</option>
          <option v-for="s in SUBSKILLS" :key="s.name" :value="s.name" :disabled="form.subskills.includes(s.name) && subskillAt(index) !== s.name">
            {{ zh(SUBSKILL_NAMES, s.name) }}
          </option>
        </select>
      </div>
    </section>

    <section class="card form-card">
      <h2>{{ UI.edit.ingredients }} · {{ zh(BERRY_NAMES, pokemon.berry.name) }}</h2>
      <div v-for="(lv, index) in INGREDIENT_UNLOCKS" :key="lv" class="field">
        <label>Lv.{{ lv }} {{ form.level < (lv === 1 ? 1 : lv) ? UI.edit.locked : '' }}</label>
        <div class="sheet-grid">
          <button
            v-for="(slot, opt) in slotOptions(index as 0 | 1 | 2)"
            :key="slot.ingredient.name + opt"
            class="choice"
            :class="{ active: form.ingredientIndexes[index] === opt }"
            :disabled="form.level < (lv === 1 ? 1 : lv)"
            @click="form.ingredientIndexes[index] = opt"
          >
            {{ zh(INGREDIENT_NAMES, slot.ingredient.name) }} ×{{ slot.amount }}
          </button>
        </div>
      </div>
      <div class="field">
        <label>{{ UI.edit.extraCarry }} · {{ form.extraCarry }}</label>
        <input v-model.number="form.extraCarry" class="range" type="range" min="-10" max="30" />
      </div>
    </section>

    <h2 class="section-title">{{ UI.edit.preview }}</h2>
    <ProductionPreview :prod="prod" />

    <div class="actions">
      <button class="btn btn-primary btn-block" @click="save">{{ UI.edit.save }}</button>
      <button class="btn btn-ghost btn-block" @click="duplicate">{{ UI.edit.duplicate }}</button>
      <button class="btn btn-danger btn-block" @click="remove">{{ UI.edit.delete }}</button>
    </div>
    <p class="muted hint">性格：{{ zh(NATURE_NAMES, nature.name) }} · {{ natureNote(nature) }}</p>
  </main>
</template>

<style scoped>
.form-card, .actions { padding: 16px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 14px; }
.form-card h2, .section-title { margin: 0 0 4px; font-size: 18px; }
.hint { font-size: 12px; margin: 0; }
.check { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 650; }
.check input { width: 22px; height: 22px; }
.actions { padding: 0; }
</style>
