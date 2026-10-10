import { describe, expect, it } from 'vitest'

import type { Block, Topic } from '../../db/schema'
import { summarizePlanner } from '../planner'

describe('summarizePlanner', () => {
  const topics: Topic[] = [
    { id: 'chem', name: 'Organic Chemistry', color: 'clay', reviewIntervalDays: 3, nextReviewAt: Date.UTC(2026, 9, 10, 7, 0), archivedAt: null, createdAt: Date.UTC(2026, 9, 1) },
    { id: 'calc', name: 'Calculus II', color: 'indigo', reviewIntervalDays: 4, nextReviewAt: Date.UTC(2026, 9, 11, 9, 0), archivedAt: null, createdAt: Date.UTC(2026, 9, 1) },
  ]

  const blocks: Block[] = [
    { id: 'b1', topicId: 'chem', kind: 'study', title: 'Organic Chemistry', start: Date.UTC(2026, 9, 10, 9, 0), end: Date.UTC(2026, 9, 10, 10, 30), status: 'done', actualMinutes: 90, reviewedAt: null, createdAt: Date.UTC(2026, 9, 1) },
    { id: 'b2', topicId: 'chem', kind: 'rest', title: 'Break', start: Date.UTC(2026, 9, 10, 10, 30), end: Date.UTC(2026, 9, 10, 10, 45), status: 'planned', actualMinutes: 15, reviewedAt: null, createdAt: Date.UTC(2026, 9, 1) },
    { id: 'b4', topicId: 'calc', kind: 'study', title: 'Calculus II', start: Date.UTC(2026, 9, 10, 18, 0), end: Date.UTC(2026, 9, 10, 19, 0), status: 'planned', actualMinutes: 60, reviewedAt: null, createdAt: Date.UTC(2026, 9, 1) },
    { id: 'b3', topicId: 'chem', kind: 'review', title: 'Chem review', start: Date.UTC(2026, 9, 11, 17, 0), end: Date.UTC(2026, 9, 11, 17, 45), status: 'planned', actualMinutes: 45, reviewedAt: null, createdAt: Date.UTC(2026, 9, 1) },
  ]

  it('computes planned study minutes, review count, and the next few blocks', () => {
    const summary = summarizePlanner(topics, blocks, Date.UTC(2026, 9, 10, 8, 0))

    expect(summary.studyMinutesToday).toBe(150)
    expect(summary.breakMinutesToday).toBe(15)
    expect(summary.reviewDueCount).toBe(1)
    expect(summary.nextUp.map((block) => block.title)).toEqual(['Organic Chemistry', 'Break', 'Calculus II'])
    expect(summary.entries[0].title).toBe('Organic Chemistry')
  })
})
