import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  filterPublicPeople,
  matchesPeopleSearch,
  matchesPeopleScope,
  resolvePersonDisplayName,
} from '@/components/user/user-display.ts'
import type { PlatformUser } from '@/types/domain.ts'

const sample: PlatformUser = {
  id: 'u1',
  email: 'a@example.com',
  role: 'pm',
  status: 'active',
  isPublic: true,
  profile: {
    name: 'Sara Al-Qahtani',
    headline: 'Senior PM',
    location: 'Riyadh',
    skills: ['BIM', 'NEOM'],
  },
}

describe('user-display', () => {
  it('resolves display name and filters public people', () => {
    assert.equal(resolvePersonDisplayName(sample), 'Sara Al-Qahtani')
    const filtered = filterPublicPeople([
      sample,
      { ...sample, id: 'u2', isPublic: false },
    ])
    assert.equal(filtered.length, 1)
  })

  it('matches search query against profile fields', () => {
    assert.equal(matchesPeopleSearch(sample, 'bim'), true)
    assert.equal(matchesPeopleSearch(sample, 'jeddah'), false)
  })

  it('filters by people vs companies scope', () => {
    const companyIds = new Set(['c1'])
    assert.equal(matchesPeopleScope(sample, 'people', companyIds), true)
    assert.equal(matchesPeopleScope({ ...sample, id: 'c1' }, 'companies', companyIds), true)
    assert.equal(matchesPeopleScope({ ...sample, id: 'c1' }, 'people', companyIds), false)
  })
})
