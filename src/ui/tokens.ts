/** Lab-aligned visual tokens. Colors match Neroli's Lab frontend/src/assets/theme.ts. */
export const LAB = {
  background: '#191224',
  surface: '#403D58',
  surfaceBright: '#4A4765',
  primary: '#E63946',
  secondary: '#5E5A7F',
  accent: '#9A95C3',
  strength: '#FFB81F',
  natureUp: '#FF683A',
  natureDown: '#2BA0ED',
  energy: '#31E571',
  day: '#FF9D45',
  night: '#4896FF',
  berry: '#B9A0E9',
  ingredient: '#FDB4CA',
  skill: '#EFD269',
  all: '#FFFFFF',
  hb: '#FFDF2E',
  erb: '#499FFF',
  onDark: '#191224',
  onLight: '#FFFFFF'
} as const

export const SPECIALTY_COLOR: Record<string, string> = {
  berry: LAB.berry,
  ingredient: LAB.ingredient,
  skill: LAB.skill,
  all: LAB.all
}

export const RARITY_BG: Record<string, string> = {
  white: '#FAFAFA',
  silver: '#DCF2FF',
  gold: '#FFE570'
}

export const RARITY_FG = LAB.onDark
