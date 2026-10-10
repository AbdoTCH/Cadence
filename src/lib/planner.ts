import type { Block, Topic } from '../db/schema'

export type PlannerSummary = {
  studyMinutesToday: number
  breakMinutesToday: number
  reviewDueCount: number
  nextUp: Block[]
  entries: Block[]
}

function toLocalDayStart(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function toLocalDayEnd(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(23, 59, 59, 999)
  return date.getTime()
}

export function summarizePlanner(topics: Topic[], blocks: Block[], now = Date.now()): PlannerSummary {
  const dayStart = toLocalDayStart(now)
  const dayEnd = toLocalDayEnd(now)

  const todayBlocks = blocks
    .filter((block) => block.start <= dayEnd && block.end >= dayStart)
    .sort((a, b) => a.start - b.start)

  const studyMinutesToday = todayBlocks
    .filter((block) => block.kind === 'study')
    .reduce((total, block) => {
      const minutes = block.actualMinutes > 0 ? block.actualMinutes : Math.max(0, Math.round((block.end - block.start) / 60000))
      return total + minutes
    }, 0)

  const breakMinutesToday = todayBlocks
    .filter((block) => block.kind === 'rest')
    .reduce((total, block) => {
      const minutes = block.actualMinutes > 0 ? block.actualMinutes : Math.max(0, Math.round((block.end - block.start) / 60000))
      return total + minutes
    }, 0)

  const reviewDueCount = topics.filter((topic) => topic.nextReviewAt !== null && topic.nextReviewAt <= now).length

  const nextUp = blocks
    .filter((block) => block.start >= now)
    .sort((a, b) => a.start - b.start)
    .slice(0, 3)

  return {
    studyMinutesToday,
    breakMinutesToday,
    reviewDueCount,
    nextUp,
    entries: todayBlocks,
  }
}