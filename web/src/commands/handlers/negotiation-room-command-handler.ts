import type {
  AcceptNegotiationOfferCommand,
  AddNegotiationAttachmentCommand,
  Command,
  CommandResult,
  EditNegotiationMessageCommand,
  LockNegotiationTranscriptCommand,
  RejectNegotiationOfferCommand,
  SendNegotiationMessageCommand,
  SubmitNegotiationCounterOfferCommand,
  SubmitNegotiationOfferCommand,
} from '@pm-twin/commands'
import { allowedTransitions, isTerminal, toCanonical } from '@pm-twin/lifecycle'
import type { AuditEntry, Negotiation } from '@/types/domain.ts'
import type { CommercialTerms } from '@/types/commercial-terms.ts'
import type {
  NegotiationAttachment,
  NegotiationMessage,
  NegotiationOffer,
  NegotiationTranscriptEvent,
} from '@/types/negotiation-discussion.ts'
import { normalizeParticipants } from '@/types/participant.ts'
import {
  diffCommercialTerms,
  validateNegotiationOfferTerms,
} from '@/domain/negotiation/validate-offer-terms.ts'
import type { AuditRepository } from '@/repositories/audit-repository.ts'
import type { NegotiationMessageRepository } from '@/repositories/negotiation-message-repository.ts'
import type { NegotiationOfferRepository } from '@/repositories/negotiation-offer-repository.ts'
import type { NegotiationRepository } from '@/repositories/negotiation-repository.ts'
import type { NegotiationTranscriptRepository } from '@/repositories/negotiation-transcript-repository.ts'
import type { UserRepository } from '@/repositories/user-repository.ts'

const NEGOTIATION_ENTITY = 'negotiation' as const
const WRITABLE_STATUSES = new Set(['active', 'countered'])
const AUDITOR_ROLES = new Set(['auditor', 'admin', 'moderator'])
const AGREED_STATUS = 'agreed' as const

export type NegotiationRoomCommandHandlerDeps = {
  readonly negotiationRepository: NegotiationRepository
  readonly messageRepository: NegotiationMessageRepository
  readonly offerRepository: NegotiationOfferRepository
  readonly transcriptRepository: NegotiationTranscriptRepository
  readonly auditRepository?: AuditRepository | null
  readonly userRepository?: UserRepository | null
}

function failure(
  commandType: string,
  aggregateId: string,
  errors: readonly string[],
): CommandResult {
  return { success: false, aggregateId, commandType, errors }
}

function success(commandType: string, aggregateId: string): CommandResult {
  return { success: true, aggregateId, commandType }
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export class NegotiationRoomCommandHandler {
  private readonly deps: NegotiationRoomCommandHandlerDeps

  constructor(deps: NegotiationRoomCommandHandlerDeps) {
    this.deps = deps
  }

  handle(command: Command): CommandResult {
    switch (command.commandType) {
      case 'SendNegotiationMessage':
        return this.handleSendMessage(command as SendNegotiationMessageCommand)
      case 'EditNegotiationMessage':
        return this.handleEditMessage(command as EditNegotiationMessageCommand)
      case 'AddNegotiationAttachment':
        return this.handleAddAttachment(command as AddNegotiationAttachmentCommand)
      case 'SubmitNegotiationOffer':
        return this.handleSubmitOffer(command as SubmitNegotiationOfferCommand, false)
      case 'SubmitNegotiationCounterOffer':
        return this.handleSubmitOffer(command as SubmitNegotiationCounterOfferCommand, true)
      case 'AcceptNegotiationOffer':
        return this.handleAcceptOffer(command as AcceptNegotiationOfferCommand)
      case 'RejectNegotiationOffer':
        return this.handleRejectOffer(command as RejectNegotiationOfferCommand)
      case 'LockNegotiationTranscript':
        return this.handleLockTranscript(command as LockNegotiationTranscriptCommand)
      default:
        return failure(command.commandType, command.aggregateId, [
          `Unsupported negotiation room command: ${command.commandType}`,
        ])
    }
  }

  private isAuditor(userId: string): boolean {
    const user = this.deps.userRepository?.getById(userId)
    return Boolean(user?.role && AUDITOR_ROLES.has(user.role))
  }

  private resolveParticipantRole(negotiation: Negotiation, userId: string): string | null {
    const participant = normalizeParticipants(
      negotiation.participants,
      negotiation.parties,
    ).find((item) => item.userId === userId)
    return participant?.role ?? null
  }

  private assertParticipantWrite(
    negotiation: Negotiation,
    userId: string,
    negotiationId: string,
  ): readonly string[] {
    if (!userId?.trim()) return ['userId is required']
    if (this.isAuditor(userId)) {
      return ['Auditors have read-only access to negotiation rooms']
    }
    if (!this.resolveParticipantRole(negotiation, userId)) {
      return ['Only negotiation participants can perform this action']
    }
    if (this.deps.transcriptRepository.isLocked(negotiationId)) {
      return ['Negotiation transcript is locked']
    }
    const canonical = toCanonical(NEGOTIATION_ENTITY, negotiation.status ?? '') ?? ''
    if (!WRITABLE_STATUSES.has(canonical)) {
      return [`Negotiation is read-only in status "${canonical || negotiation.status}"`]
    }
    return []
  }

  private appendTranscript(
    event: Omit<NegotiationTranscriptEvent, 'id' | 'timestamp'>,
  ): NegotiationTranscriptEvent {
    return this.deps.transcriptRepository.append({
      ...event,
      id: createId('tx'),
      timestamp: new Date().toISOString(),
    })
  }

  private appendAudit(
    entry: Omit<AuditEntry, 'id' | 'timestamp'>,
  ): void {
    this.deps.auditRepository?.append(entry)
  }

  private handleSendMessage(command: SendNegotiationMessageCommand): CommandResult {
    const negotiationId = command.aggregateId
    const negotiation = this.deps.negotiationRepository.getById(negotiationId)
    if (!negotiation) {
      return failure(command.commandType, negotiationId, ['Negotiation not found'])
    }

    const errors = this.assertParticipantWrite(
      negotiation,
      command.userId,
      negotiationId,
    )
    if (errors.length > 0) return failure(command.commandType, negotiationId, errors)
    if (!command.body?.trim()) {
      return failure(command.commandType, negotiationId, ['Message body is required'])
    }

    const role = this.resolveParticipantRole(negotiation, command.userId) ?? 'participant'
    const message: NegotiationMessage = {
      id: createId('msg'),
      negotiationId,
      senderId: command.userId,
      senderRole: role,
      body: command.body.trim(),
      visibility: command.visibility ?? 'participants',
      createdAt: new Date().toISOString(),
      attachments: command.attachments?.map((attachment) => ({
        id: createId('att'),
        ...attachment,
      })),
    }

    this.deps.messageRepository.append(message)
    this.appendTranscript({
      negotiationId,
      eventType: 'message.sent',
      actorId: command.userId,
      actorRole: role,
      summary: 'Negotiation message sent',
      metadata: { messageId: message.id },
    })
    this.appendAudit({
      action: 'negotiation.message.sent',
      entityType: 'negotiation',
      entityId: negotiationId,
      requestId: command.clientRequestId,
      details: { messageId: message.id, senderId: command.userId },
    })

    return success(command.commandType, negotiationId)
  }

  private handleEditMessage(command: EditNegotiationMessageCommand): CommandResult {
    const negotiationId = command.aggregateId
    const negotiation = this.deps.negotiationRepository.getById(negotiationId)
    if (!negotiation) {
      return failure(command.commandType, negotiationId, ['Negotiation not found'])
    }

    const errors = this.assertParticipantWrite(
      negotiation,
      command.userId,
      negotiationId,
    )
    if (errors.length > 0) return failure(command.commandType, negotiationId, errors)

    const message = this.deps.messageRepository.getById(command.messageId)
    if (!message || message.negotiationId !== negotiationId) {
      return failure(command.commandType, negotiationId, ['Message not found'])
    }
    if (message.senderId !== command.userId) {
      return failure(command.commandType, negotiationId, ['Only the sender can edit a message'])
    }

    const canonical = toCanonical(NEGOTIATION_ENTITY, negotiation.status ?? '') ?? ''
    if (canonical === AGREED_STATUS) {
      return failure(command.commandType, negotiationId, [
        'Messages cannot be edited after negotiation is agreed',
      ])
    }

    const originalBody = message.originalBody ?? message.body
    this.deps.messageRepository.update(command.messageId, {
      body: command.body.trim(),
      editedAt: new Date().toISOString(),
      originalBody,
    })

    this.appendTranscript({
      negotiationId,
      eventType: 'message.edited',
      actorId: command.userId,
      actorRole: message.senderRole,
      summary: 'Negotiation message edited',
      metadata: {
        messageId: message.id,
        previousBody: originalBody,
        nextBody: command.body.trim(),
      },
    })
    this.appendAudit({
      action: 'negotiation.message.edited',
      entityType: 'negotiation',
      entityId: negotiationId,
      requestId: command.clientRequestId,
      details: { messageId: message.id },
    })

    return success(command.commandType, negotiationId)
  }

  private handleAddAttachment(command: AddNegotiationAttachmentCommand): CommandResult {
    const negotiationId = command.aggregateId
    const negotiation = this.deps.negotiationRepository.getById(negotiationId)
    if (!negotiation) {
      return failure(command.commandType, negotiationId, ['Negotiation not found'])
    }

    const errors = this.assertParticipantWrite(
      negotiation,
      command.userId,
      negotiationId,
    )
    if (errors.length > 0) return failure(command.commandType, negotiationId, errors)

    const message = this.deps.messageRepository.getById(command.messageId)
    if (!message || message.negotiationId !== negotiationId) {
      return failure(command.commandType, negotiationId, ['Message not found'])
    }

    const attachment: NegotiationAttachment = {
      id: createId('att'),
      ...command.attachment,
    }
    this.deps.messageRepository.update(command.messageId, {
      attachments: [...(message.attachments ?? []), attachment],
    })

    this.appendTranscript({
      negotiationId,
      eventType: 'attachment.added',
      actorId: command.userId,
      actorRole: message.senderRole,
      summary: `Attachment added: ${attachment.fileName}`,
      metadata: { messageId: message.id, attachmentId: attachment.id },
    })
    this.appendAudit({
      action: 'negotiation.attachment.added',
      entityType: 'negotiation',
      entityId: negotiationId,
      requestId: command.clientRequestId,
      details: { messageId: message.id, attachment },
    })

    return success(command.commandType, negotiationId)
  }

  private handleSubmitOffer(
    command: SubmitNegotiationOfferCommand | SubmitNegotiationCounterOfferCommand,
    isCounter: boolean,
  ): CommandResult {
    const negotiationId = command.aggregateId
    const negotiation = this.deps.negotiationRepository.getById(negotiationId)
    if (!negotiation) {
      return failure(command.commandType, negotiationId, ['Negotiation not found'])
    }

    const errors = this.assertParticipantWrite(
      negotiation,
      command.userId,
      negotiationId,
    )
    if (errors.length > 0) return failure(command.commandType, negotiationId, errors)

    const terms = command.terms as CommercialTerms
    const validationErrors = validateNegotiationOfferTerms(negotiation, terms)
    if (validationErrors.length > 0) {
      return failure(command.commandType, negotiationId, validationErrors)
    }

    const previousOffers = this.deps.offerRepository.getByNegotiationId(negotiationId)
    const submittedOffers = previousOffers.filter((offer) => offer.status === 'submitted')
    if (submittedOffers.length > 0) {
      this.deps.offerRepository.updateMany(
        submittedOffers.map((offer) => offer.id),
        { status: 'superseded' },
      )
    }

    const version = this.deps.offerRepository.getLatestVersion(negotiationId) + 1
    const previousTerms =
      previousOffers.at(-1)?.terms ?? negotiation.commercialTerms ?? undefined
    const changeSummary =
      command.changeSummary
      ?? diffCommercialTerms(previousTerms, terms).join('; ')
      ?? undefined

    const offer: NegotiationOffer = {
      id: createId('offer'),
      negotiationId,
      submittedBy: command.userId,
      version,
      terms,
      changeSummary,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    }
    this.deps.offerRepository.append(offer)

    const targetStatus = isCounter ? 'countered' : 'active'
    const currentCanonical = toCanonical(NEGOTIATION_ENTITY, negotiation.status ?? '') ?? ''
    if (currentCanonical !== targetStatus && !isTerminal(NEGOTIATION_ENTITY, negotiation.status)) {
      const allowed = allowedTransitions(NEGOTIATION_ENTITY, negotiation.status ?? '')
      const targetCanonical = toCanonical(NEGOTIATION_ENTITY, targetStatus)
      if (targetCanonical && allowed.includes(targetCanonical)) {
        this.deps.negotiationRepository.update(negotiationId, {
          status: targetStatus,
          commercialTerms: terms,
        })
      } else if (isCounter) {
        this.deps.negotiationRepository.update(negotiationId, {
          commercialTerms: terms,
        })
      }
    } else {
      this.deps.negotiationRepository.update(negotiationId, { commercialTerms: terms })
    }

    const role = this.resolveParticipantRole(negotiation, command.userId) ?? 'participant'
    this.appendTranscript({
      negotiationId,
      eventType: isCounter ? 'offer.countered' : 'offer.submitted',
      actorId: command.userId,
      actorRole: role,
      summary: isCounter
        ? `Counter offer v${version} submitted`
        : `Offer v${version} submitted`,
      metadata: { offerId: offer.id, version, changeSummary },
    })
    this.appendTranscript({
      negotiationId,
      eventType: 'terms.changed',
      actorId: command.userId,
      actorRole: role,
      summary: 'Commercial terms updated from offer',
      metadata: { offerId: offer.id, terms },
    })
    this.appendAudit({
      action: isCounter ? 'negotiation.counter.submitted' : 'negotiation.offer.submitted',
      entityType: 'negotiation',
      entityId: negotiationId,
      requestId: command.clientRequestId,
      details: { offerId: offer.id, version },
    })

    return success(command.commandType, negotiationId)
  }

  private handleAcceptOffer(command: AcceptNegotiationOfferCommand): CommandResult {
    const negotiationId = command.aggregateId
    const negotiation = this.deps.negotiationRepository.getById(negotiationId)
    if (!negotiation) {
      return failure(command.commandType, negotiationId, ['Negotiation not found'])
    }

    const errors = this.assertParticipantWrite(
      negotiation,
      command.userId,
      negotiationId,
    )
    if (errors.length > 0) return failure(command.commandType, negotiationId, errors)

    const offer = this.deps.offerRepository.getById(command.offerId)
    if (!offer || offer.negotiationId !== negotiationId) {
      return failure(command.commandType, negotiationId, ['Offer not found'])
    }
    if (offer.status !== 'submitted') {
      return failure(command.commandType, negotiationId, [
        'Only submitted offers can be accepted',
      ])
    }

    const otherOffers = this.deps.offerRepository
      .getByNegotiationId(negotiationId)
      .filter((item) => item.id !== offer.id && item.status === 'submitted')
    if (otherOffers.length > 0) {
      this.deps.offerRepository.updateMany(
        otherOffers.map((item) => item.id),
        { status: 'rejected' },
      )
    }
    this.deps.offerRepository.updateMany([offer.id], { status: 'accepted' })

    this.deps.negotiationRepository.update(negotiationId, {
      status: AGREED_STATUS,
      commercialTerms: offer.terms,
      agreedTerms: offer.terms,
    })

    const role = this.resolveParticipantRole(negotiation, command.userId) ?? 'participant'
    this.appendTranscript({
      negotiationId,
      eventType: 'negotiation.agreed',
      actorId: command.userId,
      actorRole: role,
      summary: `Offer v${offer.version} accepted`,
      metadata: { offerId: offer.id },
    })
    this.appendAudit({
      action: 'negotiation.offer.accepted',
      entityType: 'negotiation',
      entityId: negotiationId,
      requestId: command.clientRequestId,
      details: { offerId: offer.id, version: offer.version },
    })

    return success(command.commandType, negotiationId)
  }

  private handleRejectOffer(command: RejectNegotiationOfferCommand): CommandResult {
    const negotiationId = command.aggregateId
    const negotiation = this.deps.negotiationRepository.getById(negotiationId)
    if (!negotiation) {
      return failure(command.commandType, negotiationId, ['Negotiation not found'])
    }

    const errors = this.assertParticipantWrite(
      negotiation,
      command.userId,
      negotiationId,
    )
    if (errors.length > 0) return failure(command.commandType, negotiationId, errors)

    const offer = this.deps.offerRepository.getById(command.offerId)
    if (!offer || offer.negotiationId !== negotiationId) {
      return failure(command.commandType, negotiationId, ['Offer not found'])
    }

    this.deps.offerRepository.updateMany([offer.id], { status: 'rejected' })
    const role = this.resolveParticipantRole(negotiation, command.userId) ?? 'participant'
    this.appendAudit({
      action: 'negotiation.offer.rejected',
      entityType: 'negotiation',
      entityId: negotiationId,
      requestId: command.clientRequestId,
      details: { offerId: offer.id, reason: command.reason },
    })
    this.appendTranscript({
      negotiationId,
      eventType: 'terms.changed',
      actorId: command.userId,
      actorRole: role,
      summary: `Offer v${offer.version} rejected`,
      metadata: { offerId: offer.id, reason: command.reason },
    })

    return success(command.commandType, negotiationId)
  }

  private handleLockTranscript(command: LockNegotiationTranscriptCommand): CommandResult {
    const negotiationId = command.aggregateId
    const negotiation = this.deps.negotiationRepository.getById(negotiationId)
    if (!negotiation) {
      return failure(command.commandType, negotiationId, ['Negotiation not found'])
    }

    if (this.deps.transcriptRepository.isLocked(negotiationId)) {
      return success(command.commandType, negotiationId)
    }

    const canonical = toCanonical(NEGOTIATION_ENTITY, negotiation.status ?? '') ?? ''
    if (!['agreed', 'cancelled', 'expired'].includes(canonical)) {
      return failure(command.commandType, negotiationId, [
        'Transcript can only be locked for terminal negotiations',
      ])
    }

    const role = this.resolveParticipantRole(negotiation, command.userId)
      ?? (this.isAuditor(command.userId) ? 'auditor' : 'participant')

    this.appendTranscript({
      negotiationId,
      eventType: 'transcript.locked',
      actorId: command.userId,
      actorRole: role,
      summary: 'Negotiation transcript locked',
    })
    this.appendAudit({
      action: 'negotiation.transcript.locked',
      entityType: 'negotiation',
      entityId: negotiationId,
      requestId: command.clientRequestId,
      details: { lockedBy: command.userId },
    })

    return success(command.commandType, negotiationId)
  }
}
