import type { CommandResult } from '@pm-twin/commands'

import { toCanonical } from '@pm-twin/lifecycle'

import type { Deal, Negotiation } from '@/types/domain.ts'

import { dealRepository } from '@/repositories/index.ts'

import { dealCommandService } from '@/services/deal-command-service.ts'



const NEGOTIATION_ENTITY = 'negotiation' as const



export type CreateDealUiActionResult =

  | { readonly success: true; readonly dealId: string; readonly deal: Deal }

  | { readonly success: false; readonly message: string }



export type CreateDealUiActionsDeps = {

  readonly createDealFromNegotiation?: (negotiationId: string) => {

    readonly result: CommandResult

    readonly deal: Deal | null

  }

  readonly findDealByNegotiationId?: (negotiationId: string) => Deal | undefined

}



function isAgreedNegotiationStatus(status: string | undefined): boolean {

  return toCanonical(NEGOTIATION_ENTITY, status ?? '') === 'agreed'

}



function resolveExistingDeal(

  negotiationId: string,

  deps?: CreateDealUiActionsDeps,

): Deal | undefined {

  const find =

    deps?.findDealByNegotiationId ??

    ((id: string) => dealRepository.findByNegotiationId(id))

  return find(negotiationId)

}



function formatCommandErrors(result: CommandResult): string {

  if (result.errors && result.errors.length > 0) {

    return result.errors.join('. ')

  }

  return 'Deal could not be created.'

}



export function canShowCreateDealFromNegotiation(

  negotiation: Negotiation | null | undefined,

  deps?: CreateDealUiActionsDeps,

): boolean {

  if (!negotiation?.id) return false

  if (!isAgreedNegotiationStatus(negotiation.status)) return false

  if (resolveExistingDeal(negotiation.id, deps)) return false

  return true

}



export function isPostMatchNegotiation(

  negotiation: Negotiation | null | undefined,

): boolean {

  return Boolean(negotiation?.postMatchId)

}



export function createDealFromNegotiationUiAction(

  negotiationId: string,

  deps?: CreateDealUiActionsDeps,

): CreateDealUiActionResult {

  const create =

    deps?.createDealFromNegotiation ??

    dealCommandService.createDealFromNegotiation.bind(dealCommandService)



  const { result, deal } = create(negotiationId)

  if (!result.success) {

    return { success: false, message: formatCommandErrors(result) }

  }



  if (!deal?.id) {

    return {

      success: false,

      message: 'Deal could not be created. Negotiation may not exist.',

    }

  }



  return { success: true, dealId: deal.id, deal }

}


