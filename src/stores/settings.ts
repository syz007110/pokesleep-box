import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadSettings, saveSettings } from '../db'
import { DEFAULT_SETTINGS, type AppSettings } from '../models/types'
import { useThemeStore } from './theme'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS })
  const loaded = ref(false)

  async function hydrate() {
    settings.value = await loadSettings()
    useThemeStore().setPreference(settings.value.theme)
    loaded.value = true
  }

  async function patch(partial: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...partial }
    if (partial.theme) useThemeStore().setPreference(partial.theme)
    await saveSettings(settings.value)
  }

  function replace(next: AppSettings) {
    settings.value = { ...DEFAULT_SETTINGS, ...next }
    useThemeStore().setPreference(settings.value.theme)
  }

  return { settings, loaded, hydrate, patch, replace }
})
