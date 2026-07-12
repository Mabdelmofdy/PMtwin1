import {
  initialDraft,
  type OpportunityDraft,
} from '@/components/opportunity/wizard/draft-model.ts'

const PREFIX = 'pmtwin.ocx.local-draft.v1'
const DISMISSAL_PREFIX = 'pmtwin.ocx.local-draft.dismissal.v1'

export type LocalDraftSnapshot = {
  readonly savedAt: string
  readonly mode: 'create' | 'edit'
  readonly opportunityId?: string
  readonly draft: OpportunityDraft
  readonly activeStepId: string
}

export type LocalDraftRecoveryDismissal = {
  readonly decision: 'continue' | 'discard'
  readonly snapshotSavedAt: string
  readonly draftFingerprint: string
  readonly dismissedAt: string
}

const memory = new Map<string, string>()

function storageKey(mode: 'create' | 'edit', opportunityId?: string): string {
  return `${PREFIX}:${mode}:${opportunityId ?? 'new'}`
}

function dismissalKey(mode: 'create' | 'edit', opportunityId?: string): string {
  return `${DISMISSAL_PREFIX}:${mode}:${opportunityId ?? 'new'}`
}

function canUseLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage != null
  } catch {
    return false
  }
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
    // ignore
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

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`
  }
  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort()
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
    .join(',')}}`
}

export function draftFingerprint(draft: OpportunityDraft): string {
  return stableSerialize(draft)
}

export function draftsAreEquivalent(
  left: OpportunityDraft,
  right: OpportunityDraft,
): boolean {
  return draftFingerprint(left) === draftFingerprint(right)
}

/** A local draft is meaningful when it differs from the blank wizard baseline. */
export function isMeaningfulLocalDraft(draft: OpportunityDraft): boolean {
  return !draftsAreEquivalent(draft, initialDraft)
}

const RECOVERABLE_OPPORTUNITY_STATUSES = new Set(['draft', ''])

export function isOpportunityStatusRecoverable(
  status: string | null | undefined,
): boolean {
  if (status == null) return true
  return RECOVERABLE_OPPORTUNITY_STATUSES.has(String(status).toLowerCase())
}

export function saveLocalDraftSnapshot(snapshot: LocalDraftSnapshot): void {
  const key = storageKey(snapshot.mode, snapshot.opportunityId)
  writeRaw(key, JSON.stringify(snapshot))
}

export function readLocalDraftSnapshot(
  mode: 'create' | 'edit',
  opportunityId?: string,
): LocalDraftSnapshot | null {
  const key = storageKey(mode, opportunityId)
  try {
    const raw = readRaw(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LocalDraftSnapshot
    if (!parsed?.draft || !parsed.savedAt || typeof parsed.savedAt !== 'string') {
      return null
    }
    if (parsed.mode !== mode) return null
    if (typeof parsed.activeStepId !== 'string' || !parsed.activeStepId) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearLocalDraftSnapshot(
  mode: 'create' | 'edit',
  opportunityId?: string,
): void {
  removeRaw(storageKey(mode, opportunityId))
}

export function readLocalDraftRecoveryDismissal(
  mode: 'create' | 'edit',
  opportunityId?: string,
): LocalDraftRecoveryDismissal | null {
  try {
    const raw = readRaw(dismissalKey(mode, opportunityId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as LocalDraftRecoveryDismissal
    if (
      !parsed
      || (parsed.decision !== 'continue' && parsed.decision !== 'discard')
      || typeof parsed.snapshotSavedAt !== 'string'
      || typeof parsed.draftFingerprint !== 'string'
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeLocalDraftRecoveryDismissal(
  mode: 'create' | 'edit',
  opportunityId: string | undefined,
  dismissal: Omit<LocalDraftRecoveryDismissal, 'dismissedAt'> & {
    readonly dismissedAt?: string
  },
): void {
  const payload: LocalDraftRecoveryDismissal = {
    decision: dismissal.decision,
    snapshotSavedAt: dismissal.snapshotSavedAt,
    draftFingerprint: dismissal.draftFingerprint,
    dismissedAt: dismissal.dismissedAt ?? new Date().toISOString(),
  }
  writeRaw(dismissalKey(mode, opportunityId), JSON.stringify(payload))
}

export function clearLocalDraftRecoveryDismissal(
  mode: 'create' | 'edit',
  opportunityId?: string,
): void {
  removeRaw(dismissalKey(mode, opportunityId))
}

export type ShouldOfferLocalDraftRecoveryInput = {
  readonly snapshot: LocalDraftSnapshot | null
  readonly authoritativeDraft: OpportunityDraft
  readonly opportunityStatus?: string | null
  /** Edit mode when the opportunity id no longer resolves. */
  readonly opportunityMissing?: boolean
  readonly dismissal?: LocalDraftRecoveryDismissal | null
}

/**
 * Offer recovery only for a meaningful local autosave that is newer/different
 * from the authoritative draft and has not already been continued or discarded.
 */
export function shouldOfferLocalDraftRecovery(
  input: ShouldOfferLocalDraftRecoveryInput,
): boolean {
  const {
    snapshot,
    authoritativeDraft,
    opportunityStatus,
    opportunityMissing = false,
    dismissal = null,
  } = input

  if (!snapshot) return false
  if (opportunityMissing) return false
  if (!isOpportunityStatusRecoverable(opportunityStatus)) return false
  if (!snapshot.draft || !snapshot.savedAt) return false
  if (!isMeaningfulLocalDraft(snapshot.draft)) return false
  if (draftsAreEquivalent(snapshot.draft, authoritativeDraft)) return false

  if (dismissal) {
    const sameFingerprint =
      dismissal.draftFingerprint === draftFingerprint(snapshot.draft)
    // Continue/Discard suppresses the same payload on refresh.
    if (sameFingerprint) return false

    const snapshotTime = Date.parse(snapshot.savedAt)
    const dismissalTime = Date.parse(dismissal.snapshotSavedAt)
    // Without a newer autosave than the dismissed decision, do not re-offer.
    if (
      Number.isFinite(snapshotTime)
      && Number.isFinite(dismissalTime)
      && snapshotTime <= dismissalTime
    ) {
      return false
    }
  }

  return true
}

export function dismissLocalDraftRecovery(options: {
  readonly mode: 'create' | 'edit'
  readonly opportunityId?: string
  readonly decision: 'continue' | 'discard'
  readonly snapshot: LocalDraftSnapshot
}): void {
  writeLocalDraftRecoveryDismissal(options.mode, options.opportunityId, {
    decision: options.decision,
    snapshotSavedAt: options.snapshot.savedAt,
    draftFingerprint: draftFingerprint(options.snapshot.draft),
  })
  if (options.decision === 'discard') {
    clearLocalDraftSnapshot(options.mode, options.opportunityId)
  }
}

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function formatLastSavedAt(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}
