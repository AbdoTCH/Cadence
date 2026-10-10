import { createId } from '../lib/id'
import { db } from './db'
import type { Block, Notification, Settings, Topic } from './schema'

let seedPromise: Promise<void> | null = null

function atFutureDay(now: number, daysAhead: number, hour: number, minute = 0): number {
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + daysAhead)
  date.setHours(hour, minute, 0, 0)
  return date.getTime()
}

export async function ensureSeedData(): Promise<void> {
  if (seedPromise) {
    await seedPromise
    return
  }

  seedPromise = (async () => {
    const settings = await db.settings.get('singleton')
    if (settings?.seededAt !== null && settings?.seededAt !== undefined) {
      return
    }

    const now = Date.now()

    const topics: Topic[] = [
      { id: 'topic-chem', name: 'Organic Chemistry', color: 'clay', reviewIntervalDays: 3, nextReviewAt: atFutureDay(now, 3, 18), archivedAt: null, createdAt: now },
      { id: 'topic-calc', name: 'Calculus II', color: 'indigo', reviewIntervalDays: 4, nextReviewAt: atFutureDay(now, 4, 9), archivedAt: null, createdAt: now },
      { id: 'topic-history', name: 'World History', color: 'amber', reviewIntervalDays: 5, nextReviewAt: atFutureDay(now, 5, 13), archivedAt: null, createdAt: now },
      { id: 'topic-spanish', name: 'Spanish', color: 'teal', reviewIntervalDays: 2, nextReviewAt: atFutureDay(now, 2, 16), archivedAt: null, createdAt: now },
    ]

    const blocks: Block[] = [
      { id: createId(), topicId: 'topic-chem', kind: 'study', title: 'Organic Chemistry', start: atFutureDay(now, 1, 9), end: atFutureDay(now, 1, 10, 30), status: 'planned', actualMinutes: 90, reviewedAt: null, createdAt: now },
      { id: createId(), topicId: 'topic-chem', kind: 'rest', title: 'Break', start: atFutureDay(now, 1, 10, 30), end: atFutureDay(now, 1, 11), status: 'planned', actualMinutes: 30, reviewedAt: null, createdAt: now },
      { id: createId(), topicId: 'topic-calc', kind: 'study', title: 'Calculus II', start: atFutureDay(now, 2, 9), end: atFutureDay(now, 2, 10, 30), status: 'planned', actualMinutes: 90, reviewedAt: null, createdAt: now },
      { id: createId(), topicId: 'topic-history', kind: 'study', title: 'World History', start: atFutureDay(now, 3, 18), end: atFutureDay(now, 3, 19), status: 'planned', actualMinutes: 60, reviewedAt: null, createdAt: now },
      { id: createId(), topicId: 'topic-spanish', kind: 'review', title: 'Spanish review', start: atFutureDay(now, 4, 16), end: atFutureDay(now, 4, 16, 45), status: 'planned', actualMinutes: 45, reviewedAt: null, createdAt: now },
    ]

    const notifications: Notification[] = [
      { id: createId(), type: 'review', title: 'Review Organic Chemistry', body: 'Your next chemistry review is coming up. Revisit mechanisms and flashcards.', href: '/topics/topic-chem', readAt: null, createdAt: now },
      { id: createId(), type: 'rest', title: 'Take a short break', body: 'You have been studying for 50 minutes. Stand up and reset.', href: '/timetable', readAt: null, createdAt: now },
    ]

    const settingsRecord: Settings = {
      id: 'singleton',
      theme: 'system',
      weekStartsOn: 1,
      defaultStudyMinutes: 50,
      defaultBreakMinutes: 10,
      quietHoursStart: '21:00',
      quietHoursEnd: '07:00',
      reviewRemindersEnabled: true,
      seededAt: Date.now(),
    }

    await db.transaction('rw', [db.topics, db.blocks, db.notifications, db.settings], async () => {
      await db.topics.bulkPut(topics)
      await db.blocks.bulkPut(blocks)
      await db.notifications.bulkPut(notifications)
      await db.settings.put(settingsRecord)
    })
  })()

  try {
    await seedPromise
  } finally {
    seedPromise = null
  }
}
