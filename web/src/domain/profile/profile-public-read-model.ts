import {
  toPublicProfile,
  type ProfileSocialLinks,
} from '@pm-twin/profile'
import type { PlatformUser } from '@/types/domain.ts'

export type PublicProfileProjection = {
  readonly id: string
  readonly kind: 'individual' | 'company'
  readonly displayName: string
  readonly headline?: string
  readonly location?: string
  readonly summary?: string
  readonly skills: readonly string[]
  readonly services: readonly string[]
  readonly workHistory: readonly string[]
  readonly portfolio: readonly string[]
  readonly certifications: readonly string[]
  readonly availability?: string
  readonly teamSize?: string
  readonly description?: string
  readonly contact: {
    readonly phone?: string
    readonly website?: string
    readonly linkedIn?: string
  }
  readonly socialLinks: ProfileSocialLinks
  readonly verified: boolean
}

function localizedText(value?: { readonly ar?: string; readonly en?: string }): string | undefined {
  return value?.en ?? value?.ar
}

/** Builds the only shape allowed to cross the marketplace profile read boundary. */
export function buildPublicProfileProjection(
  account: PlatformUser,
  companyIds: ReadonlySet<string>,
): PublicProfileProjection {
  const profile = account.profile
  const kind = companyIds.has(account.id) ? 'company' : 'individual'
  const vettingStatus =
    profile?.vetting?.caseStatus ?? profile?.vetting?.reviewProgress
  const canonical = profile?.canonical
    ? toPublicProfile(profile.canonical)
    : undefined
  const canonicalContact = canonical?.contact

  return {
    id: account.id,
    kind,
    displayName: canonical?.displayName ?? profile?.name ?? 'Marketplace member',
    headline:
      localizedText(canonical?.headline) ?? profile?.headline ?? profile?.type,
    location:
      canonical?.location
        ? [canonical.location.city, canonical.location.region, canonical.location.countryCode]
            .filter(Boolean)
            .join(', ')
        : profile?.location,
    summary: localizedText(canonical?.summary) ?? profile?.bio ?? profile?.description,
    skills: profile?.skills ?? [],
    services:
      canonical?.services.map((service) => localizedText(service.name) ?? service.category) ??
      profile?.services ??
      [],
    workHistory:
      canonical?.experience.map((entry) => localizedText(entry.title) ?? entry.organization ?? '') ??
      profile?.workHistory ??
      [],
    portfolio:
      canonical?.portfolio.map((entry) => localizedText(entry.title) ?? entry.url ?? '') ??
      profile?.portfolio ??
      [],
    certifications:
      canonical?.credentials.map((entry) => localizedText(entry.name) ?? entry.issuer ?? '') ??
      profile?.certifications ??
      [],
    availability: profile?.availability,
    teamSize: profile?.employeeCount ?? profile?.teamSize,
    description: profile?.description,
    contact: {
      ...(typeof canonicalContact?.phone === 'string'
        ? { phone: canonicalContact.phone }
        : profile?.visibility?.showPhone && profile.phone
          ? { phone: profile.phone }
          : {}),
      ...(typeof canonicalContact?.website === 'string'
        ? { website: canonicalContact.website }
        : profile?.visibility?.showWebsite && profile.website
          ? { website: profile.website }
          : {}),
      ...(typeof canonicalContact?.linkedin === 'string'
        ? { linkedIn: canonicalContact.linkedin }
        : profile?.visibility?.showLinkedIn && profile.linkedIn
          ? { linkedIn: profile.linkedIn }
          : {}),
    },
    socialLinks:
      canonical?.socialLinks ??
      (profile?.visibility?.showSocialLinks ? { ...profile.socialLinks } : {}),
    verified: vettingStatus === 'approved',
  }
}
