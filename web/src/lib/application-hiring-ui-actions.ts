import { toCanonical } from '@pm-twin/lifecycle'
import type { CommandResult } from '@pm-twin/commands'
import type { Application, Deal, Negotiation, Opportunity } from '@/types/domain.ts'
import {
  dealRepository,
  negotiationRepository,
  opportunityRepository,
  applicationRepository,
} from '@/repositories/index.ts'
import { dealCommandService } from '@/services/deal-command-service.ts'
import { negotiationCommandService } from '@/services/negotiation-command-service.ts'
import {
  buildWorkflowContext,
  findWorkflowAction,
  isWorkflowActionAvailable,
  toWorkflowEntitySnapshot,
} from '@/domain/workflows/workflow-bridge.ts'
import { productFlags } from '@/config/product-flags.ts'

export type ApplicationHiringUiActionResult =
  | { readonly success: true; readonly negotiationId: string }
  | { readonly success: false; readonly message: string }

export type ApplicationHiringDealUiActionResult =
  | { readonly success: true; readonly dealId: string; readonly deal: Deal }
  | { readonly success: false; readonly message: string }

export type ApplicationHiringUiActionsDeps = {
  readonly startNegotiationFromApplication?: (applicationId: string) => {
    readonly result: CommandResult
    readonly negotiation: Negotiation | null
  }
  readonly createDealFromApplication?: (
    applicationId: string,
    negotiationId: string,
  ) => {
    readonly result: CommandResult
    readonly deal: Deal | null
  }
  readonly getNegotiationsForApplication?: (
    applicationId: string,
  ) => readonly Negotiation[]
  readonly findDealByApplicationId?: (applicationId: string) => Deal | undefined
  readonly getOpportunity?: (opportunityId: string) => Opportunity | undefined
  readonly getApplication?: (applicationId: string) => Application | undefined
  readonly userId?: string | null
  readonly canMutate?: boolean
  readonly legacyApplicationsEnabled?: boolean
}

function formatCommandErrors(result: CommandResult): string {
  if (result.errors && result.errors.length > 0) {
    return result.errors.join('. ')
  }
  return 'Action could not be completed.'
}

function buildApplicationWorkflowContext(
  application: Application,
  deps?: ApplicationHiringUiActionsDeps,
) {
  const getNegotiations =
    deps?.getNegotiationsForApplication
    ?? ((id: string) => negotiationRepository.getByApplicationId(id))
  const findDeal =
    deps?.findDealByApplicationId
    ?? ((id: string) => dealRepository.findByApplicationId(id))
  const getOpportunity =
    deps?.getOpportunity
    ?? ((id: string) => opportunityRepository.getById(id))

  return buildWorkflowContext({
    primaryWorkflow: 'hiring',
    user: {
      userId: deps?.userId ?? null,
      canMutate: deps?.canMutate ?? true,
      isOpportunityOwner: true,
    },
    opportunity: getOpportunity(application.opportunityId) ?? null,
    application,
    linkage: {
      legacyApplicationsEnabled:
        deps?.legacyApplicationsEnabled ?? productFlags.showLegacyApplications,
      negotiationsForApplication: getNegotiations(application.id).map((negotiation) =>
        toWorkflowEntitySnapshot(negotiation) ?? { id: negotiation.id, status: negotiation.status },
      ),
      commercialAgreementForApplication: (() => {
        const deal = findDeal(application.id)
        return deal ? toWorkflowEntitySnapshot(deal) ?? null : null
      })(),
    },
  })
}

export function canShowStartHiringNegotiation(
  application: Application | null | undefined,
  deps?: ApplicationHiringUiActionsDeps,
): boolean {
  if (!application?.id) return false
  const context = buildApplicationWorkflowContext(application, deps)
  return isWorkflowActionAvailable(context, 'start_negotiation_from_application')
}

export function canShowCreateHiringDeal(
  application: Application | null | undefined,
  deps?: ApplicationHiringUiActionsDeps,
): boolean {
  if (!application?.id) return false
  const context = buildApplicationWorkflowContext(application, deps)
  return isWorkflowActionAvailable(context, 'create_commercial_agreement_from_application')
}

export function startHiringNegotiationFromApplicationUiAction(
  applicationId: string,
  deps?: ApplicationHiringUiActionsDeps,
): ApplicationHiringUiActionResult {
  const getApplication =
    deps?.getApplication
    ?? ((id: string) => applicationRepository.getById(id))

  const application =
    getApplication(applicationId)
    ?? ({ id: applicationId } as Application)
  const context = buildApplicationWorkflowContext(application, deps)
  const action = findWorkflowAction(context, 'start_negotiation_from_application')
  if (!action?.enabled) {
    return {
      success: false,
      message: action?.disabledReason ?? 'Start hiring negotiation is not available',
    }
  }

  const start =
    deps?.startNegotiationFromApplication
    ?? negotiationCommandService.startNegotiationFromApplication.bind(
      negotiationCommandService,
    )

  const { result, negotiation } = start(applicationId)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }

  const negotiationId = negotiation?.id ?? result.aggregateId
  if (!negotiationId) {
    return {
      success: false,
      message: 'Hiring negotiation could not be started. No negotiation record returned.',
    }
  }

  return { success: true, negotiationId }
}

export function createHiringDealFromApplicationUiAction(
  applicationId: string,
  negotiationId?: string,
  deps?: ApplicationHiringUiActionsDeps,
): ApplicationHiringDealUiActionResult {
  const getApplication =
    deps?.getApplication
    ?? ((id: string) => applicationRepository.getById(id))

  const application =
    getApplication(applicationId)
    ?? ({ id: applicationId } as Application)
  const context = buildApplicationWorkflowContext(application, deps)
  const action = findWorkflowAction(context, 'create_commercial_agreement_from_application')
  if (!action?.enabled) {
    return {
      success: false,
      message: action?.disabledReason ?? 'Create hiring deal is not available',
    }
  }

  const resolvedNegotiationId =
    negotiationId
    ?? (action.metadata?.negotiationId as string | undefined)
    ?? context.linkage?.negotiationsForApplication?.find(
      (negotiation) =>
        toCanonical('negotiation', negotiation.status ?? '') === 'agreed',
    )?.id

  if (!resolvedNegotiationId) {
    return {
      success: false,
      message: 'An agreed hiring negotiation is required before creating a deal.',
    }
  }

  const create =
    deps?.createDealFromApplication
    ?? dealCommandService.createDealFromApplication.bind(dealCommandService)

  const { result, deal } = create(applicationId, resolvedNegotiationId)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }

  if (!deal?.id) {
    return {
      success: false,
      message: 'Hiring deal could not be created. No deal record returned.',
    }
  }

  return { success: true, dealId: deal.id, deal }
}

export function resolveApplicationHiringNegotiationLink(
  application: Application,
): string | null {
  if (application.negotiationId) {
    return `/negotiations/${application.negotiationId}`
  }
  const linked = negotiationRepository.getByApplicationId(application.id)[0]
  return linked?.id ? `/negotiations/${linked.id}` : null
}

export function resolveApplicationHiringDealLink(
  application: Application,
  deps?: ApplicationHiringUiActionsDeps,
): string | null {
  const find =
    deps?.findDealByApplicationId
    ?? ((id: string) => dealRepository.findByApplicationId(id))
  const deal =
    find(application.id)
    ?? (application.dealId ? dealRepository.getById(application.dealId) : undefined)
  return deal?.id ? `/commercial-agreements/${deal.id}` : null
}
