import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  resolveFormFieldSpan,
  resolveFormGridClasses,
} from '@/components/forms/pm-form-layout.ts'

describe('pm-form-layout', () => {
  it('resolves single-column grid', () => {
    assert.match(resolveFormGridClasses(1), /grid-cols-1/)
    assert.doesNotMatch(resolveFormGridClasses(1), /sm:grid-cols-2/)
  })

  it('resolves two-column responsive grid', () => {
    assert.match(resolveFormGridClasses(2), /sm:grid-cols-2/)
  })

  it('resolves three-column responsive grid', () => {
    assert.match(resolveFormGridClasses(3), /lg:grid-cols-3/)
  })

  it('resolves full span', () => {
    assert.equal(resolveFormFieldSpan('full', 2), 'col-span-full')
  })

  it('resolves partial span in multi-column grid', () => {
    assert.match(resolveFormFieldSpan(2, 3), /col-span-2/)
  })
})
