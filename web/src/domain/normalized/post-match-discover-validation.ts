import type { DiscoverPostMatchCommand } from '@pm-twin/commands'
import {
  isDiscoverCircularPostMatch,
  isDiscoverConsortiumPostMatch,
  isDiscoverOneWayPostMatch,
  isDiscoverTwoWayPostMatch,
} from '@/domain/normalized/post-match-topology-guards.ts'
import type {
  PostMatchBarterSide,
  PostMatchCircularLink,
  PostMatchConsortiumRole,
} from '@/types/domain.ts'
import { computePostMatchStrongKey } from '@/domain/normalized/post-match-strong-key.ts'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function validateParticipants(
  participants: DiscoverPostMatchCommand['participants'],
  errors: string[],
): void {
  if (!Array.isArray(participants) || participants.length === 0) {
    errors.push('participants is required')
  }
}

function validateBarterSide(
  side: PostMatchBarterSide | undefined,
  label: string,
  errors: string[],
): void {
  if (!side || typeof side !== 'object') {
    errors.push(`${label} is required`)
    return
  }
  if (!isNonEmptyString(side.userId)) {
    errors.push(`${label}.userId is required`)
  }
  if (!isNonEmptyString(side.needId)) {
    errors.push(`${label}.needId is required`)
  }
  if (!isNonEmptyString(side.offerId)) {
    errors.push(`${label}.offerId is required`)
  }
}

function validateCircularLink(
  link: PostMatchCircularLink,
  index: number,
  errors: string[],
): void {
  const prefix = `links[${index}]`
  if (!isNonEmptyString(link.fromCreatorId)) {
    errors.push(`${prefix}.fromCreatorId is required`)
  }
  if (!isNonEmptyString(link.toCreatorId)) {
    errors.push(`${prefix}.toCreatorId is required`)
  }
  if (!isNonEmptyString(link.needId)) {
    errors.push(`${prefix}.needId is required`)
  }
  if (!isNonEmptyString(link.offerId)) {
    errors.push(`${prefix}.offerId is required`)
  }
  if (link.score == null || Number.isNaN(Number(link.score))) {
    errors.push(`${prefix}.score is required`)
  }
}

function validateConsortiumRole(
  role: PostMatchConsortiumRole,
  index: number,
  errors: string[],
): void {
  const prefix = `roles[${index}]`
  if (!isNonEmptyString(role.role)) {
    errors.push(`${prefix}.role is required`)
  }
  if (!isNonEmptyString(role.userId)) {
    errors.push(`${prefix}.userId is required`)
  }
  if (!isNonEmptyString(role.opportunityId)) {
    errors.push(`${prefix}.opportunityId is required`)
  }
}

/**
 * Topology-aware validation for DiscoverPostMatch commands (ADR-MATCH-001).
 */
export function validateDiscoverPostMatchCommand(
  command: DiscoverPostMatchCommand,
): readonly string[] {
  const errors: string[] = []

  if (!command.matchType?.trim()) {
    errors.push('matchType is required')
  }
  if (command.matchScore == null || Number.isNaN(Number(command.matchScore))) {
    errors.push('matchScore is required')
  }
  validateParticipants(command.participants, errors)

  if (isDiscoverOneWayPostMatch(command)) {
    if (!isNonEmptyString(command.needOpportunityId)) {
      errors.push('needOpportunityId is required')
    }
    if (!isNonEmptyString(command.offerOpportunityId)) {
      errors.push('offerOpportunityId is required')
    }
    if (!command.matchCriteria || typeof command.matchCriteria !== 'object') {
      errors.push('matchCriteria is required')
    }
  } else if (isDiscoverTwoWayPostMatch(command)) {
    validateBarterSide(command.sideA, 'sideA', errors)
    validateBarterSide(command.sideB, 'sideB', errors)
  } else if (isDiscoverConsortiumPostMatch(command)) {
    if (!isNonEmptyString(command.leadNeedId)) {
      errors.push('leadNeedId is required')
    }
    if (!Array.isArray(command.roles) || command.roles.length === 0) {
      errors.push('roles is required')
    } else {
      command.roles.forEach((role, index) =>
        validateConsortiumRole(role, index, errors),
      )
    }
  } else if (isDiscoverCircularPostMatch(command)) {
    if (!Array.isArray(command.cycle) || command.cycle.length < 2) {
      errors.push('cycle must contain at least 2 participants')
    }
    if (!Array.isArray(command.links) || command.links.length === 0) {
      errors.push('links is required')
    } else {
      command.links.forEach((link, index) =>
        validateCircularLink(link, index, errors),
      )
      if (
        Array.isArray(command.cycle) &&
        command.cycle.length > 0 &&
        command.links.length < command.cycle.length
      ) {
        errors.push('links must cover every step in cycle')
      }
    }
  }

  return errors
}

/** Strong key for discover dedupe — null when topology payload is incomplete. */
export function discoverPostMatchStrongKey(
  command: DiscoverPostMatchCommand,
): string | null {
  if (isDiscoverOneWayPostMatch(command)) {
    return computePostMatchStrongKey({
      matchType: 'one_way',
      needOpportunityId: command.needOpportunityId,
      offerOpportunityId: command.offerOpportunityId,
      participants: command.participants,
    })
  }

  if (isDiscoverTwoWayPostMatch(command)) {
    return computePostMatchStrongKey({
      matchType: 'two_way',
      payload: {
        sideA: command.sideA,
        sideB: command.sideB,
        scoreAtoB: command.scoreAtoB,
        scoreBtoA: command.scoreBtoA,
        valueEquivalence: command.valueEquivalence,
      },
      participants: command.participants,
    })
  }

  if (isDiscoverConsortiumPostMatch(command)) {
    return computePostMatchStrongKey({
      matchType: 'consortium',
      payload: {
        leadNeedId: command.leadNeedId,
        roles: [...command.roles],
        valueBalance: command.valueBalance,
      },
      participants: command.participants,
    })
  }

  if (isDiscoverCircularPostMatch(command)) {
    return computePostMatchStrongKey({
      matchType: 'circular',
      payload: {
        cycle: [...command.cycle],
        links: [...command.links],
        chainBalance: command.chainBalance,
      },
      participants: command.participants,
    })
  }

  return null
}
