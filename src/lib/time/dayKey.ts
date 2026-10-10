export function dayKey(ms: number): string {
  const date = new Date(ms)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function startOfLocalDay(ms: number): number {
  const date = new Date(ms)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function endOfLocalDay(ms: number): number {
  const start = startOfLocalDay(ms)
  const nextDay = new Date(start)
  nextDay.setDate(nextDay.getDate() + 1)
  return nextDay.getTime() - 1
}

export function startOfWeek(ms: number, weekStartsOn: 0 | 1): number {
  const date = new Date(ms)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  const diff = ((day - weekStartsOn) + 7) % 7
  date.setDate(date.getDate() - diff)
  return date.getTime()
}

export function addDays(ms: number, days: number): number {
  const date = new Date(ms)
  date.setDate(date.getDate() + days)
  return date.getTime()
}
