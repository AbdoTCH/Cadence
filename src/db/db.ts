import Dexie, { type Table } from 'dexie'

import type { AppNotification, Block, Notification, Session, Settings, Subject, Task, TimerState, Topic } from './schema'

class JustDB extends Dexie {
  topics!: Table<Topic, string>
  blocks!: Table<Block, string>
  notifications!: Table<Notification, string>
  settings!: Table<Settings, string>

  subjects!: Table<Subject, string>
  sessions!: Table<Session, string>
  tasks!: Table<Task, string>
  timer!: Table<TimerState, string>
  legacyNotifications!: Table<AppNotification, string>

  constructor() {
    super('just-db')
    this.version(1).stores({
      topics: 'id, name, nextReviewAt, archivedAt, createdAt',
      blocks: 'id, topicId, kind, start, end, status, [start+end]',
      notifications: 'id, type, readAt, createdAt',
      settings: 'id',
      subjects: 'id, name, archivedAt, createdAt',
      sessions: 'id, topicId, start, end, status, [start+end]',
      tasks: 'id, topicId, due, status, priority, createdAt',
      timer: 'id',
      legacyNotifications: 'id, type, readAt, createdAt',
    })
  }
}

export const db = new JustDB()

export async function resetDatabase(): Promise<void> {
  await db.transaction(
    'rw',
    [db.topics, db.blocks, db.notifications, db.settings, db.subjects, db.sessions, db.tasks, db.timer],
    async () => {
      await db.topics.clear()
      await db.blocks.clear()
      await db.notifications.clear()
      await db.settings.clear()
      await db.subjects.clear()
      await db.sessions.clear()
      await db.tasks.clear()
      await db.timer.clear()
    },
  )
}
