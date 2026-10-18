/**
 * Help-interval formulas ported from Neroli's Lab
 * `backend/src/services/calculator/help/help-calculator.ts`
 * (Apache-2.0). Game data helpers come from the vendored `common/` package.
 */
import { calculateHelpSpeedSubskills, calculateRibbonFrequency, invertNatureFrequency, MathUtils, nature, type Pokemon } from 'sleepapi-common'

type Nature = nature.Nature

export function calculateHelpSpeedBeforeEnergy(stats: {
  pokemon: Pokemon
  level: number
  nature: Nature
  subskills: Set<string>
  teamHelpingBonus: number
  ribbonLevel: number
  camp: boolean
}): number {
  const { pokemon, level, nature, subskills, teamHelpingBonus, ribbonLevel, camp } = stats

  const helpSpeedSubskills = calculateHelpSpeedSubskills({ subskills, nrOfTeamHelpingBonus: teamHelpingBonus })
  const levelFactor = 1 - 0.002 * (level - 1)
  const natureFreq = invertNatureFrequency(nature)
  const ribbonFrequency = calculateRibbonFrequency(pokemon, ribbonLevel)
  const campBonus = camp ? 1.2 : 1

  return Math.floor(
    (MathUtils.round(natureFreq * helpSpeedSubskills * levelFactor * ribbonFrequency, 4) * pokemon.frequency) /
      campBonus
  )
}

export function calculateFrequencyWithEnergy(helpSpeedInSeconds: number, energy: number): number {
  return helpSpeedInSeconds * energyFactorFromEnergy(energy)
}

/** Lab energy bands (`energy-calculator.ts`). Wiki writes 81+ for ×0.45; Lab uses 80+. */
export function energyFactorFromEnergy(energy: number): number {
  if (energy >= 80) return 0.45
  if (energy >= 60) return 0.52
  if (energy >= 40) return 0.58
  if (energy >= 1) return 0.66
  return 1
}

export function formatInterval(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const rem = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
  return `${m}:${String(rem).padStart(2, '0')}`
}
