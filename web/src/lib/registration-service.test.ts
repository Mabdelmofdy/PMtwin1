import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  registerAccount,
  type RegistrationApiClient,
  type RegistrationInput,
  validateRegistrationInput,
} from '@/lib/registration-service.ts'

function validIndividualInput(): RegistrationInput {
  return {
    accountType: 'individual',
    name: 'Aisha Saleh',
    email: 'aisha@example.com',
    password: 'StrongPass1',
    confirmPassword: 'StrongPass1',
    intent: 'explore',
    termsAccepted: true,
  }
}

describe('registration-service validation', () => {
  it('requires key fields for individual registration', () => {
    const result = validateRegistrationInput({
      accountType: 'individual',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    })

    assert.equal(result.valid, false)
    assert.equal(result.errors.name, 'Name is required.')
    assert.equal(result.errors.email, 'Email is required.')
    assert.equal(result.errors.password, 'Password is required.')
    assert.equal(result.errors.confirmPassword, 'Confirm your password.')
    assert.equal(result.errors.termsAccepted, 'You must accept the terms to continue.')
  })

  it('requires company-specific fields for company registration', () => {
    const result = validateRegistrationInput({
      accountType: 'company',
      companyName: '',
      businessEmail: 'invalid-email',
      contactPerson: '',
      password: 'StrongPass1',
      confirmPassword: 'StrongPass1',
      termsAccepted: true,
    })

    assert.equal(result.valid, false)
    assert.equal(result.errors.companyName, 'Company name is required.')
    assert.equal(result.errors.contactPerson, 'Contact person is required.')
    assert.equal(result.errors.businessEmail, 'Enter a valid email address.')
  })

  it('fails password confirmation mismatch', () => {
    const result = validateRegistrationInput({
      ...validIndividualInput(),
      confirmPassword: 'DifferentPass1',
    })
    assert.equal(result.valid, false)
    assert.equal(result.errors.confirmPassword, 'Passwords do not match.')
  })
})

describe('registration-service request path', () => {
  it('handles duplicate email before backend request', async () => {
    const apiClient: RegistrationApiClient = {
      async register() {
        throw new Error('should not be called')
      },
    }
    const result = await registerAccount(validIndividualInput(), {
      apiClient,
      emailExists: () => true,
    })
    assert.equal(result.ok, false)
    assert.equal(result.code, 'DUPLICATE_EMAIL')
  })

  it('returns backend unavailable when API is not implemented', async () => {
    const apiClient: RegistrationApiClient = {
      async register() {
        throw new Error('Registration API is not available yet.')
      },
    }
    const result = await registerAccount(validIndividualInput(), {
      apiClient,
      emailExists: () => false,
    })

    assert.equal(result.ok, false)
    assert.equal(result.code, 'BACKEND_UNAVAILABLE')
  })

  it('supports successful request path when API exists', async () => {
    let called = false
    const apiClient: RegistrationApiClient = {
      async register() {
        called = true
        return { userId: 'user-1' }
      },
    }
    const result = await registerAccount(validIndividualInput(), {
      apiClient,
      emailExists: () => false,
    })

    assert.equal(called, true)
    assert.equal(result.ok, true)
  })
})
