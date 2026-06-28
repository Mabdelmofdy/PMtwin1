import { toCanonical } from '@pm-twin/lifecycle'
import type { CommandResult } from '@pm-twin/commands'
import type { Negotiation, PostMatch } from '@/types/domain.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { negotiationCommandService } from '@/services/negotiation-command-service.ts'

const MATCH_ENTITY = 'match' as const
const NEGOTIATION_ENTITY = 'negotiation' as const

const BLOCKING_NEGOTIATION_STATUSES = new Set(['active', 'countered', 'agreed'])

export type StartNegotiationUiActionResult =
  | { readonly success: true; readonly negotiationId: string }
  | { readonly success: false; readonly message: string }

export type StartNegotiationUiActionsDeps = {
  readonly startNegotiationFromPostMatch?: (postMatchId: string) => {
    readonly result: CommandResult
    readonly negotiation: Negotiation | null
  }
  readonly getNegotiationsForPostMatch?: (
    postMatchId: string,
  ) => readonly Negotiation[]
}

function formatCommandErrors(result: CommandResult): string {
  if (result.errors && result.errors.length > 0) {
    return result.errors.join('. ')
  }
  return 'Negotiation could not be started.'
}

function resolveNegotiationsForPostMatch(
  postMatchId: string,
  deps?: StartNegotiationUiActionsDeps,
): readonly Negotiation[] {
  const read =
    deps?.getNegotiationsForPostMatch ??
    ((id: string) => negotiationsApi.getByPostMatchId(id))
  return read(postMatchId)
}

export function canShowStartNegotiationFromPostMatch(
  match: PostMatch | null | undefined,
  deps?: StartNegotiationUiActionsDeps,
): boolean {
  if (!match?.id) return false

  const matchStatus = toCanonical(MATCH_ENTITY, match.status ?? '') ?? ''
  if (matchStatus !== 'confirmed') return false

  const linked = resolveNegotiationsForPostMatch(match.id, deps)
  return !linked.some((negotiation) => {
    const status =
      toCanonical(NEGOTIATION_ENTITY, negotiation.status ?? '') ?? ''
    return BLOCKING_NEGOTIATION_STATUSES.has(status)
  })
}

export function startNegotiationFromPostMatchUiAction(
  postMatchId: string,
  deps?: StartNegotiationUiActionsDeps,
): StartNegotiationUiActionResult {
  const start =
    deps?.startNegotiationFromPostMatch ??
    negotiationCommandService.startNegotiationFromPostMatch.bind(
      negotiationCommandService,
    )

  const { result, negotiation } = start(postMatchId)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }

  const negotiationId = negotiation?.id ?? result.aggregateId
  if (!negotiationId) {
    return {
      success: false,
      message: 'Negotiation could not be started. No negotiation record returned.',
    }
  }

  return { success: true, negotiationId }
}
