import type { Command } from '../types.ts'

export interface SubmitApplicationCommand extends Command {
  readonly commandType: 'SubmitApplication'
  readonly opportunityId: string
  readonly applicantId: string
  /** Optional application fields (proposal, commercial terms, etc.). */
  readonly payload?: Readonly<Record<string, unknown>>
}

export interface AcceptApplicationCommand extends Command {
  readonly commandType: 'AcceptApplication'
}

export interface RejectApplicationCommand extends Command {
  readonly commandType: 'RejectApplication'
}
