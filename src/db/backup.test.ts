import { describe, expect, it } from 'vitest'
import { APP_ID, DEFAULT_SETTINGS } from '../models/types'
import { parseBackup } from './index'

describe('parseBackup', () => {
  it('rejects invalid JSON', () => {
    expect(() => parseBackup('{')).toThrow('不是有效的 JSON 文件')
  })

  it('rejects a backup from another app', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'other', pokemon: [] }))).toThrow(
      '这不是橙花口袋本的备份'
    )
  })

  it('fills defaults for a valid pocket backup', () => {
    const backup = parseBackup(
      JSON.stringify({
        app: APP_ID,
        pokemon: [{ id: '1', speciesId: 'PIKACHU', nickname: '', level: 25 }],
        settings: { islandBonus: 10 }
      })
    )
    expect(backup.schemaVersion).toBe(1)
    expect(backup.teams).toEqual([])
    expect(backup.settings.islandBonus).toBe(10)
    expect(backup.settings.dayHours).toBe(DEFAULT_SETTINGS.dayHours)
    expect(backup.pokemon).toHaveLength(1)
  })
})
