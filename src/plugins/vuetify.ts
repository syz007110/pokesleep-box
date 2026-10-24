import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export const vuetify = createVuetify({
  theme: {
    defaultTheme: 'camp',
    themes: {
      camp: {
        dark: true,
        colors: {
          background: '#141A22',
          surface: '#1E2733',
          'surface-bright': '#2A3544',
          primary: '#E8B86D',
          secondary: '#7EB8DA',
          accent: '#D97B5A',
          error: '#E57373',
          info: '#7EB8DA',
          success: '#81C784',
          warning: '#E8B86D',
          'on-background': '#F4EDE1',
          'on-surface': '#F4EDE1',
          'on-primary': '#1B2430'
        }
      }
    }
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi }
  },
  defaults: {
    VBtn: { rounded: 'lg' },
    VCard: { rounded: 'xl', elevation: 0 },
    VTextField: { variant: 'outlined', density: 'comfortable', hideDetails: 'auto' },
    VSelect: { variant: 'outlined', density: 'comfortable', hideDetails: 'auto' },
    VSlider: { hideDetails: 'auto' },
    VChip: { rounded: 'lg' }
  }
})
