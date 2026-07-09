import type {
  CollaborationApplicability,
  OwnershipPolicy,
  ParticipantConstraints,
  RelationshipType,
  SubModelType,
} from '../types.ts'
import { relationshipFlagsFromSupported } from '@pm-twin/party'

function buildApplicability(
  supportedRelationships: readonly RelationshipType[],
  ownershipPolicy: OwnershipPolicy,
  participantConstraints: ParticipantConstraints,
  options: {
    allowedPartyTypes?: readonly ('company' | 'individual')[]
    primaryRelationship?: RelationshipType
    reason?: string
  } = {},
): CollaborationApplicability {
  return {
    allowedPartyTypes: options.allowedPartyTypes,
    primaryRelationship: options.primaryRelationship ?? supportedRelationships[0],
    supportedRelationships,
    ...relationshipFlagsFromSupported(supportedRelationships),
    ownershipPolicy,
    participantConstraints,
    reason: options.reason,
  }
}

const ALL: readonly RelationshipType[] = ['B2B', 'B2P', 'P2B', 'P2P']
const B2B_ONLY: readonly RelationshipType[] = ['B2B']
const HIRING: readonly RelationshipType[] = ['B2P', 'P2B']
const B2B_B2P_P2B: readonly RelationshipType[] = ['B2B', 'B2P', 'P2B']

export const SUB_MODEL_APPLICABILITY: Record<SubModelType, CollaborationApplicability> = {
  task_based: buildApplicability(
    ALL,
    { mode: 'single', transferable: true, requiresPrimaryOwner: true },
    { minimumParticipants: 1, maximumParticipants: 1, recommendedParticipants: 1 },
    { primaryRelationship: 'B2B' },
  ),
  consortium: buildApplicability(
    B2B_ONLY,
    { mode: 'multi', transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 2, maximumParticipants: 'unlimited', recommendedParticipants: 4 },
    { allowedPartyTypes: ['company'], primaryRelationship: 'B2B' },
  ),
  project_jv: buildApplicability(
    B2B_ONLY,
    { mode: 'shared', transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 2, maximumParticipants: 'unlimited', recommendedParticipants: 2 },
    {
      allowedPartyTypes: ['company'],
      primaryRelationship: 'B2B',
      reason: 'Project-Specific Joint Venture requires a company entity',
    },
  ),
  spv: buildApplicability(
    B2B_ONLY,
    { mode: 'shared', transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 2, maximumParticipants: 'unlimited', recommendedParticipants: 3 },
    {
      allowedPartyTypes: ['company'],
      primaryRelationship: 'B2B',
      reason: 'SPV is a corporate structure available to companies only',
    },
  ),
  strategic_jv: buildApplicability(
    B2B_ONLY,
    { mode: 'shared', transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 2, maximumParticipants: 'unlimited', recommendedParticipants: 2 },
    {
      allowedPartyTypes: ['company'],
      primaryRelationship: 'B2B',
      reason: 'Strategic Joint Venture requires a company entity',
    },
  ),
  strategic_alliance: buildApplicability(
    ALL,
    { mode: 'shared', transferable: true, requiresPrimaryOwner: true },
    { minimumParticipants: 2, maximumParticipants: 'unlimited', recommendedParticipants: 2 },
    { primaryRelationship: 'B2B' },
  ),
  mentorship: buildApplicability(
    ['P2P', 'B2P', 'P2B'],
    { mode: 'single', transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 1, maximumParticipants: 2, recommendedParticipants: 1 },
    { primaryRelationship: 'P2P' },
  ),
  bulk_purchasing: buildApplicability(
    ['B2B', 'B2P'],
    { mode: 'multi', transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 2, maximumParticipants: 'unlimited', recommendedParticipants: 3 },
    { primaryRelationship: 'B2B' },
  ),
  equipment_sharing: buildApplicability(
    ALL,
    { mode: 'shared', transferable: true, requiresPrimaryOwner: true },
    { minimumParticipants: 2, maximumParticipants: 'unlimited', recommendedParticipants: 2 },
    { primaryRelationship: 'B2B' },
  ),
  resource_sharing: buildApplicability(
    ALL,
    { mode: 'shared', transferable: true, requiresPrimaryOwner: false },
    { minimumParticipants: 2, maximumParticipants: 'unlimited', recommendedParticipants: 2 },
    { primaryRelationship: 'B2P' },
  ),
  professional_hiring: buildApplicability(
    HIRING,
    { mode: 'single', transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 1, maximumParticipants: 1, recommendedParticipants: 1 },
    { allowedPartyTypes: ['company'], primaryRelationship: 'B2P' },
  ),
  consultant_hiring: buildApplicability(
    B2B_B2P_P2B,
    { mode: 'single', transferable: true, requiresPrimaryOwner: true },
    { minimumParticipants: 1, maximumParticipants: 'unlimited', recommendedParticipants: 1 },
    { primaryRelationship: 'B2P' },
  ),
  competition_rfp: buildApplicability(
    ALL,
    { mode: 'single', transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 1, maximumParticipants: 'unlimited', recommendedParticipants: 3 },
    { primaryRelationship: 'B2B' },
  ),
}
