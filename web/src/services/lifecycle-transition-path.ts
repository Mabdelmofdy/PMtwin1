import { allowedTransitions, toCanonical } from '@pm-twin/lifecycle'

export function findLifecycleTransitionPath(
  entity: string,
  fromStatus: string,
  toStatus: string,
): readonly string[] | null {
  const from = toCanonical(entity, fromStatus)
  const to = toCanonical(entity, toStatus)
  if (!from || !to) return null
  if (from === to) return []

  const queue: Array<{ readonly status: string; readonly path: string[] }> = [
    { status: from, path: [] },
  ]
  const visited = new Set<string>([from])

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break

    for (const next of allowedTransitions(entity, current.status)) {
      if (visited.has(next)) continue
      const nextPath = [...current.path, next]
      if (next === to) return nextPath
      visited.add(next)
      queue.push({ status: next, path: nextPath })
    }
  }

  return null
}
