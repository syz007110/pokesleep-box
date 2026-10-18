export function formatNum(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: digits, minimumFractionDigits: 0 })
}

export function formatInt(n: number): string {
  return formatNum(n, 0)
}

export function formatPercent(n: number, digits = 1): string {
  return `${formatNum(n * 100, digits)}%`
}

export function sleepLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} 小时 ${m} 分` : `${h} 小时`
}
