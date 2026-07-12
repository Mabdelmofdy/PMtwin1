import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { initialDraft } from '@/components/opportunity/wizard/draft-model.ts'
import {
  clearLocalDraftRecoveryDismissal,
  clearLocalDraftSnapshot,
  dismissLocalDraftRecovery,
  isMeaningfulLocalDraft,
  readLocalDraftRecoveryDismissal,
  readLocalDraftSnapshot,
  saveLocalDraftSnapshot,
  shouldOfferLocalDraftRecovery,
  type LocalDraftSnapshot,
} from '@/lib/wizard-local-draft.ts'

function meaningfulSnapshot(
  overrides: Partial<LocalDraftSnapshot> = {},
): LocalDraftSnapshot {
  return {
    savedAt: '2026-07-12T08:00:00.000Z',
    mode: 'create',
    draft: { ...initialDraft, title: 'Recover me', description: 'Local edits' },
    activeStepId: 'opportunity',
    ...overrides,
  }
}

describe('wizard local draft recovery', () => {
  it('offers recovery for a meaningful newer local draft', () => {
    clearLocalDraftSnapshot('create')
    clearLocalDraftRecoveryDismissal('create')
    const snapshot = meaningfulSnapshot()
    saveLocalDraftSnapshot(snapshot)

    assert.equal(isMeaningfulLocalDraft(snapshot.draft), true)
    assert.equal(
      shouldOfferLocalDraftRecovery({
        snapshot: readLocalDraftSnapshot('create'),
        authoritativeDraft: initialDraft,
        dismissal: readLocalDraftRecoveryDismissal('create'),
      }),
      true,
    )
  })

  it('does not offer recovery for an empty or identical draft', () => {
    clearLocalDraftSnapshot('create')
    clearLocalDraftRecoveryDismissal('create')

    const emptySnapshot = meaningfulSnapshot({
      draft: { ...initialDraft },
      savedAt: '2026-07-12T08:01:00.000Z',
    })
    assert.equal(isMeaningfulLocalDraft(emptySnapshot.draft), false)
    assert.equal(
      shouldOfferLocalDraftRecovery({
        snapshot: emptySnapshot,
        authoritativeDraft: initialDraft,
      }),
      false,
    )

    const identical = meaningfulSnapshot({
      draft: { ...initialDraft, title: 'Same as server' },
    })
    const authoritative = { ...initialDraft, title: 'Same as server' }
    assert.equal(
      shouldOfferLocalDraftRecovery({
        snapshot: identical,
        authoritativeDraft: authoritative,
      }),
      false,
    )
  })

  it('Continue Draft dismisses the notice and persists the decision', () => {
    clearLocalDraftSnapshot('create')
    clearLocalDraftRecoveryDismissal('create')
    const snapshot = meaningfulSnapshot()
    saveLocalDraftSnapshot(snapshot)

    dismissLocalDraftRecovery({
      mode: 'create',
      decision: 'continue',
      snapshot,
    })

    assert.ok(readLocalDraftRecoveryDismissal('create'))
    assert.equal(readLocalDraftRecoveryDismissal('create')?.decision, 'continue')
    // Snapshot remains for continued editing / autosave continuity.
    assert.ok(readLocalDraftSnapshot('create'))
    assert.equal(
      shouldOfferLocalDraftRecovery({
        snapshot: readLocalDraftSnapshot('create'),
        authoritativeDraft: initialDraft,
        dismissal: readLocalDraftRecoveryDismissal('create'),
      }),
      false,
    )
  })

  it('Discard dismisses the notice and clears or tombstones the recovery payload', () => {
    clearLocalDraftSnapshot('create')
    clearLocalDraftRecoveryDismissal('create')
    const snapshot = meaningfulSnapshot()
    saveLocalDraftSnapshot(snapshot)

    dismissLocalDraftRecovery({
      mode: 'create',
      decision: 'discard',
      snapshot,
    })

    assert.equal(readLocalDraftSnapshot('create'), null)
    assert.equal(readLocalDraftRecoveryDismissal('create')?.decision, 'discard')
    assert.equal(
      shouldOfferLocalDraftRecovery({
        snapshot: readLocalDraftSnapshot('create'),
        authoritativeDraft: initialDraft,
        dismissal: readLocalDraftRecoveryDismissal('create'),
      }),
      false,
    )
  })

  it('refresh does not restore a dismissed notice without a newer autosave', () => {
    clearLocalDraftSnapshot('create')
    clearLocalDraftRecoveryDismissal('create')
    const snapshot = meaningfulSnapshot({
      savedAt: '2026-07-12T09:00:00.000Z',
    })
    saveLocalDraftSnapshot(snapshot)
    dismissLocalDraftRecovery({
      mode: 'create',
      decision: 'continue',
      snapshot,
    })

    // Same content rewritten with a later timestamp (post-continue autosave).
    saveLocalDraftSnapshot({
      ...snapshot,
      savedAt: '2026-07-12T09:05:00.000Z',
    })
    assert.equal(
      shouldOfferLocalDraftRecovery({
        snapshot: readLocalDraftSnapshot('create'),
        authoritativeDraft: initialDraft,
        dismissal: readLocalDraftRecoveryDismissal('create'),
      }),
      false,
    )

    // A newer autosave with different content may offer recovery again.
    const newer = meaningfulSnapshot({
      savedAt: '2026-07-12T10:00:00.000Z',
      draft: {
        ...initialDraft,
        title: 'Newer local edits',
        description: 'Changed after dismiss',
      },
    })
    saveLocalDraftSnapshot(newer)
    assert.equal(
      shouldOfferLocalDraftRecovery({
        snapshot: readLocalDraftSnapshot('create'),
        authoritativeDraft: initialDraft,
        dismissal: readLocalDraftRecoveryDismissal('create'),
      }),
      true,
    )
  })

  it('does not offer recovery for published or missing opportunities', () => {
    const snapshot = meaningfulSnapshot({ mode: 'edit', opportunityId: 'opp-1' })
    assert.equal(
      shouldOfferLocalDraftRecovery({
        snapshot,
        authoritativeDraft: initialDraft,
        opportunityStatus: 'published',
      }),
      false,
    )
    assert.equal(
      shouldOfferLocalDraftRecovery({
        snapshot,
        authoritativeDraft: initialDraft,
        opportunityMissing: true,
      }),
      false,
    )
  })
})
