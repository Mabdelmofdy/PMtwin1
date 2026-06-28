/**
 * Compile-time contract checks for PostMatch commands (ADR-MATCH-001).
 * Validated via `npm run type-check` / `npm run test`.
 */
import type { Command } from '../types.ts'
import type {
  AcceptPostMatchCommand,
  ConfirmPostMatchCommand,
  DeclinePostMatchCommand,
  DiscoverCircularPostMatchCommand,
  DiscoverConsortiumPostMatchCommand,
  DiscoverOneWayPostMatchCommand,
  DiscoverPostMatchCommand,
  DiscoverTwoWayPostMatchCommand,
  ExpirePostMatchCommand,
  SupersedePostMatchCommand,
} from './match-commands.ts'

type AssertExtends<T extends Command> = T

type AssertCommandType<T extends string> = T

type _DiscoverExtendsCommand = AssertExtends<DiscoverPostMatchCommand>
type _OneWayExtendsCommand = AssertExtends<DiscoverOneWayPostMatchCommand>
type _TwoWayExtendsCommand = AssertExtends<DiscoverTwoWayPostMatchCommand>
type _ConsortiumExtendsCommand = AssertExtends<DiscoverConsortiumPostMatchCommand>
type _CircularExtendsCommand = AssertExtends<DiscoverCircularPostMatchCommand>
type _AcceptExtendsCommand = AssertExtends<AcceptPostMatchCommand>
type _DeclineExtendsCommand = AssertExtends<DeclinePostMatchCommand>
type _ConfirmExtendsCommand = AssertExtends<ConfirmPostMatchCommand>
type _ExpireExtendsCommand = AssertExtends<ExpirePostMatchCommand>
type _SupersedeExtendsCommand = AssertExtends<SupersedePostMatchCommand>

type _DiscoverLiteral = AssertCommandType<
  DiscoverPostMatchCommand['commandType']
>
type _AcceptLiteral = AssertCommandType<AcceptPostMatchCommand['commandType']>
type _DeclineLiteral = AssertCommandType<DeclinePostMatchCommand['commandType']>
type _ConfirmLiteral = AssertCommandType<ConfirmPostMatchCommand['commandType']>
type _ExpireLiteral = AssertCommandType<ExpirePostMatchCommand['commandType']>
type _SupersedeLiteral = AssertCommandType<
  SupersedePostMatchCommand['commandType']
>

export const discoverOneWayPostMatchFixture = {
  commandType: 'DiscoverPostMatch',
  aggregateId: 'pm-new-1',
  clientRequestId: 'client-req-1',
  matchType: 'one_way',
  needOpportunityId: 'need-opp-1',
  offerOpportunityId: 'offer-opp-1',
  matchScore: 0.92,
  matchCriteria: { skillMatch: 1, budgetFit: 0.8 },
  participants: [
    {
      userId: 'user-need',
      role: 'need_owner',
      opportunityId: 'need-opp-1',
      participantStatus: 'pending',
    },
    {
      userId: 'user-offer',
      role: 'offer_provider',
      opportunityId: 'offer-opp-1',
      participantStatus: 'pending',
    },
  ],
  runId: 'run-001',
} satisfies DiscoverOneWayPostMatchCommand

export const discoverTwoWayPostMatchFixture = {
  commandType: 'DiscoverPostMatch',
  aggregateId: 'pm-barter-1',
  clientRequestId: 'client-req-barter',
  matchType: 'two_way',
  matchScore: 0.88,
  sideA: {
    userId: 'user-a',
    needId: 'need-a',
    offerId: 'offer-a',
  },
  sideB: {
    userId: 'user-b',
    needId: 'need-b',
    offerId: 'offer-b',
  },
  scoreAtoB: 0.9,
  scoreBtoA: 0.86,
  participants: [
    { userId: 'user-a', role: 'need_owner', opportunityId: 'need-a' },
    { userId: 'user-a', role: 'offer_provider', opportunityId: 'offer-a' },
    { userId: 'user-b', role: 'need_owner', opportunityId: 'need-b' },
    { userId: 'user-b', role: 'offer_provider', opportunityId: 'offer-b' },
  ],
} satisfies DiscoverTwoWayPostMatchCommand

export const discoverConsortiumPostMatchFixture = {
  commandType: 'DiscoverPostMatch',
  aggregateId: 'pm-consortium-1',
  clientRequestId: 'client-req-consortium',
  matchType: 'consortium',
  matchScore: 0.75,
  leadNeedId: 'lead-need-1',
  roles: [
    {
      role: 'Architect',
      opportunityId: 'offer-arch',
      userId: 'user-arch',
      score: 0.75,
    },
  ],
  participants: [
    { userId: 'user-lead', role: 'consortium_lead', opportunityId: 'lead-need-1' },
    { userId: 'user-arch', role: 'consortium_member', opportunityId: 'offer-arch' },
  ],
} satisfies DiscoverConsortiumPostMatchCommand

export const discoverCircularPostMatchFixture = {
  commandType: 'DiscoverPostMatch',
  aggregateId: 'pm-circular-1',
  clientRequestId: 'client-req-circular',
  matchType: 'circular',
  matchScore: 0.8,
  cycle: ['user-1', 'user-2', 'user-3'],
  links: [
    {
      fromCreatorId: 'user-1',
      toCreatorId: 'user-2',
      needId: 'need-1',
      offerId: 'offer-2',
      score: 0.8,
    },
    {
      fromCreatorId: 'user-2',
      toCreatorId: 'user-3',
      needId: 'need-2',
      offerId: 'offer-3',
      score: 0.82,
    },
    {
      fromCreatorId: 'user-3',
      toCreatorId: 'user-1',
      needId: 'need-3',
      offerId: 'offer-1',
      score: 0.79,
    },
  ],
  participants: [
    { userId: 'user-1', role: 'chain_participant', opportunityId: 'offer-1' },
    { userId: 'user-2', role: 'chain_participant', opportunityId: 'offer-2' },
    { userId: 'user-3', role: 'chain_participant', opportunityId: 'offer-3' },
  ],
} satisfies DiscoverCircularPostMatchCommand

/** Backward-compatible alias for one_way discover fixture. */
export const discoverPostMatchFixture = discoverOneWayPostMatchFixture

export const acceptPostMatchFixture = {
  commandType: 'AcceptPostMatch',
  aggregateId: 'pm-1',
  clientRequestId: 'client-req-2',
  userId: 'user-need',
} satisfies AcceptPostMatchCommand

export const declinePostMatchFixture = {
  commandType: 'DeclinePostMatch',
  aggregateId: 'pm-1',
  clientRequestId: 'client-req-3',
  userId: 'user-offer',
} satisfies DeclinePostMatchCommand

export const confirmPostMatchFixture = {
  commandType: 'ConfirmPostMatch',
  aggregateId: 'pm-1',
  clientRequestId: 'client-req-4',
  triggeredByCommandId: 'client-req-2',
} satisfies ConfirmPostMatchCommand

export const expirePostMatchFixture = {
  commandType: 'ExpirePostMatch',
  aggregateId: 'pm-1',
  clientRequestId: 'client-req-5',
  reason: 'ttl_elapsed',
} satisfies ExpirePostMatchCommand

export const supersedePostMatchFixture = {
  commandType: 'SupersedePostMatch',
  aggregateId: 'pm-old-1',
  clientRequestId: 'client-req-6',
  replacementPostMatchId: 'pm-new-2',
  reason: 'higher_score',
} satisfies SupersedePostMatchCommand

// Literal commandType assertions (fail compile if widened to string)
const _discoverType: 'DiscoverPostMatch' = discoverPostMatchFixture.commandType
const _acceptType: 'AcceptPostMatch' = acceptPostMatchFixture.commandType
const _declineType: 'DeclinePostMatch' = declinePostMatchFixture.commandType
const _confirmType: 'ConfirmPostMatch' = confirmPostMatchFixture.commandType
const _expireType: 'ExpirePostMatch' = expirePostMatchFixture.commandType
const _supersedeType: 'SupersedePostMatch' = supersedePostMatchFixture.commandType

void _discoverType
void _acceptType
void _declineType
void _confirmType
void _expireType
void _supersedeType
