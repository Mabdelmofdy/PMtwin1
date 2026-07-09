import type { Party } from '@pm-twin/party'
import type { PlatformUser } from '@/types/domain.ts'
import type { PartyDocument, PartyDocumentCategory } from '@/types/party-document.ts'
import type { VettingMetadata } from '@/types/vetting.ts'
import { VETTING_QUEUE_STATUSES } from '@/types/vetting.ts'
import { resolveVettingSlaStatus } from '@/lib/vetting-sla-service.ts'
import { partiesApi } from '@/api/parties.ts'
import { peopleApi } from '@/api/people.ts'
import {
  auditRepository,
  companyRepository,
  notificationRepository,
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
  readonly notificationRepository: typeof notificationRepository
}

const defaultDeps: VettingServiceDeps = {
  peopleApi,
  partiesApi,
  userRepository,
  companyRepository,
  partyRepository,
  partyDocumentRepository,
  auditRepository,
  notificationRepository,
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

function createVettingNotification(
  deps: VettingServiceDeps,
  input: {
    userId: string
    title: string
    message: string
    entityId?: string
  },
): void {
  deps.notificationRepository.create({
    userId: input.userId,
    title: input.title,
    message: input.message,
    read: false,
    type: 'review_received',
    entityType: 'user',
    entityId: input.entityId ?? input.userId,
  })
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
        .listAll()
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
      const reviewedAt = new Date().toISOString()
      const user = appendVettingMetadata(
        deps,
        userId,
        {
          reviewProgress: 'approved',
          reviewedBy: reviewerId,
          reviewerId,
          reviewedAt,
          slaStatus: 'on_track',
        },
        'active',
      )
      if (!user) return undefined

      syncPartyStatus(deps, partyId, 'active')

      deps.auditRepository.append({
        action: 'vetting.approved',
        userId: reviewerId,
        entityType: 'user',
        entityId: userId,
        details: { partyId },
      })
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
      createVettingNotification(deps, {
        userId,
        title: 'Account approved',
        message: 'Your onboarding review is complete. You can now perform full platform actions.',
      })

      return user
    },

    approveAccount(userId: string, partyId: string, reviewerId: string): PlatformUser | undefined {
      return this.approve(userId, partyId, reviewerId)
    },

    reject(
      userId: string,
      partyId: string,
      reviewerId: string,
      reason?: string,
    ): PlatformUser | undefined {
      const reviewedAt = new Date().toISOString()
      const user = appendVettingMetadata(
        deps,
        userId,
        {
          reason,
          reviewNotes: reason,
          reviewedBy: reviewerId,
          reviewerId,
          reviewedAt,
          slaStatus: 'on_track',
        },
        'rejected',
      )
      if (!user) return undefined

      syncPartyStatus(deps, partyId, 'rejected')

      deps.auditRepository.append({
        action: 'vetting.rejected',
        userId: reviewerId,
        entityType: 'user',
        entityId: userId,
        details: { partyId, reason },
      })
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
      createVettingNotification(deps, {
        userId,
        title: 'Account rejected',
        message: reason || 'Your onboarding submission was rejected. Please contact support.',
      })

      return user
    },

    requestChanges(input: RequestVettingChangesInput): PlatformUser | undefined {
      const existing = deps.userRepository.getById(input.userId)
      const reviewedAt = new Date().toISOString()
      const slaStatus = existing ? resolveVettingSlaStatus(existing) : 'on_track'
      const user = appendVettingMetadata(
        deps,
        input.userId,
        {
          reason: input.reason,
          reviewNotes: input.reason,
          requestedItems: input.requestedItems,
          requestedChanges: input.requestedItems,
          dueDate: input.dueDate,
          reviewerId: input.reviewerId,
          reviewedBy: input.reviewerId,
          reviewedAt,
          reviewProgress: 'changes_requested',
          changesResolved: false,
          slaStatus,
        },
        'pending_vetting',
      )
      if (!user) return undefined

      syncPartyStatus(deps, input.partyId, 'pending_vetting')

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
      createVettingNotification(deps, {
        userId: input.userId,
        title: 'Changes requested',
        message: input.reason,
      })

      return user
    },

    updateProfile(
      userId: string,
      profilePatch: NonNullable<PlatformUser['profile']>,
    ): PlatformUser | undefined {
      const existing = deps.userRepository.getById(userId)
      if (!existing) return undefined
      if (
        existing.status !== 'pending' &&
        existing.status !== 'pending_vetting' &&
        existing.status !== 'clarification_requested'
      ) {
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
      deps.notificationRepository.create({
        userId: input.uploadedByUserId,
        title: 'Document replaced',
        message: `${input.documentType} was uploaded for review.`,
        read: false,
        type: 'review_received',
        entityType: 'notification',
      })

      return document
    },

    resubmitForReview(userId: string, partyId: string): PlatformUser | undefined {
      const existing = deps.userRepository.getById(userId)
      if (!existing) return undefined
      if (
        existing.status !== 'clarification_requested' &&
        existing.status !== 'pending' &&
        existing.status !== 'pending_vetting'
      ) {
        return undefined
      }

      const user = appendVettingMetadata(
        deps,
        userId,
        {
          ...existing.profile?.vetting,
          lastResubmittedAt: new Date().toISOString(),
          reviewProgress: 'in_review',
          changesResolved: true,
          slaStatus: resolveVettingSlaStatus(existing),
        },
        'pending_vetting',
      )
      if (!user) return undefined

      syncPartyStatus(deps, partyId, 'pending_vetting')

      deps.auditRepository.append({
        action: 'vetting.resubmitted',
        userId,
        entityType: 'user',
        entityId: userId,
        details: { partyId },
      })
      createVettingNotification(deps, {
        userId,
        title: 'Resubmission received',
        message: 'Your onboarding updates were resubmitted and queued for review.',
      })

      return user
    },

    listHistory(): VettingQueueEntry[] {
      return deps.peopleApi
        .listAll()
        .filter(
          (user) =>
            (user.status === 'active' || user.status === 'rejected') &&
            Boolean(user.profile?.vetting?.reviewedAt),
        )
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

    syncSlaEscalations(): void {
      for (const entry of this.listQueue()) {
        const slaStatus = resolveVettingSlaStatus(entry.user)
        const existing = entry.user.profile?.vetting
        if (existing?.slaStatus === slaStatus && slaStatus !== 'overdue') {
          continue
        }

        const escalationAt =
          slaStatus === 'overdue' && !existing?.escalationAt
            ? new Date().toISOString()
            : existing?.escalationAt

        appendVettingMetadata(deps, entry.user.id, {
          ...existing,
          slaStatus,
          escalationAt,
        }, entry.user.status)

        if (slaStatus === 'overdue' && !existing?.escalationAt) {
          deps.auditRepository.append({
            action: 'vetting.escalated',
            userId: entry.user.id,
            entityType: 'user',
            entityId: entry.user.id,
            details: { slaStatus, escalationAt },
          })
          createVettingNotification(deps, {
            userId: entry.user.id,
            title: 'Review overdue',
            message: 'Your onboarding review is overdue. Our team has been notified.',
          })
        }
      }
    },

    listPartyDocuments(ownerPartyId: string): PartyDocument[] {
      return deps.partyDocumentRepository.listForParty(ownerPartyId)
    },

    reviewPartyDocument(
      documentId: string,
      input: {
        status: 'approved' | 'rejected'
        reviewedBy: string
        reviewNotes?: string
      },
    ): PartyDocument | undefined {
      const existing = deps.partyDocumentRepository.getById(documentId)
      if (!existing) return undefined

      const updated = deps.partyDocumentRepository.update(documentId, {
        status: input.status,
        reviewedBy: input.reviewedBy,
        reviewedAt: new Date().toISOString(),
        reviewNotes: input.reviewNotes,
      })
      if (!updated) return undefined

      deps.notificationRepository.create({
        userId: existing.uploadedByUserId,
        title:
          input.status === 'approved'
            ? 'Document approved'
            : 'Document rejected',
        message:
          input.status === 'approved'
            ? `${existing.documentType} has been approved.`
            : `${existing.documentType} was rejected. ${input.reviewNotes ?? ''}`.trim(),
        read: false,
        type: 'review_received',
        entityType: 'notification',
      })

      deps.auditRepository.append({
        action:
          input.status === 'approved'
            ? 'vetting.document_approved'
            : 'vetting.document_rejected',
        userId: input.reviewedBy,
        entityType: 'party_document',
        entityId: documentId,
        details: {
          ownerPartyId: existing.ownerPartyId,
          reviewNotes: input.reviewNotes,
        },
      })

      return updated
    },
  }
}

export const vettingService = createVettingService()
