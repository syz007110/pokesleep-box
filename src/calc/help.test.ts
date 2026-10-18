import { nature, ONIX, PICHU, subskill, VICTREEBEL } from 'sleepapi-common'
import { describe, expect, it } from 'vitest'
import { calculateFrequencyWithEnergy, calculateHelpSpeedBeforeEnergy } from './help'

describe('calculateHelpSpeedBeforeEnergy (Lab help-calculator)', () => {
  it('matches Victreebel Lv30 Rash Helping Speed M', () => {
    const result = calculateHelpSpeedBeforeEnergy({
      pokemon: VICTREEBEL,
      level: 30,
      ribbonLevel: 0,
      nature: nature.RASH,
      subskills: new Set([subskill.HELPING_SPEED_M.name]),
      camp: false,
      teamHelpingBonus: 0
    })
    expect(result).toBe(2268)
  })

  it('matches camp ticket ÷1.2', () => {
    const result = calculateHelpSpeedBeforeEnergy({
      pokemon: VICTREEBEL,
      level: 30,
      ribbonLevel: 0,
      nature: nature.RASH,
      subskills: new Set([subskill.HELPING_SPEED_M.name]),
      camp: true,
      teamHelpingBonus: 0
    })
    expect(result).toBe(2268 / 1.2)
  })

  it('clamps helping bonus at 35%', () => {
    const result4hb = calculateHelpSpeedBeforeEnergy({
      pokemon: VICTREEBEL,
      level: 30,
      ribbonLevel: 0,
      nature: nature.RASH,
      subskills: new Set([subskill.HELPING_SPEED_M.name, subskill.HELPING_SPEED_S.name]),
      camp: false,
      teamHelpingBonus: 4
    })
    const result5hb = calculateHelpSpeedBeforeEnergy({
      pokemon: VICTREEBEL,
      level: 30,
      ribbonLevel: 0,
      nature: nature.RASH,
      subskills: new Set([subskill.HELPING_SPEED_M.name, subskill.HELPING_SPEED_S.name]),
      camp: false,
      teamHelpingBonus: 5
    })
    expect(result4hb).toBe(1714)
    expect(result5hb).toBe(1714)
  })

  it('skips ribbon frequency for a fully evolved mon', () => {
    const result = calculateHelpSpeedBeforeEnergy({
      pokemon: VICTREEBEL,
      level: 30,
      ribbonLevel: 4,
      nature: nature.RASH,
      subskills: new Set([subskill.HELPING_SPEED_M.name]),
      camp: false,
      teamHelpingBonus: 0
    })
    expect(result).toBe(2268)
  })

  it('applies Onix ribbon 12% at rank 4 and 5% at rank 2', () => {
    expect(
      calculateHelpSpeedBeforeEnergy({
        pokemon: ONIX,
        level: 1,
        ribbonLevel: 4,
        nature: nature.BASHFUL,
        subskills: new Set(),
        camp: false,
        teamHelpingBonus: 0
      })
    ).toBe(ONIX.frequency * 0.88)
    expect(
      calculateHelpSpeedBeforeEnergy({
        pokemon: ONIX,
        level: 1,
        ribbonLevel: 2,
        nature: nature.BASHFUL,
        subskills: new Set(),
        camp: false,
        teamHelpingBonus: 0
      })
    ).toBe(ONIX.frequency * 0.95)
  })

  it('applies Pichu ribbon 11% / 25%', () => {
    expect(
      calculateHelpSpeedBeforeEnergy({
        pokemon: PICHU,
        level: 1,
        ribbonLevel: 2,
        nature: nature.BASHFUL,
        subskills: new Set(),
        camp: false,
        teamHelpingBonus: 0
      })
    ).toBe(PICHU.frequency * 0.89)
    expect(
      calculateHelpSpeedBeforeEnergy({
        pokemon: PICHU,
        level: 1,
        ribbonLevel: 4,
        nature: nature.BASHFUL,
        subskills: new Set(),
        camp: false,
        teamHelpingBonus: 0
      })
    ).toBe(PICHU.frequency * 0.75)
  })
})

describe('calculateFrequencyWithEnergy', () => {
  it('uses Lab 80+ band ×0.45', () => {
    expect(calculateFrequencyWithEnergy(100, 100)).toBe(45)
  })
})
