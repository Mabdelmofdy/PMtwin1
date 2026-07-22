import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  ALL_BUSINESS_RULES,
  DEFAULT_VALIDATION_CONFIG,
  VAL_CODES,
  assertNoCodeInMessage,
  evaluatePublishValidation,
  humanMessages,
  messageForCode,
  shouldBlockOperation,
  validateOpportunityBusiness,
  validateOpportunityDraft,
  validateOpportunityFields,
} from '../dist/index.js'

describe('field validation', () => {
  it('requires title', () => {
    const result = validateOpportunityFields({}, { operationScope: 'draft' })
    assert.ok(result.issues.some((i) => i.code === VAL_CODES.FIELD_TITLE_REQUIRED))
    assert.ok(result.issues.every((i) => i.source === 'field'))
    assert.ok(result.issues.every((i) => i.code.startsWith('VAL_')))
  })

  it('enforces title max length from config', () => {
    const result = validateOpportunityFields(
      { title: 'x'.repeat(10) },
      { operationScope: 'draft', config: { titleMaxLength: 5 } },
    )
    assert.ok(result.issues.some((i) => i.code === VAL_CODES.FIELD_TITLE_TOO_LONG))
  })
})

describe('date validation', () => {
  it('rejects start date in the past', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', startDate: '2020-01-01' },
      { today: '2026-07-10', operationScope: 'draft' },
      { groups: ['dates'] },
    )
    assert.ok(result.issues.some((i) => i.code === VAL_CODES.DATE_START_IN_PAST))
  })

  it('allows start date equal to today', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', startDate: '2026-07-10' },
      { today: '2026-07-10', operationScope: 'draft' },
      { groups: ['dates'] },
    )
    assert.ok(!result.issues.some((i) => i.code === VAL_CODES.DATE_START_IN_PAST))
  })

  it('allows past start date when editing existing draft', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', startDate: '2020-01-01' },
      {
        today: '2026-07-10',
        isExistingDraft: true,
        operationScope: 'update',
      },
      { groups: ['dates'] },
    )
    assert.ok(!result.issues.some((i) => i.code === VAL_CODES.DATE_START_IN_PAST))
  })

  it('rejects end before start', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', startDate: '2026-08-01', endDate: '2026-07-01' },
      { operationScope: 'draft' },
      { groups: ['dates'] },
    )
    assert.ok(result.issues.some((i) => i.code === VAL_CODES.DATE_END_BEFORE_START))
  })

  it('allows end date equal to start date', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', startDate: '2026-08-01', endDate: '2026-08-01' },
      { today: '2026-07-10', operationScope: 'draft' },
      { groups: ['dates'] },
    )
    assert.ok(!result.issues.some((i) => i.code === VAL_CODES.DATE_END_BEFORE_START))
  })

  it('rejects deadline in the past', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', tenderDeadline: '2026-07-01' },
      { today: '2026-07-10', operationScope: 'draft' },
      { groups: ['dates'] },
    )
    assert.ok(result.issues.some((i) => i.code === VAL_CODES.DATE_DEADLINE_IN_PAST))
  })

  it('allows deadline equal to today', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', tenderDeadline: '2026-07-10' },
      { today: '2026-07-10', operationScope: 'draft' },
      { groups: ['dates'] },
    )
    assert.ok(!result.issues.some((i) => i.code === VAL_CODES.DATE_DEADLINE_IN_PAST))
  })

  it('rejects availability end date in the past', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', availabilityEndDate: '2026-07-01' },
      { today: '2026-07-10', operationScope: 'draft' },
      { groups: ['dates'] },
    )
    assert.ok(result.issues.some((i) => i.code === VAL_CODES.DATE_AVAILABILITY_END_IN_PAST))
  })

  it('allows availability end date equal to today', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', availabilityEndDate: '2026-07-10' },
      { today: '2026-07-10', operationScope: 'draft' },
      { groups: ['dates'] },
    )
    assert.ok(!result.issues.some((i) => i.code === VAL_CODES.DATE_AVAILABILITY_END_IN_PAST))
  })

  it('allows deadline and availability end equal to start', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        startDate: '2026-08-01',
        tenderDeadline: '2026-08-01',
        availabilityEndDate: '2026-08-01',
      },
      { today: '2026-07-10', operationScope: 'draft' },
      { groups: ['dates'] },
    )
    assert.ok(!result.issues.some((i) => i.code === VAL_CODES.DATE_DEADLINE_BEFORE_START))
    assert.ok(
      !result.issues.some((i) => i.code === VAL_CODES.DATE_AVAILABILITY_END_BEFORE_START),
    )
  })

  it('rejects deadline and availability end before start', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        startDate: '2026-08-10',
        tenderDeadline: '2026-08-01',
        availabilityEndDate: '2026-08-05',
      },
      { today: '2026-07-10', operationScope: 'draft' },
      { groups: ['dates'] },
    )
    assert.ok(result.issues.some((i) => i.code === VAL_CODES.DATE_DEADLINE_BEFORE_START))
    assert.ok(
      result.issues.some((i) => i.code === VAL_CODES.DATE_AVAILABILITY_END_BEFORE_START),
    )
  })

  it('warns when start is within configured hours', () => {
    const now = new Date('2026-07-10T10:00:00.000Z')
    const start = new Date(now.getTime() + 12 * 60 * 60 * 1000)
    const result = validateOpportunityBusiness(
      { title: 'T', startDate: start.toISOString() },
      { now, operationScope: 'draft', config: { warningStartWithinHours: 48 } },
      { groups: ['dates'] },
    )
    assert.ok(result.issues.some((i) => i.code === VAL_CODES.DATE_START_SOON))
    assert.equal(result.issues.find((i) => i.code === VAL_CODES.DATE_START_SOON)?.severity, 'warning')
  })
})

describe('budget and exchange', () => {
  it('requires cash budget on publish only', () => {
    const draft = validateOpportunityBusiness(
      { title: 'T', exchangeMode: 'cash' },
      { operationScope: 'draft' },
      { scopes: ['draft'], groups: ['budget'] },
    )
    assert.ok(!draft.issues.some((i) => i.code === VAL_CODES.BUDGET_CASH_REQUIRED))

    const result = validateOpportunityBusiness(
      { title: 'T', exchangeMode: 'cash' },
      { operationScope: 'publish' },
      { scopes: ['publish'], groups: ['budget'] },
    )
    assert.ok(result.issues.some((i) => i.code === VAL_CODES.BUDGET_CASH_REQUIRED))
  })

  it('accepts a cash amount from the commercial structure', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        exchangeMode: 'cash',
        exchangeData: {
          commercialStructure: {
            components: [
              {
                type: 'cash',
                enabled: true,
                budgetType: 'fixed',
                fixedAmount: 125_000,
              },
            ],
          },
        },
      },
      { operationScope: 'publish' },
      { scopes: ['publish'], groups: ['budget'] },
    )

    assert.ok(!result.issues.some((i) => i.code === VAL_CODES.BUDGET_CASH_REQUIRED))
  })

  it('accepts cash commercial structure with range notes on publish', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        exchangeMode: 'cash',
        collaborationAttributes: {
          commercialStructure: {
            components: [
              {
                type: 'cash',
                enabled: true,
                budgetType: 'range',
                notes: 'Budget range 150000 – 400000 SAR',
                paymentTerms: 'Milestone-Based',
                paymentSchedule: [{ title: 'Kickoff', percentage: 20, amount: 55000 }],
              },
            ],
          },
        },
      },
      { operationScope: 'publish' },
      { scopes: ['publish'], groups: ['budget'] },
    )

    assert.ok(!result.issues.some((i) => i.code === VAL_CODES.BUDGET_CASH_REQUIRED))
  })

  it('uses config minimumBudget', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', exchangeMode: 'cash', budget: 50 },
      { operationScope: 'draft', config: { minimumBudget: 100 } },
      { groups: ['budget'] },
    )
    assert.ok(result.issues.some((i) => i.code === VAL_CODES.BUDGET_BELOW_MINIMUM))
  })

  it('requires profit sharing fields on publish', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', exchangeMode: 'profit_sharing', exchangeData: {} },
      { operationScope: 'publish' },
      { scopes: ['publish'], groups: ['budget'] },
    )
    assert.ok(
      result.issues.some((i) => i.code === VAL_CODES.BUDGET_PROFIT_FIELDS_REQUIRED),
    )
  })

  it('requires equity fields on publish', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', exchangeMode: 'equity', exchangeData: { equityPercentage: 10 } },
      { operationScope: 'publish' },
      { scopes: ['publish'], groups: ['budget'] },
    )
    assert.ok(
      result.issues.some((i) => i.code === VAL_CODES.BUDGET_EQUITY_FIELDS_REQUIRED),
    )
  })

  it('validates hybrid components when touched', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        exchangeMode: 'hybrid',
        exchangeData: { cashComponent: 100 },
      },
      { operationScope: 'draft' },
      { groups: ['budget'] },
    )
    assert.ok(
      result.issues.some((i) => i.code === VAL_CODES.BUDGET_HYBRID_COMPONENT_REQUIRED),
    )
  })
})

describe('skills', () => {
  it('rejects duplicate skills', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        intent: 'need',
        structuredSkills: [
          { name: 'PMP', role: 'required', years: 5 },
          { name: 'PMP', role: 'required', years: 3 },
        ],
      },
      { operationScope: 'draft' },
      { groups: ['skills'] },
    )
    assert.ok(result.issues.some((i) => i.code === VAL_CODES.SKILL_DUPLICATE))
  })

  it('rejects impossible expert + 1 year from config', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        structuredSkills: [
          { name: 'PMP', role: 'required', level: 'Expert', years: 1 },
        ],
      },
      { operationScope: 'draft' },
      { groups: ['skills'] },
    )
    assert.ok(
      result.issues.some((i) => i.code === VAL_CODES.SKILL_LEVEL_YEARS_IMPOSSIBLE),
    )
  })

  it('accepts expert with 5 years (Creation 3.0 UI levels)', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        structuredSkills: [
          { name: 'Revit', role: 'required', level: 'expert', years: 5 },
          { name: 'BIM', role: 'required', level: 'intermediate', years: 3 },
        ],
      },
      { operationScope: 'draft' },
      { groups: ['skills'] },
    )
    assert.equal(
      result.issues.some((i) => i.code === VAL_CODES.SKILL_LEVEL_YEARS_IMPOSSIBLE),
      false,
    )
  })

  it('requires provided skill for offer on publish', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        intent: 'offer',
        structuredSkills: [{ name: 'PMP', role: 'required' }],
      },
      { operationScope: 'publish' },
      { scopes: ['publish'], groups: ['skills'] },
    )
    assert.ok(result.issues.some((i) => i.code === VAL_CODES.SKILL_PROVIDED_MISSING))
  })

  it('accepts scope.requiredSkills as StructuredSkill objects without crashing', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        intent: 'need',
        scope: {
          requiredSkills: [
            {
              name: 'BIM',
              level: 'intermediate',
              certificationRequired: false,
              mandatory: true,
            },
          ],
        },
      },
      { operationScope: 'draft' },
      { groups: ['skills'] },
    )
    assert.equal(result.valid, true)
    assert.ok(!result.issues.some((i) => i.code === VAL_CODES.SKILL_DUPLICATE))
  })

  it('accepts legacy offer skills stored in scope.requiredSkills on publish', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        intent: 'offer',
        scope: { requiredSkills: ['BIM', 'Revit'] },
      },
      { operationScope: 'publish' },
      { scopes: ['publish'], groups: ['skills'] },
    )
    assert.equal(
      result.issues.some((i) => i.code === VAL_CODES.SKILL_PROVIDED_MISSING),
      false,
    )
  })
})

describe('work packages', () => {
  it('requires package fields', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        workPackages: [{ title: '', description: '', skills: [], deadline: '' }],
      },
      { operationScope: 'draft' },
      { groups: ['workPackages'] },
    )
    assert.ok(result.issues.some((i) => i.code === VAL_CODES.PACKAGE_TITLE_REQUIRED))
    assert.ok(
      result.issues.some((i) => i.code === VAL_CODES.PACKAGE_DESCRIPTION_REQUIRED),
    )
  })

  it('accepts requiredSkills as package skills (Creation 3.0)', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        workPackages: [
          {
            title: 'BIM federation',
            description: 'Model federation',
            requiredSkills: [{ name: 'BIM', role: 'required' }],
            deadline: '2026-09-01',
          },
        ],
      },
      { operationScope: 'draft' },
      { groups: ['workPackages'] },
    )
    assert.equal(
      result.issues.some((i) => i.code === VAL_CODES.PACKAGE_SKILL_REQUIRED),
      false,
    )
  })

  it('rejects package deadline after project end', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        endDate: '2026-08-01',
        workPackages: [
          {
            title: 'Pkg',
            description: 'Desc',
            skills: ['PMP'],
            deadline: '2026-09-01',
          },
        ],
      },
      { operationScope: 'draft' },
      { groups: ['workPackages'] },
    )
    assert.ok(
      result.issues.some((i) => i.code === VAL_CODES.PACKAGE_DEADLINE_AFTER_PROJECT),
    )
  })
})

describe('commercial', () => {
  it('uses config retention max', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', exchangeData: { retention: 25 } },
      { operationScope: 'draft', config: { maxRetentionPercent: 20, retentionMax: 20 } },
      { groups: ['commercial'] },
    )
    assert.ok(
      result.issues.some((i) => i.code === VAL_CODES.COMMERCIAL_RETENTION_RANGE),
    )
    assert.equal(
      result.issues.find((i) => i.code === VAL_CODES.COMMERCIAL_RETENTION_RANGE)?.source,
      'commercial',
    )
  })
})

describe('capacity', () => {
  it('rejects negative capacity', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', capacity: { required: -1 } },
      { operationScope: 'draft' },
      { groups: ['capacity'] },
    )
    assert.ok(result.issues.some((i) => i.code === VAL_CODES.CAPACITY_NEGATIVE))
  })
})

describe('documents and scope', () => {
  it('publish-only CR blocker does not block draft save', () => {
    const draft = validateOpportunityBusiness(
      {
        title: 'T',
        complianceRequirements: ['CR Required'],
        attachments: [],
      },
      { operationScope: 'draft' },
      { scopes: ['draft'], groups: ['documents'] },
    )
    assert.equal(draft.issues.length, 0)
    assert.equal(shouldBlockOperation(draft.issues, 'draft'), false)

    const publish = validateOpportunityBusiness(
      {
        title: 'T',
        complianceRequirements: ['CR Required'],
        attachments: [],
      },
      { operationScope: 'publish' },
      { scopes: ['publish'], groups: ['documents'] },
    )
    assert.ok(publish.issues.some((i) => i.code === VAL_CODES.DOC_CR_REQUIRED))
    assert.equal(shouldBlockOperation(publish.issues, 'publish'), true)
    assert.equal(shouldBlockOperation(publish.issues, 'draft'), false)
  })
})

describe('location', () => {
  it('rejects inconsistent country/city', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', country: 'Saudi Arabia', city: 'Cairo' },
      { operationScope: 'draft' },
      { groups: ['location'] },
    )
    assert.ok(result.issues.some((i) => i.code === VAL_CODES.LOCATION_INCONSISTENT))
  })
})

describe('duplicates', () => {
  it('warns on similar draft', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'Build Tower Project',
        ownerId: 'u1',
        mainCollaborationModel: 'cash_subcontracting',
        subModelType: 'task_based',
        location: 'Riyadh',
      },
      {
        operationScope: 'draft',
        existingDrafts: [
          {
            id: 'other',
            title: 'Build Tower Project',
            ownerId: 'u1',
            mainCollaborationModel: 'cash_subcontracting',
            subModelType: 'task_based',
            location: 'Riyadh',
            status: 'draft',
          },
        ],
      },
      { groups: ['duplicates'] },
    )
    const issue = result.issues.find((i) => i.code === VAL_CODES.DUP_SIMILAR_DRAFT)
    assert.ok(issue)
    assert.equal(issue.severity, 'warning')
    assert.equal(shouldBlockOperation([issue], 'draft'), false)
  })
})

describe('need vs offer', () => {
  it('rejects available capacity on need', () => {
    const result = validateOpportunityBusiness(
      { title: 'T', intent: 'need', capacity: { available: 5 } },
      { operationScope: 'draft' },
      { groups: ['needOffer'] },
    )
    assert.ok(
      result.issues.some((i) => i.code === VAL_CODES.INTENT_NEED_HAS_AVAILABLE_CAPACITY),
    )
  })
})

describe('targeted groups', () => {
  it('runs only requested groups', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        exchangeMode: 'cash',
        startDate: '2020-01-01',
      },
      { today: '2026-07-10', operationScope: 'draft' },
      { groups: ['budget'] },
    )
    assert.ok(result.issues.every((i) => i.group === 'budget'))
    assert.ok(!result.issues.some((i) => i.group === 'dates'))
  })

  it('exposes all business rule groups', () => {
    const groups = new Set(ALL_BUSINESS_RULES.map((r) => r.group))
    assert.ok(groups.has('dates'))
    assert.ok(groups.has('budget'))
    assert.ok(groups.has('skills'))
  })
})

describe('messages never expose codes', () => {
  it('catalog messages do not include codes', () => {
    for (const code of Object.values(VAL_CODES)) {
      const msg = messageForCode(code)
      assert.ok(assertNoCodeInMessage(msg, code), code)
    }
  })

  it('humanMessages omit codes', () => {
    const result = validateOpportunityFields({}, { operationScope: 'draft' })
    for (const msg of humanMessages(result.issues)) {
      assert.ok(!msg.includes('VAL_'))
    }
  })
})

describe('draft aggregate', () => {
  it('allows draft with publish-only document gap', () => {
    const result = validateOpportunityDraft(
      {
        title: 'Valid draft',
        complianceRequirements: ['Insurance Required'],
      },
      {},
    )
    assert.equal(shouldBlockOperation(result.issues, 'draft'), false)
  })
})

describe('publish validation', () => {
  it('blocks when readiness snapshot says not publish ready', () => {
    const field = validateOpportunityFields(
      { title: 'Ready enough' },
      { operationScope: 'publish' },
      { scopes: ['publish'] },
    )
    const business = validateOpportunityBusiness(
      { title: 'Ready enough' },
      { operationScope: 'publish' },
      { scopes: ['publish'] },
    )
    const result = evaluatePublishValidation({
      fieldResult: field,
      businessResult: business,
      publishReadiness: {
        allowed: false,
        profileReady: true,
        opportunityPublishReady: false,
        opportunityScore: 40,
      },
      vettingStatus: { approved: true },
    })
    assert.equal(result.status, 'blocked')
    assert.ok(
      result.blockingIssues.some(
        (i) => i.code === VAL_CODES.PUBLISH_READINESS_BELOW_THRESHOLD,
      ),
    )
    assert.ok(result.recommendations.every((r) => !r.includes('VAL_')))
  })

  it('allows when readiness, vetting, and validation pass', () => {
    const field = validateOpportunityFields(
      { title: 'Ready' },
      { operationScope: 'publish' },
      { scopes: ['publish'] },
    )
    const business = validateOpportunityBusiness(
      {
        title: 'Ready',
        exchangeMode: 'cash',
        budget: DEFAULT_VALIDATION_CONFIG.minimumBudget + 10,
        startDate: '2026-08-01',
        endDate: '2026-09-01',
      },
      { today: '2026-07-10', operationScope: 'publish' },
      { scopes: ['publish'] },
    )
    const result = evaluatePublishValidation({
      fieldResult: field,
      businessResult: business,
      publishReadiness: {
        allowed: true,
        profileReady: true,
        opportunityPublishReady: true,
        opportunityScore: 90,
      },
      vettingStatus: { approved: true },
    })
    assert.equal(result.status, 'allowed')
    assert.equal(result.blockingIssues.length, 0)
  })

  it('blocks when vetting not approved without recalculating readiness', () => {
    const result = evaluatePublishValidation({
      fieldResult: { valid: true, issues: [] },
      businessResult: { valid: true, issues: [] },
      publishReadiness: {
        allowed: true,
        profileReady: true,
        opportunityPublishReady: true,
        opportunityScore: 95,
      },
      vettingStatus: { approved: false },
    })
    assert.equal(result.status, 'blocked')
    assert.ok(
      result.blockingIssues.some(
        (i) => i.code === VAL_CODES.PUBLISH_VETTING_NOT_APPROVED,
      ),
    )
  })
})

describe('issue contract', () => {
  it('every issue has code and source', () => {
    const result = validateOpportunityBusiness(
      {
        title: 'T',
        exchangeMode: 'cash',
        startDate: '2020-01-01',
        country: 'Saudi',
        city: 'Cairo',
      },
      { today: '2026-07-10', operationScope: 'draft' },
    )
    assert.ok(result.issues.length > 0)
    for (const issue of result.issues) {
      assert.ok(issue.code)
      assert.ok(issue.source)
      assert.ok(issue.severity)
      assert.ok(issue.scope.length > 0)
      assert.ok(issue.message)
      assert.ok(!issue.message.includes(issue.code))
    }
  })
})
