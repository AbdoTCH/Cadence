export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; message: string }

export function required(value: string, label: string): Result<string> {
  if (!value.trim()) {
    return { ok: false, message: `${label} is required.` }
  }

  return { ok: true, value: value.trim() }
}

export function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0
}
