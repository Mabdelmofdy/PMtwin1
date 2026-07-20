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

  it('rejects create when subModelType is a matching topology (one_way / two_way / circular)', () => {
    const stack = createCommandGatewayTestStack({
      users: [
        {
          id: 'seed-user-001',
          email: 'creator@test.com',
          role: 'pm',
          status: 'active',
          profile: {
            type: 'individual',
            skills: ['Structural'],
            headline: 'Structural engineer',
          },
        },
      ],
    })
    const commandService = createOpportunityCommandService({ gateway: stack.gateway })

    for (const topology of ['one_way', 'two_way', 'circular'] as const) {
      const result = commandService.createOpportunity({
        title: `Illegal topology sub-model ${topology}`,
        intent: 'need',
        creatorId: 'seed-user-001',
        mainCollaborationModel: 'cash_subcontracting',
        modelType: 'project_based',
        subModelType: topology,
        exchangeMode: 'cash',
        acceptedExchangeModes: ['cash'],
        collaborationAttributes: {
          detailedScope: 'Scope',
          requiredSkills: ['Structural'],
          duration: 30,
          startDate: '2026-08-01',
        },
      })
      assert.equal(result.success, false, topology)
      assert.ok(
        result.errors?.some((e) => e.includes('subModelType')),
        `${topology}: ${result.errors?.join('; ')}`,
      )
    }
  })

  it('does not persist a manual preferredMatchingTopology from the payload', () => {
    const stack = createCommandGatewayTestStack({
      users: [
        {
          id: 'seed-user-001',
          email: 'creator@test.com',
          role: 'pm',
          status: 'active',
          profile: {
            type: 'individual',
            skills: ['Structural'],
            headline: 'Structural engineer',
          },
        },
      ],
    })
    const commandService = createOpportunityCommandService({ gateway: stack.gateway })

    const createResult = commandService.createOpportunity({
      title: 'Override topology ignored',
      description: 'Service barter should derive two_way',
      intent: 'need',
      location: 'Riyadh',
      creatorId: 'seed-user-001',
      mainCollaborationModel: 'service_exchange',
      modelType: 'strategic_partnership',
      subModelType: 'strategic_alliance',
      exchangeMode: 'barter',
      acceptedExchangeModes: ['barter'],
      preferredMatchingTopology: 'circular',
      collaborationAttributes: {
        scopeOfCollaboration: 'Skill swap package',
        duration: 90,
        financialTerms: 'In-kind skill exchange',
      },
    })

    assert.equal(createResult.success, true, createResult.errors?.join('; '))
    const stored = stack.opportunityRepository.getById(createResult.aggregateId)
    assert.equal(stored?.preferredMatchingTopology, 'two_way')
    assert.notEqual(stored?.preferredMatchingTopology, 'circular')
    assert.notEqual(stored?.subModelType, 'two_way')
  })

  it('rejects draft create when collaboration taxonomy is set but required attributes are incomplete', () => {
    const stack = createCommandGatewayTestStack({
      users: [
        {
          id: 'seed-user-001',
          email: 'creator@test.com',
          role: 'pm',
          status: 'active',
          profile: {
            type: 'individual',
            skills: ['Structural'],
            headline: 'Structural engineer',
          },
        },
      ],
    })
    const commandService = createOpportunityCommandService({ gateway: stack.gateway })

    const createResult = commandService.createOpportunity({
      title: 'Incomplete draft with taxonomy',
      description: 'Attributes filled later in the wizard',
      intent: 'need',
      creatorId: 'seed-user-001',
      mainCollaborationModel: 'cash_subcontracting',
      modelType: 'project_based',
      subModelType: 'task_based',
      exchangeMode: 'cash',
      acceptedExchangeModes: ['cash'],
      collaborationAttributes: {
        detailedScope: 'Shop drawing review',
        startDate: '2026-08-01',
        // requiredSkills + duration intentionally omitted
      },
    })

    assert.equal(createResult.success, false)
    assert.ok(
      createResult.errors?.some((e) => e.includes('requiredSkills'))
        || createResult.errors?.some((e) => e.includes('duration')),
      createResult.errors?.join('; '),
    )
  })
})
