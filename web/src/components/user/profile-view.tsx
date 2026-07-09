import { Link } from 'react-router-dom'
import { FileText, Settings } from 'lucide-react'
import { ProfileReadinessCard } from '@/components/readiness/profile-readiness-card.tsx'
import { PmDetailLayout } from '@/components/layout/pm-layout-index'
import {
  PmForm,
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
  PmFormSection,
} from '@/components/forms/pm-form-index'
import { PmBadge, PmButton, PmEmptyState } from '@/components/ui/pm-index'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ProfileKind } from '@/domain/profile-readiness/types.ts'

export type ProfileViewProps = {
  profile?: object | null
  profileKind: ProfileKind
  email?: string
  userId?: string
}

/** Authenticated profile page — summary, skills, readiness panel. */
export function ProfileView({ profile, profileKind, email, userId }: ProfileViewProps) {
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
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="mb-4 w-full justify-start overflow-x-auto">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              {profileKind === 'company' ? (
                <TabsTrigger value="company">Company</TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="summary">
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
            </TabsContent>

            <TabsContent value="skills">
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
                  <PmEmptyState
                    size="compact"
                    title="No skills listed yet"
                    description="Add skills in settings to improve profile readiness and matching."
                    icon={<FileText className="size-8" />}
                    action={
                      <PmButton size="sm" asChild>
                        <Link to="/settings">Open settings</Link>
                      </PmButton>
                    }
                    secondaryAction={
                      <PmButton size="sm" variant="outline" asChild>
                        <Link to="/profile">
                          <Settings className="size-4" aria-hidden />
                          Profile
                        </Link>
                      </PmButton>
                    }
                  />
                )}
              </PmFormSection>
            </TabsContent>

            <TabsContent value="experience">
              <PmFormSection title="Services & experience" description="Offered services and work history.">
                <PmEmptyState
                  size="compact"
                  title="Experience not connected yet"
                  description="Services and work history will appear here when profile storage is connected."
                  icon={<FileText className="size-8" />}
                  action={
                    <PmButton size="sm" variant="outline" asChild>
                      <Link to="/settings">Review settings</Link>
                    </PmButton>
                  }
                />
              </PmFormSection>

              <PmFormSection title="Portfolio" description="Projects and case studies.">
                <PmEmptyState
                  size="compact"
                  title="No portfolio items yet"
                  description="Portfolio entries will appear here when connected to profile storage."
                  icon={<FileText className="size-8" />}
                  action={
                    <PmButton size="sm" variant="outline" asChild>
                      <Link to="/settings">Review settings</Link>
                    </PmButton>
                  }
                />
              </PmFormSection>
            </TabsContent>

            {profileKind === 'company' ? (
              <TabsContent value="company">
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
              </TabsContent>
            ) : null}
          </Tabs>
        </PmForm>
      }
      inspector={
        <ProfileReadinessCard
          profile={profile}
          profileKind={profileKind}
          userId={userId}
        />
      }
    />
  )
}
