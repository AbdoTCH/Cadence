import { db } from '../db'
import type { AppNotification, NotificationType } from '../schema'

export async function listNotifications(limit = 20): Promise<AppNotification[]> {
  return db.notifications.orderBy('createdAt').reverse().limit(limit).toArray()
}

export async function pushNotification(input: {
  type: NotificationType
  title: string
  body: string
  href?: string | null
}): Promise<AppNotification> {
  const notification: AppNotification = {
    id: crypto.randomUUID(),
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    readAt: null,
    createdAt: Date.now(),
  }

  await db.notifications.put(notification)
  return notification
}

export async function markNotificationRead(id: string): Promise<void> {
  await db.notifications.update(id, { readAt: Date.now() })
}

export async function markAllNotificationsRead(): Promise<void> {
  const notifications = await db.notifications.filter((notification) => notification.readAt === null).toArray()
  for (const notification of notifications) {
    await db.notifications.update(notification.id, { readAt: Date.now() })
  }
}
