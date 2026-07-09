import { registerAccount, type RegistrationInput, type RegistrationResult } from '@/lib/registration-service'

export type AccountType = 'company' | 'individual'
export type IndividualType = 'professional' | 'consultant'
export type Intent = 'publish' | 'partner' | 'explore'
export type WizardStep = 0 | 1 | 2 | 3 | 4 | 5

export type RegistrationWizardData = {
  accountType: AccountType | null
  individualType: IndividualType | null
  individualSubType: string
  companyRole: string
  companySubType: string
  intent: Intent
  name: string
  fullName: string
  email: string
  mobile: string
  country: string
  region: string
  city: string
  currentRole: string
  yearsExperience: string
  skills: string
  languages: string
  linkedin: string
  specialty: string
  expertise: string
  companyName: string
  businessEmail: string
  contactPerson: string
  website: string
  industry: string
  companySize: string
  companyDescription: string
  crNumber: string
  taxId: string
  authRepName: string
  authRepRole: string
  password: string
  confirmPassword: string
  termsAccepted: boolean
  verificationChoice: 'skip' | 'complete' | null
  primaryDomain: string
}

export type WizardErrors = Record<string, string>

export const INDIVIDUAL_SUBTYPES: Record<IndividualType, readonly string[]> = {
  professional: ['Project Manager', 'Engineer', 'Architect', 'Analyst'],
  consultant: ['Strategy Consultant', 'PMO Consultant', 'Risk Consultant', 'Transformation Advisor'],
}

export const COMPANY_ROLES = ['Consultant Company', 'Contractor', 'Owner / Client', 'Supplier'] as const

export function createInitialWizardData(): RegistrationWizardData {
  return {
    accountType: null,
    individualType: null,
    individualSubType: '',
    companyRole: '',
    companySubType: '',
    intent: 'explore',
    name: '',
    fullName: '',
    email: '',
    mobile: '',
    country: '',
    region: '',
    city: '',
    currentRole: '',
    yearsExperience: '',
    skills: '',
    languages: '',
    linkedin: '',
    specialty: '',
    expertise: '',
    companyName: '',
    businessEmail: '',
    contactPerson: '',
    website: '',
    industry: '',
    companySize: '',
    companyDescription: '',
    crNumber: '',
    taxId: '',
    authRepName: '',
    authRepRole: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    verificationChoice: null,
    primaryDomain: '',
  }
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function requireField(errors: WizardErrors, key: string, value: string, label: string) {
  if (!value.trim()) {
    errors[key] = `${label} is required.`
  }
}

export function validateWizardStep(step: WizardStep, data: RegistrationWizardData): WizardErrors {
  const errors: WizardErrors = {}

  if (step === 0) {
    if (!data.accountType) errors.accountType = 'Select account type to continue.'
    return errors
  }

  if (!data.accountType) {
    errors.accountType = 'Select account type to continue.'
    return errors
  }

  if (step === 1) {
    if (data.accountType === 'company') {
      requireField(errors, 'companyRole', data.companyRole, 'Company role')
    } else {
      if (!data.individualType) errors.individualType = 'Choose your role.'
      requireField(errors, 'individualSubType', data.individualSubType, 'Sub-type')
    }
  }

  if (step === 2) {
    if (data.accountType === 'company') {
      requireField(errors, 'companyName', data.companyName, 'Company name')
      requireField(errors, 'businessEmail', data.businessEmail, 'Business email')
      if (data.businessEmail.trim() && !isEmail(data.businessEmail)) {
        errors.businessEmail = 'Enter a valid email address.'
      }
      requireField(errors, 'contactPerson', data.contactPerson, 'Contact person')
      requireField(errors, 'mobile', data.mobile, 'Mobile')
      requireField(errors, 'country', data.country, 'Country')
    } else {
      const effectiveName = data.fullName || data.name
      requireField(errors, 'fullName', effectiveName, 'Full name')
      requireField(errors, 'email', data.email, 'Email')
      if (data.email.trim() && !isEmail(data.email)) {
        errors.email = 'Enter a valid email address.'
      }
      requireField(errors, 'mobile', data.mobile, 'Mobile')
      requireField(errors, 'country', data.country, 'Country')
      if (data.individualType === 'professional') {
        requireField(errors, 'specialty', data.specialty, 'Discipline / specialty')
      }
      if (data.individualType === 'consultant') {
        requireField(errors, 'expertise', data.expertise, 'Expertise area')
      }
    }
    if (!data.password) {
      errors.password = 'Password is required.'
    } else if (data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }
    if (!data.confirmPassword) {
      errors.confirmPassword = 'Confirm your password.'
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }
  }

  if (step === 3 && !data.termsAccepted) {
    errors.termsAccepted = 'You must accept the terms to continue.'
  }

  return errors
}

export function toRegistrationInput(data: RegistrationWizardData): RegistrationInput {
  if (data.accountType === 'company') {
    return {
      accountType: 'company',
      companyName: data.companyName.trim(),
      businessEmail: data.businessEmail.trim(),
      contactPerson: data.contactPerson.trim(),
      password: data.password,
      confirmPassword: data.confirmPassword,
      intent: data.intent,
      termsAccepted: data.termsAccepted,
      mobile: data.mobile,
      country: data.country,
      region: data.region,
      city: data.city,
      companyDescription: data.companyDescription,
    }
  }

  return {
    accountType: 'individual',
    name: (data.fullName || data.name).trim(),
    email: data.email.trim(),
    password: data.password,
    confirmPassword: data.confirmPassword,
    intent: data.intent,
    termsAccepted: data.termsAccepted,
    mobile: data.mobile,
    country: data.country,
    region: data.region,
    city: data.city,
    specialty: data.specialty,
    expertise: data.expertise,
    skills: data.skills,
  }
}

export async function submitWizardRegistration(
  data: RegistrationWizardData,
  submit: (input: RegistrationInput) => Promise<RegistrationResult> = registerAccount,
): Promise<RegistrationResult> {
  return submit(toRegistrationInput(data))
}
