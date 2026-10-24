import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { LAB } from '../ui/tokens'

export const vuetify = createVuetify({
  theme: {
    defaultTheme: 'lab',
    themes: {
      lab: {
        dark: true,
        colors: {
          background: LAB.background,
          surface: LAB.surface,
          'surface-bright': LAB.surfaceBright,
          primary: LAB.primary,
          secondary: LAB.secondary,
          accent: LAB.accent,
          strength: LAB.strength,
          berry: LAB.berry,
          ingredient: LAB.ingredient,
          skill: LAB.skill,
          error: LAB.primary,
          info: LAB.accent,
          success: LAB.energy,
          warning: LAB.strength,
          'on-background': LAB.onLight,
          'on-surface': LAB.onLight,
          'on-primary': LAB.onLight,
          'on-secondary': LAB.onLight
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
    VBtn: { rounded: 'lg', elevation: 0 },
    VCard: { rounded: 'lg', elevation: 0 },
    VTextField: { variant: 'outlined', density: 'compact', hideDetails: 'auto', color: 'accent' },
    VSelect: { variant: 'outlined', density: 'compact', hideDetails: 'auto', color: 'accent' },
    VSlider: { hideDetails: 'auto', color: 'primary' },
    VChip: { rounded: 'lg', size: 'small' },
    VSwitch: { color: 'primary', hideDetails: true },
    VDialog: { scrim: 'background' }
  }
})
