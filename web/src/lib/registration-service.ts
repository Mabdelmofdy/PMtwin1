import { peopleApi } from '@/api/people.ts'

export type RegistrationAccountType = 'individual' | 'company'

export type IndividualRegistrationInput = {
  accountType: 'individual'
  name: string
  email: string
  password: string
  confirmPassword: string
  intent?: string
  termsAccepted: boolean
}

export type CompanyRegistrationInput = {
  accountType: 'company'
  companyName: string
  businessEmail: string
  contactPerson: string
  password: string
  confirmPassword: string
  intent?: string
  termsAccepted: boolean
}

export type RegistrationInput = IndividualRegistrationInput | CompanyRegistrationInput

export type RegistrationField =
  | 'accountType'
  | 'name'
  | 'email'
  | 'companyName'
  | 'businessEmail'
  | 'contactPerson'
  | 'password'
  | 'confirmPassword'
  | 'termsAccepted'

export type RegistrationValidationErrors = Partial<Record<RegistrationField, string>>

export type RegistrationValidationResult = {
  valid: boolean
  errors: RegistrationValidationErrors
}

export type RegistrationRequest = {
  accountType: RegistrationAccountType
  email: string
  password: string
  profile: {
    displayName: string
    intent?: string
  }
}

export type RegistrationFailureCode =
  | 'VALIDATION_FAILED'
  | 'DUPLICATE_EMAIL'
  | 'BACKEND_UNAVAILABLE'
  | 'REQUEST_FAILED'

export type RegistrationResult =
  | { ok: true }
  | {
      ok: false
      code: RegistrationFailureCode
      message: string
      fieldErrors?: RegistrationValidationErrors
    }

export interface RegistrationApiClient {
  register(request: RegistrationRequest): Promise<{ userId: string }>
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

export function validateRegistrationInput(input: RegistrationInput): RegistrationValidationResult {
  const errors: RegistrationValidationErrors = {}

  if (!input.accountType) {
    errors.accountType = 'Account type is required.'
  }

  if (input.accountType === 'individual') {
    if (!input.name.trim()) errors.name = 'Name is required.'
    if (!input.email.trim()) {
      errors.email = 'Email is required.'
    } else if (!EMAIL_PATTERN.test(input.email.trim())) {
      errors.email = 'Enter a valid email address.'
    }
  } else {
    if (!input.companyName.trim()) errors.companyName = 'Company name is required.'
    if (!input.contactPerson.trim()) errors.contactPerson = 'Contact person is required.'
    if (!input.businessEmail.trim()) {
      errors.businessEmail = 'Business email is required.'
    } else if (!EMAIL_PATTERN.test(input.businessEmail.trim())) {
      errors.businessEmail = 'Enter a valid email address.'
    }
  }

  if (!input.password) {
    errors.password = 'Password is required.'
  } else if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.'
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  if (!input.termsAccepted) {
    errors.termsAccepted = 'You must accept the terms to continue.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

function toRegistrationRequest(input: RegistrationInput): RegistrationRequest {
  if (input.accountType === 'individual') {
    return {
      accountType: 'individual',
      email: input.email.trim().toLowerCase(),
      password: input.password,
      profile: {
        displayName: input.name.trim(),
        intent: input.intent?.trim() || undefined,
      },
    }
  }

  return {
    accountType: 'company',
    email: input.businessEmail.trim().toLowerCase(),
    password: input.password,
    profile: {
      displayName: input.companyName.trim(),
      intent: input.intent?.trim() || undefined,
    },
  }
}

function registrationBackendUnavailableError(): Error {
  return new Error('Registration API is not available yet.')
}

const backendUnavailableClient: RegistrationApiClient = {
  async register() {
    throw registrationBackendUnavailableError()
  },
}

type RegistrationDependencies = {
  apiClient: RegistrationApiClient
  emailExists: (email: string) => boolean
}

const defaultDependencies: RegistrationDependencies = {
  apiClient: backendUnavailableClient,
  emailExists(email) {
    const normalized = email.trim().toLowerCase()
    return peopleApi
      .listAll()
      .some((person) => person.email.trim().toLowerCase() === normalized)
  },
}

export async function registerAccount(
  input: RegistrationInput,
  dependencies: RegistrationDependencies = defaultDependencies,
): Promise<RegistrationResult> {
  const validation = validateRegistrationInput(input)
  if (!validation.valid) {
    return {
      ok: false,
      code: 'VALIDATION_FAILED',
      message: 'Please fix the highlighted fields and try again.',
      fieldErrors: validation.errors,
    }
  }

  const request = toRegistrationRequest(input)
  if (dependencies.emailExists(request.email)) {
    return {
      ok: false,
      code: 'DUPLICATE_EMAIL',
      message: 'This email is already in use.',
      fieldErrors:
        request.accountType === 'company'
          ? { businessEmail: 'This email is already in use.' }
          : { email: 'This email is already in use.' },
    }
  }

  try {
    await dependencies.apiClient.register(request)
    return { ok: true }
  } catch (error) {
    if (error instanceof Error && error.message === 'Registration API is not available yet.') {
      return {
        ok: false,
        code: 'BACKEND_UNAVAILABLE',
        message:
          'Registration is not yet available in production. Please sign in, explore the marketplace, or contact sales.',
      }
    }
    return {
      ok: false,
      code: 'REQUEST_FAILED',
      message: 'Registration could not be completed at this time. Please try again later.',
    }
  }
}

export const registrationContracts = {
  minimumPasswordLength: MIN_PASSWORD_LENGTH,
}
