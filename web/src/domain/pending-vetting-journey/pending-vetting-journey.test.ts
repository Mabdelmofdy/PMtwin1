import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PlatformUser } from '@/types/domain.ts'
import type { PartyDocument } from '@/types/party-document.ts'
import {
  computeOverallOnboardingPercent,
  resolveAdminApprovalProgress,
  resolvePendingVettingJourney,
} from '@/domain/pending-vetting-journey/pending-vetting-journey.ts'
import { evaluateProfileReadiness } from '@/domain/profile-readiness/profile-readiness-evaluator.ts'
import { evaluateVettingReadiness } from '@/domain/vetting-readiness/vetting-readiness-evaluator.ts'

function baseUser(overrides: Partial<PlatformUser> = {}): PlatformUser {
  return {
    id: 'u-1',
    email: 'user@test.com',
    role: 'user',
    status: 'pending_vetting',
    createdAt: '2026-01-01T00:00:00.000Z',
    profile: { name: 'User' },
    ...overrides,
  }
}

describe('pending vetting journey', () => {
  it('shows journey steps with completed, current, and pending states', () => {
    const user = baseUser()
    const profile = evaluateProfileReadiness({
      profileKind: 'individual',
      profile: { profileCompletionUnlocked: false },
    })
    const vetting = evaluateVettingReadiness({
      accountStatus: user.status,
      documents: [],
    })
    const journey = resolvePendingVettingJourney({
      user,
      profile,
      profileCompletionUnlocked: false,
      vetting,
      documents: [],
    })

    assert.equal(journey.steps.length, 6)
    assert.equal(journey.steps[0]?.id, 'account_created')
    assert.equal(journey.steps[0]?.state, 'completed')
    assert.equal(journey.steps[1]?.state, 'completed')
    assert.ok(journey.steps.some((step) => step.state === 'current'))
  })

  it('calculates overall onboarding score with weighted formula', () => {
    const percent = computeOverallOnboardingPercent({
      profileCompletionScore: 50,
      vettingScore: 40,
      adminApprovalProgress: 50,
    })
    assert.equal(percent, 46)
  })

  it('resolves admin approval progress by status', () => {
    assert.equal(resolveAdminApprovalProgress(baseUser()), 0)
    assert.equal(resolveAdminApprovalProgress(baseUser({ status: 'approved' })), 100)
    assert.equal(
      resolveAdminApprovalProgress(
        baseUser({
          profile: {
            vetting: { reviewProgress: 'in_review', lastResubmittedAt: '2026-01-02' },
          },
        }),
      ),
      50,
    )
    assert.equal(resolveAdminApprovalProgress(baseUser({ status: 'active' })), 100)
    assert.equal(resolveAdminApprovalProgress(baseUser({ status: 'rejected' })), 0)
  })

  it('does not persist overall onboarding score (pure function)', () => {
    const user = baseUser()
    const profile = evaluateProfileReadiness({
      profileKind: 'individual',
      profile: { profileCompletionUnlocked: true, name: 'User', skills: ['a', 'b', 'c'] },
    })
    const vetting = evaluateVettingReadiness({
      accountStatus: user.status,
      documents: [],
    })
    const before = JSON.stringify(user)
    resolvePendingVettingJourney({
      user,
      profile,
      profileCompletionUnlocked: true,
      vetting,
      documents: [],
    })
    assert.equal(JSON.stringify(user), before)
  })

  it('changes next best action based on profile, documents, and review status', () => {
    const profileLocked = evaluateProfileReadiness({
      profileKind: 'individual',
      profile: { profileCompletionUnlocked: false },
    })
    const journeyProfile = resolvePendingVettingJourney({
      user: baseUser(),
      profile: profileLocked,
      profileCompletionUnlocked: false,
      vetting: evaluateVettingReadiness({ accountStatus: 'pending_vetting', documents: [] }),
      documents: [],
    })
    assert.match(journeyProfile.nextBestAction, /Complete/i)

    const expiredDoc: PartyDocument = {
      id: 'doc-1',
      ownerPartyId: 'u-1',
      uploadedByUserId: 'u-1',
      documentCategory: 'vetting',
      documentType: 'commercial_registration',
      fileName: 'cr.pdf',
      status: 'expired',
      uploadedAt: '2026-01-01',
    }
    const journeyExpired = resolvePendingVettingJourney({
      user: baseUser({
        profile: { profileCompletionUnlocked: true, vetting: { reviewProgress: 'in_review' } },
      }),
      profile: evaluateProfileReadiness({
        profileKind: 'individual',
        profile: {
          profileCompletionUnlocked: true,
          name: 'User',
          role: 'Consultant',
          skills: ['a', 'b', 'c'],
          services: ['Service A'],
          location: 'Riyadh',
          availability: 'Immediate',
        },
      }),
      profileCompletionUnlocked: true,
      vetting: evaluateVettingReadiness({
        accountStatus: 'pending_vetting',
        documents: [expiredDoc],
      }),
      documents: [expiredDoc],
    })
    assert.match(journeyExpired.nextBestAction, /Replace expired/i)

    const journeyMissingVat = resolvePendingVettingJourney({
      user: baseUser({
        profile: { profileCompletionUnlocked: true, vetting: { reviewProgress: 'in_review' } },
      }),
      profile: evaluateProfileReadiness({
        profileKind: 'individual',
        profile: {
          profileCompletionUnlocked: true,
          name: 'User',
          role: 'Consultant',
          skills: ['a', 'b', 'c'],
          services: ['Service A'],
          location: 'Riyadh',
          availability: 'Immediate',
        },
      }),
      profileCompletionUnlocked: true,
      vetting: evaluateVettingReadiness({
        accountStatus: 'pending_vetting',
        documents: [
          {
            id: 'doc-cr',
            ownerPartyId: 'u-1',
            uploadedByUserId: 'u-1',
            documentCategory: 'vetting',
            documentType: 'commercial_registration',
            fileName: 'cr.pdf',
            status: 'approved',
            uploadedAt: '2026-01-01',
          },
        ],
      }),
      documents: [],
    })
    assert.equal(journeyMissingVat.nextBestAction, 'Upload VAT')

    const journeyWaiting = resolvePendingVettingJourney({
      user: baseUser({
        profile: {
          profileCompletionUnlocked: true,
          vetting: { reviewProgress: 'in_review', lastResubmittedAt: '2026-01-03' },
        },
      }),
      profile: evaluateProfileReadiness({
        profileKind: 'individual',
        profile: {
          profileCompletionUnlocked: true,
          name: 'User',
          role: 'Consultant',
          skills: ['a', 'b', 'c'],
          services: ['Service A'],
          location: 'Riyadh',
          availability: 'Immediate',
        },
      }),
      profileCompletionUnlocked: true,
      vetting: evaluateVettingReadiness({
        accountStatus: 'pending_vetting',
        reviewProgress: 'in_review',
        documents: [
          {
            id: 'doc-cr-2',
            ownerPartyId: 'u-1',
            uploadedByUserId: 'u-1',
            documentCategory: 'vetting',
            documentType: 'commercial_registration',
            fileName: 'cr.pdf',
            status: 'approved',
            uploadedAt: '2026-01-01',
          },
          {
            id: 'doc-vat-2',
            ownerPartyId: 'u-1',
            uploadedByUserId: 'u-1',
            documentCategory: 'vetting',
            documentType: 'vat_certificate',
            fileName: 'vat.pdf',
            status: 'approved',
            uploadedAt: '2026-01-01',
          },
          {
            id: 'doc-insurance',
            ownerPartyId: 'u-1',
            uploadedByUserId: 'u-1',
            documentCategory: 'vetting',
            documentType: 'insurance_certificate',
            fileName: 'insurance.pdf',
            status: 'approved',
            uploadedAt: '2026-01-01',
          },
          {
            id: 'doc-license',
            ownerPartyId: 'u-1',
            uploadedByUserId: 'u-1',
            documentCategory: 'vetting',
            documentType: 'license',
            fileName: 'license.pdf',
            status: 'approved',
            uploadedAt: '2026-01-01',
          },
          {
            id: 'doc-national-id',
            ownerPartyId: 'u-1',
            uploadedByUserId: 'u-1',
            documentCategory: 'vetting',
            documentType: 'national_id',
            fileName: 'national-id.pdf',
            status: 'approved',
            uploadedAt: '2026-01-01',
          },
        ],
      }),
      documents: [],
    })
    assert.equal(journeyWaiting.nextBestAction, 'Waiting for admin review')

    const journeyChanges = resolvePendingVettingJourney({
      user: baseUser({
        profile: { vetting: { reviewProgress: 'changes_requested', changesResolved: false } },
      }),
      profile: evaluateProfileReadiness({
        profileKind: 'individual',
        profile: { profileCompletionUnlocked: true, name: 'User', skills: ['a', 'b', 'c'] },
      }),
      profileCompletionUnlocked: true,
      vetting: evaluateVettingReadiness({
        accountStatus: 'pending_vetting',
        reviewProgress: 'changes_requested',
        changesResolved: false,
        documents: [],
      }),
      documents: [],
    })
    assert.equal(journeyChanges.nextBestAction, 'Resubmit for review')
  })
})
