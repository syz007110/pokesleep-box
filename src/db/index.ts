import { APP_ID, BACKUP_SCHEMA_VERSION, DEFAULT_SETTINGS, emptyTeam } from '../models/types'
import type { AppSettings, BackupFile, BoxPokemon, DataPack, Team } from '../models/types'
import { currentPack } from '../data/catalog'

const DB_NAME = 'neroli-pocket'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('pokemon')) db.createObjectStore('pokemon', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('teams')) db.createObjectStore('teams', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>
): Promise<T> {
  const db = await openDb()
  try {
    const tx = db.transaction(storeName, mode)
    const result = run(tx.objectStore(storeName))
    const value = result instanceof Promise ? await result : await requestToPromise(result)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    return value
  } finally {
    db.close()
  }
}

export async function listPokemon(): Promise<BoxPokemon[]> {
  const rows = await withStore<BoxPokemon[]>('pokemon', 'readonly', (store) => store.getAll())
  return rows.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function putPokemon(pokemon: BoxPokemon): Promise<void> {
  await withStore('pokemon', 'readwrite', (store) => store.put({ ...pokemon, updatedAt: Date.now() }))
}

export async function deletePokemon(id: string): Promise<void> {
  await withStore('pokemon', 'readwrite', (store) => store.delete(id))
}

export async function replacePokemon(pokemon: BoxPokemon[]): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction('pokemon', 'readwrite')
    tx.objectStore('pokemon').clear()
    for (const row of pokemon) tx.objectStore('pokemon').put(row)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function listTeams(): Promise<Team[]> {
  const rows = await withStore<Team[]>('teams', 'readonly', (store) => store.getAll())
  if (rows.length === 0) {
    const team = emptyTeam()
    await withStore('teams', 'readwrite', (store) => store.put(team))
    return [team]
  }
  return rows
}

export async function putTeam(team: Team): Promise<void> {
  await withStore('teams', 'readwrite', (store) => store.put(team))
}

export async function replaceTeams(teams: Team[]): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction('teams', 'readwrite')
    tx.objectStore('teams').clear()
    for (const row of teams) tx.objectStore('teams').put(row)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function loadSettings(): Promise<AppSettings> {
  const stored = await withStore<AppSettings | undefined>('kv', 'readonly', (store) => store.get('settings'))
  return { ...DEFAULT_SETTINGS, ...stored }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await withStore('kv', 'readwrite', (store) => store.put(settings, 'settings'))
}

export async function loadPackOverlay(): Promise<DataPack | undefined> {
  return withStore<DataPack | undefined>('kv', 'readonly', (store) => store.get('datapack-overlay'))
}

export async function savePackOverlay(pack: DataPack): Promise<void> {
  await withStore('kv', 'readwrite', (store) => store.put(pack, 'datapack-overlay'))
}

export async function clearPackOverlay(): Promise<void> {
  await withStore('kv', 'readwrite', (store) => store.delete('datapack-overlay'))
}

export async function exportBackup(): Promise<BackupFile> {
  const [pokemon, teams, settings] = await Promise.all([listPokemon(), listTeams(), loadSettings()])
  return {
    app: APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    packVersion: currentPack().version,
    pokemon,
    teams,
    settings
  }
}

export function parseBackup(text: string): BackupFile {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('不是有效的 JSON 文件')
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('备份格式不正确')
  const raw = parsed as Partial<BackupFile>
  if (raw.app && raw.app !== APP_ID) throw new Error('这不是橙花口袋本的备份')
  if (!Array.isArray(raw.pokemon)) throw new Error('备份缺少宝可梦列表')
  return {
    app: APP_ID,
    schemaVersion: typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 1,
    exportedAt: raw.exportedAt ?? new Date().toISOString(),
    packVersion: raw.packVersion ?? '',
    pokemon: raw.pokemon,
    teams: raw.teams ?? [],
    settings: { ...DEFAULT_SETTINGS, ...raw.settings }
  }
}

export async function importBackup(backup: BackupFile): Promise<void> {
  await replacePokemon(backup.pokemon)
  await replaceTeams(backup.teams.length ? backup.teams : [])
  await saveSettings(backup.settings)
}
