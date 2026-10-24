import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadSettings, saveSettings as persistSettings } from '../db'
import { DEFAULT_SETTINGS, type AppSettings } from '../models/types'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS })
  const loaded = ref(false)

  async function hydrate() {
    settings.value = await loadSettings()
    loaded.value = true
  }

  async function save(next: Partial<AppSettings> | AppSettings) {
    settings.value = { ...settings.value, ...next }
    await persistSettings(settings.value)
  }

  return { settings, loaded, hydrate, save }
})
