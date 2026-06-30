/**
 * User workspace UI display helpers — filtering and labels only.
 */

import type { PlatformUser } from '@/types/domain.ts'

export function resolvePersonDisplayName(person: PlatformUser): string {
  return person.profile?.name ?? person.email
}

export function resolvePersonHeadline(person: PlatformUser): string {
  return person.profile?.headline ?? person.profile?.type ?? String(person.role)
}

export function filterPublicPeople(
  people: readonly PlatformUser[],
): PlatformUser[] {
  return people.filter((p) => p.isPublic !== false)
}

export function matchesPeopleSearch(person: PlatformUser, query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  const name = resolvePersonDisplayName(person).toLowerCase()
  const headline = resolvePersonHeadline(person).toLowerCase()
  const location = person.profile?.location?.toLowerCase() ?? ''
  const skills = (person.profile?.skills ?? []).join(' ').toLowerCase()
  return (
    name.includes(q) ||
    headline.includes(q) ||
    location.includes(q) ||
    skills.includes(q)
  )
}

export function isCompanyEntity(
  person: PlatformUser,
  companyIds: ReadonlySet<string>,
): boolean {
  return companyIds.has(person.id)
}

export type PeopleScopeFilter = 'all' | 'people' | 'companies'

export function matchesPeopleScope(
  person: PlatformUser,
  scope: PeopleScopeFilter,
  companyIds: ReadonlySet<string>,
): boolean {
  if (scope === 'all') return true
  const isCompany = isCompanyEntity(person, companyIds)
  return scope === 'companies' ? isCompany : !isCompany
}

/** Mock message threads — preserved from legacy MessagesPage. */
export const MOCK_MESSAGE_THREADS = [
  { id: 't1', name: 'Khalid Al-Harbi', preview: 'Happy to walk through LOD 400…', unread: 2 },
  { id: 't2', name: 'Al-Riyadh Construction', preview: 'Contract draft attached', unread: 0 },
] as const
