import { db } from '../db'
import type { ID, Subject, SubjectColor } from '../schema'

export async function listSubjects(includeArchived = false): Promise<Subject[]> {
  const subjects = await db.subjects.orderBy('createdAt').toArray()
  return includeArchived ? subjects : subjects.filter((subject) => subject.archivedAt === null)
}

export async function getSubject(id: ID): Promise<Subject | undefined> {
  return db.subjects.get(id)
}

export async function createSubject(input: {
  name: string
  color: SubjectColor
  targetMinutesPerWeek: number
}): Promise<Subject> {
  const subject: Subject = {
    id: crypto.randomUUID(),
    name: input.name,
    color: input.color,
    targetMinutesPerWeek: input.targetMinutesPerWeek,
    archivedAt: null,
    createdAt: Date.now(),
  }

  await db.subjects.put(subject)
  return subject
}

export async function updateSubject(
  id: ID,
  patch: Partial<Omit<Subject, 'id' | 'createdAt'>>,
): Promise<void> {
  const existing = await db.subjects.get(id)
  if (!existing) return

  await db.subjects.update(id, patch)
}

export async function archiveSubject(id: ID): Promise<void> {
  await db.subjects.update(id, { archivedAt: Date.now() })
}

export async function unarchiveSubject(id: ID): Promise<void> {
  await db.subjects.update(id, { archivedAt: null })
}
