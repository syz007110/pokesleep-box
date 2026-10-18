import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { ThemePreference } from '../models/types'

function systemDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export const useThemeStore = defineStore('theme', () => {
  const preference = ref<ThemePreference>('system')
  const resolved = computed(() => {
    if (preference.value === 'system') return systemDark() ? 'dark' : 'light'
    return preference.value
  })

  function apply() {
    document.documentElement.dataset.theme = resolved.value
    const color = resolved.value === 'dark' ? '#0e1714' : '#2f6f5e'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  }

  watch(resolved, apply, { immediate: false })

  function setPreference(value: ThemePreference) {
    preference.value = value
    apply()
  }

  return { preference, resolved, setPreference, apply }
})
