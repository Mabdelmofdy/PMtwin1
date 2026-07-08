import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { AuditEntry } from '@/types/domain.ts'
import { mergeAuditEntries, mergeSeedWithOverrides } from '@/repositories/seed-override-merge.ts'

describe('mergeSeedWithOverrides', () => {
  it('merges patches and new items while honoring tombstones', () => {
    const seed = [
      { id: 'a', value: 1 },
      { id: 'b', value: 2 },
      { id: 'c', value: 3 },
    ]

    const merged = mergeSeedWithOverrides({
      seed,
      patches: { b: { value: 20 } },
      newItems: [{ id: 'd', value: 4 }],
      deletedIds: ['c'],
    })

    assert.deepEqual(merged, [
      { id: 'a', value: 1 },
      { id: 'b', value: 20 },
      { id: 'd', value: 4 },
    ])
  })

  it('keeps new items when tombstones only apply to seed rows', () => {
    const merged = mergeSeedWithOverrides({
      seed: [{ id: 'a', value: 1 }],
      newItems: [{ id: 'a', value: 99 }],
      deletedIds: ['a'],
    })

    assert.deepEqual(merged, [{ id: 'a', value: 99 }])
  })
})

describe('mergeAuditEntries', () => {
  it('uses audit snapshot instead of seed when present', () => {
    const seed = [{ id: 'seed-audit', action: 'seed', timestamp: '2026-01-01T00:00:00.000Z' }]
    const snapshot = [{ id: 'import-audit', action: 'imported', timestamp: '2026-01-02T00:00:00.000Z' }]

    const merged = mergeAuditEntries(seed, {
      auditSnapshot: snapshot,
      newAuditEntries: [],
    })

    assert.equal(merged.length, 1)
    assert.equal(merged[0]?.id, 'import-audit')
  })

  it('appends new audit entries without duplicating snapshot ids', () => {
    const snapshot: AuditEntry[] = [
      { id: 'audit-1', action: 'first', timestamp: '2026-01-01T00:00:00.000Z' },
    ]

    const merged = mergeAuditEntries([], {
      auditSnapshot: snapshot,
      newAuditEntries: [
        { id: 'audit-2', action: 'second', timestamp: '2026-01-02T00:00:00.000Z' },
      ],
    })

    assert.equal(merged.length, 2)
    assert.deepEqual(
      merged.map((entry) => entry.id),
      ['audit-1', 'audit-2'],
    )
  })
})
