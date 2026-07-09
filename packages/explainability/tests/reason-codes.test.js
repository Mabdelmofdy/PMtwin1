import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  AGREEMENT_REASON_CODES,
  ALL_REASON_CODES,
  ANALYTICS_REASON_CODES,
  COMMERCIAL_REASON_CODES,
  CONTRACT_REASON_CODES,
  DASHBOARD_REASON_CODES,
  DOCUMENT_REASON_CODES,
  KNOWLEDGE_REASON_CODES,
  MATCH_REASON_CODES,
  NEGOTIATION_REASON_CODES,
  PROFILE_REASON_CODES,
  READINESS_REASON_CODES,
  REASON_CODE_PREFIX,
  VETTING_REASON_CODES,
  assertReasonCode,
  isReasonCode,
} from '../dist/index.js'

const DOMAIN_CODES = [
  PROFILE_REASON_CODES,
  DOCUMENT_REASON_CODES,
  READINESS_REASON_CODES,
  MATCH_REASON_CODES,
  NEGOTIATION_REASON_CODES,
  COMMERCIAL_REASON_CODES,
  CONTRACT_REASON_CODES,
  VETTING_REASON_CODES,
  DASHBOARD_REASON_CODES,
  ANALYTICS_REASON_CODES,
  AGREEMENT_REASON_CODES,
  KNOWLEDGE_REASON_CODES,
]

describe('Reason code registry', () => {
  it('defines canonical codes for every domain prefix', () => {
    for (const prefix of Object.values(REASON_CODE_PREFIX)) {
      const domainObject = DOMAIN_CODES.find((codes) =>
        Object.values(codes).some((code) => code.startsWith(prefix)),
      )
      assert.ok(domainObject, `Missing reason codes for prefix ${prefix}`)
    }
  })

  it('includes required sprint examples', () => {
    assert.equal(PROFILE_REASON_CODES.MISSING_PHONE, 'PROFILE_MISSING_PHONE')
    assert.equal(PROFILE_REASON_CODES.MISSING_SKILLS, 'PROFILE_MISSING_SKILLS')
    assert.equal(PROFILE_REASON_CODES.MISSING_ADDRESS, 'PROFILE_MISSING_ADDRESS')
    assert.equal(DOCUMENT_REASON_CODES.CR_EXPIRED, 'DOCUMENT_CR_EXPIRED')
    assert.equal(DOCUMENT_REASON_CODES.VAT_MISSING, 'DOCUMENT_VAT_MISSING')
    assert.equal(
      DOCUMENT_REASON_CODES.CERTIFICATE_EXPIRED,
      'DOCUMENT_CERTIFICATE_EXPIRED',
    )
    assert.equal(READINESS_REASON_CODES.MISSING_BUDGET, 'READINESS_MISSING_BUDGET')
    assert.equal(
      READINESS_REASON_CODES.MISSING_TIMELINE,
      'READINESS_MISSING_TIMELINE',
    )
    assert.equal(MATCH_REASON_CODES.SKILL_LOW, 'MATCH_SKILL_LOW')
    assert.equal(MATCH_REASON_CODES.LOCATION_LOW, 'MATCH_LOCATION_LOW')
    assert.equal(MATCH_REASON_CODES.VALUE_LOW, 'MATCH_VALUE_LOW')
    assert.equal(NEGOTIATION_REASON_CODES.PRICE_GAP, 'NEGOTIATION_PRICE_GAP')
    assert.equal(
      NEGOTIATION_REASON_CODES.RESPONSE_DELAY,
      'NEGOTIATION_RESPONSE_DELAY',
    )
    assert.equal(
      COMMERCIAL_REASON_CODES.APPROVAL_PENDING,
      'COMMERCIAL_APPROVAL_PENDING',
    )
    assert.equal(
      CONTRACT_REASON_CODES.SIGNATURE_PENDING,
      'CONTRACT_SIGNATURE_PENDING',
    )
  })

  it('validates static and parameterized reason codes', () => {
    for (const code of ALL_REASON_CODES) {
      assert.equal(isReasonCode(code), true)
      assert.equal(assertReasonCode(code), code)
    }

    assert.equal(isReasonCode('READINESS_MISSING_customField'), true)
    assert.equal(isReasonCode('PROFILE_MISSING_customField'), true)
    assert.equal(isReasonCode('NOT_A_REASON'), false)
    assert.throws(() => assertReasonCode('NOT_A_REASON'))
  })

  it('keeps ALL_REASON_CODES aligned with domain registries', () => {
    const flattened = DOMAIN_CODES.flatMap((codes) => Object.values(codes))
    assert.deepEqual([...ALL_REASON_CODES].sort(), [...flattened].sort())
  })
})
