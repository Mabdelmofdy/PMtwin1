import type {
  ArchiveOpportunityCommand,
  CloseOpportunityCommand,
  Command,
  CommandResult,
  CreateOpportunityCommand,
  DeleteOpportunityCommand,
  OpportunityCollaborationPayload,
  PublishOpportunityCommand,
  TransitionOpportunityStatusCommand,
  UpdateOpportunityCommand,
  ValidateOpportunityCollaborationModelCommand,
} from '@pm-twin/commands'
import {
  allowedTransitions,
  getFsm,
  isTerminal,
  toCanonical,
} from '@pm-twin/lifecycle'
import {
  normalizeSubModelType,
  validateCollaborationTaxonomy,
  validateOpportunityCollaborationModel,
} from '@pm-twin/collaboration-models'
import type { AuditEntry, Opportunity } from '@/types/domain.ts'
import type { AuditRepository } from '@/repositories/audit-repository.ts'
import type { OpportunityRepository } from '@/repositories/opportunity-repository.ts'
import type { ProfileKind } from '@/domain/profile-readiness/types.ts'
import type { CommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'
import {
  evaluatePublishReadiness,
  formatPublishReadinessCommandErrors,
} from '@/domain/publish-readiness/publish-readiness-gate.ts'
import {
  buildOpportunityCollaborationPatch,
  normalizeOpportunityCollaboration,
} from '@/domain/collaboration/opportunity-collaboration.ts'
import { toStoredStatus } from '@/domain/workflow/legacy-map.ts'
import {
  composePublishValidation,
  formatPublishValidationMessages,
  runDraftValidation,
  runUpdateValidation,
} from '@/domain/opportunity-validation/index.ts'

const ENTITY_TYPE = 'opportunity' as const

export type PublishReadinessContext = {
  readonly profile?: object | null
  readonly profileKind: ProfileKind
  /** When omitted, publish validation treats vetting as approved (legacy test stacks). */
  readonly vettingApproved?: boolean
}

export type OpportunityCommandHandlerDeps = {
  readonly opportunityRepository: OpportunityRepository
  readonly auditRepository?: AuditRepository | null
  readonly resolvePublishReadinessContext?: (
    opportunity: Opportunity,
  ) => PublishReadinessContext
  readonly resolveCommandActor?: () => CommandPermissionActor | null
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
  const fsm = getFsm(ENTITY_TYPE)
  if (!fsm) {
    return ['Opportunity lifecycle FSM is not available']
  }

  const fromCanonical = toCanonical(ENTITY_TYPE, currentStatus)
  const toCanonicalStatus = toCanonical(ENTITY_TYPE, targetStatus)

  if (!fromCanonical) {
    return [`Unknown current status "${currentStatus}"`]
  }
  if (!toCanonicalStatus) {
    return [`Unknown target status "${targetStatus}"`]
  }
  if (fromCanonical === toCanonicalStatus) {
    return []
  }
  if (isTerminal(ENTITY_TYPE, currentStatus)) {
    return [
      `Opportunity is in terminal state "${fromCanonical}" and cannot transition`,
    ]
  }

  const allowed = allowedTransitions(ENTITY_TYPE, currentStatus)
  if (!allowed.includes(toCanonicalStatus)) {
    return [
      `Transition ${fromCanonical} → ${toCanonicalStatus} is not allowed`,
    ]
  }

  return []
}

function payloadToOpportunityFields(
  payload: OpportunityCollaborationPayload,
): Partial<Opportunity> {
  const hasCollaborationSelection = Boolean(
    payload.mainCollaborationModel?.trim() || payload.subModelType?.trim(),
  )
  const subModelType =
    normalizeSubModelType(payload.subModelType, payload) ?? payload.subModelType
  // preferredMatchingTopology is system-derived inside the patch builder —
  // never accept a manual matchType / topology override from form input.
  // Skip inventing taxonomy defaults for empty create drafts (readiness starts at 0).
  const collaborationPatch = hasCollaborationSelection
    ? buildOpportunityCollaborationPatch({
        mainCollaborationModel: payload.mainCollaborationModel,
        modelType: payload.modelType,
        subModelType,
        exchangeMode: payload.exchangeMode,
        acceptedExchangeModes: payload.acceptedExchangeModes,
        collaborationAttributes: payload.collaborationAttributes,
      })
    : (payload.collaborationAttributes
        ? { collaborationAttributes: { ...payload.collaborationAttributes } }
        : {})

  return {
    title: payload.title,
    description: payload.description,
    intent: payload.intent === 'request' ? 'need' : payload.intent,
    location: payload.location,
    coverageAreas:
      payload.coverageAreas !== undefined
        ? [...payload.coverageAreas]
        : undefined,
    creatorId: payload.creatorId,
    tenantId: payload.tenantId,
    organizationId: payload.organizationId,
    scope: payload.scope as Opportunity['scope'],
    attributes: payload.attributes as Opportunity['attributes'],
    exchangeData: payload.exchangeData,
    normalized: payload.normalized,
    preferredPartnerType: payload.preferredPartnerType,
    attachments: payload.attachments as Opportunity['attachments'],
    complianceRequirements: payload.complianceRequirements
      ? [...payload.complianceRequirements]
      : undefined,
    deliveryMilestones: payload.deliveryMilestones as Opportunity['deliveryMilestones'],
    structuredSkills: payload.structuredSkills as Opportunity['structuredSkills'],
    workPackages: payload.workPackages as Opportunity['workPackages'],
    capacity: payload.capacity as Opportunity['capacity'],
    startDate: payload.startDate,
    endDate: payload.endDate,
    duration: payload.duration,
    deliveryDeadline: payload.deliveryDeadline,
    country: payload.country,
    city: payload.city,
    workMode: payload.workMode,
    budget: payload.budget,
    ...(hasCollaborationSelection
      ? {
          value_exchange: {
            mode: payload.exchangeMode,
            accepted_modes: [...(payload.acceptedExchangeModes ?? [payload.exchangeMode])],
          },
        }
      : {}),
    ...collaborationPatch,
  }
}

export class OpportunityCommandHandler {
  private readonly opportunityRepository: OpportunityRepository
  private readonly auditRepository: AuditRepository | null
  private readonly resolvePublishReadinessContext?: (
    opportunity: Opportunity,
  ) => PublishReadinessContext
  private readonly resolveCommandActor?: () => CommandPermissionActor | null

  constructor(deps: OpportunityCommandHandlerDeps) {
    this.opportunityRepository = deps.opportunityRepository
    this.auditRepository = deps.auditRepository ?? null
    this.resolvePublishReadinessContext = deps.resolvePublishReadinessContext
    this.resolveCommandActor = deps.resolveCommandActor
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
      case 'CreateOpportunity':
        return this.handleCreate(command as CreateOpportunityCommand)
      case 'UpdateOpportunity':
        return this.handleUpdate(command as UpdateOpportunityCommand)
      case 'ValidateOpportunityCollaborationModel':
        return this.handleValidate(command as ValidateOpportunityCollaborationModelCommand)
      case 'PublishOpportunity':
        return this.handlePublish(command as PublishOpportunityCommand)
      case 'CloseOpportunity':
        return this.handleClose(command as CloseOpportunityCommand)
      case 'ArchiveOpportunity':
        return this.handleArchive(command as ArchiveOpportunityCommand)
      case 'DeleteOpportunity':
        return this.handleDelete(command as DeleteOpportunityCommand)
      case 'TransitionOpportunityStatus':
        return this.handleTransition(
          command as TransitionOpportunityStatusCommand,
        )
      default:
        return failure(command.commandType, command.aggregateId, [
          `Unsupported Opportunity command type "${command.commandType}"`,
        ])
    }
  }

  private handleCreate(command: CreateOpportunityCommand): CommandResult {
    const payload = command.payload
    if (!payload?.title?.trim()) {
      return failure(command.commandType, command.aggregateId, ['title is required'])
    }

    // When a collaboration model is selected, create requires taxonomy + required attributes.
    // Incomplete drafts without a model selection remain allowed (readiness starts at 0).
    const hasCollaborationSelection = Boolean(
      payload.mainCollaborationModel?.trim() || payload.subModelType?.trim(),
    )
    if (hasCollaborationSelection) {
      const validation = validateOpportunityCollaborationModel({
        mainCollaborationModel: payload.mainCollaborationModel,
        modelType: payload.modelType,
        subModelType: payload.subModelType,
        exchangeMode: payload.exchangeMode,
        acceptedExchangeModes: payload.acceptedExchangeModes,
        collaborationAttributes: payload.collaborationAttributes,
      })
      if (!validation.valid) {
        return failure(command.commandType, command.aggregateId, validation.errors)
      }
    }

    const fields = payloadToOpportunityFields(payload)
    const actor = this.resolveCommandActor?.()
    const createdByUserId = actor?.userId ?? payload.creatorId
    const draftCheck = runDraftValidation(fields, {
      taxonomyValid: hasCollaborationSelection ? true : undefined,
    })
    if (draftCheck.blocked) {
      return failure(command.commandType, command.aggregateId, draftCheck.messages)
    }

    const activeWorkspaceId = actor?.activeWorkspaceId?.trim() || undefined
    const activePartyId = actor?.activePartyId?.trim() || undefined
    const created = this.opportunityRepository.create({
      ...fields,
      id: command.aggregateId,
      status: 'draft',
      // Never persist blank party/workspace ids — they block legacy ownership
      // resolution and silently drop DiscoverPostMatch participant builds.
      workspaceId: activeWorkspaceId,
      ownerPartyId: activePartyId,
      createdByUserId,
      creatorId: createdByUserId,
      lastModifiedByUserId: createdByUserId,
      createdByActorType: actor?.actorType ?? 'marketplace_user',
    } as Omit<Opportunity, 'createdAt' | 'updatedAt'>)

    this.appendAudit({
      action: 'opportunity.created',
      entityType: 'opportunity',
      entityId: created.id,
      requestId: command.clientRequestId,
      details: {
        mainCollaborationModel: created.mainCollaborationModel,
        subModelType: created.subModelType,
        preferredMatchingTopology: created.preferredMatchingTopology,
      },
    })

    return success(command.commandType, created.id)
  }

  private handleUpdate(command: UpdateOpportunityCommand): CommandResult {
    const existing = this.opportunityRepository.getById(command.aggregateId)
    if (!existing) {
      return failure(command.commandType, command.aggregateId, [
        `Opportunity "${command.aggregateId}" not found`,
      ])
    }

    const payload = command.payload ?? {}
    const actor = this.resolveCommandActor?.()
    const merged = {
      ...existing,
      ...payloadToOpportunityFields({
        title: payload.title ?? existing.title,
        description: payload.description ?? existing.description,
        intent: (payload.intent ?? existing.intent) as OpportunityCollaborationPayload['intent'],
        location: payload.location ?? existing.location,
        coverageAreas:
          payload.coverageAreas !== undefined
            ? [...payload.coverageAreas]
            : existing.coverageAreas,
        mainCollaborationModel:
          payload.mainCollaborationModel ?? existing.mainCollaborationModel ?? '',
        modelType: payload.modelType ?? existing.modelType ?? '',
        subModelType: payload.subModelType ?? existing.subModelType ?? '',
        exchangeMode: payload.exchangeMode ?? existing.exchangeMode ?? 'cash',
        acceptedExchangeModes:
          payload.acceptedExchangeModes ?? existing.acceptedExchangeModes,
        collaborationAttributes:
          payload.collaborationAttributes ?? existing.collaborationAttributes,
        scope: payload.scope,
        attributes: payload.attributes,
        exchangeData: payload.exchangeData,
        normalized: payload.normalized,
        preferredPartnerType:
          payload.preferredPartnerType ?? existing.preferredPartnerType,
        attachments: payload.attachments ?? existing.attachments,
        complianceRequirements:
          payload.complianceRequirements ?? existing.complianceRequirements,
        deliveryMilestones:
          payload.deliveryMilestones ?? existing.deliveryMilestones,
        structuredSkills: payload.structuredSkills ?? existing.structuredSkills,
        workPackages: payload.workPackages ?? existing.workPackages,
        capacity: payload.capacity ?? existing.capacity,
        startDate: payload.startDate ?? existing.startDate,
        endDate: payload.endDate ?? existing.endDate,
        duration: payload.duration ?? existing.duration,
        deliveryDeadline: payload.deliveryDeadline ?? existing.deliveryDeadline,
        country: payload.country ?? existing.country,
        city: payload.city ?? existing.city,
        workMode: payload.workMode ?? existing.workMode,
        budget: payload.budget ?? existing.budget,
      }),
    }

    // Draft updates validate taxonomy shape only. Attribute completeness is a readiness concern.
    if (payload.mainCollaborationModel || payload.subModelType || payload.modelType) {
      const validation = validateCollaborationTaxonomy({
        mainCollaborationModel: merged.mainCollaborationModel,
        modelType: merged.modelType,
        subModelType: merged.subModelType,
        exchangeMode: merged.exchangeMode,
        acceptedExchangeModes: merged.acceptedExchangeModes,
      })
      if (!validation.valid) {
        return failure(command.commandType, command.aggregateId, validation.errors)
      }
    }

    const updateCheck = runUpdateValidation(merged, { isExistingDraft: true })
    if (updateCheck.blocked) {
      return failure(command.commandType, command.aggregateId, updateCheck.messages)
    }

    const { status: _status, id: _id, createdAt: _createdAt, ...patch } = merged
    const existingWorkspaceId = existing.workspaceId?.trim() || undefined
    const existingOwnerPartyId = existing.ownerPartyId?.trim() || undefined
    const activeWorkspaceId = actor?.activeWorkspaceId?.trim() || undefined
    const activePartyId = actor?.activePartyId?.trim() || undefined
    this.opportunityRepository.update(command.aggregateId, {
      ...patch,
      workspaceId: existingWorkspaceId ?? activeWorkspaceId,
      ownerPartyId: existingOwnerPartyId ?? activePartyId,
      lastModifiedByUserId:
        actor?.userId ??
        payload.creatorId ??
        existing.lastModifiedByUserId ??
        existing.createdByUserId,
    })

    this.appendAudit({
      action: 'opportunity.updated',
      entityType: 'opportunity',
      entityId: command.aggregateId,
      requestId: command.clientRequestId,
      details: {
        fields: Object.keys(payload),
      },
    })

    return success(command.commandType, command.aggregateId)
  }

  private handleValidate(
    command: ValidateOpportunityCollaborationModelCommand,
  ): CommandResult {
    const validation = validateOpportunityCollaborationModel(command.payload)
    if (!validation.valid) {
      return failure(command.commandType, command.aggregateId, validation.errors)
    }
    return success(command.commandType, command.aggregateId)
  }

  private handlePublish(command: PublishOpportunityCommand): CommandResult {
    return this.handleTransition({
      commandType: 'TransitionOpportunityStatus',
      aggregateId: command.aggregateId,
      clientRequestId: command.clientRequestId,
      targetStatus: 'published',
      reason: command.reason,
    })
  }

  private handleClose(command: CloseOpportunityCommand): CommandResult {
    const opportunity = this.opportunityRepository.getById(command.aggregateId)
    if (!opportunity) {
      return failure(command.commandType, command.aggregateId, [
        `Opportunity "${command.aggregateId}" not found`,
      ])
    }
    this.opportunityRepository.update(command.aggregateId, {
      visibilityStatus: 'closed',
    })
    return success(command.commandType, command.aggregateId)
  }

  private handleArchive(command: ArchiveOpportunityCommand): CommandResult {
    const opportunity = this.opportunityRepository.getById(command.aggregateId)
    if (!opportunity) {
      return failure(command.commandType, command.aggregateId, [
        `Opportunity "${command.aggregateId}" not found`,
      ])
    }
    this.opportunityRepository.update(command.aggregateId, {
      visibilityStatus: 'archived',
    })
    this.appendAudit({
      action: 'opportunity.archived',
      entityType: 'opportunity',
      entityId: command.aggregateId,
      requestId: command.clientRequestId,
      details: { reason: command.reason },
    })
    return success(command.commandType, command.aggregateId)
  }

  private handleDelete(command: DeleteOpportunityCommand): CommandResult {
    const opportunity = this.opportunityRepository.getById(command.aggregateId)
    if (!opportunity) {
      return failure(command.commandType, command.aggregateId, [
        `Opportunity "${command.aggregateId}" not found`,
      ])
    }

    const status = (opportunity.status ?? '').toLowerCase()
    const visibility = (opportunity.visibilityStatus ?? '').toLowerCase()
    const isDraft = status === 'draft'
    const isWithdrawn = visibility === 'archived' || visibility === 'closed'
    // Drafts and withdrawn posts may soft-delete. Active published posts must
    // Archive/Close first so marketplace history is intentional.
    if (!isDraft && !isWithdrawn) {
      return failure(command.commandType, command.aggregateId, [
        'Active published opportunities cannot be deleted. Archive or close them first.',
      ])
    }

    this.opportunityRepository.softDelete(command.aggregateId)
    this.appendAudit({
      action: 'opportunity.deleted',
      entityType: 'opportunity',
      entityId: command.aggregateId,
      requestId: command.clientRequestId,
      details: {
        reason: command.reason,
        status,
        visibilityStatus: visibility || undefined,
      },
    })
    return success(command.commandType, command.aggregateId)
  }

  private handleTransition(
    command: TransitionOpportunityStatusCommand,
  ): CommandResult {
    if (!command.targetStatus?.trim()) {
      return failure(command.commandType, command.aggregateId, [
        'targetStatus is required',
      ])
    }

    const opportunity = this.opportunityRepository.getById(command.aggregateId)
    if (!opportunity) {
      return failure(command.commandType, command.aggregateId, [
        `Opportunity "${command.aggregateId}" not found`,
      ])
    }

    const transitionErrors = validateTransition(
      opportunity.status ?? '',
      command.targetStatus,
    )
    if (transitionErrors.length > 0) {
      return failure(
        command.commandType,
        command.aggregateId,
        transitionErrors,
      )
    }

    const canonicalTarget = toCanonical(ENTITY_TYPE, command.targetStatus)
    const storedStatus = toStoredStatus(ENTITY_TYPE, canonicalTarget)

    if (canonicalTarget === 'published') {
      // Publish guard (future): enforce validateSubModelAttributes for opportunities
      // created after collaboration-models rollout, while skipping full attribute
      // validation for legacy seed rows loaded via normalizeOpportunityCollaboration.
      const normalizedOpportunity = normalizeOpportunityCollaboration(opportunity)
      const collaborationValidation = validateCollaborationTaxonomy({
        mainCollaborationModel: normalizedOpportunity.mainCollaborationModel,
        modelType: normalizedOpportunity.modelType,
        subModelType: normalizedOpportunity.subModelType,
        exchangeMode: normalizedOpportunity.exchangeMode,
        acceptedExchangeModes: normalizedOpportunity.acceptedExchangeModes,
      })
      if (!collaborationValidation.valid) {
        return failure(
          command.commandType,
          command.aggregateId,
          collaborationValidation.errors,
        )
      }

      const publishContext = this.resolvePublishReadinessContext?.(opportunity) ?? {
        profile: null,
        profileKind: 'individual' as const,
      }
      // Consume existing readiness gate — do not recalculate scores inside validation.
      const publishGate = evaluatePublishReadiness({
        profile: publishContext.profile,
        profileKind: publishContext.profileKind,
        opportunity,
      })
      const publishValidation = composePublishValidation({
        opportunity,
        publishReadiness: publishGate,
        vettingApproved: publishContext.vettingApproved ?? true,
        taxonomyValid: collaborationValidation.valid,
        taxonomyErrors: collaborationValidation.errors,
      })
      if (publishValidation.status === 'blocked') {
        const messages = !publishGate.allowed
          ? formatPublishReadinessCommandErrors(publishGate)
          : formatPublishValidationMessages(publishValidation)
        return failure(command.commandType, command.aggregateId, messages)
      }
    }

    if (
      (opportunity.status || '').toLowerCase() === storedStatus.toLowerCase()
    ) {
      return success(command.commandType, command.aggregateId)
    }

    this.opportunityRepository.update(command.aggregateId, {
      status: storedStatus,
      ...(canonicalTarget === 'published'
        ? { visibilityStatus: 'published' }
        : {}),
    })

    this.appendAudit({
      action: 'opportunity.status_changed',
      entityType: 'opportunity',
      entityId: command.aggregateId,
      requestId: command.clientRequestId,
      details: {
        targetStatus: storedStatus,
        reason: command.reason,
      },
    })

    return success(command.commandType, command.aggregateId)
  }

  private appendAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
    if (
      !this.auditRepository ||
      typeof this.auditRepository.append !== 'function'
    ) {
      return
    }
    this.auditRepository.append(entry)
  }
}
