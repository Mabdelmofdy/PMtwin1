/**
 * Onboarding wizard autosave / draft recovery (env + identity namespaced).
 */

import { environmentContext } from '@/infrastructure/environment/environment-context.ts'
import type { RegistrationWizardData } from '@/lib/registration-wizard.ts'
import { createInitialWizardData } from '@/lib/registration-wizard.ts'

const PREFIX = 'pmtwin.onboarding.draft.v1'

export type OnboardingDraftKind = 'individual' | 'company' | 'employee_invite'

export type OnboardingDraftSnapshot = {
  readonly savedAt: string
  readonly kind: OnboardingDraftKind
  readonly identityKey: string
  readonly activeStep: number
  readonly data: RegistrationWizardData
  readonly profileCompletionPercent: number
}

const memory = new Map<string, string>()

function canUseLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage != null
  } catch {
    return false
  }
}

function envPrefix(): string {
  const mode = environmentContext.runtimeMode
  return mode === 'uat' ? 'uat' : mode === 'demo' ? 'demo' : 'prod'
}

function storageKey(kind: OnboardingDraftKind, identityKey: string): string {
  return `${PREFIX}:${envPrefix()}:${kind}:${identityKey.trim().toLowerCase()}`
}

function readRaw(key: string): string | null {
  try {
    const raw = canUseLocalStorage()
      ? localStorage.getItem(key) ?? memory.get(key)
      : memory.get(key)
    return raw ?? null
  } catch {
    return memory.get(key) ?? null
  }
}

function writeRaw(key: string, value: string): void {
  memory.set(key, value)
  if (!canUseLocalStorage()) return
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore quota
  }
}

function removeRaw(key: string): void {
  memory.delete(key)
  if (!canUseLocalStorage()) return
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function saveOnboardingDraft(snapshot: OnboardingDraftSnapshot): void {
  writeRaw(storageKey(snapshot.kind, snapshot.identityKey), JSON.stringify(snapshot))
}

export function readOnboardingDraft(
  kind: OnboardingDraftKind,
  identityKey: string,
): OnboardingDraftSnapshot | null {
  try {
    const raw = readRaw(storageKey(kind, identityKey))
    if (!raw) return null
    const parsed = JSON.parse(raw) as OnboardingDraftSnapshot
    if (!parsed?.data || !parsed.savedAt || parsed.kind !== kind) return null
    return parsed
  } catch {
    return null
  }
}

export function clearOnboardingDraft(kind: OnboardingDraftKind, identityKey: string): void {
  removeRaw(storageKey(kind, identityKey))
}

export function isMeaningfulOnboardingDraft(data: RegistrationWizardData): boolean {
  const blank = createInitialWizardData()
  return (
    data.email !== blank.email ||
    data.businessEmail !== blank.businessEmail ||
    data.fullName !== blank.fullName ||
    data.companyName !== blank.companyName ||
    data.password !== blank.password ||
    data.accountType != null
  )
}
