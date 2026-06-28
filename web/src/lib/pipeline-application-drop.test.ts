import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { pipelineApplicationDrop } from '@/lib/pipeline-application-drop.ts'

describe('pipelineApplicationDrop', () => {
  it('still routes application drag through updateApplicationStatus', () => {
    const updates: Array<{ id: string; status: string }> = []
    const result = pipelineApplicationDrop('app-1', 'reviewing', {
      updateApplicationStatus: (id, status) => {
        updates.push({ id, status })
      },
    })

    assert.equal(result.success, true)
    assert.deepEqual(updates, [{ id: 'app-1', status: 'reviewing' }])
  })
})
