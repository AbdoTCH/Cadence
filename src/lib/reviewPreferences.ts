import type { Settings } from '../db/schema'

export function areReviewRemindersEnabled(settings?: Pick<Settings, 'reviewRemindersEnabled'>): boolean {
  return settings?.reviewRemindersEnabled !== false
}