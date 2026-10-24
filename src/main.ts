import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import { createApp } from 'vue'

// Vuetify
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import 'vuetify/styles'

import App from '@/app.vue'
import { darkTheme } from '@/assets/theme'
import router from '@/router/router'

import { registerChartJS } from '@/components/custom-components/charts/register-charts'
import { mirrorLocalStorageToIdb, restoreLocalStorageFromIdb } from '@/local/persistence'
import { migrateSite } from '@/stores/store-service'
import { registerSW } from 'virtual:pwa-register'
import 'sleepapi-common'

async function initializeApp() {
  await restoreLocalStorageFromIdb()
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  pinia.use(({ store }) => {
    store.$subscribe(() => {
      void mirrorLocalStorageToIdb()
    })
  })
  registerSW({ immediate: true })

  const app = createApp(App)
  const vuetify = createVuetify({
    theme: {
      defaultTheme: 'darkTheme',
      themes: {
        darkTheme
      }
    },
    defaults: {
      VAvatar: {
        color: 'transparent'
      }
    }
  })

  app.use(pinia)
  try {
    await migrateSite()
  } catch (error) {
    logger.error('Migration failed during startup. Application might be in an inconsistent state. ' + error)
  }
  registerChartJS()

  app.use(vuetify)
  app.use(router)

  app.mount('#app')
}

initializeApp()
