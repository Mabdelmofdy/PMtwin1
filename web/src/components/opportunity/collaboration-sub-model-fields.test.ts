import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getSubModel,
  SUB_MODEL_TYPE_KEYS,
  resolveSubModelFormFields,
} from '@pm-twin/collaboration-models'
import { listRenderedSubModelFieldKeys } from '@/components/opportunity/collaboration-sub-model-fields.tsx'

describe('CollaborationSubModelFields registry wiring', () => {
  for (const subModelType of SUB_MODEL_TYPE_KEYS) {
    it(`renders required fields for ${subModelType}`, () => {
      const sub = getSubModel(subModelType)
      assert.ok(sub)

      const fields = resolveSubModelFormFields(subModelType)
      const renderedKeys = listRenderedSubModelFieldKeys(subModelType)
      const required = sub.requiredFields

      assert.ok(fields.length > 0, `expected fields for ${subModelType}`)
      for (const key of required) {
        assert.ok(
          renderedKeys.includes(key),
          `missing required field "${key}" for ${subModelType}`,
        )
        const field = fields.find((item) => item.key === key)
        assert.equal(field?.emphasis, 'required')
      }
    })
  }

  it('includes recommended fields after required ones', () => {
    const fields = resolveSubModelFormFields('task_based')
    const requiredIndex = fields.findIndex((field) => field.key === 'detailedScope')
    const recommendedIndex = fields.findIndex((field) => field.key === 'budgetRange')
    assert.ok(requiredIndex >= 0)
    if (recommendedIndex >= 0) {
      assert.ok(requiredIndex < recommendedIndex)
    }
  })
})
