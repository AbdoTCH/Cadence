import type { Block } from '../../db/schema'

export function nextBlock(blocks: Block[], now = Date.now()): Block | null {
  const upcoming = blocks
    .filter((block) => block.start >= now)
    .sort((a, b) => a.start - b.start)

  return upcoming[0] ?? null
}

export function nextReviewWindow(blocks: Block[], now = Date.now()): Block | null {
  const upcoming = blocks
    .filter((block) => block.kind === 'review' && block.start >= now)
    .sort((a, b) => a.start - b.start)

  return upcoming[0] ?? null
}
