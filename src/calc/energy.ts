import { MAX_ENERGY_RECOVERY, MAX_ENERGY_RECOVERY_ERB, MAX_SLEEP_SCORE_MINUTES, subskill } from 'sleepapi-common'
import { energyFactorFromEnergy } from './help'

const DEGRADE_MINUTES = 10

export function sleepEnergyRecovery(params: {
  sleepMinutes: number
  natureEnergy: number
  erbCount: number
  incense: boolean
  ownErb: boolean
}): number {
  const maxRecovery = params.ownErb ? MAX_ENERGY_RECOVERY_ERB : MAX_ENERGY_RECOVERY
  const erbFactor = 1 + params.erbCount * subskill.ENERGY_RECOVERY_BONUS.amount
  const incenseFactor = params.incense ? 2 : 1
  const recovered =
    params.sleepMinutes * (100 / MAX_SLEEP_SCORE_MINUTES) * params.natureEnergy * erbFactor * incenseFactor
  return Math.min(maxRecovery, recovered)
}

/**
 * Helps during the waking window while energy drops 1 point / 10 minutes.
 * Night helps use leftover energy (no recovery applied mid-sleep in this v1 model).
 */
export function helpsWithDegradingEnergy(params: {
  startEnergy: number
  awakeMinutes: number
  displayIntervalSec: number
}): { helps: number; bedtimeEnergy: number } {
  let energy = Math.max(0, params.startEnergy)
  let helps = 0
  const ticks = Math.floor(params.awakeMinutes / DEGRADE_MINUTES)
  const remainder = params.awakeMinutes % DEGRADE_MINUTES

  for (let i = 0; i < ticks; i++) {
    const interval = params.displayIntervalSec * energyFactorFromEnergy(energy)
    helps += (DEGRADE_MINUTES * 60) / interval
    energy = Math.max(0, energy - 1)
  }
  if (remainder > 0) {
    const interval = params.displayIntervalSec * energyFactorFromEnergy(energy)
    helps += (remainder * 60) / interval
  }
  return { helps, bedtimeEnergy: energy }
}

export function helpsAtFixedEnergy(params: {
  minutes: number
  energy: number
  displayIntervalSec: number
}): number {
  const interval = params.displayIntervalSec * energyFactorFromEnergy(params.energy)
  return (params.minutes * 60) / interval
}
