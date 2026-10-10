import { db } from '../db'
import type { ID, Task, TaskPriority, TaskStatus } from '../schema'

export async function listTasks(filter: {
  status?: TaskStatus
  subjectId?: ID
  dueBefore?: number
} = {}): Promise<Task[]> {
  const tasks = await db.tasks.orderBy('createdAt').toArray()

  return tasks.filter((task) => {
    if (filter.status && task.status !== filter.status) return false
    if (filter.subjectId && task.subjectId !== filter.subjectId) return false
    if (filter.dueBefore !== undefined && task.due !== null && task.due > filter.dueBefore) return false
    return true
  })
}

export async function createTask(input: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const task: Task = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await db.tasks.put(task)
  return task
}

export async function updateTask(id: ID, patch: Partial<Task>): Promise<void> {
  const existing = await db.tasks.get(id)
  if (!existing) return

  await db.tasks.update(id, { ...patch, updatedAt: Date.now() })
}

export async function toggleTask(id: ID): Promise<void> {
  const task = await db.tasks.get(id)
  if (!task) return

  await db.tasks.update(id, {
    status: task.status === 'open' ? 'done' : 'open',
    completedAt: task.status === 'open' ? Date.now() : null,
    updatedAt: Date.now(),
  })
}

export async function deleteTask(id: ID): Promise<void> {
  await db.tasks.delete(id)
}

export type TaskTemplate = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
export type TaskSort = 'due' | 'priority' | 'created'

export function priorityRank(priority: TaskPriority): number {
  return priority === 'high' ? 3 : priority === 'normal' ? 2 : 1
}

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  const next = [...tasks]

  next.sort((a, b) => {
    if (sort === 'due') {
      const aDue = a.due ?? Number.MAX_SAFE_INTEGER
      const bDue = b.due ?? Number.MAX_SAFE_INTEGER
      if (aDue !== bDue) return aDue - bDue
      return priorityRank(b.priority) - priorityRank(a.priority)
    }

    if (sort === 'priority') {
      const difference = priorityRank(b.priority) - priorityRank(a.priority)
      if (difference !== 0) return difference
      const aDue = a.due ?? Number.MAX_SAFE_INTEGER
      const bDue = b.due ?? Number.MAX_SAFE_INTEGER
      return aDue - bDue
    }

    return b.createdAt - a.createdAt
  })

  return next
}
