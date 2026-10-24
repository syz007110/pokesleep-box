import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import { router } from './router'
import { vuetify } from './plugins/vuetify'
import { useBoxStore } from './stores/box'
import { usePackStore } from './stores/pack'
import { useSettingsStore } from './stores/settings'
import { useTeamStore } from './stores/team'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(vuetify)

registerSW({ immediate: true })

Promise.all([
  usePackStore(pinia).hydrate(),
  useBoxStore(pinia).hydrate(),
  useSettingsStore(pinia).hydrate(),
  useTeamStore(pinia).hydrate()
]).finally(() => {
  app.mount('#app')
})
