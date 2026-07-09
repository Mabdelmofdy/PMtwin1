import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import {
  createInitialWizardData,
  submitWizardRegistration,
  toRegistrationInput,
  validateWizardStep,
  type RegistrationWizardData,
} from '@/lib/registration-wizard'

function makeIndividual(overrides: Partial<RegistrationWizardData> = {}): RegistrationWizardData {
  return {
    ...createInitialWizardData(),
    accountType: 'individual',
    individualType: 'professional',
    individualSubType: 'Project Manager',
    fullName: 'Aisha Saleh',
    name: 'Aisha Saleh',
    email: 'aisha@example.com',
    mobile: '+966500000001',
    country: 'Saudi Arabia',
    specialty: 'Project Management',
    password: 'StrongPass1',
    confirmPassword: 'StrongPass1',
    termsAccepted: true,
    ...overrides,
  }
}

function makeCompany(overrides: Partial<RegistrationWizardData> = {}): RegistrationWizardData {
  return {
    ...createInitialWizardData(),
    accountType: 'company',
    companyRole: 'Consultant Company',
    companyName: 'Acme Projects',
    businessEmail: 'biz@example.com',
    contactPerson: 'Faisal Omar',
    mobile: '+966500000002',
    country: 'Saudi Arabia',
    password: 'StrongPass1',
    confirmPassword: 'StrongPass1',
    termsAccepted: true,
    ...overrides,
  }
}

describe('registration wizard validation', () => {
  it('blocks progression when account type is missing', () => {
    const errors = validateWizardStep(0, createInitialWizardData())
    assert.equal(errors.accountType, 'Select account type to continue.')
  })

  it('requires branch-specific role fields', () => {
    const individualErrors = validateWizardStep(1, makeIndividual({ individualSubType: '' }))
    assert.equal(individualErrors.individualSubType, 'Sub-type is required.')

    const companyErrors = validateWizardStep(1, makeCompany({ companyRole: '' }))
    assert.equal(companyErrors.companyRole, 'Company role is required.')
  })

  it('validates individual profile requirements and password mismatch', () => {
    const errors = validateWizardStep(
      2,
      makeIndividual({ email: 'invalid', password: 'StrongPass1', confirmPassword: 'Mismatch1' }),
    )
    assert.equal(errors.email, 'Enter a valid email address.')
    assert.equal(errors.confirmPassword, 'Passwords do not match.')
  })

  it('validates company profile requirements', () => {
    const errors = validateWizardStep(2, makeCompany({ companyName: '', businessEmail: '' }))
    assert.equal(errors.companyName, 'Company name is required.')
    assert.equal(errors.businessEmail, 'Business email is required.')
  })

  it('requires terms at documents step', () => {
    const errors = validateWizardStep(3, makeIndividual({ termsAccepted: false }))
    assert.equal(errors.termsAccepted, 'You must accept the terms to continue.')
  })
})

describe('registration wizard submit mapping', () => {
  it('maps individual flow to registration service payload', () => {
    const payload = toRegistrationInput(makeIndividual())
    assert.equal(payload.accountType, 'individual')
    assert.equal(payload.email, 'aisha@example.com')
    assert.equal(payload.name, 'Aisha Saleh')
  })

  it('maps extended individual profile fields to registration service payload', () => {
    const payload = toRegistrationInput(
      makeIndividual({
        country: 'Saudi Arabia',
        region: 'Riyadh',
        city: 'Riyadh',
        specialty: 'Structural Engineering',
        skills: 'PM, Risk',
      }),
    )
    assert.equal(payload.accountType, 'individual')
    assert.equal(payload.country, 'Saudi Arabia')
    assert.equal(payload.specialty, 'Structural Engineering')
    assert.equal(payload.skills, 'PM, Risk')
  })

  it('maps extended company profile fields to registration service payload', () => {
    const payload = toRegistrationInput(
      makeCompany({
        country: 'Saudi Arabia',
        companyDescription: 'Regional contractor',
      }),
    )
    assert.equal(payload.accountType, 'company')
    assert.equal(payload.country, 'Saudi Arabia')
    assert.equal(payload.companyDescription, 'Regional contractor')
  })

  it('uses registration submitter and returns backend unavailable honestly', async () => {
    let called = false
    const result = await submitWizardRegistration(makeCompany(), async (input) => {
      called = true
      assert.equal(input.accountType, 'company')
      return {
        ok: false,
        code: 'BACKEND_UNAVAILABLE',
        message: 'Registration is not yet available in production.',
      }
    })
    assert.equal(called, true)
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.code, 'BACKEND_UNAVAILABLE')
    }
  })
})

describe('/register route implementation', () => {
  it('does not render iframe-based PocRegisterPage', () => {
    const filePath = path.join(process.cwd(), 'src/pages/public/auth-pages.tsx')
    const source = readFileSync(filePath, 'utf8')
    assert.equal(source.includes('PocRegisterPage'), false)
    assert.equal(source.includes('return <LegacyRegisterPage />'), true)
  })

  it('applies pm-register-page class on legacy register page', () => {
    const filePath = path.join(process.cwd(), 'src/pages/public/legacy-register-page.tsx')
    const source = readFileSync(filePath, 'utf8')
    assert.equal(source.includes('pageClassName="pm-register-page"'), true)
    assert.equal(source.includes('Continue to Dashboard'), true)
  })
})
