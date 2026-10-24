<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const items = [
  { to: '/', icon: 'mdi-pokeball', label: '盒子' },
  { to: '/team', icon: 'mdi-account-group', label: '队伍' },
  { to: '/settings', icon: 'mdi-cog', label: '设置' }
]

const tab = computed(() => {
  if (route.path.startsWith('/team')) return '/team'
  if (route.path.startsWith('/settings')) return '/settings'
  return '/'
})
</script>

<template>
  <v-app>
    <v-app-bar color="surface" elevation="0" height="56">
      <v-app-bar-title class="text-subtitle-1 font-weight-bold">橙花口袋本</v-app-bar-title>
      <v-spacer />
      <v-btn
        v-if="route.name === 'inventory'"
        icon="mdi-plus"
        variant="text"
        aria-label="添加宝可梦"
        @click="router.push('/pokemon/new')"
      />
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
    <v-bottom-navigation
      :model-value="tab"
      color="primary"
      bg-color="surface"
      grow
      mandatory
      @update:model-value="router.push(String($event))"
    >
      <v-btn v-for="item in items" :key="item.to" :value="item.to">
        <v-icon>{{ item.icon }}</v-icon>
        <span>{{ item.label }}</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>
