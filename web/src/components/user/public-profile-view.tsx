import { Link } from 'react-router-dom'
import { pmTypography } from '@/tokens'
import { PmContentCard, PmDetailLayout } from '@/components/layout/pm-layout-index'
import {
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
} from '@/components/forms/pm-form-index'
import { PmBadge, PmButton, PmEmptyState, PmSurface } from '@/components/ui/pm-index'
import type { PublicProfileProjection } from '@/domain/profile/profile-public-read-model.ts'
import { cn } from '@/lib/utils'

export type PublicProfileViewProps = {
  profile: PublicProfileProjection
}

function ListCard({
  title,
  items,
  tone = 'neutral',
}: {
  readonly title: string
  readonly items: readonly string[]
  readonly tone?: 'neutral' | 'info'
}) {
  const visibleItems = items.filter(Boolean)
  if (visibleItems.length === 0) return null
  return (
    <PmContentCard title={title}>
      <div className="flex flex-wrap gap-2">
        {visibleItems.map((item) => (
          <PmBadge key={item} tone={tone} size="sm">{item}</PmBadge>
        ))}
      </div>
    </PmContentCard>
  )
}

/** Marketplace profile view. Receives an allowlisted projection, never a raw account. */
export function PublicProfileView({ profile }: PublicProfileViewProps) {
  const contact = [
    profile.contact.phone
      ? { label: 'Phone', value: profile.contact.phone, href: `tel:${profile.contact.phone}` }
      : null,
    profile.contact.website
      ? { label: 'Website', value: profile.contact.website, href: profile.contact.website }
      : null,
    profile.contact.linkedIn
      ? { label: 'LinkedIn', value: profile.contact.linkedIn, href: profile.contact.linkedIn }
      : null,
  ].filter(
    (
      item,
    ): item is { readonly label: string; readonly value: string; readonly href: string } =>
      item !== null,
  )

  return (
    <>
      <PmSurface variant="elevated" className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-surface to-surface-muted px-6 py-8 md:px-10 md:py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <PmBadge tone={profile.kind === 'company' ? 'primary' : 'info'}>
                {profile.kind === 'company' ? 'Company' : 'Professional'}
              </PmBadge>
              <h1 className={pmTypography.h1}>{profile.displayName}</h1>
              {profile.headline ? (
                <p className={cn(pmTypography.body, 'max-w-2xl text-muted-foreground')}>
                  {profile.headline}
                </p>
              ) : null}
              {profile.location ? (
                <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                  {profile.location}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <PmButton variant="outline">Connect</PmButton>
              <PmButton asChild><Link to="/messages">Message</Link></PmButton>
            </div>
          </div>
        </div>
      </PmSurface>

      <PmDetailLayout
        main={
          <>
            <PmContentCard title="Summary">
              <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                {profile.summary ?? profile.description ?? 'No summary provided.'}
              </p>
            </PmContentCard>
            <ListCard title="Skills" items={profile.skills} />
            <ListCard title="Services" items={profile.services} tone="info" />
            <ListCard title="Experience" items={profile.workHistory} />
            <ListCard title="Portfolio & projects" items={profile.portfolio} tone="info" />
            <ListCard title="Credentials" items={profile.certifications} />
          </>
        }
        inspector={
          <>
            <PmContentCard title="Profile details">
              <PmFormReadonly>
                <PmFormReadonlySection>
                  <PmFormReadonlyField label="Profile type" value={profile.kind === 'company' ? 'Company' : 'Individual'} />
                  <PmFormReadonlyField label="Skills listed" value={profile.skills.length} />
                  <PmFormReadonlyField label="Availability" value={profile.availability} />
                  {profile.kind === 'company' ? (
                    <PmFormReadonlyField label="Team size" value={profile.teamSize} />
                  ) : null}
                </PmFormReadonlySection>
              </PmFormReadonly>
            </PmContentCard>

            {contact.length > 0 ? (
              <PmContentCard title="Public contact">
                <div className="space-y-2">
                  {contact.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                      className={cn(
                        pmTypography.bodySm,
                        'block break-all text-primary underline-offset-4 hover:underline',
                      )}
                    >
                      {item.label}: {item.value}
                    </a>
                  ))}
                </div>
              </PmContentCard>
            ) : null}

            <PmContentCard title="Badges">
              <div className="flex flex-wrap gap-2">
                {profile.verified ? (
                  <PmBadge tone="success" size="sm">Verified profile</PmBadge>
                ) : (
                  <PmBadge tone="muted" size="sm">Verification not confirmed</PmBadge>
                )}
                {profile.skills.length >= 3 ? (
                  <PmBadge tone="info" size="sm">Skilled professional</PmBadge>
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
      description="This profile is private, unavailable, or not eligible for marketplace discovery."
      action={
        <PmButton size="sm" variant="outline" asChild>
          <Link to="/people">Back to directory</Link>
        </PmButton>
      }
    />
  )
}
