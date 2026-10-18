<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { UI } from './i18n/ui'

const route = useRoute()
const router = useRouter()
const tab = computed(() => (route.meta.tab as string) ?? 'box')
const hideNav = computed(() => route.name === 'add' || route.name === 'edit')

const items = [
  { id: 'box', to: '/', label: UI.tabs.box, icon: '▦' },
  { id: 'production', to: '/production', label: UI.tabs.production, icon: '◈' },
  { id: 'settings', to: '/settings', label: UI.tabs.settings, icon: '☉' }
]
</script>

<template>
  <router-view />
  <nav v-if="!hideNav" class="bottom-nav" aria-label="主导航">
    <button
      v-for="item in items"
      :key="item.id"
      class="nav-item"
      :class="{ active: tab === item.id }"
      @click="router.push(item.to)"
    >
      <span class="nav-icon">{{ item.icon }}</span>
      {{ item.label }}
    </button>
  </nav>
</template>
