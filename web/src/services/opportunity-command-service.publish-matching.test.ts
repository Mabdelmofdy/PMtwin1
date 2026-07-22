import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { CommandResult } from '@pm-twin/commands'
import {
  createOpportunityCommandService,
  type PublishTransitionResult,
} from '@/services/opportunity-command-service.ts'
import type { PublishMatchingResult } from '@/services/matching-service.ts'

const emptyMatching: PublishMatchingResult = {
  discoveredMatchesCount: 0,
  skippedDuplicatesCount: 0,
  matchingErrors: [],
  postMatchIds: [],
}

function successCommand(aggregateId: string): CommandResult {
  return {
    success: true,
    aggregateId,
    commandType: 'TransitionOpportunityStatus',
  }
}

function failureCommand(aggregateId: string): CommandResult {
  return {
    success: false,
    aggregateId,
    commandType: 'TransitionOpportunityStatus',
    errors: ['blocked'],
  }
}

describe('opportunityCommandService post-publish matching', () => {
  it('runs matching once after successful transitionToPublished', () => {
    let publishCalls = 0
    let circularCalls = 0
    const service = createOpportunityCommandService({
      gateway: {
        execute: () => successCommand('opp-1'),
      } as never,
      runPublishMatching: () => {
        publishCalls += 1
        return {
          ...emptyMatching,
          discoveredMatchesCount: 2,
          postMatchIds: ['pm-1', 'pm-2'],
        }
      },
      runCircularMatching: () => {
        circularCalls += 1
        return {
          ...emptyMatching,
          discoveredMatchesCount: 1,
          postMatchIds: ['pm-c1'],
        }
      },
    })

    const result: PublishTransitionResult = service.transitionToPublished('opp-1')

    assert.equal(result.command.success, true)
    assert.equal(publishCalls, 1)
    assert.equal(circularCalls, 1)
    assert.equal(result.matching.discoveredMatchesCount, 2)
    assert.equal(result.circular.discoveredMatchesCount, 1)
  })

  it('does not run matching when publish transition fails', () => {
    let publishCalls = 0
    const service = createOpportunityCommandService({
      gateway: {
        execute: () => failureCommand('opp-fail'),
      } as never,
      runPublishMatching: () => {
        publishCalls += 1
        return emptyMatching
      },
      runCircularMatching: () => emptyMatching,
    })

    const result = service.transitionToPublished('opp-fail')

    assert.equal(result.command.success, false)
    assert.equal(publishCalls, 0)
    assert.equal(result.matching.discoveredMatchesCount, 0)
  })

  it('transitionOpportunityStatus to published runs matching as side effect', () => {
    let publishCalls = 0
    const service = createOpportunityCommandService({
      gateway: {
        execute: () => successCommand('opp-2'),
      } as never,
      runPublishMatching: () => {
        publishCalls += 1
        return emptyMatching
      },
      runCircularMatching: () => emptyMatching,
    })

    const result = service.transitionOpportunityStatus('opp-2', 'published')
    assert.equal(result.success, true)
    assert.equal(publishCalls, 1)

    publishCalls = 0
    service.transitionOpportunityStatus('opp-2', 'matched')
    assert.equal(publishCalls, 0)
  })

  it('second matching pass reports duplicates skipped (idempotent)', () => {
    let pass = 0
    const service = createOpportunityCommandService({
      gateway: {
        execute: () => successCommand('opp-dup'),
      } as never,
      runPublishMatching: () => {
        pass += 1
        if (pass === 1) {
          return {
            ...emptyMatching,
            discoveredMatchesCount: 1,
            postMatchIds: ['pm-1'],
          }
        }
        return {
          ...emptyMatching,
          skippedDuplicatesCount: 1,
        }
      },
      runCircularMatching: () => emptyMatching,
    })

    const first = service.transitionToPublished('opp-dup')
    const second = service.transitionToPublished('opp-dup')

    assert.equal(first.matching.discoveredMatchesCount, 1)
    assert.equal(second.matching.discoveredMatchesCount, 0)
    assert.equal(second.matching.skippedDuplicatesCount, 1)
  })

  it('publishOpportunity also runs matching after success', () => {
    let publishCalls = 0
    const service = createOpportunityCommandService({
      gateway: {
        execute: () => ({
          success: true,
          aggregateId: 'opp-pub',
          commandType: 'PublishOpportunity',
        }),
      } as never,
      runPublishMatching: () => {
        publishCalls += 1
        return {
          ...emptyMatching,
          discoveredMatchesCount: 3,
        }
      },
      runCircularMatching: () => emptyMatching,
    })

    const result = service.publishOpportunity('opp-pub')
    assert.equal(result.command.success, true)
    assert.equal(publishCalls, 1)
    assert.equal(result.matching.discoveredMatchesCount, 3)
  })

  it('circular matching throw does not fail publish result', () => {
    const service = createOpportunityCommandService({
      gateway: {
        execute: () => successCommand('opp-circ'),
      } as never,
      runPublishMatching: () => ({
        ...emptyMatching,
        discoveredMatchesCount: 1,
      }),
      runCircularMatching: () => {
        throw new Error('Circular engine failure')
      },
    })

    const result = service.transitionToPublished('opp-circ')
    assert.equal(result.command.success, true)
    assert.equal(result.matching.discoveredMatchesCount, 1)
    assert.ok(
      result.circular.matchingErrors.some((error) =>
        error.includes('Circular engine failure'),
      ),
    )
  })
})
