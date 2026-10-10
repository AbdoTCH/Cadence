import { db } from '../db'
import type { Settings } from '../schema'

export async function getSettings(): Promise<Settings | undefined> {
  return db.settings.get('singleton')
}

export async function setSettings(patch: Partial<Settings>): Promise<void> {
  const current = await db.settings.get('singleton')
  if (!current) {
    const defaultSettings: Settings = {
      id: 'singleton',
      theme: 'system',
      weekStartsOn: 1,
      defaultSessionMinutes: 50,
      breakReminderMinutes: 10,
      syncEnabled: false,
      reviewRemindersEnabled: true,
      seededAt: null,
    }
    await db.settings.put({ ...defaultSettings, ...patch })
    return
  }

  await db.settings.update('singleton', patch)
}
