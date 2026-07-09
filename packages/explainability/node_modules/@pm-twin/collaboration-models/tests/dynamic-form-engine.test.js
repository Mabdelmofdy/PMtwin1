import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import {
  SUB_MODEL_TYPE_KEYS,
  buildDynamicForm,
  groupFields,
  resolveConditionalFields,
  buildValidationRules,
  evaluateValidation,
  buildFieldReadiness,
  resolveLegacyFallback,
  clearDynamicFormCaches,
  resolveSubModelFormFields,
  getDynamicFields,
  FIELD_GROUP_LABELS,
} from '../dist/index.js'

describe('dynamic form engine', () => {
  beforeEach(() => {
    clearDynamicFormCaches()
  })

  it('buildDynamicForm returns knowledge-sourced form for all 13 sub-models', () => {
    for (const key of SUB_MODEL_TYPE_KEYS) {
      const form = buildDynamicForm(key)
      assert.ok(form, key)
      assert.equal(form.source, 'knowledge', key)
      assert.ok(form.fields.length > 0, key)
      assert.ok(form.groups.length > 0, key)
    }
  })

  it('orders fields by ui.order / displayOrder', () => {
    const form = buildDynamicForm('task_based')
    assert.ok(form)
    for (let i = 1; i < form.fields.length; i += 1) {
      const prev = form.fields[i - 1].ui?.order ?? form.fields[i - 1].displayOrder
      const next = form.fields[i].ui?.order ?? form.fields[i].displayOrder
      assert.ok(prev <= next)
    }
  })

  it('groupFields uses metadata group order and labels', () => {
    const form = buildDynamicForm('task_based')
    assert.ok(form)
    const sections = groupFields(form.fields, form.groups)
    assert.ok(sections.length > 0)
    for (const section of sections) {
      assert.equal(section.label, FIELD_GROUP_LABELS[section.id])
      assert.ok(section.fields.every((field) => field.group === section.id))
    }
    const sectionIds = sections.map((section) => section.id)
    const expected = form.groups.filter((id) =>
      form.fields.some((field) => field.group === id),
    )
    assert.deepEqual(sectionIds, expected)
  })

  it('hides equity fields when exchangeMode is cash', () => {
    const form = buildDynamicForm('project_jv')
    assert.ok(form)
    const equity = form.fields.find((field) => field.id === 'equitySplit')
    assert.ok(equity?.visibleWhen, 'equitySplit should declare visibleWhen')

    const hidden = resolveConditionalFields(form.fields, { exchangeMode: 'cash' })
    const equityResolved = hidden.find((field) => field.id === 'equitySplit')
    assert.equal(equityResolved?.visible, false)

    const shown = resolveConditionalFields(form.fields, { exchangeMode: 'equity' })
    assert.equal(shown.find((field) => field.id === 'equitySplit')?.visible, true)

    const unset = resolveConditionalFields(form.fields, {})
    assert.equal(unset.find((field) => field.id === 'equitySplit')?.visible, true)
  })

  it('applies requiredWhen for conditional required', () => {
    const fields = [
      {
        id: 'mode',
        label: 'Mode',
        description: 'Mode',
        type: 'select',
        required: false,
        displayOrder: 10,
        group: 'commercial',
      },
      {
        id: 'split',
        label: 'Split',
        description: 'Split',
        type: 'text',
        required: false,
        displayOrder: 20,
        group: 'commercial',
        requiredWhen: { field: 'mode', op: 'eq', value: 'equity' },
      },
    ]
    const inactive = resolveConditionalFields(fields, { mode: 'cash' })
    assert.equal(inactive.find((f) => f.id === 'split')?.effectivelyRequired, false)

    const active = resolveConditionalFields(fields, { mode: 'equity' })
    assert.equal(active.find((f) => f.id === 'split')?.effectivelyRequired, true)
  })

  it('buildValidationRules and evaluateValidation cover required/min/maxLength/regex', () => {
    const fields = [
      {
        id: 'title',
        label: 'Title',
        description: 'Title',
        type: 'text',
        required: true,
        displayOrder: 10,
        group: 'general',
        validation: { required: true, maxLength: 5, regex: '^[A-Z].*' },
      },
      {
        id: 'days',
        label: 'Days',
        description: 'Days',
        type: 'number',
        required: false,
        displayOrder: 20,
        group: 'timeline',
        validation: { min: 2, max: 10 },
      },
    ]
    const rules = buildValidationRules(fields)
    assert.equal(rules.length, 2)
    assert.equal(rules[0].async, false)

    const empty = evaluateValidation(rules, {})
    assert.equal(empty.valid, false)
    assert.ok(empty.errors.some((error) => error.code === 'required'))

    const tooLong = evaluateValidation(rules, { title: 'toolong', days: 5 })
    assert.ok(tooLong.errors.some((error) => error.code === 'maxLength'))

    const badPattern = evaluateValidation(rules, { title: 'abcde', days: 5 })
    assert.ok(badPattern.errors.some((error) => error.code === 'regex'))

    const tooSmall = evaluateValidation(rules, { title: 'Abc', days: 1 })
    assert.ok(tooSmall.errors.some((error) => error.code === 'min'))

    const ok = evaluateValidation(rules, { title: 'Hello', days: 5 })
    // "Hello" length 5 ok; starts with H — valid
    assert.equal(ok.valid, true)
  })

  it('resolveLegacyFallback rebuilds from attributes', () => {
    const fallback = resolveLegacyFallback('task_based')
    assert.ok(fallback)
    assert.equal(fallback.source, 'legacy-fallback')
    assert.ok(fallback.fields.some((field) => field.id === 'detailedScope'))
    assert.ok(fallback.fields.every((field) => field.ui?.width))
  })

  it('buildFieldReadiness exposes requiredWeight and recommendedWeight', () => {
    for (const key of SUB_MODEL_TYPE_KEYS) {
      const readiness = buildFieldReadiness(key)
      assert.ok(readiness, key)
      const entries = Object.values(readiness)
      assert.ok(entries.length > 0, key)
      for (const entry of entries) {
        assert.equal(typeof entry.requiredWeight, 'number')
        assert.equal(typeof entry.recommendedWeight, 'number')
        assert.ok(entry.requiredWeight >= 0)
        assert.ok(entry.recommendedWeight >= 0)
      }
    }
  })

  it('memoizes buildDynamicForm by subModelKey', () => {
    const first = buildDynamicForm('task_based')
    const second = buildDynamicForm('task_based')
    assert.equal(first, second)
  })

  it('seeds ui metadata on dynamic fields', () => {
    const fields = getDynamicFields('task_based')
    assert.ok(fields)
    for (const field of fields) {
      assert.ok(field.ui, field.id)
      assert.ok(field.ui.width === 'full' || field.ui.width === 'half')
      assert.equal(typeof field.ui.order, 'number')
    }
  })

  it('keeps resolveSubModelFormFields backward compatible', () => {
    const legacy = resolveSubModelFormFields('task_based')
    const form = buildDynamicForm('task_based')
    assert.ok(form)
    for (const field of legacy) {
      assert.ok(
        form.fields.some((item) => item.id === field.key),
        `missing ${field.key} in dynamic form`,
      )
    }
  })
})
