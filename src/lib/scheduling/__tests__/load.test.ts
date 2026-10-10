import { describe, expect, it } from 'vitest'

import type { Session, Subject } from '../../../db/schema'
import { weeklyLoad } from '../load'

describe('weeklyLoad', () => {
  it('actualMinutes ignores skipped and planned sessions', () => {
    const sessions: Session[] = [
      {
        id: 'done',
        subjectId: 'math',
        title: 'Did it',
        start: new Date('2025-01-06T09:00:00Z').getTime(),
        end: new Date('2025-01-06T10:00:00Z').getTime(),
        notes: '',
        status: 'done',
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: 'planned',
        subjectId: 'math',
        title: 'Planned',
        start: new Date('2025-01-06T10:00:00Z').getTime(),
        end: new Date('2025-01-06T11:00:00Z').getTime(),
        notes: '',
        status: 'planned',
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: 'skipped',
        subjectId: 'math',
        title: 'Skipped',
        start: new Date('2025-01-07T09:00:00Z').getTime(),
        end: new Date('2025-01-07T10:00:00Z').getTime(),
        notes: '',
        status: 'skipped',
        createdAt: 0,
        updatedAt: 0,
      },
    ]

    const subjects: Subject[] = [{ id: 'math', name: 'Math', color: 'indigo', targetMinutesPerWeek: 120, archivedAt: null, createdAt: 0 }]

    const result = weeklyLoad(sessions, subjects, new Date('2025-01-05T00:00:00Z').getTime(), new Date('2025-01-07T00:00:00Z').getTime())

    expect(result[0]).toMatchObject({ subjectId: 'math', plannedMinutes: 120, actualMinutes: 60, targetMinutes: 120 })
  })

  it('sessions spanning a week boundary are assigned to the week containing start', () => {
    const sessions: Session[] = [
      {
        id: 'span',
        subjectId: 'math',
        title: 'Cross-week',
        start: new Date('2025-01-05T23:30:00Z').getTime(),
        end: new Date('2025-01-06T01:00:00Z').getTime(),
        notes: '',
        status: 'done',
        createdAt: 0,
        updatedAt: 0,
      },
    ]
    const subjects: Subject[] = [{ id: 'math', name: 'Math', color: 'indigo', targetMinutesPerWeek: 120, archivedAt: null, createdAt: 0 }]

    const result = weeklyLoad(sessions, subjects, new Date('2025-01-05T00:00:00Z').getTime(), new Date('2025-01-07T00:00:00Z').getTime())

    expect(result[0].plannedMinutes).toBe(90)
    expect(result[0].actualMinutes).toBe(90)
  })

  it('targetMinutes is null when the target is zero', () => {
    const sessions: Session[] = []
    const subjects: Subject[] = [{ id: 'math', name: 'Math', color: 'indigo', targetMinutesPerWeek: 0, archivedAt: null, createdAt: 0 }]

    const result = weeklyLoad(sessions, subjects, new Date('2025-01-05T00:00:00Z').getTime(), new Date('2025-01-07T00:00:00Z').getTime())

    expect(result[0]).toMatchObject({ targetMinutes: null, ratio: null })
  })
})
