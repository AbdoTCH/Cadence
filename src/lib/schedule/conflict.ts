import type { Block } from '../../db/schema'

import { overlaps } from './overlap'

export type ConflictSeverity = 'hard' | 'tight' | 'none'

export type ConflictResult = {
  severity: ConflictSeverity
  conflicts: Block[]
  gapMinutes: number | null
}

function sameLocalDay(a: number, b: number): boolean {
  const left = new Date(a)
  const right = new Date(b)

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export function detectConflicts(
  candidate: { id?: string; start: number; end: number },
  existing: Block[],
  breakMinutes: number,
): ConflictResult {
  const otherBlocks = existing.filter((block) => block.id !== candidate.id)
  const directConflicts = otherBlocks.filter((block) => overlaps(candidate, block))

  if (directConflicts.length > 0) {
    return {
      severity: 'hard',
      conflicts: directConflicts,
      gapMinutes: null,
    }
  }

  const sameDayBlocks = otherBlocks.filter(
    (block) => sameLocalDay(block.start, candidate.start) || sameLocalDay(block.end, candidate.start),
  )

  const gaps = sameDayBlocks
    .map((block) => {
      if (block.end <= candidate.start) {
        return (candidate.start - block.end) / 60000
      }

      if (candidate.end <= block.start) {
        return (block.start - candidate.end) / 60000
      }

      return null
    })
    .filter((gap): gap is number => gap !== null && gap >= 0)

  const gapMinutes = gaps.length > 0 ? Math.min(...gaps) : null

  if (gapMinutes !== null && gapMinutes < breakMinutes) {
    return {
      severity: 'tight',
      conflicts: [],
      gapMinutes: Math.round(gapMinutes),
    }
  }

  return {
    severity: 'none',
    conflicts: [],
    gapMinutes: gapMinutes !== null ? Math.round(gapMinutes) : null,
  }
}
