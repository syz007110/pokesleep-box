<script setup lang="ts">
import { ref } from 'vue'
import { currentPack } from '../data/catalog'
import { exportBackup, importBackup, parseBackup } from '../db'
import { useBoxStore } from '../stores/box'
import { usePackStore } from '../stores/pack'
import { useSettingsStore } from '../stores/settings'
import { useTeamStore } from '../stores/team'

const settings = useSettingsStore()
const packStore = usePackStore()
const box = useBoxStore()
const team = useTeamStore()
const pack = currentPack()
const toast = ref(false)
const toastText = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const section = ref<'game' | 'backup' | 'pack'>('game')

const berryItems = pack.berries.map((berry) => ({
  title: `${berry.nameZh}（${berry.typeZh}）`,
  value: berry.id
}))

function notify(text: string) {
  toastText.value = text
  toast.value = true
}

async function persist() {
  await settings.save({ ...settings.settings })
  notify('设置已保存')
}

async function onExport() {
  const backup = await exportBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `neroli-pocket-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
  notify('备份已导出')
}

async function onImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const backup = parseBackup(await file.text())
    await importBackup(backup)
    await Promise.all([box.hydrate(), team.hydrate(), settings.hydrate()])
    notify(`已导入 ${backup.pokemon.length} 只宝可梦`)
  } catch (err) {
    notify(err instanceof Error ? err.message : '导入失败')
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}

function onFavored(value: string[]) {
  settings.settings.favoredBerries = value.slice(0, 3)
  persist()
}
</script>

<template>
  <div class="page-shell">
    <div class="seg-tabs" style="grid-template-columns: 1fr 1fr 1fr">
      <button type="button" :class="{ 'is-on': section === 'game' }" @click="section = 'game'">游戏</button>
      <button type="button" :class="{ 'is-on': section === 'backup' }" @click="section = 'backup'">备份</button>
      <button type="button" :class="{ 'is-on': section === 'pack' }" @click="section = 'pack'">数据包</button>
    </div>

    <template v-if="section === 'game'">
      <div class="lab-section-title">计算假设</div>
      <div class="lab-card mb-2">
        <div class="d-flex align-center justify-space-between">
          <div class="muted">岛屿加成</div>
          <div class="num">{{ settings.settings.islandBonus }}%</div>
        </div>
        <v-slider
          v-model="settings.settings.islandBonus"
          :min="0"
          :max="pack.constants.maxIslandBonus"
          :step="1"
          @end="persist"
        />
        <v-select
          v-model="settings.settings.favoredBerries"
          :items="berryItems"
          label="本岛喜爱树果（最多 3）"
          multiple
          chips
          closable-chips
          class="mt-2"
          @update:model-value="onFavored"
        />
        <v-switch
          v-model="settings.settings.goodCamp"
          label="好露营券（间隔 ÷1.2，携带上限 ×1.2）"
          class="mt-3"
          @update:model-value="persist"
        />
      </div>
      <div class="lab-card">
        <div class="d-flex align-center justify-space-between">
          <div class="muted">白天小时</div>
          <div class="num" style="color: var(--lab-day)">{{ settings.settings.dayHours }}</div>
        </div>
        <v-slider v-model="settings.settings.dayHours" :min="8" :max="18" :step="0.5" @end="persist" />
        <div class="d-flex align-center justify-space-between mt-2">
          <div class="muted">夜间小时</div>
          <div class="num" style="color: var(--lab-night)">{{ settings.settings.nightHours }}</div>
        </div>
        <v-slider v-model="settings.settings.nightHours" :min="6" :max="12" :step="0.5" @end="persist" />
        <div class="d-flex align-center justify-space-between mt-2">
          <div class="muted">起床活力</div>
          <div class="num" style="color: var(--lab-energy)">{{ settings.settings.startingEnergy }}</div>
        </div>
        <v-slider v-model="settings.settings.startingEnergy" :min="0" :max="150" :step="1" @end="persist" />
      </div>
    </template>

    <template v-else-if="section === 'backup'">
      <div class="lab-section-title">备份与恢复</div>
      <div class="lab-card mb-3">
        <p class="muted mb-3">
          iPhone Safari 清缓存时 IndexedDB 可能一起没。请定期导出 JSON，换机或重装后从这里导回。
        </p>
        <v-btn block color="primary" class="mb-2" @click="onExport">导出备份 JSON</v-btn>
        <v-btn block variant="tonal" @click="fileInput?.click()">导入备份 JSON</v-btn>
        <input ref="fileInput" type="file" accept="application/json" hidden @change="onImport" />
      </div>
      <div class="lab-section-title">关于</div>
      <div class="lab-card">
        <p class="muted">
          橙花口袋本是给个人离线用的宝可梦睡眠计算器。界面按 Neroli's Lab 的配色、卡片与队伍栏位来排；公式对齐 Lab /
          SleepAPI 的公开实现。
        </p>
        <p class="muted mt-2">游戏数据来自 Neroli's Lab common（Apache-2.0）。本应用不联网登录、不上传存档。</p>
      </div>
    </template>

    <template v-else>
      <div class="lab-section-title">数据包</div>
      <div class="lab-card mb-3">
        <div>当前版本 <strong>{{ packStore.version }}</strong></div>
        <div class="muted mt-1">{{ packStore.source }}</div>
        <div class="muted">
          内置版本 {{ packStore.bundledVersion }}{{ packStore.usingOverlay ? ' · 正在使用覆盖包' : '' }}
        </div>
      </div>
      <v-text-field
        v-model="settings.settings.packUrl"
        label="远程数据包 URL（可选）"
        placeholder="https://example.com/datapack.json"
        class="mb-3"
        @change="persist"
      />
      <v-btn block variant="tonal" :loading="packStore.checking" class="mb-2" @click="packStore.checkUpdate">
        检查更新
      </v-btn>
      <v-btn v-if="packStore.usingOverlay" block variant="text" class="mb-2" @click="packStore.restoreBundled">
        恢复内置数据包
      </v-btn>
      <v-alert v-if="packStore.message" variant="tonal" color="success" class="mb-2">{{ packStore.message }}</v-alert>
      <v-alert v-if="packStore.error" variant="tonal" color="error" class="mb-2">{{ packStore.error }}</v-alert>
      <p class="muted">
        现在不必接 CDN。以后把新的静态 JSON 放到任意地址，填到上面再点检查即可，用户存档不会被数据包覆盖。
      </p>
    </template>
  </div>

  <v-snackbar v-model="toast" :timeout="2000">{{ toastText }}</v-snackbar>
</template>
