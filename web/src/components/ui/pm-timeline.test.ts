import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { PmTimelineEvent } from '@/components/ui/pm-timeline'

describe('PmTimelineEvent contract', () => {
  it('requires id and label; status defaults to upcoming rendering', () => {
    const events: readonly PmTimelineEvent[] = [
      { id: 'created', label: 'Created', timestamp: 'Jan 1, 2026', status: 'done' },
      { id: 'updated', label: 'Last updated', status: 'active' },
      { id: 'next', label: 'Awaiting matches' },
    ]

    assert.equal(events.length, 3)
    assert.equal(events[0]?.status, 'done')
    assert.equal(events[2]?.status, undefined)
  })

  it('supports optional description and timestamp', () => {
    const event: PmTimelineEvent = {
      id: 'matched',
      label: 'Matches discovered',
      description: 'Matching engine linked this opportunity.',
    }
    assert.ok(event.description)
    assert.equal(event.timestamp, undefined)
  })
})
