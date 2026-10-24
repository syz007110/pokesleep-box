import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'inventory',
      component: () => import('../views/InventoryView.vue'),
      meta: { title: '盒子' }
    },
    {
      path: '/pokemon/new',
      name: 'pokemon-new',
      component: () => import('../views/PokemonEditView.vue'),
      meta: { title: '添加' }
    },
    {
      path: '/pokemon/:id',
      name: 'pokemon-edit',
      component: () => import('../views/PokemonEditView.vue'),
      meta: { title: '编辑' }
    },
    {
      path: '/team',
      name: 'team',
      component: () => import('../views/TeamView.vue'),
      meta: { title: '队伍' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { title: '设置' }
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})
