import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { deriveMatchingTopology } from '@pm-twin/collaboration-models'
import { buildOpportunityCollaborationPatch } from '@/domain/collaboration/opportunity-collaboration.ts'

const sourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  'opportunities-pages.tsx',
)
const source = readFileSync(sourcePath, 'utf8')

function wizardSource(): string {
  const start = source.indexOf('function OpportunityWizardPage')
  assert.ok(start >= 0)
  return source.slice(start)
}

describe('Opportunity wizard — system-derived matching topology', () => {
  it('does not render selectable match type options (one_way / two_way / consortium / circular)', () => {
    const wizard = wizardSource()

    // Value exchange is selectable; matching topologies must not be.
    assert.match(wizard, /ValueExchangeModesPanel/)
    assert.match(wizard, /selectable/)

    // No SelectItem / radio / toggle bound to topology keys as user choices.
    assert.doesNotMatch(
      wizard,
      /SelectItem[^>]*>\s*(One Way|Two Way|Consortium Matching|Circular)/i,
    )
    assert.doesNotMatch(
      wizard,
      /onValueChange=\{[^}]*matchType|setMatchType|updateDraft\('matchType'/,
    )
    assert.doesNotMatch(wizard, /label=["']Match [Tt]ype["']/)
    assert.doesNotMatch(wizard, /id=["']opp-match-type["']/)

    // Four topology keys must not appear as selectable option values in the wizard.
    for (const topology of ['one_way', 'two_way', 'circular'] as const) {
      assert.doesNotMatch(
        wizard,
        new RegExp(`SelectItem[^>]*value=["']${topology}["']`),
      )
    }
  })

  it('shows derived topology as read-only Recommended Matching Topology', () => {
    const wizard = wizardSource()
    assert.match(wizard, /Recommended Matching Topology/)
    assert.match(wizard, /System will match this as/)
    assert.match(wizard, /System-derived/)
    assert.match(wizard, /Based on your collaboration model and exchange mode/i)
    assert.match(wizard, /data-testid=["']recommended-matching-topology["']/)
    assert.match(wizard, /deriveMatchingTopology\(/)
    assert.match(wizard, /systemDerived/)
  })

  it('command payload builder does not forward manual matchType / preferredMatchingTopology', () => {
    const wizard = wizardSource()
    const payloadFnStart = source.indexOf('function buildCollaborationCommandPayload')
    const payloadFnEnd = source.indexOf('function resolveCompletedSteps')
    assert.ok(payloadFnStart >= 0 && payloadFnEnd > payloadFnStart)
    const payloadFn = source.slice(payloadFnStart, payloadFnEnd)

    assert.doesNotMatch(payloadFn, /preferredMatchingTopology:/)
    assert.doesNotMatch(payloadFn, /matchType:/)
    assert.match(payloadFn, /mainCollaborationModel:/)
    assert.match(payloadFn, /subModelType:/)
    assert.match(payloadFn, /exchangeMode:/)
  })
})

describe('Opportunity wizard topology derivation cases', () => {
  it('cash subcontracting + task based + cash → one_way', () => {
    assert.equal(
      deriveMatchingTopology({
        mainCollaborationModel: 'cash_subcontracting',
        modelType: 'project_based',
        subModelType: 'task_based',
        exchangeMode: 'cash',
      }).topology,
      'one_way',
    )
  })

  it('service exchange + barter → two_way', () => {
    assert.equal(
      deriveMatchingTopology({
        mainCollaborationModel: 'service_exchange',
        modelType: 'strategic_partnership',
        subModelType: 'strategic_alliance',
        exchangeMode: 'barter',
      }).topology,
      'two_way',
    )
  })

  it('joint venture (SPV / project JV) → consortium', () => {
    for (const sub of ['project_jv', 'spv', 'consortium'] as const) {
      assert.equal(
        deriveMatchingTopology({
          mainCollaborationModel: 'joint_venture',
          subModelType: sub,
        }).topology,
        'consortium',
        sub,
      )
    }
  })

  it('resource sharing + barter / circular chain → circular', () => {
    assert.equal(
      deriveMatchingTopology({
        mainCollaborationModel: 'resource_sharing',
        subModelType: 'resource_sharing',
        exchangeMode: 'barter',
        collaborationAttributes: { transactionType: 'barter' },
      }).topology,
      'circular',
    )
  })

  it('submitted patch ignores manual preferredMatchingTopology / matchType override', () => {
    const patch = buildOpportunityCollaborationPatch({
      mainCollaborationModel: 'cash_subcontracting',
      modelType: 'project_based',
      subModelType: 'task_based',
      exchangeMode: 'cash',
      preferredMatchingTopology: 'circular',
    })
    assert.equal(patch.preferredMatchingTopology, 'one_way')
    assert.notEqual(patch.preferredMatchingTopology, 'circular')
    assert.equal(patch.subModelType, 'task_based')
  })

  it('subModelType cannot equal one_way / two_way / circular', () => {
    for (const topology of ['one_way', 'two_way', 'circular'] as const) {
      const patch = buildOpportunityCollaborationPatch({
        mainCollaborationModel: 'cash_subcontracting',
        modelType: 'project_based',
        subModelType: topology,
        exchangeMode: 'cash',
      })
      assert.notEqual(patch.subModelType, topology)
      assert.ok(patch.subModelType)
      assert.ok(patch.preferredMatchingTopology)
    }
  })
})
