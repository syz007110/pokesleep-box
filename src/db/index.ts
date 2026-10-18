import Dexie, { type Table } from 'dexie'
import { BACKUP_VERSION, DEFAULT_SETTINGS, SETTINGS_KEY, type AppSettings, type BackupFile, type BoxPokemon } from '../models/types'

class PokeSleepBoxDB extends Dexie {
  pokemon!: Table<BoxPokemon, string>
  kv!: Table<{ key: string; value: unknown }, string>

  constructor() {
    super('pokesleep-box')
    this.version(1).stores({
      pokemon: 'id, speciesId, updatedAt, level',
      kv: 'key'
    })
  }
}

export const db = new PokeSleepBoxDB()

export async function listPokemon(): Promise<BoxPokemon[]> {
  return db.pokemon.orderBy('updatedAt').reverse().toArray()
}

export async function getPokemon(id: string): Promise<BoxPokemon | undefined> {
  return db.pokemon.get(id)
}

export async function upsertPokemon(pokemon: BoxPokemon): Promise<string> {
  await db.pokemon.put(pokemon)
  return pokemon.id
}

export async function removePokemon(id: string): Promise<void> {
  await db.pokemon.delete(id)
}

export async function loadSettings(): Promise<AppSettings> {
  const row = await db.kv.get(SETTINGS_KEY)
  if (!row) return { ...DEFAULT_SETTINGS }
  return { ...DEFAULT_SETTINGS, ...(row.value as AppSettings) }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await db.kv.put({ key: SETTINGS_KEY, value: settings })
}

export async function exportBackup(): Promise<BackupFile> {
  const [pokemon, settings] = await Promise.all([listPokemon(), loadSettings()])
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    pokemon,
    settings
  }
}

export async function importBackup(payload: BackupFile, mode: 'replace' | 'merge' = 'replace'): Promise<void> {
  if (!payload || !Array.isArray(payload.pokemon)) {
    throw new Error('备份文件格式不正确')
  }
  const settings = { ...DEFAULT_SETTINGS, ...payload.settings }
  await db.transaction('rw', db.pokemon, db.kv, async () => {
    if (mode === 'replace') {
      await db.pokemon.clear()
    }
    if (payload.pokemon.length) {
      await db.pokemon.bulkPut(payload.pokemon)
    }
    await db.kv.put({ key: SETTINGS_KEY, value: settings })
  })
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
