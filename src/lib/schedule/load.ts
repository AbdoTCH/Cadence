export type LoadEntry = {
  topicId: string
  start: number
  end: number
  kind: 'study' | 'rest' | 'review'
}

export function minutesForTopic(blocks: LoadEntry[], topicId: string): number {
  return blocks
    .filter((block) => block.topicId === topicId)
    .reduce((total, block) => total + Math.max(0, block.end - block.start), 0)
    / 60000
}

export function weeklyLoad(blocks: LoadEntry[]): Record<string, number> {
  const totals: Record<string, number> = {}

  for (const block of blocks) {
    const minutes = Math.max(0, block.end - block.start) / 60000
    totals[block.topicId] = (totals[block.topicId] ?? 0) + minutes
  }

  return totals
}
