import type { Party } from '@pm-twin/party'
import type { PlatformUser } from '@/types/domain.ts'
import type { PartyDocument, PartyDocumentCategory } from '@/types/party-document.ts'
import type { VettingMetadata } from '@/types/vetting.ts'
import { VETTING_QUEUE_STATUSES } from '@/types/vetting.ts'
import { partiesApi } from '@/api/parties.ts'
import { peopleApi } from '@/api/people.ts'
import {
  auditRepository,
  companyRepository,
  partyDocumentRepository,
  partyRepository,
  userRepository,
} from '@/repositories/index.ts'

export type VettingQueueEntry = {
  user: PlatformUser
  activeParty: Party | null
  partyLabel: string
}

export type RequestVettingChangesInput = {
  userId: string
  partyId: string
  reviewerId: string
  reason: string
  requestedItems: string[]
  dueDate?: string
}

export type ReplacePartyDocumentInput = {
  ownerPartyId: string
  uploadedByUserId: string
  documentCategory: PartyDocumentCategory
  documentType: string
  fileName: string
  expiryDate?: string
  replaceDocumentId?: string
}

export type VettingServiceDeps = {
  readonly peopleApi: typeof peopleApi
  readonly partiesApi: typeof partiesApi
  readonly userRepository: typeof userRepository
  readonly companyRepository: typeof companyRepository
  readonly partyRepository: typeof partyRepository
  readonly partyDocumentRepository: typeof partyDocumentRepository
  readonly auditRepository: typeof auditRepository
}

const defaultDeps: VettingServiceDeps = {
  peopleApi,
  partiesApi,
  userRepository,
  companyRepository,
  partyRepository,
  partyDocumentRepository,
  auditRepository,
}

function isVettingQueueStatus(status: string): boolean {
  return (VETTING_QUEUE_STATUSES as readonly string[]).includes(status)
}

function syncPartyStatus(deps: VettingServiceDeps, partyId: string, status: string): void {
  deps.partyRepository.updateStatus(partyId, status)
  const company = deps.companyRepository.getById(partyId)
  if (company) {
    deps.companyRepository.update(partyId, { status })
  }
}

function appendVettingMetadata(
  deps: VettingServiceDeps,
  userId: string,
  metadata: VettingMetadata,
  status: string,
): PlatformUser | undefined {
  const existing = deps.userRepository.getById(userId)
  if (!existing) return undefined

  return deps.userRepository.update(userId, {
    status,
    profile: {
      ...existing.profile,
      vetting: {
        ...existing.profile?.vetting,
        ...metadata,
      },
    },
  })
}

export function createVettingService(deps: VettingServiceDeps = defaultDeps) {
  return {
    listQueue(): VettingQueueEntry[] {
      return deps.peopleApi
        .listUsers()
        .filter((user) => isVettingQueueStatus(user.status))
        .map((user) => {
          const activeParty = deps.partiesApi.resolveActiveParty(user.id)
          return {
            user,
            activeParty: activeParty ?? null,
            partyLabel:
              activeParty?.partyType === 'company'
                ? 'Company Party'
                : 'Individual Party',
          }
        })
    },

    approve(userId: string, partyId: string, reviewerId: string): PlatformUser | undefined {
      const user = deps.userRepository.update(userId, { status: 'active' })
      if (!user) return undefined

      syncPartyStatus(deps, partyId, 'active')

      deps.auditRepository.append({
        action: 'user.vetting_approved',
        userId: reviewerId,
        entityType: 'user',
        entityId: userId,
        details: { partyId },
      })
      deps.auditRepository.append({
        action: 'party.vetting_approved',
        userId: reviewerId,
        entityType: 'party',
        entityId: partyId,
        details: { userId },
      })

      return user
    },

    reject(
      userId: string,
      partyId: string,
      reviewerId: string,
      reason?: string,
    ): PlatformUser | undefined {
      const user = deps.userRepository.update(userId, { status: 'rejected' })
      if (!user) return undefined

      syncPartyStatus(deps, partyId, 'rejected')

      deps.auditRepository.append({
        action: 'user.vetting_rejected',
        userId: reviewerId,
        entityType: 'user',
        entityId: userId,
        details: { partyId, reason },
      })
      deps.auditRepository.append({
        action: 'party.vetting_rejected',
        userId: reviewerId,
        entityType: 'party',
        entityId: partyId,
        details: { userId, reason },
      })

      return user
    },

    requestChanges(input: RequestVettingChangesInput): PlatformUser | undefined {
      const reviewedAt = new Date().toISOString()
      const user = appendVettingMetadata(
        deps,
        input.userId,
        {
          reason: input.reason,
          requestedItems: input.requestedItems,
          dueDate: input.dueDate,
          reviewerId: input.reviewerId,
          reviewedAt,
        },
        'clarification_requested',
      )
      if (!user) return undefined

      syncPartyStatus(deps, input.partyId, 'clarification_requested')

      deps.auditRepository.append({
        action: 'vetting.changes_requested',
        userId: input.reviewerId,
        entityType: 'user',
        entityId: input.userId,
        details: {
          partyId: input.partyId,
          reason: input.reason,
          requestedItems: input.requestedItems,
          dueDate: input.dueDate,
        },
      })

      return user
    },

    updateProfile(
      userId: string,
      profilePatch: NonNullable<PlatformUser['profile']>,
    ): PlatformUser | undefined {
      const existing = deps.userRepository.getById(userId)
      if (!existing) return undefined
      if (existing.status !== 'pending' && existing.status !== 'clarification_requested') {
        return undefined
      }

      const updated = deps.userRepository.update(userId, {
        profile: {
          ...existing.profile,
          ...profilePatch,
        },
      })

      if (updated) {
        deps.auditRepository.append({
          action: 'vetting.profile_updated',
          userId,
          entityType: 'user',
          entityId: userId,
        })
      }

      return updated
    },

    replacePartyDocument(input: ReplacePartyDocumentInput): PartyDocument {
      if (input.replaceDocumentId) {
        deps.partyDocumentRepository.update(input.replaceDocumentId, {
          status: 'replacement_requested',
        })
      }

      const document = deps.partyDocumentRepository.create({
        ownerPartyId: input.ownerPartyId,
        uploadedByUserId: input.uploadedByUserId,
        documentCategory: input.documentCategory,
        documentType: input.documentType,
        fileName: input.fileName,
        status: 'pending_review',
        expiryDate: input.expiryDate,
      })

      deps.auditRepository.append({
        action: 'vetting.document_replaced',
        userId: input.uploadedByUserId,
        entityType: 'party_document',
        entityId: document.id,
        details: {
          ownerPartyId: input.ownerPartyId,
          documentType: input.documentType,
          fileName: input.fileName,
          replacedDocumentId: input.replaceDocumentId,
        },
      })

      return document
    },

    resubmitForReview(userId: string, partyId: string): PlatformUser | undefined {
      const existing = deps.userRepository.getById(userId)
      if (!existing) return undefined
      if (existing.status !== 'clarification_requested' && existing.status !== 'pending') {
        return undefined
      }

      const user = appendVettingMetadata(
        deps,
        userId,
        {
          ...existing.profile?.vetting,
          lastResubmittedAt: new Date().toISOString(),
        },
        'pending',
      )
      if (!user) return undefined

      syncPartyStatus(deps, partyId, 'pending')

      deps.auditRepository.append({
        action: 'vetting.resubmitted',
        userId,
        entityType: 'user',
        entityId: userId,
        details: { partyId },
      })

      return user
    },

    listPartyDocuments(ownerPartyId: string): PartyDocument[] {
      return deps.partyDocumentRepository.listForParty(ownerPartyId)
    },
  }
}

export const vettingService = createVettingService()
