import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

describe('@pm-twin/workflows package exports', () => {
  it('resolves core orchestrator APIs from the built package entry', async () => {
    const workflows = await import('@pm-twin/workflows')
    assert.equal(typeof workflows.getWorkflowNextActions, 'function')
    assert.equal(typeof workflows.findWorkflowAction, 'function')
    assert.equal(typeof workflows.isWorkflowActionAvailable, 'function')
    assert.equal(typeof workflows.validateWorkflowTransition, 'function')
    assert.equal(typeof workflows.buildWorkflowActionHook, 'function')
    assert.equal(typeof workflows.buildWorkflowActionHooks, 'function')
    assert.ok(workflows.WORKFLOW_REGISTRY)
    assert.ok(workflows.WORKFLOW_ACTION_REGISTRY)
  })

  it('exposes hiring and marketplace workflow definitions', async () => {
    const { MARKETPLACE_WORKFLOW, HIRING_WORKFLOW } = await import('@pm-twin/workflows')
    assert.equal(MARKETPLACE_WORKFLOW.key, 'marketplace')
    assert.equal(HIRING_WORKFLOW.key, 'hiring')
    assert.ok(MARKETPLACE_WORKFLOW.allowedCommands.includes('PublishOpportunity'))
    assert.ok(HIRING_WORKFLOW.allowedCommands.includes('StartNegotiationFromApplication'))
  })
})
