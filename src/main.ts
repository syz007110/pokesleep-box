import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import { router } from './router'
import { useBoxStore } from './stores/box'
import { useSettingsStore } from './stores/settings'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

const settings = useSettingsStore(pinia)
const box = useBoxStore(pinia)
Promise.all([settings.hydrate(), box.hydrate()]).catch((err) => {
  console.error(err)
})

registerSW({ immediate: true })

app.mount('#app')
