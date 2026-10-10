import type { Topic } from '../../db/schema'

export function isReviewDue(topic: Pick<Topic, 'nextReviewAt'>, now = Date.now()): boolean {
  return topic.nextReviewAt !== null && topic.nextReviewAt <= now
}

export function computeNextReview(from: number, intervalDays: number): number {
  return from + intervalDays * 24 * 60 * 60 * 1000
}
