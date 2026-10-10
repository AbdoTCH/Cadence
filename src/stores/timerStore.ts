import { create } from 'zustand'

import type { TimerState } from '../db/schema'

export type TimerRuntime = {
  displayMs: number
  isRunning: boolean
  target: TimerState['target']
  breakDue: boolean
  setDisplay: (value: number) => void
  setRunning: (value: boolean) => void
  setTarget: (target: TimerState['target']) => void
  setBreakDue: (value: boolean) => void
  reset: () => void
}

export const useTimerStore = create<TimerRuntime>((set) => ({
  displayMs: 0,
  isRunning: false,
  target: { kind: 'free' },
  breakDue: false,
  setDisplay: (value) => set({ displayMs: value }),
  setRunning: (value) => set({ isRunning: value }),
  setTarget: (target) => set({ target }),
  setBreakDue: (value) => set({ breakDue: value }),
  reset: () => set({ displayMs: 0, isRunning: false, target: { kind: 'free' }, breakDue: false }),
}))
