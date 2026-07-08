import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  FIELD_GROUP_IDS,
  KNOWLEDGE_STABILITY_VALUES,
  RISK_LEVEL_VALUES,
  SUB_MODEL_TYPE_KEYS,
  deriveMatchingTopology,
  getAiMetadata,
  getAnalyticsMetadata,
  getCapabilityDependencies,
  getCollaborationModel,
  getComplianceMetadata,
  getConfidentialityMetadata,
  getDocumentsMetadata,
  getDynamicFields,
  getEducationalContent,
  getKnowledgeMetadata,
  getLifecycleMetadata,
  getMainCollaborationModel,
  getMatchingMetrics,
  getReadinessDefinition,
  getRiskProfile,
  getSubModel,
  getWorkflowMetadata,
  listSubModels,
  resolveSubModelFormFields,
  validateCollaborationTaxonomy,
} from '../dist/index.js'

describe('knowledge registry completeness', () => {
  it('attaches knowledge to all 13 sub-models', () => {
    assert.equal(listSubModels().length, 13)
    for (const key of SUB_MODEL_TYPE_KEYS) {
      const sub = getSubModel(key)
      assert.ok(sub, `missing sub ${key}`)
      assert.ok(sub.knowledge, `${key} missing knowledge`)
    }
  })

  it('requires all knowledge sections on every sub-model', () => {
    const sections = [
      'metadata',
      'business',
      'usage',
      'dynamicForm',
      'readiness',
      'matching',
      'workflow',
      'dependencies',
      'lifecycle',
      'documents',
      'confidentiality',
      'riskProfile',
      'compliance',
      'commercial',
      'education',
      'ai',
      'analytics',
    ]
    for (const key of SUB_MODEL_TYPE_KEYS) {
      const knowledge = getSubModel(key).knowledge
      for (const section of sections) {
        assert.ok(knowledge[section], `${key} missing ${section}`)
      }
    }
  })
})

describe('knowledge versioning metadata', () => {
  it('validates schemaVersion, knowledgeVersion, lastUpdated, deprecated, stability', () => {
    for (const key of SUB_MODEL_TYPE_KEYS) {
      const meta = getKnowledgeMetadata(key)
      assert.ok(meta, key)
      assert.ok(typeof meta.schemaVersion === 'string' && meta.schemaVersion.length > 0, key)
      assert.ok(meta.knowledgeVersion >= 1, key)
      assert.ok(typeof meta.lastUpdated === 'string' && meta.lastUpdated.length > 0, key)
      assert.equal(typeof meta.deprecated, 'boolean', key)
      assert.ok(KNOWLEDGE_STABILITY_VALUES.includes(meta.stability), `${key} invalid stability`)
      if (meta.deprecated) {
        assert.equal(meta.stability, 'deprecated', key)
      }
    }
  })
})

describe('dynamic form fields', () => {
  it('orders fields by displayOrder with canonical groups', () => {
    for (const key of SUB_MODEL_TYPE_KEYS) {
      const fields = getDynamicFields(key)
      assert.ok(fields && fields.length > 0, key)
      const orders = fields.map((f) => f.displayOrder)
      assert.deepEqual(orders, [...orders].sort((a, b) => a - b), key)
      assert.equal(new Set(orders).size, orders.length, `${key} duplicate displayOrder`)
      for (const field of fields) {
        assert.ok(FIELD_GROUP_IDS.includes(field.group), `${key}.${field.id} bad group`)
        assert.ok(field.id && field.label && field.description, `${key}.${field.id}`)
        assert.equal(typeof field.required, 'boolean')
      }
    }
  })
})

describe('readiness definitions', () => {
  it('requires dual weights totaling 100', () => {
    for (const key of SUB_MODEL_TYPE_KEYS) {
      const readiness = getReadinessDefinition(key)
      assert.ok(readiness, key)
      const fieldIds = new Set(getDynamicFields(key).map((f) => f.id))
      const sum = readiness.fieldWeights.reduce((acc, w) => acc + w.weight, 0)
      assert.equal(sum, 100, `${key} weights sum ${sum}`)
      for (const weight of readiness.fieldWeights) {
        assert.ok(typeof weight.requiredWeight === 'number')
        assert.ok(typeof weight.recommendedWeight === 'number')
        assert.ok(weight.requiredWeight >= 0)
        assert.ok(weight.recommendedWeight >= 0)
      }
      for (const id of readiness.requiredFields) {
        assert.ok(fieldIds.has(id), `${key} required ${id} not in dynamic fields`)
      }
      const allowed = new Set([...readiness.requiredFields, ...readiness.optionalFields])
      for (const id of readiness.minimumPublishFields) {
        assert.ok(allowed.has(id), `${key} min-publish ${id}`)
      }
    }
  })
})

describe('matching / education / workflow / analytics / ai helpers', () => {
  it('returns content for every sub-model', () => {
    for (const key of SUB_MODEL_TYPE_KEYS) {
      const metrics = getMatchingMetrics(key)
      assert.ok(metrics && metrics.length > 0, key)
      assert.equal(new Set(metrics.map((m) => m.id)).size, metrics.length, key)

      const education = getEducationalContent(key)
      assert.ok(education?.whatIsIt && education.whyUseIt, key)
      assert.ok(education.faq.length >= 1, key)

      const workflow = getWorkflowMetadata(key)
      assert.equal(typeof workflow.supportedWorkflow, 'boolean', key)

      const analytics = getAnalyticsMetadata(key)
      assert.ok(analytics.dashboardWidgets.length > 0, key)
      assert.equal(
        new Set(analytics.dashboardWidgets.map((w) => w.id)).size,
        analytics.dashboardWidgets.length,
        key,
      )

      const ai = getAiMetadata(key)
      assert.ok(ai.decisionTree?.id && ai.decisionTree.prompt, key)
      assert.ok(ai.intentKeywords.length > 0, key)
    }
  })
})

describe('capability / lifecycle / documents / confidentiality / risk / compliance', () => {
  it('is present and well-formed for all sub-models', () => {
    for (const key of SUB_MODEL_TYPE_KEYS) {
      const deps = getCapabilityDependencies(key)
      assert.equal(typeof deps.requiresMarketplace, 'boolean', key)

      const lifecycle = getLifecycleMetadata(key)
      assert.ok(lifecycle.typicalStages.length > 0, key)
      assert.ok(lifecycle.terminalStages.length > 0, key)

      const docs = getDocumentsMetadata(key)
      assert.ok(Array.isArray(docs.required) && Array.isArray(docs.optional), key)

      const conf = getConfidentialityMetadata(key)
      assert.ok(Array.isArray(conf.marketplaceVisibleFields), key)
      assert.ok(Array.isArray(conf.privateFields), key)

      const risk = getRiskProfile(key)
      assert.ok(RISK_LEVEL_VALUES.includes(risk.defaultRiskLevel), key)
      assert.ok(risk.riskFactors.length > 0, key)

      const compliance = getComplianceMetadata(key)
      assert.equal(typeof compliance.requiresLegalReview, 'boolean', key)
    }
  })
})

describe('helper API aliases and backward compatibility', () => {
  it('getCollaborationModel aliases getMainCollaborationModel', () => {
    const a = getCollaborationModel('cash_subcontracting')
    const b = getMainCollaborationModel('cash_subcontracting')
    assert.equal(a, b)
    assert.ok(a)
  })

  it('keeps legacy form resolver attribute keys for task_based', () => {
    const fields = resolveSubModelFormFields('task_based')
    assert.ok(fields.length > 0)
    assert.ok(fields.some((f) => f.key === 'detailedScope'))
    assert.ok(fields.every((f) => typeof f.type === 'string'))
  })

  it('keeps taxonomy validation and topology derivation working', () => {
    const valid = validateCollaborationTaxonomy({
      mainCollaborationModel: 'cash_subcontracting',
      modelType: 'project_based',
      subModelType: 'task_based',
      exchangeMode: 'cash',
    })
    assert.equal(valid.valid, true, valid.errors.join('; '))
    assert.equal(
      deriveMatchingTopology({
        mainCollaborationModel: 'cash_subcontracting',
        subModelType: 'task_based',
      }).topology,
      'one_way',
    )
  })
})
