import { createRouter, createWebHistory } from 'vue-router'
import BoxView from '../views/BoxView.vue'
import ProductionView from '../views/ProductionView.vue'
import SettingsView from '../views/SettingsView.vue'
import SpeciesPickerView from '../views/SpeciesPickerView.vue'
import PokemonEditView from '../views/PokemonEditView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'box', component: BoxView, meta: { tab: 'box' } },
    { path: '/add', name: 'add', component: SpeciesPickerView, meta: { tab: 'box' } },
    { path: '/pokemon/:id', name: 'edit', component: PokemonEditView, meta: { tab: 'box' } },
    { path: '/production', name: 'production', component: ProductionView, meta: { tab: 'production' } },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { tab: 'settings' } }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})
