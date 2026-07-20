import type { Party } from '@pm-twin/party'
import type { PlatformUser } from '@/types/domain.ts'
import type { PartyDocument, PartyDocumentCategory } from '@/types/party-document.ts'
import type { VettingCaseStatus, VettingMetadata } from '@/types/vetting.ts'
import {
  VETTING_QUEUE_STATUSES,
  resolveVettingCaseStatus,
  userStatusForVettingCase,
} from '@/types/vetting.ts'
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
  workspaceMembershipRepository,
  workspaceRepository,
} from '@/repositories/index.ts'
import type { NotificationType } from '@/types/enums.ts'

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
  readonly workspaceRepository?: typeof workspaceRepository
  readonly workspaceMembershipRepository?: typeof workspaceMembershipRepository
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
  workspaceRepository,
  workspaceMembershipRepository,
}

function isVettingQueueStatus(status: string): boolean {
  return (VETTING_QUEUE_STATUSES as readonly string[]).includes(status)
}

function syncPartyStatus(
  deps: VettingServiceDeps,
  partyId: string,
  status: string,
  sourceUser?: PlatformUser,
): void {
  deps.partyRepository.updateStatus(partyId, status)
  const party =
    typeof deps.partyRepository.getById === 'function'
      ? deps.partyRepository.getById(partyId)
      : undefined
  const sourceEntityId = party?.sourceEntityId ?? partyId
  const company = deps.companyRepository.getById(sourceEntityId)
  if (company) {
    deps.companyRepository.update(sourceEntityId, {
      status,
      ...(sourceUser?.profile?.vetting
        ? {
            profile: {
              ...company.profile,
              vetting: sourceUser.profile.vetting,
            },
          }
        : {}),
    })
    return
  }
  const individual = deps.userRepository.getById(sourceEntityId)
  if (individual && individual.id !== sourceUser?.id) {
    deps.userRepository.update(sourceEntityId, {
      status,
      ...(sourceUser?.profile?.vetting
        ? {
            profile: {
              ...individual.profile,
              vetting: sourceUser.profile.vetting,
            },
          }
        : {}),
    })
  }
}

function createVettingNotification(
  deps: VettingServiceDeps,
  input: {
    userId: string
    title: string
    message: string
    entityId?: string
    type?: NotificationType
  },
): void {
  deps.notificationRepository.create({
    userId: input.userId,
    title: input.title,
    message: input.message,
    read: false,
    type: input.type ?? 'review_received',
    entityType: 'user',
    entityId: input.entityId ?? input.userId,
  })
}

function activateWorkspaceGraph(
  deps: VettingServiceDeps,
  userId: string,
  partyId: string,
): void {
  try {
    const party = deps.partyRepository.getById(partyId)
    const workspaceId = party?.workspaceId
    if (workspaceId && deps.workspaceRepository && deps.workspaceMembershipRepository) {
      const workspace = deps.workspaceRepository.getById(workspaceId)
      if (workspace && workspace.status !== 'active') {
        deps.workspaceRepository.create({
          ...workspace,
          status: 'active',
          updatedAt: new Date().toISOString(),
        })
      }
      const memberships = deps.workspaceMembershipRepository
        .listMembershipsByUserId(userId)
        .filter((m) => m.workspaceId === workspaceId)
      for (const membership of memberships) {
        if (membership.status !== 'active') {
          deps.workspaceMembershipRepository.updateStatus(membership.id, 'active')
        }
      }
    }
  } catch {
    // Activation notifications still fire; workspace repos optional in unit tests.
  }
  createVettingNotification(deps, {
    userId,
    title: 'Workspace activated',
    message: 'Your workspace is active. You can now use full collaboration capabilities.',
    type: 'workspace_activated',
  })
  createVettingNotification(deps, {
    userId,
    title: 'Membership activated',
    message: 'Your workspace membership is active.',
    type: 'membership_activated',
  })
  createVettingNotification(deps, {
    userId,
    title: 'Opportunity creation enabled',
    message: 'You can now create and publish opportunities.',
    type: 'opportunity_enabled',
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
      const caseStatus: VettingCaseStatus = 'approved'
      const user = appendVettingMetadata(
        deps,
        userId,
        {
          caseStatus,
          reviewProgress: 'approved',
          reviewedBy: reviewerId,
          reviewerId,
          reviewedAt,
          slaStatus: 'on_track',
        },
        userStatusForVettingCase(caseStatus),
      )
      if (!user) return undefined

      syncPartyStatus(deps, partyId, 'active', user)
      activateWorkspaceGraph(deps, userId, partyId)

      deps.auditRepository.append({
        action: 'vetting.approved',
        userId: reviewerId,
        entityType: 'user',
        entityId: userId,
        details: { partyId, caseStatus },
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
        type: 'registration_approved',
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
      const caseStatus: VettingCaseStatus = 'rejected'
      const user = appendVettingMetadata(
        deps,
        userId,
        {
          caseStatus,
          reason,
          reviewNotes: reason,
          reviewedBy: reviewerId,
          reviewerId,
          reviewedAt,
          slaStatus: 'on_track',
        },
        userStatusForVettingCase(caseStatus),
      )
      if (!user) return undefined

      syncPartyStatus(deps, partyId, 'rejected', user)

      deps.auditRepository.append({
        action: 'vetting.rejected',
        userId: reviewerId,
        entityType: 'user',
        entityId: userId,
        details: { partyId, reason, caseStatus },
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
        type: 'registration_rejected',
      })

      return user
    },

    submitForReview(userId: string, partyId: string): PlatformUser | undefined {
      const existing = deps.userRepository.getById(userId)
      if (!existing) return undefined
      const submittedAt = new Date().toISOString()
      const caseStatus: VettingCaseStatus = 'submitted'
      const user = appendVettingMetadata(
        deps,
        userId,
        {
          ...existing.profile?.vetting,
          caseStatus,
          submittedAt,
          reviewProgress: 'in_review',
          slaStatus: resolveVettingSlaStatus(existing),
        },
        userStatusForVettingCase(caseStatus),
      )
      if (!user) return undefined
      syncPartyStatus(deps, partyId, 'pending_vetting', user)
      // Move to pending_review once queued
      appendVettingMetadata(
        deps,
        userId,
        {
          caseStatus: 'pending_review',
          submittedAt,
          reviewProgress: 'in_review',
        },
        'pending_vetting',
      )
      deps.auditRepository.append({
        action: 'vetting.submitted',
        userId,
        entityType: 'user',
        entityId: userId,
        details: { partyId, caseStatus: 'pending_review' },
      })
      createVettingNotification(deps, {
        userId,
        title: 'Registration submitted',
        message: 'Your onboarding package was submitted for enterprise review.',
        type: 'registration_submitted',
      })
      return deps.userRepository.getById(userId)
    },

    suspend(
      userId: string,
      partyId: string,
      reviewerId: string,
      reason?: string,
    ): PlatformUser | undefined {
      const caseStatus: VettingCaseStatus = 'suspended'
      const reviewedAt = new Date().toISOString()
      const user = appendVettingMetadata(
        deps,
        userId,
        {
          caseStatus,
          reason,
          reviewNotes: reason,
          reviewedBy: reviewerId,
          reviewerId,
          reviewedAt,
        },
        userStatusForVettingCase(caseStatus),
      )
      if (!user) return undefined
      syncPartyStatus(deps, partyId, 'suspended', user)
      deps.auditRepository.append({
        action: 'vetting.suspended',
        userId: reviewerId,
        entityType: 'user',
        entityId: userId,
        details: { partyId, reason, caseStatus },
      })
      createVettingNotification(deps, {
        userId,
        title: 'Account suspended',
        message: reason || 'Your account has been suspended pending review.',
        type: 'registration_rejected',
      })
      return user
    },

    reassign(
      userId: string,
      reviewerId: string,
      assignedReviewerId: string,
    ): PlatformUser | undefined {
      const existing = deps.userRepository.getById(userId)
      if (!existing) return undefined
      const user = appendVettingMetadata(
        deps,
        userId,
        {
          ...existing.profile?.vetting,
          assignedReviewerId,
          reviewerId: assignedReviewerId,
        },
        existing.status,
      )
      if (!user) return undefined
      deps.auditRepository.append({
        action: 'vetting.reassigned',
        userId: reviewerId,
        entityType: 'user',
        entityId: userId,
        details: { assignedReviewerId },
      })
      return user
    },

    escalate(userId: string, actorId: string, reason?: string): PlatformUser | undefined {
      const existing = deps.userRepository.getById(userId)
      if (!existing) return undefined
      const escalationAt = new Date().toISOString()
      const user = appendVettingMetadata(
        deps,
        userId,
        {
          ...existing.profile?.vetting,
          escalationAt,
          slaStatus: 'overdue',
          reason: reason ?? existing.profile?.vetting?.reason,
        },
        existing.status,
      )
      if (!user) return undefined
      deps.auditRepository.append({
        action: 'vetting.escalated',
        userId: actorId,
        entityType: 'user',
        entityId: userId,
        details: { escalationAt, reason },
      })
      return user
    },

    requestChanges(input: RequestVettingChangesInput): PlatformUser | undefined {
      const existing = deps.userRepository.getById(input.userId)
      const reviewedAt = new Date().toISOString()
      const slaStatus = existing ? resolveVettingSlaStatus(existing) : 'on_track'
      const caseStatus: VettingCaseStatus = 'clarification_requested'
      const user = appendVettingMetadata(
        deps,
        input.userId,
        {
          caseStatus,
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
        userStatusForVettingCase(caseStatus),
      )
      if (!user) return undefined

      syncPartyStatus(deps, input.partyId, 'pending_vetting', user)

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
          caseStatus,
        },
      })
      createVettingNotification(deps, {
        userId: input.userId,
        title: 'Clarification requested',
        message: input.reason,
        type: 'clarification_requested',
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
      const currentCase = resolveVettingCaseStatus(existing.profile?.vetting, existing.status)
      if (
        currentCase !== 'clarification_requested' &&
        existing.status !== 'clarification_requested' &&
        existing.status !== 'pending' &&
        existing.status !== 'pending_vetting'
      ) {
        return undefined
      }

      const caseStatus: VettingCaseStatus = 'resubmitted'
      const user = appendVettingMetadata(
        deps,
        userId,
        {
          ...existing.profile?.vetting,
          caseStatus,
          lastResubmittedAt: new Date().toISOString(),
          reviewProgress: 'in_review',
          changesResolved: true,
          slaStatus: resolveVettingSlaStatus(existing),
        },
        userStatusForVettingCase(caseStatus),
      )
      if (!user) return undefined

      syncPartyStatus(deps, partyId, 'pending_vetting', user)

      deps.auditRepository.append({
        action: 'vetting.resubmitted',
        userId,
        entityType: 'user',
        entityId: userId,
        details: { partyId, caseStatus },
      })
      createVettingNotification(deps, {
        userId,
        title: 'Resubmission received',
        message: 'Your onboarding updates were resubmitted and queued for review.',
        type: 'registration_submitted',
      })

      return user
    },

    listByCaseStatus(caseStatus: VettingCaseStatus): VettingQueueEntry[] {
      return deps.peopleApi
        .listAll()
        .filter((user) => resolveVettingCaseStatus(user.profile?.vetting, user.status) === caseStatus)
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
        const statusChanged = existing?.slaStatus !== slaStatus
        const needsEscalationStamp =
          slaStatus === 'overdue' && !existing?.escalationAt

        // Idempotent: never write (or notify the data store) when nothing changed.
        if (!statusChanged && !needsEscalationStamp) {
          continue
        }

        const escalationAt = needsEscalationStamp
          ? new Date().toISOString()
          : existing?.escalationAt

        appendVettingMetadata(deps, entry.user.id, {
          ...existing,
          slaStatus,
          escalationAt,
        }, entry.user.status)

        if (needsEscalationStamp) {
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
