const KEY = 'neroli-pocket-recipe-levels'

export function loadRecipeLevels(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, number>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveRecipeLevel(name: string, level: number) {
  const next = loadRecipeLevels()
  next[name] = level
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function replaceRecipeLevels(levels: Record<string, number>) {
  localStorage.setItem(KEY, JSON.stringify(levels))
}
