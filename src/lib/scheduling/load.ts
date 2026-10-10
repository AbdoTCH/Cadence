import type { Session, Subject } from '../../db/schema'

export type SubjectLoad = {
  subjectId: string
  plannedMinutes: number
  actualMinutes: number
  targetMinutes: number | null
  ratio: number | null
}

export function weeklyLoad(
  sessions: Session[],
  subjects: Subject[],
  weekStartMs: number,
  now: number,
): SubjectLoad[] {
  const subjectMap = new Map<string, SubjectLoad>()

  for (const subject of subjects) {
    subjectMap.set(subject.id, {
      subjectId: subject.id,
      plannedMinutes: 0,
      actualMinutes: 0,
      targetMinutes: subject.targetMinutesPerWeek === 0 ? null : subject.targetMinutesPerWeek,
      ratio: null,
    })
  }

  const weekEndMs = weekStartMs + 7 * 24 * 60 * 60 * 1000

  for (const session of sessions) {
    if (session.status === 'skipped') {
      continue
    }

    if (session.start < weekStartMs || session.start >= weekEndMs) {
      continue
    }

    const subject = subjectMap.get(session.subjectId)
    if (!subject) {
      continue
    }

    const durationMinutes = (session.end - session.start) / 60000
    subject.plannedMinutes += durationMinutes
    if (session.status === 'done') {
      subject.actualMinutes += durationMinutes
    }
  }

  for (const subject of subjectMap.values()) {
    const target = subject.targetMinutes
    subject.ratio = target === null ? null : subject.plannedMinutes / target
  }

  void now
  return [...subjectMap.values()]
}

export function studyMinutesByDay(
  sessions: Session[],
  fromMs: number,
  toMs: number,
): Array<{ dayKey: string; plannedMinutes: number; actualMinutes: number }> {
  const map = new Map<string, { plannedMinutes: number; actualMinutes: number }>()

  for (const session of sessions) {
    if (session.status === 'skipped') {
      continue
    }

    if (session.end <= fromMs || session.start >= toMs) {
      continue
    }

    const day = new Date(session.start)
    const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`

    const previous = map.get(dateKey) ?? { plannedMinutes: 0, actualMinutes: 0 }
    const minutes = (session.end - session.start) / 60000

    previous.plannedMinutes += minutes
    if (session.status === 'done') {
      previous.actualMinutes += minutes
    }

    map.set(dateKey, previous)
  }

  return [...map.entries()]
    .map(([dayKey, value]) => ({ dayKey, ...value }))
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
}
