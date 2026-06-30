import { Link } from 'react-router-dom'
import { peopleApi } from '@/api/people.ts'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmContentCard, PmDetailLayout } from '@/components/layout/pm-layout-index'
import {
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
} from '@/components/forms/pm-form-index'
import { PmBadge, PmButton, PmEmptyState, PmSurface } from '@/components/ui/pm-index'
import {
  isCompanyEntity,
  resolvePersonDisplayName,
  resolvePersonHeadline,
} from '@/components/user/user-display'
import type { PlatformUser } from '@/types/domain.ts'
import { cn } from '@/lib/utils'

export type PublicProfileViewProps = {
  person: PlatformUser
  companyIds: ReadonlySet<string>
}

/** Public profile page — hero, summary, skills, portfolio placeholders. */
export function PublicProfileView({ person, companyIds }: PublicProfileViewProps) {
  const name = resolvePersonDisplayName(person)
  const headline = resolvePersonHeadline(person)
  const skills = person.profile?.skills ?? []
  const isCompany = isCompanyEntity(person, companyIds)
  const bio = person.profile?.bio ?? person.profile?.description ?? '—'

  return (
    <>
      <PmSurface variant="elevated" className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-surface to-surface-muted px-6 py-8 md:px-10 md:py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <PmBadge tone={isCompany ? 'primary' : 'info'}>
                {isCompany ? 'Company' : 'Professional'}
              </PmBadge>
              <h1 className={cn(pmTypography.h1)}>{name}</h1>
              <p className={cn(pmTypography.body, 'max-w-2xl text-muted-foreground')}>
                {headline}
              </p>
              {person.profile?.location ? (
                <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                  {person.profile.location}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <PmButton variant="outline">Connect</PmButton>
              <PmButton asChild>
                <Link to="/messages">Message</Link>
              </PmButton>
            </div>
          </div>
        </div>
      </PmSurface>

      <PmDetailLayout
        main={
          <>
            <PmContentCard title="Summary">
              <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>{bio}</p>
            </PmContentCard>

            {skills.length > 0 ? (
              <PmContentCard title="Skills">
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <PmBadge key={skill} tone="neutral" size="sm">
                      {skill}
                    </PmBadge>
                  ))}
                </div>
              </PmContentCard>
            ) : null}

            <PmContentCard title="Portfolio & projects">
              <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                Portfolio and project highlights will appear here when wired to profile data.
              </p>
            </PmContentCard>
          </>
        }
        inspector={
          <>
            <PmContentCard title="Statistics">
              <PmFormReadonly>
                <PmFormReadonlySection>
                  <PmFormReadonlyField label="Profile type" value={isCompany ? 'Company' : 'Individual'} />
                  <PmFormReadonlyField label="Skills listed" value={skills.length} />
                  <PmFormReadonlyField label="Status" value={person.status} />
                </PmFormReadonlySection>
              </PmFormReadonly>
            </PmContentCard>

            {isCompany ? (
              <PmContentCard title="Company">
                <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                  {person.profile?.description ?? 'Company profile details.'}
                </p>
              </PmContentCard>
            ) : null}

            <PmContentCard title="Badges">
              <div className="flex flex-wrap gap-2">
                <PmBadge tone="success" size="sm">
                  Verified profile
                </PmBadge>
                {skills.length >= 3 ? (
                  <PmBadge tone="info" size="sm">
                    Skilled professional
                  </PmBadge>
                ) : null}
              </div>
            </PmContentCard>
          </>
        }
      />
    </>
  )
}

export function PublicProfileNotFound() {
  return (
    <PmEmptyState
      title="Profile not found"
      description="This profile may have been removed or is not public."
      action={
        <PmButton size="sm" variant="outline" asChild>
          <Link to="/people">Back to directory</Link>
        </PmButton>
      }
    />
  )
}

/** Resolve company IDs for public profile pages. */
export function resolveCompanyIds(): ReadonlySet<string> {
  return new Set(peopleApi.listCompanies().map((c) => c.id))
}
