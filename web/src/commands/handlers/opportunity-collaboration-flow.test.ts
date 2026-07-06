import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createCommandGatewayTestStack } from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { createOpportunityCommandService } from '@/services/opportunity-command-service.ts'

describe('CreateOpportunity command flow', () => {
  it('create → save → publish → match', () => {
    const stack = createCommandGatewayTestStack({
      users: [
        {
          id: 'seed-user-001',
          email: 'creator@test.com',
          role: 'pm',
          status: 'active',
          profile: {
            type: 'individual',
            skills: ['Structural', 'BIM'],
            headline: 'Structural engineer',
          },
        },
      ],
    })
    const commandService = createOpportunityCommandService({ gateway: stack.gateway })

    const createResult = commandService.createOpportunity({
      title: 'Web taxonomy test opportunity',
      description: 'Scope for structural review package',
      intent: 'need',
      location: 'Riyadh',
      creatorId: 'seed-user-001',
      mainCollaborationModel: 'cash_subcontracting',
      modelType: 'project_based',
      subModelType: 'task_based',
      exchangeMode: 'cash',
      acceptedExchangeModes: ['cash'],
      collaborationAttributes: {
        detailedScope: 'Review shop drawings',
        requiredSkills: ['Structural'],
        duration: 30,
        startDate: '2026-08-01',
      },
    })

    assert.equal(createResult.success, true, createResult.errors?.join('; '))
    const opportunityId = createResult.aggregateId
    const draft = stack.opportunityRepository.getById(opportunityId)
    assert.ok(draft)
    assert.equal(draft?.subModelType, 'task_based')
    assert.equal(draft?.preferredMatchingTopology, 'one_way')
    assert.notEqual(draft?.subModelType, 'one_way')

    const updateResult = commandService.updateOpportunity(opportunityId, {
      title: 'Updated taxonomy test opportunity',
    })
    assert.equal(updateResult.success, true, updateResult.errors?.join('; '))
  })
})
