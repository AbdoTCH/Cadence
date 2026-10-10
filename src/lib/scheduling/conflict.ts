import type { Session } from '../../db/schema'

import { overlaps } from './overlap'

export type ConflictSeverity = 'hard' | 'tight' | 'none'

export type ConflictResult = {
  severity: ConflictSeverity
  conflicts: Session[]
  gapMinutes: number | null
}

function sameLocalDay(a: number, b: number): boolean {
  const left = new Date(a)
  const right = new Date(b)

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export function detectConflicts(
  candidate: { id?: string; start: number; end: number },
  existing: Session[],
  breakMinutes: number,
): ConflictResult {
  const otherSessions = existing.filter((session) => session.id !== candidate.id)
  const directConflicts = otherSessions.filter((session) => overlaps(candidate, session))

  if (directConflicts.length > 0) {
    return {
      severity: 'hard',
      conflicts: directConflicts,
      gapMinutes: null,
    }
  }

  const sameDaySessions = otherSessions.filter(
    (session) => sameLocalDay(session.start, candidate.start) || sameLocalDay(session.end, candidate.start),
  )

  const gaps = sameDaySessions
    .map((session) => {
      if (session.end <= candidate.start) {
        return (candidate.start - session.end) / 60000
      }

      if (candidate.end <= session.start) {
        return (session.start - candidate.end) / 60000
      }

      return null
    })
    .filter((gap): gap is number => gap !== null && gap >= 0)

  const gapMinutes = gaps.length > 0 ? Math.min(...gaps) : null

  if (gapMinutes !== null && gapMinutes < breakMinutes) {
    return {
      severity: 'tight',
      conflicts: [],
      gapMinutes: Math.round(gapMinutes),
    }
  }

  return {
    severity: 'none',
    conflicts: [],
    gapMinutes: gapMinutes !== null ? Math.round(gapMinutes) : null,
  }
}
