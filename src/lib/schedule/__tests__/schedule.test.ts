import { describe, expect, it } from 'vitest'

import type { Block } from '../../../db/schema'
import { detectConflicts } from '../conflict'
import { weeklyLoad } from '../load'
import { computeNextReview, isReviewDue } from '../review'
import { overlaps } from '../overlap'

const baseBlocks: Block[] = [
  {
    id: 'b1',
    topicId: 'topic-chem',
    kind: 'study',
    title: 'Organic Chemistry',
    start: 9 * 60 * 60 * 1000,
    end: 10 * 60 * 60 * 1000 + 30 * 60 * 1000,
    status: 'done',
    actualMinutes: 90,
    reviewedAt: null,
    createdAt: 0,
  },
  {
    id: 'b2',
    topicId: 'topic-calc',
    kind: 'study',
    title: 'Calculus II',
    start: 11 * 60 * 60 * 1000,
    end: 12 * 60 * 60 * 1000,
    status: 'planned',
    actualMinutes: 60,
    reviewedAt: null,
    createdAt: 0,
  },
]

describe('schedule library', () => {
  it('detects overlapping intervals', () => {
    expect(overlaps({ start: 0, end: 60 }, { start: 30, end: 90 })).toBe(true)
    expect(overlaps({ start: 0, end: 60 }, { start: 60, end: 90 })).toBe(false)
  })

  it('flags a hard conflict when blocks overlap', () => {
    const result = detectConflicts(
      { id: 'b3', start: 9 * 60 * 60 * 1000 + 30 * 60 * 1000, end: 10 * 60 * 60 * 1000 },
      baseBlocks,
      30,
    )

    expect(result.severity).toBe('hard')
    expect(result.conflicts).toHaveLength(1)
  })

  it('aggregates weekly load by topic', () => {
    const totals = weeklyLoad([
      { topicId: 'topic-chem', kind: 'study', start: 0, end: 60 * 60 * 1000 },
      { topicId: 'topic-chem', kind: 'review', start: 60 * 60 * 1000, end: 2 * 60 * 60 * 1000 },
      { topicId: 'topic-calc', kind: 'study', start: 0, end: 30 * 60 * 1000 },
    ])

    expect(totals['topic-chem']).toBe(120)
    expect(totals['topic-calc']).toBe(30)
  })

  it('computes the next review timestamp', () => {
    const now = Date.now()
    expect(computeNextReview(now, 3)).toBe(now + 3 * 24 * 60 * 60 * 1000)
    expect(isReviewDue({ nextReviewAt: now - 1000 })).toBe(true)
    expect(isReviewDue({ nextReviewAt: now + 1000 })).toBe(false)
  })
})
