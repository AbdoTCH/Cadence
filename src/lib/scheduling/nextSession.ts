import type { Session } from '../../db/schema'

export function nextSession(sessions: Session[], now: number): Session | null {
  const upcoming = sessions.filter((session) => session.status === 'planned' && session.start > now)
  upcoming.sort((a, b) => a.start - b.start)
  return upcoming[0] ?? null
}
