import type {
  AcceptNegotiationOfferCommand,
  RejectNegotiationOfferCommand,
  SendNegotiationMessageCommand,
  SubmitNegotiationCounterOfferCommand,
  SubmitNegotiationOfferCommand,
  CommandResult,
} from '@pm-twin/commands'
import type { CommercialTerms } from '@/types/commercial-terms.ts'
import { getApplicationCommandGateway } from '@/commands/application-command-gateway.ts'

function createClientRequestId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function sendNegotiationMessage(
  negotiationId: string,
  userId: string,
  body: string,
): CommandResult {
  const command = {
    commandType: 'SendNegotiationMessage',
    aggregateId: negotiationId,
    clientRequestId: createClientRequestId('SendNegotiationMessage'),
    userId,
    body,
  } satisfies SendNegotiationMessageCommand
  return getApplicationCommandGateway().execute(command)
}

export function submitNegotiationOffer(
  negotiationId: string,
  userId: string,
  terms: CommercialTerms,
  changeSummary?: string,
  isCounter = false,
): CommandResult {
  const command = isCounter
    ? ({
        commandType: 'SubmitNegotiationCounterOffer',
        aggregateId: negotiationId,
        clientRequestId: createClientRequestId('SubmitNegotiationCounterOffer'),
        userId,
        terms,
        changeSummary,
      } satisfies SubmitNegotiationCounterOfferCommand)
    : ({
        commandType: 'SubmitNegotiationOffer',
        aggregateId: negotiationId,
        clientRequestId: createClientRequestId('SubmitNegotiationOffer'),
        userId,
        terms,
        changeSummary,
      } satisfies SubmitNegotiationOfferCommand)
  return getApplicationCommandGateway().execute(command)
}

export function acceptNegotiationOffer(
  negotiationId: string,
  userId: string,
  offerId: string,
): CommandResult {
  const command = {
    commandType: 'AcceptNegotiationOffer',
    aggregateId: negotiationId,
    clientRequestId: createClientRequestId('AcceptNegotiationOffer'),
    userId,
    offerId,
  } satisfies AcceptNegotiationOfferCommand
  return getApplicationCommandGateway().execute(command)
}

export function rejectNegotiationOffer(
  negotiationId: string,
  userId: string,
  offerId: string,
  reason?: string,
): CommandResult {
  const command = {
    commandType: 'RejectNegotiationOffer',
    aggregateId: negotiationId,
    clientRequestId: createClientRequestId('RejectNegotiationOffer'),
    userId,
    offerId,
    reason,
  } satisfies RejectNegotiationOfferCommand
  return getApplicationCommandGateway().execute(command)
}
