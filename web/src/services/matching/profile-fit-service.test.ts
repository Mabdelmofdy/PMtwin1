import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Opportunity, PlatformUser } from '@/types/domain.ts'
import { createDefaultUserSettings } from '@/domain/user-settings/defaults.ts'
import {
  buildProfileFitSnapshot,
  listProfileOpportunityRecommendations,
  scoreProfileOpportunityFit,
} from '@/services/matching/profile-fit-service.ts'

const account: PlatformUser = {
  id: 'professional-1',
  email: 'private@example.com',
  role: 'user',
  status: 'active',
  profile: {
    name: 'Private Name',
    phone: '+966500000000',
    skills: ['project management', 'risk'],
    services: ['project management'],
    sectors: ['construction'],
    preferredWorkMode: 'hybrid',
    certifications: ['PMP'],
  },
}

const opportunity: Opportunity = {
  id: 'opportunity-1',
  title: 'Construction PM support',
  description: 'Project management and risk support',
  status: 'published',
  location: 'Riyadh',
  scope: {
    requiredSkills: ['project management'],
    sectors: ['construction'],
  },
}

describe('profile fit service', () => {
  it('builds an exact non-PII snapshot', () => {
    const snapshot = buildProfileFitSnapshot(account)
    const serialized = JSON.stringify(snapshot)

    assert.equal(serialized.includes(account.email), false)
    assert.equal(serialized.includes(account.profile?.phone ?? ''), false)
    assert.equal(serialized.includes(account.profile?.name ?? ''), false)
    assert.deepEqual(snapshot.capabilities, ['project management', 'risk'])
  })

  it('scores and explains profile fit against a project', () => {
    const result = scoreProfileOpportunityFit(account, opportunity)

    assert.ok(result.score > 0)
    assert.equal(result.targetType, 'opportunity')
    assert.ok(result.factors.some((factor) => factor.factor === 'capabilities'))
  })

  it('respects private recommendation preferences', () => {
    const defaults = createDefaultUserSettings('professional-1')
    const disabled = {
      ...defaults,
      matching: { ...defaults.matching, receiveRecommendations: false },
    }

    assert.equal(
      listProfileOpportunityRecommendations({
        account,
        opportunities: [opportunity],
        settings: disabled,
      }).length,
      0,
    )
  })
})
