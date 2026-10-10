export type ID = string

export type TopicColor = 'slate' | 'olive' | 'clay' | 'indigo' | 'amber' | 'teal'

export type Topic = {
  id: ID
  name: string
  color: TopicColor
  reviewIntervalDays: number
  nextReviewAt: number | null
  archivedAt: number | null
  createdAt: number
}

export type BlockKind = 'study' | 'rest' | 'review'
export type BlockStatus = 'planned' | 'done' | 'skipped'

export type Block = {
  id: ID
  topicId: ID
  kind: BlockKind
  title: string
  start: number
  end: number
  status: BlockStatus
  actualMinutes: number
  reviewedAt: number | null
  createdAt: number
}

export type NotificationType = 'study' | 'review' | 'rest' | 'conflict' | 'break' | 'task_due' | 'sync'

export type Notification = {
  id: ID
  type: NotificationType
  title: string
  body: string
  href: string | null
  readAt: number | null
  createdAt: number
}

export type Settings = {
  id: 'singleton'
  theme: 'light' | 'dark' | 'system'
  weekStartsOn: 0 | 1
  defaultStudyMinutes?: number
  defaultBreakMinutes?: number
  quietHoursStart?: string
  quietHoursEnd?: string
  defaultSessionMinutes?: number
  breakReminderMinutes?: number
  syncEnabled?: boolean
  reviewRemindersEnabled?: boolean
  seededAt: number | null
}

export type SubjectColor = TopicColor

export type Subject = {
  id: ID
  name: string
  color: SubjectColor
  targetMinutesPerWeek: number
  archivedAt: number | null
  createdAt: number
  subjectId?: ID
}

export type SessionStatus = BlockStatus

export type Session = {
  id: ID
  topicId?: ID
  subjectId: ID
  title: string
  start: number
  end: number
  notes?: string
  status: SessionStatus
  createdAt: number
  updatedAt?: number
}

export type TaskStatus = 'open' | 'done'
export type TaskPriority = 'low' | 'normal' | 'high'

export type Task = {
  id: ID
  topicId?: ID | null
  subjectId: ID | null
  title: string
  notes: string
  due: number | null
  estimatedMinutes: number
  status: TaskStatus
  priority: TaskPriority
  completedAt: number | null
  createdAt: number
  updatedAt: number
}

export type TimerState = {
  id: 'singleton'
  mode: 'idle' | 'running' | 'paused'
  target:
    | { kind: 'session'; id: ID }
    | { kind: 'task'; id: ID }
    | { kind: 'study'; id: ID }
    | { kind: 'rest'; id: ID }
    | { kind: 'free' }
  startedAt: number | null
  accumulatedMs: number
  lastHeartbeat: number | null
  breakReminderMinutes: number
  breakAcknowledgedAt: number | null
}

export type AppNotification = Notification
