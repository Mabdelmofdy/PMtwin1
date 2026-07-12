import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { canAccessWorkspaceEntity } from '@pm-twin/identity'
import { filterByActiveWorkspace } from './workspace-access.ts'
import { isOpportunityOwnedByContext } from './ownership-adapters.ts'

describe('workspace isolation', () => {
  it('rejects cross-workspace opportunity access', () => {
    assert.equal(
      canAccessWorkspaceEntity({
        activeWorkspaceId: 'ws-personal-a',
        entityWorkspaceId: 'ws-company-b',
      }),
      false,
    )
    assert.equal(
      canAccessWorkspaceEntity({
        activeWorkspaceId: 'ws-company-a',
        entityWorkspaceId: 'ws-company-b',
      }),
      false,
    )
  })

  it('filters lists to the active workspace only', () => {
    const items = [
      { id: '1', workspaceId: 'ws-a' },
      { id: '2', workspaceId: 'ws-b' },
      { id: '3', workspaceId: 'ws-a' },
    ]
    const filtered = filterByActiveWorkspace(items, 'ws-a')
    assert.deepEqual(
      filtered.map((item) => item.id),
      ['1', '3'],
    )
  })

  it('does not treat creatorId alone as ownership when canonical fields exist', () => {
    assert.equal(
      isOpportunityOwnedByContext(
        {
          workspaceId: 'ws-company-a',
          ownerPartyId: 'party-company-a',
          creatorId: 'employee-1',
        },
        {
          activeWorkspaceId: 'ws-personal-employee',
          activePartyId: 'party-individual-employee',
          userId: 'employee-1',
        },
      ),
      false,
    )
  })
})
