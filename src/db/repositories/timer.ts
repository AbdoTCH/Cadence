import { db } from '../db'
import type { TimerState } from '../schema'

const defaultTimer: TimerState = {
  id: 'singleton',
  mode: 'idle',
  target: { kind: 'free' },
  startedAt: null,
  accumulatedMs: 0,
  lastHeartbeat: null,
  breakReminderMinutes: 10,
  breakAcknowledgedAt: null,
}

export async function getTimer(): Promise<TimerState> {
  const timer = await db.timer.get('singleton')
  return timer ?? defaultTimer
}

export async function startTimer(
  target: TimerState['target'],
  breakReminderMinutes: number,
): Promise<void> {
  const next: TimerState = {
    id: 'singleton',
    mode: 'running',
    target,
    startedAt: Date.now(),
    accumulatedMs: 0,
    lastHeartbeat: Date.now(),
    breakReminderMinutes,
    breakAcknowledgedAt: null,
  }

  await db.timer.put(next)
}

export async function pauseTimer(): Promise<void> {
  const current = await getTimer()
  if (current.mode !== 'running') return

  const now = Date.now()
  const elapsed = current.startedAt ? now - current.startedAt : 0
  await db.timer.update('singleton', {
    mode: 'paused',
    accumulatedMs: current.accumulatedMs + elapsed,
    startedAt: null,
    lastHeartbeat: now,
  })
}

export async function resumeTimer(): Promise<void> {
  const current = await getTimer()
  if (current.mode !== 'paused') return

  await db.timer.update('singleton', {
    mode: 'running',
    startedAt: Date.now(),
    lastHeartbeat: Date.now(),
  })
}

export async function stopTimer(): Promise<{ elapsedMs: number; target: TimerState['target'] }> {
  const current = await getTimer()
  const elapsed = current.accumulatedMs + (current.startedAt ? Date.now() - current.startedAt : 0)
  await db.timer.put({
    ...current,
    mode: 'idle',
    target: { kind: 'free' },
    startedAt: null,
    accumulatedMs: 0,
    lastHeartbeat: Date.now(),
    breakAcknowledgedAt: null,
  })

  return { elapsedMs: elapsed, target: current.target }
}

export async function heartbeat(): Promise<void> {
  const current = await getTimer()
  if (current.mode !== 'running') return

  await db.timer.update('singleton', { lastHeartbeat: Date.now() })
}
