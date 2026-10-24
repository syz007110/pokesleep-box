export function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function formatInterval(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remain = total % 60
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`
  return `${minutes}:${String(remain).padStart(2, '0')}`
}

export function formatNumber(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) >= 10_000) {
    return value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
  }
  if (Number.isInteger(value)) return String(value)
  return value.toLocaleString('zh-CN', { maximumFractionDigits: digits, minimumFractionDigits: 0 })
}
