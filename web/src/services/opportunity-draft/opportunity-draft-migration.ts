/**
 * Opportunity draft migration / persistence helpers (Creation Experience 3.0).
 */

export {
  initialDraft,
  opportunityToDraft,
  buildOpportunityDraftInput,
  buildCollaborationCommandPayload,
  syncDraftExchangeFromCommercialStructure,
  toWizardDraft,
  type OpportunityDraft,
} from '@/components/opportunity/wizard/draft-model.ts'

/**
 * Bump local wizard drafts to v4: ensure coverageAreas exists.
 * Location free-text → scope ID happens lazily on opportunityToDraft / save.
 */
export function migrateOpportunityDraftVersion(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const version = typeof raw.version === 'number' ? raw.version : 1
  let next: Record<string, unknown> = { ...raw }

  if (version < 3) {
    next = {
      ...next,
      version: 3,
      commercialStructure:
        raw.commercialStructure
        ?? (raw.draft as { commercialStructure?: unknown } | undefined)
          ?.commercialStructure,
    }
  }

  if ((typeof next.version === 'number' ? next.version : 3) < 4) {
    const draft =
      next.draft && typeof next.draft === 'object'
        ? (next.draft as Record<string, unknown>)
        : null
    next = {
      ...next,
      version: 4,
      coverageAreas: Array.isArray(next.coverageAreas)
        ? next.coverageAreas
        : [],
      ...(draft
        ? {
            draft: {
              ...draft,
              coverageAreas: Array.isArray(draft.coverageAreas)
                ? draft.coverageAreas
                : [],
            },
          }
        : {}),
    }
  }

  return next
}
