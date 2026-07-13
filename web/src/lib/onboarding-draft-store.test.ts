import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  clearOnboardingDraft,
  isMeaningfulOnboardingDraft,
  readOnboardingDraft,
  saveOnboardingDraft,
} from '@/lib/onboarding-draft-store.ts'
import { createInitialWizardData } from '@/lib/registration-wizard.ts'

describe('onboarding draft store', () => {
  it('saves and restores a meaningful draft', () => {
    const data = createInitialWizardData()
    data.accountType = 'individual'
    data.email = 'draft.user@test'
    data.fullName = 'Draft User'
    assert.equal(isMeaningfulOnboardingDraft(data), true)

    saveOnboardingDraft({
      savedAt: new Date().toISOString(),
      kind: 'individual',
      identityKey: 'draft.user@test',
      activeStep: 2,
      data,
      profileCompletionPercent: 20,
    })

    const restored = readOnboardingDraft('individual', 'draft.user@test')
    assert.ok(restored)
    assert.equal(restored?.data.email, 'draft.user@test')
    assert.equal(restored?.activeStep, 2)

    clearOnboardingDraft('individual', 'draft.user@test')
    assert.equal(readOnboardingDraft('individual', 'draft.user@test'), null)
  })
})
