import type {
  AcceptPostMatchCommand,
  Command,
  CommandResult,
  ConfirmPostMatchCommand,
  DeclinePostMatchCommand,
  DiscoverPostMatchCommand,
  ExpirePostMatchCommand,
  SupersedePostMatchCommand,
  TransitionPostMatchStatusCommand,
} from '@pm-twin/commands'
import {
  isDiscoverCircularPostMatch,
  isDiscoverConsortiumPostMatch,
  isDiscoverOneWayPostMatch,
  isDiscoverTwoWayPostMatch,
} from '@/domain/normalized/post-match-topology-guards.ts'
import {
  allowedTransitions,
  getFsm,
  isTerminal,
  toCanonical,
} from '@pm-twin/lifecycle'
import type { AuditEntry, PostMatch } from '@/types/domain.ts'
import type { Participant } from '@/types/participant.ts'
import {
  discoverPostMatchStrongKey,
  validateDiscoverPostMatchCommand,
} from '@/domain/normalized/post-match-discover-validation.ts'
import type { AuditRepository } from '@/repositories/audit-repository.ts'
import type { PostMatchRepository } from '@/repositories/post-match-repository.ts'
import {
  emitParticipantNotifications,
  type NotificationSink,
} from '@/commands/handlers/lifecycle-notifications.ts'
import { getCommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'

/** Canonical lifecycle entity key — never use `post_match`. */
export const POST_MATCH_ENTITY_TYPE = 'match' as const

export type PostMatchCommandHandlerDeps = {
  readonly postMatchRepository: PostMatchRepository
  readonly auditRepository?: AuditRepository | null
  readonly notificationRepository?: NotificationSink | null
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

function validateBaseCommand(command: Command): readonly string[] {
  const errors: string[] = []
  if (!command.commandType?.trim()) {
    errors.push('commandType is required')
  }
  if (!command.aggregateId?.trim()) {
    errors.push('aggregateId is required')
  }
  if (!command.clientRequestId?.trim()) {
    errors.push('clientRequestId is required')
  }
  return errors
}

function validateTransition(
  currentStatus: string,
  targetStatus: string,
): readonly string[] {
  const fsm = getFsm(POST_MATCH_ENTITY_TYPE)
  if (!fsm) {
    return ['Match lifecycle FSM is not available']
  }

  const fromCanonical = toCanonical(POST_MATCH_ENTITY_TYPE, currentStatus)
  const toCanonicalStatus = toCanonical(POST_MATCH_ENTITY_TYPE, targetStatus)

  if (!fromCanonical) {
    return [`Unknown current status "${currentStatus}"`]
  }
  if (!toCanonicalStatus) {
    return [`Unknown target status "${targetStatus}"`]
  }
  if (fromCanonical === toCanonicalStatus) {
    return []
  }
  if (isTerminal(POST_MATCH_ENTITY_TYPE, currentStatus)) {
    return [
      `PostMatch is in terminal state "${fromCanonical}" and cannot transition`,
    ]
  }

  const allowed = allowedTransitions(POST_MATCH_ENTITY_TYPE, currentStatus)
  if (!allowed.includes(toCanonicalStatus)) {
    return [
      `Transition ${fromCanonical} → ${toCanonicalStatus} is not allowed`,
    ]
  }

  return []
}

function canonicalStatus(status: string | undefined): string {
  return toCanonical(POST_MATCH_ENTITY_TYPE, status ?? '') ?? ''
}

function mapParticipants(
  participants: readonly Participant[],
  userId: string,
  participantStatus: string,
  actor?: {
    readonly actorUserId?: string
    readonly partyId?: string
    readonly workspaceId?: string
  },
): Participant[] {
  let found = false
  const actedAt = new Date().toISOString()
  const updated = participants.map((participant) => {
    const matchesUser = participant.userId === userId
    const matchesParty =
      Boolean(actor?.partyId) &&
      (participant.partyId === actor?.partyId ||
        participant.representativeUserIds?.includes(userId))
    if (!matchesUser && !matchesParty) {
      return { ...participant }
    }
    found = true
    return {
      ...participant,
      participantStatus,
      respondedAt: actedAt,
      actorUserId: actor?.actorUserId ?? userId,
      actedAt,
      partyId: participant.partyId ?? actor?.partyId,
      workspaceId: participant.workspaceId ?? actor?.workspaceId,
    }
  })
  if (!found) {
    return participants.map((participant) => ({ ...participant }))
  }
  return updated
}

function hasAcceptedParticipant(participants: readonly Participant[]): boolean {
  return participants.some((participant) =>
    isParticipantStatus(participant, 'accepted'),
  )
}

function hasDeclinedParticipant(participants: readonly Participant[]): boolean {
  return participants.some((participant) =>
    isParticipantStatus(participant, 'declined'),
  )
}

function isParticipantStatus(
  participant: Participant,
  status: string,
): boolean {
  return (
    (participant.participantStatus || '').toLowerCase() ===
    status.toLowerCase()
  )
}

const ONE_WAY_QUORUM_ROLES = ['need_owner', 'offer_provider'] as const

function isOneWayQuorumMet(participants: readonly Participant[]): boolean {
  return ONE_WAY_QUORUM_ROLES.every((role) =>
    participants.some(
      (participant) =>
        participant.role === role && isParticipantStatus(participant, 'accepted'),
    ),
  )
}

function allParticipantsAccepted(participants: readonly Participant[]): boolean {
  // Prefer party-level uniqueness when partyId is present.
  const byParty = new Map<string, Participant>()
  for (const participant of participants) {
    const key = participant.partyId ?? participant.userId
    if (!byParty.has(key)) byParty.set(key, participant)
  }
  const unique = [...byParty.values()]
  return (
    unique.length > 0 &&
    unique.every((participant) =>
      isParticipantStatus(participant, 'accepted'),
    )
  )
}

function resolveAggregateStatusAfterAccept(
  postMatch: PostMatch,
  participants: readonly Participant[],
): string | undefined {
  if (hasDeclinedParticipant(participants)) {
    return 'declined'
  }

  const matchType = (postMatch.matchType || 'one_way').toLowerCase()
  if (matchType === 'one_way' && isOneWayQuorumMet(participants)) {
    return 'confirmed'
  }

  // Multi-party parity (two_way, consortium, circular): confirm once every
  // participant has accepted, mirroring the POC lifecycle rule.
  if (allParticipantsAccepted(participants)) {
    return 'confirmed'
  }

  if (hasAcceptedParticipant(participants)) {
    const current = canonicalStatus(postMatch.status)
    if (current === 'discovered') {
      return 'accepted'
    }
  }

  return undefined
}

function validateAcceptAggregateTransition(
  currentStatus: string,
  targetStatus: string,
): readonly string[] {
  const current = canonicalStatus(currentStatus)
  const target = toCanonical(POST_MATCH_ENTITY_TYPE, targetStatus)
  if (!target) {
    return [`Unknown target status "${targetStatus}"`]
  }

  if (current === 'discovered' && target === 'confirmed') {
    const toAccepted = validateTransition(currentStatus, 'accepted')
    if (toAccepted.length > 0) {
      return toAccepted
    }
    return validateTransition('accepted', 'confirmed')
  }

  return validateTransition(currentStatus, targetStatus)
}

function pickDiscoverRecord(command: DiscoverPostMatchCommand): PostMatch {
  const participants = command.participants.map((participant) => ({
    userId: participant.userId,
    role: participant.role,
    opportunityId: participant.opportunityId,
    participantStatus: participant.participantStatus ?? 'pending',
    respondedAt: participant.respondedAt ?? null,
    partyId: participant.partyId,
    workspaceId: participant.workspaceId,
    representativeUserIds: participant.representativeUserIds
      ? [...participant.representativeUserIds]
      : undefined,
  }))

  const base = {
    id: command.aggregateId,
    matchType: command.matchType,
    status: 'discovered' as const,
    matchScore: command.matchScore,
    runId: command.runId,
    participants,
  }

  if (isDiscoverOneWayPostMatch(command)) {
    return {
      ...base,
      needOpportunityId: command.needOpportunityId,
      offerOpportunityId: command.offerOpportunityId,
      matchCriteria: { ...command.matchCriteria },
      payload: {
        needOpportunityId: command.needOpportunityId,
        offerOpportunityId: command.offerOpportunityId,
        breakdown: { ...command.matchCriteria },
      },
    }
  }

  if (isDiscoverTwoWayPostMatch(command)) {
    return {
      ...base,
      payload: {
        sideA: { ...command.sideA },
        sideB: { ...command.sideB },
        scoreAtoB: command.scoreAtoB,
        scoreBtoA: command.scoreBtoA,
        valueEquivalence: command.valueEquivalence,
      },
    }
  }

  if (isDiscoverConsortiumPostMatch(command)) {
    return {
      ...base,
      payload: {
        leadNeedId: command.leadNeedId,
        roles: command.roles.map((role) => ({ ...role })),
        valueBalance: command.valueBalance,
      },
    }
  }

  if (isDiscoverCircularPostMatch(command)) {
    return {
      ...base,
      payload: {
        cycle: [...command.cycle],
        links: command.links.map((link) => ({ ...link })),
        linkScores: command.links.map((link) => ({ ...link })),
        chainBalance: command.chainBalance,
      },
    }
  }

  return base
}

export class PostMatchCommandHandler {
  private readonly postMatchRepository: PostMatchRepository
  private readonly auditRepository: AuditRepository | null
  private readonly notificationRepository: NotificationSink | null

  constructor(deps: PostMatchCommandHandlerDeps) {
    this.postMatchRepository = deps.postMatchRepository
    this.auditRepository = deps.auditRepository ?? null
    this.notificationRepository = deps.notificationRepository ?? null
  }

  handle(command: Command): CommandResult {
    const baseErrors = validateBaseCommand(command)
    if (baseErrors.length > 0) {
      return failure(
        command.commandType,
        command.aggregateId,
        baseErrors,
      )
    }

    switch (command.commandType) {
      case 'DiscoverPostMatch':
        return this.handleDiscover(command as DiscoverPostMatchCommand)
      case 'AcceptPostMatch':
        return this.handleAccept(command as AcceptPostMatchCommand)
      case 'DeclinePostMatch':
        return this.handleDecline(command as DeclinePostMatchCommand)
      case 'ConfirmPostMatch':
        return this.handleConfirm(command as ConfirmPostMatchCommand)
      case 'ExpirePostMatch':
        return this.handleExpire(command as ExpirePostMatchCommand)
      case 'SupersedePostMatch':
        return this.handleSupersede(command as SupersedePostMatchCommand)
      case 'TransitionPostMatchStatus':
        return this.handleTransition(
          command as TransitionPostMatchStatusCommand,
        )
      default:
        return failure(command.commandType, command.aggregateId, [
          `Unsupported PostMatch command type "${command.commandType}"`,
        ])
    }
  }

  private handleDiscover(command: DiscoverPostMatchCommand): CommandResult {
    const fieldErrors = validateDiscoverPostMatchCommand(command)
    if (fieldErrors.length > 0) {
      return failure(command.commandType, command.aggregateId, fieldErrors)
    }

    const strongKey = discoverPostMatchStrongKey(command)
    if (strongKey) {
      const activeDuplicate =
        this.postMatchRepository.findActiveDuplicateByStrongKey(strongKey)
      if (activeDuplicate) {
        return failure(command.commandType, command.aggregateId, [
          `Active PostMatch already exists for ${strongKey} (status: ${canonicalStatus(activeDuplicate.status)})`,
        ])
      }
    }

    if (this.postMatchRepository.getById(command.aggregateId)) {
      return failure(command.commandType, command.aggregateId, [
        `PostMatch "${command.aggregateId}" already exists`,
      ])
    }

    const created = this.postMatchRepository.create(pickDiscoverRecord(command))

    emitParticipantNotifications(this.notificationRepository, {
      participants: created.participants,
      type: 'new_match_found',
      title: 'New match found',
      message: 'A new match was discovered for you.',
      link: `/matches/${created.id}`,
      entityType: 'post_match',
      entityId: created.id,
    })

    this.appendAudit({
      action: 'post_match.discovered',
      entityType: 'post_match',
      entityId: created.id,
      requestId: command.clientRequestId,
      details: {
        needOpportunityId: created.needOpportunityId,
        offerOpportunityId: created.offerOpportunityId,
        status: created.status,
        matchType: created.matchType,
        strongKey,
      },
    })

    return success(command.commandType, created.id)
  }

  private handleAccept(command: AcceptPostMatchCommand): CommandResult {
    if (!command.userId?.trim()) {
      return failure(command.commandType, command.aggregateId, [
        'userId is required',
      ])
    }

    const postMatch = this.postMatchRepository.getById(command.aggregateId)
    if (!postMatch) {
      return failure(command.commandType, command.aggregateId, [
        `PostMatch "${command.aggregateId}" not found`,
      ])
    }

    if (isTerminal(POST_MATCH_ENTITY_TYPE, postMatch.status)) {
      return failure(command.commandType, command.aggregateId, [
        `PostMatch is in terminal state "${canonicalStatus(postMatch.status)}"`,
      ])
    }

    const actor = getCommandPermissionActor()
    const participant = postMatch.participants.find(
      (p) =>
        p.userId === command.userId ||
        p.representativeUserIds?.includes(command.userId) ||
        (actor?.activePartyId && p.partyId === actor.activePartyId),
    )
    if (!participant) {
      return failure(command.commandType, command.aggregateId, [
        `User "${command.userId}" is not a participant on this PostMatch`,
      ])
    }

    const participants = mapParticipants(
      postMatch.participants,
      command.userId,
      'accepted',
      {
        actorUserId: command.userId,
        partyId: actor?.activePartyId ?? participant.partyId,
        workspaceId: actor?.activeWorkspaceId ?? participant.workspaceId,
      },
    )

    const targetStatus = resolveAggregateStatusAfterAccept(
      postMatch,
      participants,
    )
    const patch: Partial<PostMatch> = { participants }

    if (targetStatus) {
      const currentCanonical = canonicalStatus(postMatch.status)
      if (currentCanonical !== targetStatus) {
        const transitionErrors = validateAcceptAggregateTransition(
          postMatch.status,
          targetStatus,
        )
        if (transitionErrors.length > 0) {
          return failure(
            command.commandType,
            command.aggregateId,
            transitionErrors,
          )
        }
        patch.status = targetStatus
      }
    }

    this.postMatchRepository.update(command.aggregateId, patch)

    if (patch.status === 'confirmed') {
      emitParticipantNotifications(this.notificationRepository, {
        participants,
        type: 'match_confirmed',
        title: 'Match confirmed',
        message: 'All participants accepted. This match is confirmed.',
        link: `/matches/${command.aggregateId}`,
        entityType: 'post_match',
        entityId: command.aggregateId,
      })
    } else {
      emitParticipantNotifications(this.notificationRepository, {
        participants,
        excludeUserId: command.userId,
        type: 'match_accepted',
        title: 'Match accepted',
        message: 'A participant accepted the match.',
        link: `/matches/${command.aggregateId}`,
        entityType: 'post_match',
        entityId: command.aggregateId,
      })
    }

    this.appendAudit({
      action:
        patch.status === 'confirmed'
          ? 'post_match.confirmed'
          : 'post_match.accepted',
      entityType: 'post_match',
      entityId: command.aggregateId,
      requestId: command.clientRequestId,
      details: {
        userId: command.userId,
        status: patch.status ?? postMatch.status,
        quorumMet: patch.status === 'confirmed',
      },
    })

    return success(command.commandType, command.aggregateId)
  }

  private handleDecline(command: DeclinePostMatchCommand): CommandResult {
    if (!command.userId?.trim()) {
      return failure(command.commandType, command.aggregateId, [
        'userId is required',
      ])
    }

    const postMatch = this.postMatchRepository.getById(command.aggregateId)
    if (!postMatch) {
      return failure(command.commandType, command.aggregateId, [
        `PostMatch "${command.aggregateId}" not found`,
      ])
    }

    if (isTerminal(POST_MATCH_ENTITY_TYPE, postMatch.status)) {
      return failure(command.commandType, command.aggregateId, [
        `PostMatch is in terminal state "${canonicalStatus(postMatch.status)}"`,
      ])
    }

    const actor = getCommandPermissionActor()
    const participant = postMatch.participants.find(
      (p) =>
        p.userId === command.userId ||
        p.representativeUserIds?.includes(command.userId) ||
        (actor?.activePartyId && p.partyId === actor.activePartyId),
    )
    if (!participant) {
      return failure(command.commandType, command.aggregateId, [
        `User "${command.userId}" is not a participant on this PostMatch`,
      ])
    }

    const participants = mapParticipants(
      postMatch.participants,
      command.userId,
      'declined',
      {
        actorUserId: command.userId,
        partyId: actor?.activePartyId ?? participant.partyId,
        workspaceId: actor?.activeWorkspaceId ?? participant.workspaceId,
      },
    )

    emitParticipantNotifications(this.notificationRepository, {
      participants,
      excludeUserId: command.userId,
      type: 'match_declined',
      title: 'Match declined',
      message: 'A participant declined the match.',
      link: `/matches/${command.aggregateId}`,
      entityType: 'post_match',
      entityId: command.aggregateId,
    })

    return this.applyStatusTransition(
      command,
      postMatch,
      'declined',
      { participants },
    )
  }

  private handleConfirm(command: ConfirmPostMatchCommand): CommandResult {
    const postMatch = this.postMatchRepository.getById(command.aggregateId)
    if (!postMatch) {
      return failure(command.commandType, command.aggregateId, [
        `PostMatch "${command.aggregateId}" not found`,
      ])
    }

    const currentCanonical = canonicalStatus(postMatch.status)
    if (currentCanonical !== 'accepted') {
      return failure(command.commandType, command.aggregateId, [
        `ConfirmPostMatch requires status accepted; current is "${currentCanonical || postMatch.status}"`,
      ])
    }

    return this.applyStatusTransition(command, postMatch, 'confirmed')
  }

  private handleExpire(command: ExpirePostMatchCommand): CommandResult {
    const postMatch = this.postMatchRepository.getById(command.aggregateId)
    if (!postMatch) {
      return failure(command.commandType, command.aggregateId, [
        `PostMatch "${command.aggregateId}" not found`,
      ])
    }

    const currentCanonical = canonicalStatus(postMatch.status)
    if (currentCanonical !== 'discovered' && currentCanonical !== 'accepted') {
      return failure(command.commandType, command.aggregateId, [
        `ExpirePostMatch requires status discovered or accepted; current is "${currentCanonical || postMatch.status}"`,
      ])
    }

    return this.applyStatusTransition(command, postMatch, 'expired')
  }

  private handleSupersede(command: SupersedePostMatchCommand): CommandResult {
    if (!command.replacementPostMatchId?.trim()) {
      return failure(command.commandType, command.aggregateId, [
        'replacementPostMatchId is required',
      ])
    }

    const postMatch = this.postMatchRepository.getById(command.aggregateId)
    if (!postMatch) {
      return failure(command.commandType, command.aggregateId, [
        `PostMatch "${command.aggregateId}" not found`,
      ])
    }

    const currentCanonical = canonicalStatus(postMatch.status)
    if (currentCanonical !== 'discovered' && currentCanonical !== 'accepted') {
      return failure(command.commandType, command.aggregateId, [
        `SupersedePostMatch requires status discovered or accepted; current is "${currentCanonical || postMatch.status}"`,
      ])
    }

    return this.applyStatusTransition(command, postMatch, 'superseded', {
      replacementPostMatchId: command.replacementPostMatchId,
    })
  }

  private handleTransition(
    command: TransitionPostMatchStatusCommand,
  ): CommandResult {
    if (!command.targetStatus?.trim()) {
      return failure(command.commandType, command.aggregateId, [
        'targetStatus is required',
      ])
    }

    const postMatch = this.postMatchRepository.getById(command.aggregateId)
    if (!postMatch) {
      return failure(command.commandType, command.aggregateId, [
        `PostMatch "${command.aggregateId}" not found`,
      ])
    }

    return this.applyStatusTransition(
      command,
      postMatch,
      command.targetStatus,
    )
  }

  private applyStatusTransition(
    command: Command,
    postMatch: PostMatch,
    targetStatus: string,
    extraPatch: Partial<PostMatch> = {},
  ): CommandResult {
    const transitionErrors = validateTransition(postMatch.status, targetStatus)
    if (transitionErrors.length > 0) {
      return failure(command.commandType, command.aggregateId, transitionErrors)
    }

    const canonicalTarget = toCanonical(POST_MATCH_ENTITY_TYPE, targetStatus)
    const currentCanonical = canonicalStatus(postMatch.status)

    if (currentCanonical === canonicalTarget) {
      if (Object.keys(extraPatch).length > 0) {
        this.postMatchRepository.update(command.aggregateId, extraPatch)
      }
      return success(command.commandType, command.aggregateId)
    }

    this.postMatchRepository.update(command.aggregateId, {
      ...extraPatch,
      status: canonicalTarget,
    })

    this.appendAudit({
      action: 'post_match.status_changed',
      entityType: 'post_match',
      entityId: command.aggregateId,
      requestId: command.clientRequestId,
      details: {
        fromStatus: postMatch.status,
        toStatus: canonicalTarget,
      },
    })

    return success(command.commandType, command.aggregateId)
  }

  private appendAudit(
    entry: Omit<AuditEntry, 'id' | 'timestamp'>,
  ): void {
    if (
      !this.auditRepository ||
      typeof this.auditRepository.append !== 'function'
    ) {
      return
    }
    this.auditRepository.append(entry)
  }
}
