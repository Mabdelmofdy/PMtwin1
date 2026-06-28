/**
 * Compile-time contract checks for Contract commands.
 * Validated via `npm run type-check` / `npm run test`.
 */
import type { Command } from '../types.ts'
import type {
  ActivateContractCommand,
  CompleteContractCommand,
  CreateContractFromDealCommand,
  SignContractCommand,
  TerminateContractCommand,
} from './contract-commands.ts'

type AssertExtends<T extends Command> = T

type AssertCommandType<T extends string> = T

type _CreateExtendsCommand = AssertExtends<CreateContractFromDealCommand>
type _SignExtendsCommand = AssertExtends<SignContractCommand>
type _ActivateExtendsCommand = AssertExtends<ActivateContractCommand>
type _CompleteExtendsCommand = AssertExtends<CompleteContractCommand>
type _TerminateExtendsCommand = AssertExtends<TerminateContractCommand>

type _CreateLiteral = AssertCommandType<
  CreateContractFromDealCommand['commandType']
>
type _SignLiteral = AssertCommandType<SignContractCommand['commandType']>
type _ActivateLiteral = AssertCommandType<
  ActivateContractCommand['commandType']
>
type _CompleteLiteral = AssertCommandType<
  CompleteContractCommand['commandType']
>
type _TerminateLiteral = AssertCommandType<
  TerminateContractCommand['commandType']
>

export const createContractFromDealFixture = {
  commandType: 'CreateContractFromDeal',
  aggregateId: 'deal-draft-1',
  clientRequestId: 'client-req-contract-1',
  dealId: 'deal-draft-1',
  postMatchId: 'pm-confirmed-1',
  negotiationId: 'neg-agreed-1',
  needOpportunityId: 'need-opp-1',
  offerOpportunityId: 'offer-opp-1',
  parties: [
    {
      userId: 'user-need',
      role: 'need_owner',
      opportunityId: 'need-opp-1',
      participantStatus: 'accepted',
    },
    {
      userId: 'user-offer',
      role: 'offer_provider',
      opportunityId: 'offer-opp-1',
      participantStatus: 'accepted',
    },
  ],
  scope: 'PM delivery for NEOM phase 2',
  milestonesSnapshot: [
    {
      id: 'ms-1',
      title: 'Kickoff',
      dueDate: '2026-07-01',
      status: 'pending',
    },
  ],
} satisfies CreateContractFromDealCommand

export const signContractFixture = {
  commandType: 'SignContract',
  aggregateId: 'contract-1',
  clientRequestId: 'client-req-contract-2',
  userId: 'user-need',
} satisfies SignContractCommand

export const activateContractFixture = {
  commandType: 'ActivateContract',
  aggregateId: 'contract-1',
  clientRequestId: 'client-req-contract-3',
  triggeredByCommandId: 'client-req-contract-2',
} satisfies ActivateContractCommand

export const completeContractFixture = {
  commandType: 'CompleteContract',
  aggregateId: 'contract-1',
  clientRequestId: 'client-req-contract-4',
  reason: 'all_milestones_delivered',
} satisfies CompleteContractCommand

export const terminateContractFixture = {
  commandType: 'TerminateContract',
  aggregateId: 'contract-1',
  clientRequestId: 'client-req-contract-5',
  reason: 'mutual_agreement',
} satisfies TerminateContractCommand

const _createType: 'CreateContractFromDeal' =
  createContractFromDealFixture.commandType
const _signType: 'SignContract' = signContractFixture.commandType
const _activateType: 'ActivateContract' = activateContractFixture.commandType
const _completeType: 'CompleteContract' = completeContractFixture.commandType
const _terminateType: 'TerminateContract' =
  terminateContractFixture.commandType

void _createType
void _signType
void _activateType
void _completeType
void _terminateType
