import type { ValidationIssue, ValidationRule } from '../types.ts'
import { VAL_CODES } from '../rules/codes.ts'
import { messageForCode } from '../messages/catalog.ts'
import { titleSimilarity } from '../validators/primitives.ts'

const DRAFT_UPDATE_PUBLISH = ['draft', 'update', 'publish'] as const

export const duplicateSimilarDraft: ValidationRule = {
  id: 'duplicate-similar-draft',
  code: VAL_CODES.DUP_SIMILAR_DRAFT,
  layer: 'business',
  source: 'business',
  severity: 'warning',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['title'],
  group: 'duplicates',
  execute(input, context, config) {
    const drafts = context.existingDrafts
    if (!drafts || drafts.length === 0) return null
    const owner = input.ownerId ?? input.creatorId
    for (const draft of drafts) {
      if (input.id && draft.id === input.id) continue
      const status = (draft.status ?? 'draft').toLowerCase()
      if (status !== 'draft') continue
      const draftOwner = draft.ownerId ?? draft.creatorId
      if (owner && draftOwner && owner !== draftOwner) continue
      if (
        input.mainCollaborationModel &&
        draft.mainCollaborationModel &&
        input.mainCollaborationModel !== draft.mainCollaborationModel
      ) {
        continue
      }
      if (
        input.subModelType &&
        draft.subModelType &&
        input.subModelType !== draft.subModelType
      ) {
        continue
      }
      if (
        input.location &&
        draft.location &&
        input.location.toLowerCase() !== draft.location.toLowerCase()
      ) {
        continue
      }
      const similarity = titleSimilarity(input.title, draft.title)
      if (similarity >= config.duplicateSimilarityThreshold) {
        const issue: ValidationIssue = {
          code: VAL_CODES.DUP_SIMILAR_DRAFT,
          source: 'business',
          severity: 'warning',
          scope: DRAFT_UPDATE_PUBLISH,
          fieldPaths: ['title'],
          message: messageForCode(VAL_CODES.DUP_SIMILAR_DRAFT),
          layer: 'business',
          group: 'duplicates',
        }
        return issue
      }
    }
    return null
  },
}

export const DUPLICATE_RULES: readonly ValidationRule[] = [duplicateSimilarDraft]
