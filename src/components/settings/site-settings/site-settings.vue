<template>
  <div class="site-settings-container">
    <SettingsCard title="Version Information" icon="mdi-information">
      <span>Site version: </span>
      <code>{{ versionStore.version }}</code>

      <p class="fine-print">
        <v-icon icon="mdi-alert-circle-outline" size="small" class="mr-1" />
        Please provide this when reporting bugs
      </p>
    </SettingsCard>

    <SettingsCard title="Pokémon Name Generation" icon="mdi-dice-multiple">
      <p class="mb-2">Control how Pokémon names are generated when they are first acquired.</p>
      <v-switch v-model="useRandomPokemonNames" label="Use Random Pokémon Names" color="primary" inset></v-switch>
      <p class="fine-print">
        If enabled, newly acquired Pokémon will be given a random nickname. If disabled, they will use their default
        species name.
      </p>
    </SettingsCard>

    <SettingsCard title="本机备份" icon="mdi-content-save">
      <p class="mb-4">
        队伍、宝可梦和设置在这台设备上。Safari 清网站数据时可能一起丢掉，请定期导出 JSON。
      </p>
      <v-btn color="primary" class="mr-2 mb-2" prepend-icon="mdi-download" @click="downloadBackup">导出备份</v-btn>
      <v-btn color="secondary" class="mb-2" prepend-icon="mdi-upload" @click="fileInput?.click()">导入备份</v-btn>
      <input ref="fileInput" type="file" accept="application/json" hidden @change="onImport" />
    </SettingsCard>

    <SettingsCard title="Cache Settings" icon="mdi-cached">
      <p class="mb-4">
        In case of issues please try clearing the cache. If that doesn't work, contact the developers and attach the
        site version found above.
      </p>

      <v-btn color="secondary" variant="elevated" prepend-icon="mdi-delete-sweep" @click="clear"> Clear Cache </v-btn>
    </SettingsCard>
  </div>
</template>

<script setup lang="ts">
import { exportBackup, importBackup } from '@/local/persistence'
import { UserService } from '@/services/user/user-service'
import { clearCacheKeepLogin } from '@/stores/store-service'
import { useUserStore } from '@/stores/user-store'
import { useVersionStore } from '@/stores/version-store/version-store'
import { computed, ref } from 'vue'
import SettingsCard from '../settings-card.vue'

import { success, error } from '@/components/snackbar/snackbar.vue'
const versionStore = useVersionStore()
const userStore = useUserStore()

const useRandomPokemonNames = computed({
  get: () => userStore.randomizeNicknames,
  set: async (newValue: boolean) => {
    try {
      // Optimistically update the store for immediate UI feedback
      userStore.randomizeNicknames = newValue
      await UserService.upsertUserSettings({ randomizeNicknames: newValue })
    } catch (err) {
      console.error('Failed to update randomizeNicknames setting:', err)
      userStore.randomizeNicknames = !newValue
      error('Failed to update Pokémon name settings. Please try again.')
    }
  }
})

const fileInput = ref<HTMLInputElement | null>(null)

function downloadBackup() {
  const backup = exportBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `neroli-pocket-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
  success('备份已导出')
}

async function onImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    await importBackup(await file.text())
    success('已导入，正在刷新')
    window.location.reload()
  } catch (err) {
    error(err instanceof Error ? err.message : '导入失败')
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}

function clear() {
  clearCacheKeepLogin()
  success('Cache cleared successfully')
}
</script>

<style lang="scss" scoped>
.site-settings-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
