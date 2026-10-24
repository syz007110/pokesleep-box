import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  bundledVersion,
  currentPack,
  isValidPack,
  restoreBundledPack,
  setPack
} from '../data/catalog'
import { clearPackOverlay, loadPackOverlay, loadSettings, savePackOverlay, saveSettings } from '../db'

export const usePackStore = defineStore('pack', () => {
  const version = ref(currentPack().version)
  const source = ref(currentPack().source)
  const checking = ref(false)
  const message = ref('')
  const error = ref('')
  const usingOverlay = ref(false)
  const bundled = computed(() => bundledVersion())

  async function hydrate() {
    const overlay = await loadPackOverlay()
    if (overlay && isValidPack(overlay)) {
      setPack(overlay)
      usingOverlay.value = true
    } else {
      restoreBundledPack()
      usingOverlay.value = false
    }
    version.value = currentPack().version
    source.value = currentPack().source
  }

  async function checkUpdate() {
    checking.value = true
    message.value = ''
    error.value = ''
    try {
      const settings = await loadSettings()
      const url = settings.packUrl.trim()
      if (!url) {
        message.value = `未配置远程地址。当前内置数据包 ${bundled.value}，可稍后填入静态 JSON 地址。`
        settings.lastPackCheck = new Date().toISOString()
        await saveSettings(settings)
        return
      }
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) throw new Error(`请求失败（${response.status}）`)
      const pack = await response.json()
      if (!isValidPack(pack)) throw new Error('远程文件不是有效数据包')
      if (pack.version === version.value) {
        message.value = `已是最新：${pack.version}`
      } else {
        setPack(pack)
        await savePackOverlay(pack)
        usingOverlay.value = true
        version.value = pack.version
        source.value = pack.source
        message.value = `已更新到 ${pack.version}`
      }
      settings.lastPackCheck = new Date().toISOString()
      await saveSettings(settings)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '检查更新失败'
    } finally {
      checking.value = false
    }
  }

  async function restoreBundled() {
    restoreBundledPack()
    await clearPackOverlay()
    usingOverlay.value = false
    version.value = currentPack().version
    source.value = currentPack().source
    message.value = '已恢复内置数据包'
  }

  return {
    version,
    source,
    checking,
    message,
    error,
    usingOverlay,
    bundledVersion: bundled,
    hydrate,
    checkUpdate,
    restoreBundled
  }
})
