import { describe, expect, it } from 'vitest'

import { findOverlaps, mergeIntervals, overlaps } from '../overlap'

describe('overlap utilities', () => {
  it('touching boundaries do not overlap', () => {
    expect(overlaps({ start: 0, end: 10 }, { start: 10, end: 20 })).toBe(false)
    expect(overlaps({ start: 10, end: 20 }, { start: 0, end: 10 })).toBe(false)
  })

  it('fully contained interval overlaps', () => {
    expect(overlaps({ start: 0, end: 100 }, { start: 20, end: 80 })).toBe(true)
  })

  it('identical intervals overlap', () => {
    expect(overlaps({ start: 5, end: 15 }, { start: 5, end: 15 })).toBe(true)
  })

  it('findOverlaps excludes the item with the same id', () => {
    const target = { id: 'target', start: 0, end: 60 }
    const items = [
      { id: 'target', start: 10, end: 20 },
      { id: 'other', start: 25, end: 35 },
      { id: 'other-2', start: 70, end: 90 },
    ]

    expect(findOverlaps(target, items, 'target')).toHaveLength(1)
    expect(findOverlaps(target, items, 'target')[0].id).toBe('other')
  })

  it('mergeIntervals combines adjacent and overlapping intervals', () => {
    expect(
      mergeIntervals([
        { start: 0, end: 10 },
        { start: 10, end: 20 },
        { start: 30, end: 40 },
        { start: 35, end: 50 },
      ]),
    ).toEqual([
      { start: 0, end: 20 },
      { start: 30, end: 50 },
    ])
  })
})
