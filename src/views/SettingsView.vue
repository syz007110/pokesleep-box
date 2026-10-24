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
    <div class="text-subtitle-1 font-weight-bold mb-3">计算假设</div>
    <div class="mb-2 text-caption muted">岛屿加成 {{ settings.settings.islandBonus }}%</div>
    <v-slider
      v-model="settings.settings.islandBonus"
      :min="0"
      :max="pack.constants.maxIslandBonus"
      :step="1"
      class="mb-4"
      @end="persist"
    />
    <v-select
      v-model="settings.settings.favoredBerries"
      :items="berryItems"
      label="本岛喜爱树果（最多 3）"
      multiple
      chips
      closable-chips
      class="mb-3"
      @update:model-value="onFavored"
    />
    <v-switch
      v-model="settings.settings.goodCamp"
      color="primary"
      label="好露营券（间隔 ÷1.2，携带上限 ×1.2）"
      hide-details
      class="mb-4"
      @update:model-value="persist"
    />
    <div class="mb-2 text-caption muted">白天小时 {{ settings.settings.dayHours }}</div>
    <v-slider v-model="settings.settings.dayHours" :min="8" :max="18" :step="0.5" class="mb-3" @end="persist" />
    <div class="mb-2 text-caption muted">夜间小时 {{ settings.settings.nightHours }}</div>
    <v-slider v-model="settings.settings.nightHours" :min="6" :max="12" :step="0.5" class="mb-3" @end="persist" />
    <div class="mb-2 text-caption muted">起床活力 {{ settings.settings.startingEnergy }}</div>
    <v-slider v-model="settings.settings.startingEnergy" :min="0" :max="150" :step="1" class="mb-6" @end="persist" />

    <div class="text-subtitle-1 font-weight-bold mb-2">备份与恢复</div>
    <p class="muted mb-3">
      iPhone Safari 清缓存时 IndexedDB 可能一起没。请定期导出 JSON，换机或重装后从这里导回。
    </p>
    <v-btn block color="primary" class="mb-2" @click="onExport">导出备份 JSON</v-btn>
    <v-btn block variant="tonal" class="mb-6" @click="fileInput?.click()">导入备份 JSON</v-btn>
    <input ref="fileInput" type="file" accept="application/json" hidden @change="onImport" />

    <div class="text-subtitle-1 font-weight-bold mb-2">数据包</div>
    <v-card class="pa-3 mb-3" color="surface-bright">
      <div>当前版本 <strong>{{ packStore.version }}</strong></div>
      <div class="muted mt-1">{{ packStore.source }}</div>
      <div class="muted">
        内置版本 {{ packStore.bundledVersion }}{{ packStore.usingOverlay ? ' · 正在使用覆盖包' : '' }}
      </div>
    </v-card>
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
    <p class="muted mb-6">
      现在不必接 CDN。以后把新的静态 JSON 放到任意地址，填到上面再点检查即可，用户存档不会被数据包覆盖。
    </p>

    <div class="text-subtitle-1 font-weight-bold mb-2">关于</div>
    <p class="muted">
      橙花口袋本是给个人离线用的宝可梦睡眠计算器。公式对齐 Neroli's Lab / SleepAPI 的公开实现（帮忙间隔、树果能量、食材栏位、保底技能率、夜间携带与偷吃）。最优队伍求解未包含在本版。
    </p>
    <p class="muted mt-2">游戏数据来自 Neroli's Lab common（Apache-2.0）。本应用不联网登录、不上传存档。</p>
  </div>

  <v-snackbar v-model="toast" :timeout="2000">{{ toastText }}</v-snackbar>
</template>
