export function formatDuration(minutes: number): string {
  const safeMinutes = Math.max(0, Math.round(minutes))
  const hours = Math.floor(safeMinutes / 60)
  const remainder = safeMinutes % 60

  if (hours === 0) {
    return `${remainder}m`
  }

  if (remainder === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainder}m`
}

export function formatTimeRange(start: number, end: number): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const format = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  return `${format(startDate)} – ${format(endDate)}`
}

export function formatRelativeDay(ms: number, now: number): string {
  const currentDay = new Date(now)
  const targetDay = new Date(ms)

  currentDay.setHours(0, 0, 0, 0)
  targetDay.setHours(0, 0, 0, 0)

  const diffDays = Math.round((targetDay.getTime() - currentDay.getTime()) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'

  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(targetDay)
  return `${weekday} ${targetDay.getDate()}`
}
