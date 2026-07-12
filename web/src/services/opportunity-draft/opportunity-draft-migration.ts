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

export function migrateOpportunityDraftVersion(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const version = typeof raw.version === 'number' ? raw.version : 1
  if (version >= 3) return raw
  return {
    ...raw,
    version: 3,
    // Ensure commercialStructure key exists for v3 consumers
    commercialStructure:
      raw.commercialStructure
      ?? (raw.draft as { commercialStructure?: unknown } | undefined)
        ?.commercialStructure,
  }
}
