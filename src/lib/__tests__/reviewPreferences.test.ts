import { describe, expect, it } from 'vitest'

import { areReviewRemindersEnabled } from '../reviewPreferences'

describe('review reminder preference', () => {
  it('defaults to enabled for existing settings records', () => {
    expect(areReviewRemindersEnabled()).toBe(true)
    expect(areReviewRemindersEnabled({})).toBe(true)
  })

  it('returns the explicitly saved preference', () => {
    expect(areReviewRemindersEnabled({ reviewRemindersEnabled: true })).toBe(true)
    expect(areReviewRemindersEnabled({ reviewRemindersEnabled: false })).toBe(false)
  })
})