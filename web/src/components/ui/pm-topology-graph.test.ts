import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type {
  PmTopologyGraphNode,
  PmTopologyKind,
} from '@/components/ui/pm-topology-graph'

describe('PmTopologyGraph contract', () => {
  it('supports the four canonical topologies', () => {
    const topologies: readonly PmTopologyKind[] = [
      'one_way',
      'two_way',
      'consortium',
      'circular',
    ]
    assert.equal(topologies.length, 4)
  })

  it('accepts read-model shaped nodes (structural compatibility)', () => {
    // Mirrors MatchTopologyNode from @/lib/match-topology-read-model.ts
    const nodes: readonly PmTopologyGraphNode[] = [
      { id: 'need', label: 'PM needed', kind: 'need', subtitle: 'Need', href: '/opportunities/1' },
      { id: 'offer', label: 'PM available', kind: 'offer', subtitle: 'Offer' },
      { id: 'party-0', label: 'Alice', kind: 'participant', subtitle: 'Party 1' },
    ]
    assert.equal(nodes[0]?.kind, 'need')
    assert.equal(nodes[2]?.kind, 'participant')
  })
})
