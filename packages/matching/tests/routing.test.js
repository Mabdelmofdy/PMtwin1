import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  detectMatchingModel,
  rankMatches,
} from '../dist/index.js'

describe('routing — detectMatchingModel', () => {
  it('includes one_way for offer opportunities', () => {
    const models = detectMatchingModel({ intent: 'offer' })
    assert.ok(models.includes('one_way'))
  })

  it('includes two_way for barter opportunities', () => {
    const models = detectMatchingModel({
      intent: 'request',
      exchangeMode: 'barter',
    })
    assert.ok(models.includes('one_way'))
    assert.ok(models.includes('two_way'))
  })

  it('includes consortium when member roles are present', () => {
    const models = detectMatchingModel({
      intent: 'request',
      attributes: { memberRoles: ['Investor', 'Operator'] },
    })
    assert.ok(models.includes('consortium'))
  })

  it('does not include circular in auto-detection', () => {
    const models = detectMatchingModel({
      intent: 'hybrid',
      exchangeMode: 'barter',
      attributes: { memberRoles: ['Role A'] },
    })
    assert.ok(!models.includes('circular'))
  })
})

describe('routing — rankMatches', () => {
  it('sorts by composite rank descending', () => {
    const ranked = rankMatches([
      { matchScore: 0.75, breakdown: { reputation: 0.5, timelineFit: 0.5 } },
      { matchScore: 0.90, breakdown: { reputation: 0.8, timelineFit: 0.8 } },
      { matchScore: 0.60, breakdown: { reputation: 0.4, timelineFit: 0.4 } },
    ])
    assert.equal(ranked[0].matchScore, 0.90)
    assert.equal(ranked[ranked.length - 1].matchScore, 0.60)
    assert.ok(ranked[0].compositeRank > ranked[1].compositeRank)
  })

  it('assigns recommendation tiers', () => {
    const ranked = rankMatches([
      {
        matchScore: 0.90,
        breakdown: { reputation: 0.9, timelineFit: 0.9 },
        valueAnalysis: { valueFit: 'strong', coverageRatio: 1 },
      },
      {
        matchScore: 0.75,
        breakdown: { reputation: 0.7, timelineFit: 0.7 },
      },
      {
        matchScore: 0.55,
        breakdown: { reputation: 0.5, timelineFit: 0.5 },
      },
    ])
    assert.equal(ranked[0].recommendation?.tier, 'top')
    assert.equal(ranked[1].recommendation?.tier, 'good')
    assert.equal(ranked[2].recommendation?.tier, 'possible')
  })
})
