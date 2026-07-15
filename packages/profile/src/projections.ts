import {
  PROFILE_SCHEMA_VERSION,
  type CanonicalProfile,
  type MatchingProfileSnapshot,
  type PortfolioItem,
  type ProfileAvailability,
  type ProfileCredential,
  type ProfileExperience,
  type ProfileLocation,
  type ProfileService,
  type PublicProfile,
  type PublicProfileService,
} from './types.ts'

function copyLocation(value: ProfileLocation): ProfileLocation {
  return {
    countryCode: value.countryCode,
    ...(value.region ? { region: value.region } : {}),
    ...(value.city ? { city: value.city } : {}),
  }
}

function copyService(value: ProfileService): PublicProfileService {
  return {
    id: value.id,
    category: value.category,
    name: { ...value.name },
    ...(value.description ? { description: { ...value.description } } : {}),
    skillTags: [...value.skillTags],
    ...(value.proficiency ? { proficiency: value.proficiency } : {}),
  }
}

function copyExperience(value: ProfileExperience): ProfileExperience {
  return {
    id: value.id,
    title: { ...value.title },
    ...(value.organization ? { organization: value.organization } : {}),
    ...(value.sector ? { sector: value.sector } : {}),
    ...(value.description ? { description: { ...value.description } } : {}),
    ...(value.startedOn ? { startedOn: value.startedOn } : {}),
    ...(value.endedOn ? { endedOn: value.endedOn } : {}),
    isCurrent: value.isCurrent,
    skillTags: [...value.skillTags],
  }
}

function copyPortfolio(value: PortfolioItem): PortfolioItem {
  return {
    id: value.id,
    title: { ...value.title },
    ...(value.description ? { description: { ...value.description } } : {}),
    ...(value.sector ? { sector: value.sector } : {}),
    ...(value.completedOn ? { completedOn: value.completedOn } : {}),
    ...(value.url ? { url: value.url } : {}),
    skillTags: [...value.skillTags],
  }
}

function copyCredential(value: ProfileCredential): ProfileCredential {
  return {
    id: value.id,
    name: { ...value.name },
    ...(value.issuer ? { issuer: value.issuer } : {}),
    ...(value.credentialType ? { credentialType: value.credentialType } : {}),
    status: value.status,
    ...(value.issuedOn ? { issuedOn: value.issuedOn } : {}),
    ...(value.expiresOn ? { expiresOn: value.expiresOn } : {}),
    ...(value.verificationUrl ? { verificationUrl: value.verificationUrl } : {}),
  }
}

function copyAvailability(value: ProfileAvailability): ProfileAvailability {
  return {
    status: value.status,
    ...(value.availableFrom ? { availableFrom: value.availableFrom } : {}),
    ...(value.hoursPerWeek !== undefined ? { hoursPerWeek: value.hoursPerWeek } : {}),
    engagementModes: [...value.engagementModes],
    locations: value.locations.map(copyLocation),
  }
}

export function toPublicProfile(profile: CanonicalProfile): PublicProfile {
  const contact = {
    ...(profile.contactVisibility.email && profile.contact.email
      ? { email: profile.contact.email }
      : {}),
    ...(profile.contactVisibility.phone && profile.contact.phone
      ? { phone: profile.contact.phone }
      : {}),
    ...(profile.contactVisibility.website && profile.contact.website
      ? { website: profile.contact.website }
      : {}),
    ...(profile.contactVisibility.linkedin && profile.contact.linkedin
      ? { linkedin: profile.contact.linkedin }
      : {}),
  }
  const base = {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    id: profile.id,
    partyId: profile.partyId,
    kind: profile.kind,
    displayName: profile.displayName,
    ...(profile.headline ? { headline: { ...profile.headline } } : {}),
    ...(profile.summary ? { summary: { ...profile.summary } } : {}),
    locale: profile.locale,
    ...(profile.location ? { location: copyLocation(profile.location) } : {}),
    services: profile.services.map(copyService),
    experience: profile.experience.map(copyExperience),
    portfolio: profile.portfolio.map(copyPortfolio),
    credentials: profile.credentials.map(copyCredential),
    availability: copyAvailability(profile.availability),
    contact,
  } as const
  if (profile.kind === 'individual') {
    return {
      ...base,
      kind: 'individual',
      individual: {
        fullName: profile.individual.fullName,
        ...(profile.individual.professionalTitle
          ? { professionalTitle: profile.individual.professionalTitle }
          : {}),
        ...(profile.individual.yearsOfExperience !== undefined
          ? { yearsOfExperience: profile.individual.yearsOfExperience }
          : {}),
        languages: [...profile.individual.languages],
      },
    }
  }
  return {
    ...base,
    kind: 'company',
    company: {
      legalName: profile.company.legalName,
      ...(profile.company.organizationType ? { organizationType: profile.company.organizationType } : {}),
      ...(profile.company.foundedYear !== undefined ? { foundedYear: profile.company.foundedYear } : {}),
      ...(profile.company.employeeCountRange
        ? { employeeCountRange: profile.company.employeeCountRange }
        : {}),
      sectors: [...profile.company.sectors],
    },
  }
}

function sortedUnique<T extends string>(values: readonly T[]): readonly T[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort((left, right) =>
    left.localeCompare(right),
  )
}

function copyMatchingLocation(value: ProfileLocation): ProfileLocation {
  return {
    countryCode: value.countryCode,
    ...(value.region ? { region: value.region } : {}),
  }
}

export function toMatchingProfileSnapshot(profile: CanonicalProfile): MatchingProfileSnapshot {
  const serviceCategories = sortedUnique([
    ...profile.services.map((service) => service.category),
    ...profile.matchingPreferences.serviceCategories,
  ])
  const skillTags = sortedUnique([
    ...profile.services.flatMap((service) => service.skillTags),
    ...profile.experience.flatMap((entry) => entry.skillTags),
    ...profile.portfolio.flatMap((entry) => entry.skillTags),
    ...profile.matchingPreferences.skillTags,
  ])
  const sectors = sortedUnique([
    ...profile.experience.flatMap((entry) => entry.sector ? [entry.sector] : []),
    ...profile.portfolio.flatMap((entry) => entry.sector ? [entry.sector] : []),
    ...(profile.kind === 'company' ? profile.company.sectors : []),
    ...profile.matchingPreferences.sectors,
  ])
  const credentialTypes = sortedUnique(
    profile.credentials.flatMap((entry) => entry.credentialType ? [entry.credentialType] : []),
  )
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    kind: profile.kind,
    serviceCategories,
    skillTags,
    sectors,
    credentialTypes,
    ...(profile.kind === 'individual' && profile.individual.yearsOfExperience !== undefined
      ? { yearsOfExperience: profile.individual.yearsOfExperience }
      : {}),
    availabilityStatus: profile.availability.status,
    ...(profile.availability.hoursPerWeek !== undefined
      ? { hoursPerWeek: profile.availability.hoursPerWeek }
      : {}),
    engagementModes: sortedUnique(profile.availability.engagementModes),
    ...(profile.location ? { locationCountryCode: profile.location.countryCode } : {}),
    ...(profile.location?.region ? { locationRegion: profile.location.region } : {}),
    matchingPreferences: {
      enabled: profile.matchingPreferences.enabled,
      serviceCategories: [...profile.matchingPreferences.serviceCategories],
      skillTags: [...profile.matchingPreferences.skillTags],
      sectors: [...profile.matchingPreferences.sectors],
      preferredLocations: profile.matchingPreferences.preferredLocations.map(copyMatchingLocation),
      engagementModes: [...profile.matchingPreferences.engagementModes],
      ...(profile.matchingPreferences.minimumBudgetSar !== undefined
        ? { minimumBudgetSar: profile.matchingPreferences.minimumBudgetSar }
        : {}),
      ...(profile.matchingPreferences.maximumBudgetSar !== undefined
        ? { maximumBudgetSar: profile.matchingPreferences.maximumBudgetSar }
        : {}),
    },
  }
}
