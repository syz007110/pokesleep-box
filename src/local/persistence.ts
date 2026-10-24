const DB_NAME = 'neroli-pocket'
const STORE = 'kv'
const SNAPSHOT = 'pinia-snapshot'
const PINIA_KEYS = ['user', 'team', 'pokemon', 'comparison', 'version', 'notification', 'avatar', 'pokemonSearch']

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).get(key)
      request.onsuccess = () => resolve(request.result as T | undefined)
      request.onerror = () => reject(request.error)
    })
  } finally {
    db.close()
  }
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function idbClear(): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

function collectSnapshot() {
  const snapshot: Record<string, string> = {}
  for (const key of PINIA_KEYS) {
    const value = localStorage.getItem(key)
    if (value != null) snapshot[key] = value
  }
  const recipes = localStorage.getItem('neroli-pocket-recipe-levels')
  if (recipes != null) snapshot['neroli-pocket-recipe-levels'] = recipes
  return snapshot
}

export async function mirrorLocalStorageToIdb() {
  await idbSet(SNAPSHOT, collectSnapshot())
}

export async function restoreLocalStorageFromIdb() {
  const snapshot = await idbGet<Record<string, string>>(SNAPSHOT)
  if (!snapshot) return
  const hasLocalTeam = localStorage.getItem('team')
  if (hasLocalTeam) return
  for (const [key, value] of Object.entries(snapshot)) {
    if (localStorage.getItem(key) == null) localStorage.setItem(key, value)
  }
}

export interface PocketBackup {
  app: 'neroli-pocket'
  schemaVersion: 2
  exportedAt: string
  stores: Record<string, string>
}

export function exportBackup(): PocketBackup {
  return {
    app: 'neroli-pocket',
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    stores: collectSnapshot()
  }
}

export async function importBackup(raw: string) {
  const parsed = JSON.parse(raw) as Partial<PocketBackup>
  if (!parsed || parsed.app !== 'neroli-pocket' || !parsed.stores || typeof parsed.stores !== 'object') {
    throw new Error('不是橙花口袋本的备份文件')
  }
  for (const [key, value] of Object.entries(parsed.stores)) {
    if (typeof value === 'string') localStorage.setItem(key, value)
  }
  await mirrorLocalStorageToIdb()
}
