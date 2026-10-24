<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const drawer = ref(false)

const items = [
  { to: '/', icon: 'mdi-pokeball', label: '盒子', name: 'inventory' },
  { to: '/team', icon: 'mdi-account-group', label: '队伍', name: 'team' },
  { to: '/settings', icon: 'mdi-cog', label: '设置', name: 'settings' }
]

const overlay = computed(() => route.name === 'pokemon-new' || route.name === 'pokemon-edit')
const pageTitle = computed(() => String(route.meta.title ?? '橙花口袋本'))

const tab = computed(() => {
  if (route.path.startsWith('/team')) return '/team'
  if (route.path.startsWith('/settings')) return '/settings'
  return '/'
})

function go(to: string) {
  drawer.value = false
  router.push(to)
}
</script>

<template>
  <v-app class="lab-app">
    <div class="lab-bg" aria-hidden="true" />
    <v-navigation-drawer
      v-model="drawer"
      temporary
      width="280"
      color="background"
    >
      <div class="pa-4">
        <div class="lab-title">橙花口袋本</div>
        <div class="muted mt-1">离线 Lab 风盒子 · 无登录</div>
      </div>
      <div class="px-3">
        <button
          v-for="item in items"
          :key="item.to"
          type="button"
          class="drawer-item"
          :class="{ 'is-on': tab === item.to }"
          @click="go(item.to)"
        >
          <v-icon :icon="item.icon" size="20" />
          {{ item.label }}
        </button>
      </div>
      <div class="px-4 pt-6 muted">
        对齐 Neroli's Lab 的公开公式与配色。数据只存在这台设备的 IndexedDB。
      </div>
    </v-navigation-drawer>

    <v-app-bar class="lab-toolbar" elevation="0" height="56">
      <v-btn
        icon
        variant="text"
        aria-label="打开菜单"
        @click="drawer = true"
      >
        <v-icon>mdi-menu</v-icon>
      </v-btn>
      <v-app-bar-title class="lab-title">{{ pageTitle }}</v-app-bar-title>
      <v-spacer />
      <v-btn
        v-if="route.name === 'inventory'"
        icon
        variant="text"
        aria-label="添加宝可梦"
        @click="router.push('/pokemon/new')"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>

    <nav v-if="!overlay" class="lab-tabbar" aria-label="主导航">
      <button
        v-for="item in items"
        :key="item.to"
        type="button"
        :class="{ active: tab === item.to }"
        @click="router.push(item.to)"
      >
        <v-icon :icon="item.icon" size="22" />
        <span>{{ item.label }}</span>
      </button>
    </nav>
  </v-app>
</template>
