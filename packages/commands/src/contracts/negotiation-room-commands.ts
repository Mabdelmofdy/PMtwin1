import type { Command } from '../types.ts'

export type NegotiationOfferTermsPayload = Readonly<Record<string, unknown>>

export interface SendNegotiationMessageCommand extends Command {
  readonly commandType: 'SendNegotiationMessage'
  readonly userId: string
  readonly body: string
  readonly visibility?: 'participants' | 'auditor'
  readonly attachments?: readonly {
    readonly fileName: string
    readonly mimeType?: string
    readonly sizeBytes?: number
    readonly url?: string
  }[]
}

export interface EditNegotiationMessageCommand extends Command {
  readonly commandType: 'EditNegotiationMessage'
  readonly userId: string
  readonly messageId: string
  readonly body: string
}

export interface AddNegotiationAttachmentCommand extends Command {
  readonly commandType: 'AddNegotiationAttachment'
  readonly userId: string
  readonly messageId: string
  readonly attachment: {
    readonly fileName: string
    readonly mimeType?: string
    readonly sizeBytes?: number
    readonly url?: string
  }
}

export interface SubmitNegotiationOfferCommand extends Command {
  readonly commandType: 'SubmitNegotiationOffer'
  readonly userId: string
  readonly terms: NegotiationOfferTermsPayload
  readonly changeSummary?: string
}

export interface SubmitNegotiationCounterOfferCommand extends Command {
  readonly commandType: 'SubmitNegotiationCounterOffer'
  readonly userId: string
  readonly terms: NegotiationOfferTermsPayload
  readonly changeSummary?: string
}

export interface AcceptNegotiationOfferCommand extends Command {
  readonly commandType: 'AcceptNegotiationOffer'
  readonly userId: string
  readonly offerId: string
}

export interface RejectNegotiationOfferCommand extends Command {
  readonly commandType: 'RejectNegotiationOffer'
  readonly userId: string
  readonly offerId: string
  readonly reason?: string
}

export interface LockNegotiationTranscriptCommand extends Command {
  readonly commandType: 'LockNegotiationTranscript'
  readonly userId: string
}
