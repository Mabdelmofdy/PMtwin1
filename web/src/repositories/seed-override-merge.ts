import type { AuditEntry } from '@/types/domain.ts'
import type { Overrides } from '@/types/storage.ts'

export type SeedOverrideMergeInput<T extends { id: string }> = {
  readonly seed: readonly T[]
  readonly patches?: Readonly<Record<string, Partial<T>>>
  readonly newItems?: readonly T[]
  readonly deletedIds?: readonly string[]
  readonly normalize?: (item: T) => T
}

export function mergeSeedWithOverrides<T extends { id: string }>({
  seed,
  patches = {},
  newItems = [],
  deletedIds = [],
  normalize = (item) => item,
}: SeedOverrideMergeInput<T>): T[] {
  const deleted = new Set(deletedIds)
  const merged = seed
    .filter((item) => !deleted.has(item.id))
    .map((item) => normalize({ ...item, ...patches[item.id] } as T))
  const created = newItems.map((item) => normalize(item))
  return [...merged, ...created]
}

export function mergeAuditEntries(
  seed: readonly AuditEntry[],
  overrides: Overrides,
): AuditEntry[] {
  const base = overrides.auditSnapshot ?? seed
  const appended = overrides.newAuditEntries ?? []
  const byId = new Map<string, AuditEntry>()

  for (const entry of base) {
    byId.set(entry.id, entry)
  }
  for (const entry of appended) {
    byId.set(entry.id, entry)
  }

  const orderedIds = [
    ...base.map((entry) => entry.id),
    ...appended.map((entry) => entry.id),
  ]
  const seen = new Set<string>()
  const ordered: AuditEntry[] = []
  for (const id of orderedIds) {
    if (seen.has(id)) continue
    seen.add(id)
    const entry = byId.get(id)
    if (entry) ordered.push(entry)
  }
  return ordered
}
