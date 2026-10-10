export type Interval = {
  start: number
  end: number
}

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end
}

export function findOverlaps<T extends Interval & { id: string }>(
  target: Interval,
  items: T[],
  excludeId?: string,
): T[] {
  return items.filter((item) => item.id !== excludeId && overlaps(target, item))
}

export function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) {
    return []
  }

  const sorted = [...intervals].sort((a, b) => a.start - b.start)
  const merged: Interval[] = [sorted[0]]

  for (const current of sorted.slice(1)) {
    const last = merged[merged.length - 1]

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end)
    } else {
      merged.push({ ...current })
    }
  }

  return merged
}
