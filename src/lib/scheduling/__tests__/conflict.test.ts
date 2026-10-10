import { describe, expect, it } from 'vitest'

import { detectConflicts } from '../conflict'

describe('detectConflicts', () => {
  it('returns hard when there is an overlap', () => {
    const result = detectConflicts(
      { id: 'candidate', start: 9 * 60 * 60 * 1000, end: 10 * 60 * 60 * 1000 },
      [
        {
          id: 'existing',
          subjectId: 's1',
          title: 'Math',
          start: 9 * 60 * 60 * 1000 + 30 * 60 * 1000,
          end: 10 * 60 * 60 * 1000 + 30 * 60 * 1000,
          notes: '',
          status: 'planned',
          createdAt: 0,
          updatedAt: 0,
        },
      ],
      10,
    )

    expect(result.severity).toBe('hard')
    expect(result.conflicts).toHaveLength(1)
  })

  it('returns tight for a short gap', () => {
    const result = detectConflicts(
      { id: 'candidate', start: 9 * 60 * 60 * 1000, end: 9 * 60 * 60 * 1000 + 60 * 60 * 1000 },
      [
        {
          id: 'existing',
          subjectId: 's1',
          title: 'Math',
          start: 10 * 60 * 60 * 1000 + 5 * 60 * 1000,
          end: 11 * 60 * 60 * 1000,
          notes: '',
          status: 'planned',
          createdAt: 0,
          updatedAt: 0,
        },
      ],
      10,
    )

    expect(result.severity).toBe('tight')
    expect(result.gapMinutes).toBe(5)
  })

  it('returns none when the gap is wide enough', () => {
    const result = detectConflicts(
      { id: 'candidate', start: 9 * 60 * 60 * 1000, end: 9 * 60 * 60 * 1000 + 60 * 60 * 1000 },
      [
        {
          id: 'existing',
          subjectId: 's1',
          title: 'Math',
          start: 10 * 60 * 60 * 1000 + 15 * 60 * 1000,
          end: 11 * 60 * 60 * 1000,
          notes: '',
          status: 'planned',
          createdAt: 0,
          updatedAt: 0,
        },
      ],
      10,
    )

    expect(result.severity).toBe('none')
    expect(result.gapMinutes).toBe(15)
  })

  it('does not conflict with itself while editing', () => {
    const result = detectConflicts(
      { id: 'candidate', start: 9 * 60 * 60 * 1000, end: 10 * 60 * 60 * 1000 },
      [
        {
          id: 'candidate',
          subjectId: 's1',
          title: 'Math',
          start: 9 * 60 * 60 * 1000,
          end: 10 * 60 * 60 * 1000,
          notes: '',
          status: 'planned',
          createdAt: 0,
          updatedAt: 0,
        },
      ],
      10,
    )

    expect(result.severity).toBe('none')
    expect(result.conflicts).toHaveLength(0)
  })
})
