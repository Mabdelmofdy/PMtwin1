import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Opportunity, PlatformUser } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { createOpportunityCommandService } from '@/services/opportunity-command-service.ts'

const activeUser: PlatformUser = {
  id: 'user-1',
  email: 'owner@pmtwin.test',
  role: 'professional',
  status: 'active',
  profile: { name: 'Owner' },
}

describe('DeleteOpportunity via command service', () => {
  let stack: CommandGatewayTestStack

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      users: [activeUser],
      opportunities: [
        {
          id: 'opp-draft-del',
          title: 'Draft to delete',
          status: 'draft',
          creatorId: 'user-1',
        } as Opportunity,
        {
          id: 'opp-pub-del',
          title: 'Published locked',
          status: 'published',
          visibilityStatus: 'published',
          creatorId: 'user-1',
        } as Opportunity,
      ],
    })
  })

  it('owner can delete draft', () => {
    const service = createOpportunityCommandService({ gateway: stack.gateway })
    const result = service.deleteOpportunity('opp-draft-del')
    assert.equal(result.success, true)
    assert.equal(stack.opportunityRepository.getById('opp-draft-del'), undefined)
  })

  it('published opportunity cannot be hard deleted while active', () => {
    const service = createOpportunityCommandService({ gateway: stack.gateway })
    const result = service.deleteOpportunity('opp-pub-del')
    assert.equal(result.success, false)
    assert.match(result.errors?.[0] ?? '', /Archive or close/i)
    assert.ok(stack.opportunityRepository.getById('opp-pub-del'))
  })

  it('archived opportunity can be soft deleted', () => {
    stack.opportunityRepository.update('opp-pub-del', {
      visibilityStatus: 'archived',
    })
    const service = createOpportunityCommandService({ gateway: stack.gateway })
    const result = service.deleteOpportunity('opp-pub-del')
    assert.equal(result.success, true)
    assert.equal(stack.opportunityRepository.getById('opp-pub-del'), undefined)
  })
})
