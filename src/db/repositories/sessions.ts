import { db } from '../db'
import type { ID, Session, SessionStatus } from '../schema'

export async function listSessionsInRange(fromMs: number, toMs: number): Promise<Session[]> {
  return db.sessions.where('start').between(fromMs, toMs, true, true).toArray()
}

export async function listUpcomingSessions(limit: number): Promise<Session[]> {
  return db.sessions
    .where('status')
    .equals('planned')
    .filter((session) => session.start > Date.now())
    .sortBy('start')
    .then((sessions) => sessions.slice(0, limit))
}

export async function createSession(input: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session> {
  const session: Session = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await db.sessions.put(session)
  return session
}

export async function updateSession(id: ID, patch: Partial<Session>): Promise<void> {
  const existing = await db.sessions.get(id)
  if (!existing) return

  await db.sessions.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteSession(id: ID): Promise<void> {
  await db.sessions.delete(id)
}

export async function setSessionStatus(id: ID, status: SessionStatus): Promise<void> {
  await db.sessions.update(id, { status, updatedAt: Date.now() })
}
