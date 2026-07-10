import type { OpportunityDraft } from '@/components/opportunity/wizard/draft-model.ts'

const PREFIX = 'pmtwin.ocx.local-draft.v1'

export type LocalDraftSnapshot = {
  readonly savedAt: string
  readonly mode: 'create' | 'edit'
  readonly opportunityId?: string
  readonly draft: OpportunityDraft
  readonly activeStepId: string
}

const memory = new Map<string, string>()

function storageKey(mode: 'create' | 'edit', opportunityId?: string): string {
  return `${PREFIX}:${mode}:${opportunityId ?? 'new'}`
}

function canUseLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage != null
  } catch {
    return false
  }
}

export function saveLocalDraftSnapshot(snapshot: LocalDraftSnapshot): void {
  const key = storageKey(snapshot.mode, snapshot.opportunityId)
  const value = JSON.stringify(snapshot)
  memory.set(key, value)
  if (!canUseLocalStorage()) return
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

export function readLocalDraftSnapshot(
  mode: 'create' | 'edit',
  opportunityId?: string,
): LocalDraftSnapshot | null {
  const key = storageKey(mode, opportunityId)
  try {
    const raw = canUseLocalStorage()
      ? localStorage.getItem(key) ?? memory.get(key)
      : memory.get(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LocalDraftSnapshot
    if (!parsed?.draft || !parsed.savedAt) return null
    return parsed
  } catch {
    return null
  }
}

export function clearLocalDraftSnapshot(
  mode: 'create' | 'edit',
  opportunityId?: string,
): void {
  const key = storageKey(mode, opportunityId)
  memory.delete(key)
  if (!canUseLocalStorage()) return
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
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
