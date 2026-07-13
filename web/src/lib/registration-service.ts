import { peopleApi } from '@/api/people.ts'
import { resolveRuntimeMode } from '@/config/runtime-environment.ts'
import { registerLocalAccount } from '@/lib/local-registration-service.ts'
import type { ImplementedPartyType } from '@pm-twin/party'

export type RegistrationAccountType = 'individual' | 'company'

export type IndividualRegistrationInput = {
  accountType: 'individual'
  name: string
  email: string
  password: string
  confirmPassword: string
  intent?: string
  termsAccepted: boolean
  mobile?: string
  country?: string
  region?: string
  city?: string
  specialty?: string
  expertise?: string
  skills?: string
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
  mobile?: string
  country?: string
  region?: string
  city?: string
  companyDescription?: string
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
    contactPerson?: string
    intent?: string
    mobile?: string
    country?: string
    region?: string
    city?: string
    specialty?: string
    expertise?: string
    skills?: string[]
    companyDescription?: string
  }
}

export type RegistrationSuccess = {
  ok: true
  userId: string
  workspaceId: string
  partyId: string
  membershipId: string
  partyType: ImplementedPartyType
}

export type RegistrationFailureCode =
  | 'VALIDATION_FAILED'
  | 'DUPLICATE_EMAIL'
  | 'DUPLICATE_PARTY'
  | 'OTP_REQUIRED'
  | 'BACKEND_UNAVAILABLE'
  | 'REQUEST_FAILED'

export type RegistrationResult =
  | RegistrationSuccess
  | {
      ok: false
      code: RegistrationFailureCode
      message: string
      fieldErrors?: RegistrationValidationErrors
    }

export interface RegistrationApiClient {
  register(request: RegistrationRequest): Promise<{
    userId: string
    workspaceId: string
    partyId: string
    membershipId: string
    partyType: ImplementedPartyType
  }>
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
    const skills = input.skills
      ?.split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)

    return {
      accountType: 'individual',
      email: input.email.trim().toLowerCase(),
      password: input.password,
      profile: {
        displayName: input.name.trim(),
        intent: input.intent?.trim() || undefined,
        mobile: input.mobile?.trim() || undefined,
        country: input.country?.trim() || undefined,
        region: input.region?.trim() || undefined,
        city: input.city?.trim() || undefined,
        specialty: input.specialty?.trim() || undefined,
        expertise: input.expertise?.trim() || undefined,
        skills,
      },
    }
  }

  return {
    accountType: 'company',
    email: input.businessEmail.trim().toLowerCase(),
    password: input.password,
    profile: {
      displayName: input.companyName.trim(),
      contactPerson: input.contactPerson.trim(),
      intent: input.intent?.trim() || undefined,
      mobile: input.mobile?.trim() || undefined,
      country: input.country?.trim() || undefined,
      region: input.region?.trim() || undefined,
      city: input.city?.trim() || undefined,
      companyDescription: input.companyDescription?.trim() || undefined,
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

function readViteEnv(name: string): string | undefined {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  return env?.[name]
}

function resolveRegistrationClient(): RegistrationApiClient {
  const runtimeMode = resolveRuntimeMode()
  const allowProductionLocalRegistration = readViteEnv('VITE_ENABLE_LOCAL_REGISTRATION') === 'true'

  if (runtimeMode === 'demo' || runtimeMode === 'uat' || allowProductionLocalRegistration) {
    return {
      async register(request) {
        return registerLocalAccount(request)
      },
    }
  }

  return backendUnavailableClient
}

type RegistrationDependencies = {
  apiClient: RegistrationApiClient
  emailExists: (email: string) => boolean
}

const defaultDependencies: RegistrationDependencies = {
  get apiClient() {
    return resolveRegistrationClient()
  },
  emailExists(email) {
    const normalized = email.trim().toLowerCase()
    return peopleApi
      .listAll()
      .some((person) => person.email.trim().toLowerCase() === normalized)
  },
}

export async function registerAccount(
  input: RegistrationInput,
  dependencies: Partial<RegistrationDependencies> = {},
): Promise<RegistrationResult> {
  const resolvedDependencies: RegistrationDependencies = {
    ...defaultDependencies,
    ...dependencies,
    apiClient: dependencies.apiClient ?? resolveRegistrationClient(),
  }
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
  if (resolvedDependencies.emailExists(request.email)) {
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
    const created = await resolvedDependencies.apiClient.register(request)
    return {
      ok: true,
      userId: created.userId,
      workspaceId: created.workspaceId,
      partyId: created.partyId,
      membershipId: created.membershipId,
      partyType: created.partyType,
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'DUPLICATE_EMAIL') {
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
    if (error instanceof Error && error.message === 'DUPLICATE_PARTY') {
      return {
        ok: false,
        code: 'DUPLICATE_PARTY',
        message: 'A party for this account already exists.',
      }
    }
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
