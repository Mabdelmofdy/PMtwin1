import { ProfileReadinessCard } from '@/components/readiness/profile-readiness-card.tsx'
import { PmDetailLayout } from '@/components/layout/pm-layout-index'
import {
  PmForm,
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
  PmFormSection,
} from '@/components/forms/pm-form-index'
import { PmBadge } from '@/components/ui/pm-index'
import type { ProfileKind } from '@/domain/profile-readiness/types.ts'

export type ProfileViewProps = {
  profile?: object | null
  profileKind: ProfileKind
  email?: string
}

/** Authenticated profile page — summary, skills, readiness panel. */
export function ProfileView({ profile, profileKind, email }: ProfileViewProps) {
  const personProfile = profile as {
    name?: string
    bio?: string
    location?: string
    headline?: string
    skills?: string[]
    description?: string
  } | null

  const skills = personProfile?.skills ?? []

  return (
    <PmDetailLayout
      main={
        <PmForm onSubmit={(e) => e.preventDefault()} readOnly>
          <PmFormSection
            title="Profile summary"
            description="Your public profile and vetting status."
          >
            <PmFormReadonly>
              <PmFormReadonlySection>
                <PmFormReadonlyField label="Name" value={personProfile?.name} />
                <PmFormReadonlyField label="Email" value={email} />
                <PmFormReadonlyField label="Headline" value={personProfile?.headline} />
                <PmFormReadonlyField label="Location" value={personProfile?.location} />
                <PmFormReadonlyField label="Bio" value={personProfile?.bio} />
              </PmFormReadonlySection>
            </PmFormReadonly>
          </PmFormSection>

          <PmFormSection title="Skills" description="Core capabilities shown on your profile.">
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <PmBadge key={skill} tone="neutral" size="sm">
                    {skill}
                  </PmBadge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills listed yet.</p>
            )}
          </PmFormSection>

          <PmFormSection title="Services & experience" description="Offered services and work history.">
            <p className="text-sm text-muted-foreground">
              Services and experience sections will populate from profile data when wired.
            </p>
          </PmFormSection>

          <PmFormSection title="Portfolio" description="Projects and case studies.">
            <p className="text-sm text-muted-foreground">
              Portfolio items will appear here when connected to profile storage.
            </p>
          </PmFormSection>

          {profileKind === 'company' ? (
            <PmFormSection title="Company information" description="Organization details.">
              <PmFormReadonly>
                <PmFormReadonlySection>
                  <PmFormReadonlyField
                    label="Description"
                    value={personProfile?.description}
                  />
                </PmFormReadonlySection>
              </PmFormReadonly>
            </PmFormSection>
          ) : null}
        </PmForm>
      }
      inspector={
        <ProfileReadinessCard profile={profile} profileKind={profileKind} />
      }
    />
  )
}
