import { Link } from 'react-router-dom'
import { pmTypography } from '@/tokens'
import { PmBadge } from '@/components/ui/pm-badge'
import { PmCardActions } from '@/components/ui/pm-more-actions'
import { PmSurface } from '@/components/ui/pm-surface'
import {
  isCompanyEntity,
  resolvePersonDisplayName,
  resolvePersonHeadline,
} from '@/components/user/user-display'
import type { PlatformUser } from '@/types/domain.ts'
import { cn } from '@/lib/utils'

export type PersonCardProps = {
  person: PlatformUser
  companyIds: ReadonlySet<string>
  className?: string
}

/** Premium person or company card for directory mobile layout. */
export function PersonCard({ person, companyIds, className }: PersonCardProps) {
  const name = resolvePersonDisplayName(person)
  const headline = resolvePersonHeadline(person)
  const isCompany = isCompanyEntity(person, companyIds)
  const skills = person.profile?.skills ?? []
  const href = `/people/${person.id}`

  return (
    <PmSurface
      variant="default"
      shadow="card"
      interactive
      className={cn('flex h-full flex-col p-4 md:p-5', className)}
      data-slot="person-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <Link to={href} className={cn(pmTypography.h3, 'line-clamp-2 hover:text-primary')}>
            {name}
          </Link>
          <PmBadge tone={isCompany ? 'primary' : 'info'} size="sm">
            {isCompany ? 'Company' : 'Professional'}
          </PmBadge>
        </div>
      </div>

      <p className={cn(pmTypography.bodySm, 'mt-2 line-clamp-2 text-muted-foreground')}>
        {headline}
      </p>

      {person.profile?.location ? (
        <p className={cn(pmTypography.caption, 'mt-2 text-muted-foreground')}>
          {person.profile.location}
        </p>
      ) : null}

      {skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {skills.slice(0, 3).map((skill) => (
            <PmBadge key={skill} tone="neutral" size="sm">
              {skill}
            </PmBadge>
          ))}
        </div>
      ) : null}

      <PmCardActions className="mt-4" primary={{ label: 'Open profile', href }} />
    </PmSurface>
  )
}
