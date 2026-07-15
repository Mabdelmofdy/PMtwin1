import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, FileText, Globe2, MapPin, Pencil, Settings, UserRound } from 'lucide-react'
import { ProfileReadinessCard } from '@/components/readiness/profile-readiness-card.tsx'
import { PmDetailLayout } from '@/components/layout/pm-layout-index'
import {
  PmForm,
  PmFormActions,
  PmFormField,
  PmFormGrid,
  PmFormGridItem,
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
  PmFormSection,
} from '@/components/forms/pm-form-index'
import { PmBadge, PmButton, PmEmptyState } from '@/components/ui/pm-index'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type { ProfileKind } from '@/domain/profile-readiness/types.ts'
import type { PersonProfile } from '@/types/domain.ts'

export type EditableProfileFields = Omit<
  PersonProfile,
  'accountLabel' | 'profileCompletionUnlocked' | 'vetting'
>

export type ProfileViewProps = {
  profile?: EditableProfileFields | null
  profileKind: ProfileKind
  email?: string
  userId?: string
  onSave?: (profile: EditableProfileFields) => boolean
}

type ProfileDraft = {
  name: string
  headline: string
  location: string
  bio: string
  description: string
  skills: string
  phone: string
  website: string
  linkedIn: string
  facebook: string
  x: string
  instagram: string
  youtube: string
  github: string
  behance: string
  services: string
  languages: string
  certifications: string
  collaborationPreferences: string
  preferredWorkMode: string
  availability: string
  yearsExperience: string
  workHistory: string
  education: string
  portfolio: string
  testimonials: string
  teamSize: string
  businessCategory: string
  sectors: string
  projectCategories: string
  contactPerson: string
  coverageAreas: string
  financialCapacity: string
}

function joinList(value?: string[], separator = ', '): string {
  return value?.join(separator) ?? ''
}

function splitList(value: string, separator: ',' | '\n' = ','): string[] {
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean)
}

function createProfileDraft(profile?: EditableProfileFields | null): ProfileDraft {
  return {
    name: profile?.name ?? '',
    headline: profile?.headline ?? '',
    location: profile?.location ?? '',
    bio: profile?.bio ?? '',
    description: profile?.description ?? '',
    skills: joinList(profile?.skills),
    phone: profile?.phone ?? '',
    website: profile?.website ?? '',
    linkedIn: profile?.linkedIn ?? '',
    facebook: profile?.socialLinks?.facebook ?? '',
    x: profile?.socialLinks?.x ?? '',
    instagram: profile?.socialLinks?.instagram ?? '',
    youtube: profile?.socialLinks?.youtube ?? '',
    github: profile?.socialLinks?.github ?? '',
    behance: profile?.socialLinks?.behance ?? '',
    services: joinList(profile?.services),
    languages: joinList(profile?.languages),
    certifications: joinList(profile?.certifications),
    collaborationPreferences: joinList(profile?.collaborationPreferences),
    preferredWorkMode: profile?.preferredWorkMode ?? '',
    availability: profile?.availability ?? '',
    yearsExperience: profile?.yearsExperience?.toString() ?? '',
    workHistory: joinList(profile?.workHistory, '\n'),
    education: joinList(profile?.education, '\n'),
    portfolio: joinList(profile?.portfolio, '\n'),
    testimonials: joinList(profile?.testimonials, '\n'),
    teamSize: profile?.employeeCount ?? profile?.teamSize ?? '',
    businessCategory: profile?.businessCategory ?? '',
    sectors: joinList(profile?.sectors),
    projectCategories: joinList(profile?.projectCategories),
    contactPerson: profile?.contactPerson ?? '',
    coverageAreas: joinList(profile?.coverageAreas),
    financialCapacity: profile?.financialCapacity?.toString() ?? '',
  }
}

const SOCIAL_FIELDS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/your-page' },
  { key: 'x', label: 'X', placeholder: 'https://x.com/your-handle' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/your-profile' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@your-channel' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/your-profile' },
  { key: 'behance', label: 'Behance', placeholder: 'https://behance.net/your-profile' },
] as const

/** Authenticated profile page — summary, skills, readiness panel. */
export function ProfileView({
  profile,
  profileKind,
  email,
  userId,
  onSave,
}: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ProfileDraft>(() => createProfileDraft(profile))
  const [nameError, setNameError] = useState<string | null>(null)
  const skills = profile?.skills ?? []
  const initials = (profile?.name ?? email ?? 'Profile')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
  const socialLinkCount = Object.values(profile?.socialLinks ?? {}).filter(Boolean).length

  useEffect(() => {
    if (!isEditing) return undefined
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [isEditing])

  const updateDraft = (field: keyof ProfileDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const beginEditing = () => {
    setDraft(createProfileDraft(profile))
    setNameError(null)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setDraft(createProfileDraft(profile))
    setNameError(null)
    setIsEditing(false)
  }

  const saveProfile = () => {
    const name = draft.name.trim()
    if (!name) {
      setNameError('Name is required.')
      return
    }

    const saved = onSave?.({
      name,
      headline: draft.headline.trim(),
      location: draft.location.trim(),
      bio: draft.bio.trim(),
      description: draft.description.trim(),
      skills: splitList(draft.skills),
      phone: draft.phone.trim(),
      website: draft.website.trim(),
      linkedIn: draft.linkedIn.trim(),
      socialLinks: {
        ...(draft.facebook.trim() ? { facebook: draft.facebook.trim() } : {}),
        ...(draft.x.trim() ? { x: draft.x.trim() } : {}),
        ...(draft.instagram.trim() ? { instagram: draft.instagram.trim() } : {}),
        ...(draft.youtube.trim() ? { youtube: draft.youtube.trim() } : {}),
        ...(draft.github.trim() ? { github: draft.github.trim() } : {}),
        ...(draft.behance.trim() ? { behance: draft.behance.trim() } : {}),
      },
      services: splitList(draft.services),
      languages: splitList(draft.languages),
      certifications: splitList(draft.certifications),
      collaborationPreferences: splitList(draft.collaborationPreferences),
      preferredWorkMode: draft.preferredWorkMode.trim(),
      availability: draft.availability.trim(),
      yearsExperience: draft.yearsExperience ? Number(draft.yearsExperience) : undefined,
      workHistory: splitList(draft.workHistory, '\n'),
      education: splitList(draft.education, '\n'),
      portfolio: splitList(draft.portfolio, '\n'),
      testimonials: splitList(draft.testimonials, '\n'),
      teamSize: draft.teamSize.trim(),
      employeeCount: draft.teamSize.trim(),
      businessCategory: draft.businessCategory.trim(),
      sectors: splitList(draft.sectors),
      projectCategories: splitList(draft.projectCategories),
      contactPerson: draft.contactPerson.trim(),
      coverageAreas: splitList(draft.coverageAreas),
      financialCapacity: draft.financialCapacity
        ? Number(draft.financialCapacity)
        : undefined,
    })
    if (saved) {
      setNameError(null)
      setIsEditing(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isEditing) saveProfile()
  }

  return (
    <PmDetailLayout
      main={
        <PmForm
          onSubmit={handleSubmit}
          readOnly={!isEditing}
          footer={
            isEditing ? (
              <PmFormActions
                submitLabel="Save profile"
                onSubmit={saveProfile}
                onCancel={cancelEditing}
              />
            ) : undefined
          }
        >
          <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-surface to-surface-muted">
            <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-semibold text-primary-foreground shadow-sm">
                  {initials || <UserRound className="size-7" aria-hidden />}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-xl font-semibold text-foreground">
                    {profile?.name ?? 'Complete your professional profile'}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {profile?.headline ?? (profileKind === 'company' ? 'Company profile' : 'Professional profile')}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {profile?.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden />
                        {profile.location}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <Globe2 className="size-3.5" aria-hidden />
                      {socialLinkCount} social {socialLinkCount === 1 ? 'link' : 'links'}
                    </span>
                  </div>
                </div>
              </div>
              {!isEditing ? (
                <div className="flex flex-wrap gap-2">
                  <PmButton type="button" size="sm" variant="outline" asChild>
                    <Link to="/profile/preview">
                      <Eye className="size-4" aria-hidden />
                      Public preview
                    </Link>
                  </PmButton>
                  <PmButton
                    type="button"
                    size="sm"
                    onClick={beginEditing}
                    disabled={!onSave}
                  >
                    <Pencil className="size-4" aria-hidden />
                    {profile ? 'Edit profile' : 'Create profile'}
                  </PmButton>
                </div>
              ) : null}
            </div>
          </div>
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="mb-4 w-full justify-start overflow-x-auto">
              <TabsTrigger value="summary">About</TabsTrigger>
              <TabsTrigger value="skills">Expertise</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="social">Social & links</TabsTrigger>
              {profileKind === 'company' ? (
                <TabsTrigger value="company">Company</TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="summary">
              <PmFormSection
                title="Profile summary"
                description="Your public profile and vetting status."
              >
                {isEditing ? (
                  <PmFormGrid columns={2}>
                    <PmFormField id="profile-name" label="Name" required error={nameError}>
                      <Input
                        value={draft.name}
                        onChange={(event) => {
                          updateDraft('name', event.target.value)
                          if (event.target.value.trim()) setNameError(null)
                        }}
                        autoComplete="name"
                      />
                    </PmFormField>
                    <PmFormField id="profile-email" label="Email">
                      <Input value={email ?? ''} disabled type="email" />
                    </PmFormField>
                    <PmFormField id="profile-headline" label="Headline" optional>
                      <Input
                        value={draft.headline}
                        onChange={(event) => updateDraft('headline', event.target.value)}
                        placeholder="Senior Project Manager"
                      />
                    </PmFormField>
                    <PmFormField id="profile-location" label="Location" optional>
                      <Input
                        value={draft.location}
                        onChange={(event) => updateDraft('location', event.target.value)}
                        placeholder="Riyadh, Saudi Arabia"
                        autoComplete="address-level2"
                      />
                    </PmFormField>
                    <PmFormField id="profile-phone" label="Phone" optional>
                      <Input
                        value={draft.phone}
                        onChange={(event) => updateDraft('phone', event.target.value)}
                        placeholder="+966 5X XXX XXXX"
                        type="tel"
                        autoComplete="tel"
                        dir="ltr"
                      />
                    </PmFormField>
                    <PmFormGridItem span="full" gridColumns={2}>
                      <PmFormField id="profile-bio" label="Bio" optional>
                        <Textarea
                          value={draft.bio}
                          onChange={(event) => updateDraft('bio', event.target.value)}
                          placeholder="Describe your experience and the work you are looking for."
                          rows={5}
                        />
                      </PmFormField>
                    </PmFormGridItem>
                    <PmFormField id="profile-website" label="Website" optional>
                      <Input
                        value={draft.website}
                        onChange={(event) => updateDraft('website', event.target.value)}
                        placeholder="https://yourwebsite.com"
                        type="url"
                        autoComplete="url"
                        dir="ltr"
                      />
                    </PmFormField>
                    <PmFormField id="profile-linkedin" label="LinkedIn" optional>
                      <Input
                        value={draft.linkedIn}
                        onChange={(event) => updateDraft('linkedIn', event.target.value)}
                        placeholder="https://linkedin.com/in/your-profile"
                        type="url"
                        dir="ltr"
                      />
                    </PmFormField>
                  </PmFormGrid>
                ) : (
                  <PmFormReadonly>
                    <PmFormReadonlySection>
                      <PmFormReadonlyField label="Name" value={profile?.name} />
                      <PmFormReadonlyField label="Email" value={email} />
                      <PmFormReadonlyField label="Headline" value={profile?.headline} />
                      <PmFormReadonlyField label="Location" value={profile?.location} />
                      <PmFormReadonlyField label="Phone" value={profile?.phone} />
                      <PmFormReadonlyField label="Bio" value={profile?.bio} />
                      <PmFormReadonlyField label="Website" value={profile?.website} />
                      <PmFormReadonlyField label="LinkedIn" value={profile?.linkedIn} />
                    </PmFormReadonlySection>
                  </PmFormReadonly>
                )}
              </PmFormSection>
            </TabsContent>

            <TabsContent value="skills">
              <PmFormSection title="Skills" description="Core capabilities shown on your profile.">
                {isEditing ? (
                  <PmFormField
                    id="profile-skills"
                    label="Skills"
                    optional
                    hint="Separate skills with commas."
                  >
                    <Textarea
                      value={draft.skills}
                      onChange={(event) => updateDraft('skills', event.target.value)}
                      placeholder="Project Management, Risk, Procurement"
                      rows={4}
                    />
                  </PmFormField>
                ) : skills.length > 0 ? (
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
                    description="Add skills to improve profile readiness and matching."
                    icon={<FileText className="size-8" />}
                    action={
                      <PmButton size="sm" onClick={beginEditing} disabled={!onSave}>
                        Add skills
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

              <PmFormSection
                title="Services & expertise"
                description="Help clients understand the work you can deliver."
              >
                {isEditing ? (
                  <PmFormField
                    id="profile-services"
                    label="Services"
                    optional
                    hint="Separate services with commas."
                  >
                    <Textarea
                      value={draft.services}
                      onChange={(event) => updateDraft('services', event.target.value)}
                      placeholder="PMO setup, Project recovery, Risk management"
                      rows={3}
                    />
                  </PmFormField>
                ) : (
                  <PmFormReadonly>
                    <PmFormReadonlySection>
                      <PmFormReadonlyField
                        label="Services"
                        value={profile?.services?.join(', ')}
                      />
                    </PmFormReadonlySection>
                  </PmFormReadonly>
                )}
              </PmFormSection>

              <PmFormSection
                title="Languages & certifications"
                description="Add languages and professional credentials that strengthen your profile."
              >
                {isEditing ? (
                  <PmFormGrid columns={2}>
                    <PmFormField
                      id="profile-languages"
                      label="Languages"
                      optional
                      hint="Separate languages with commas."
                    >
                      <Input
                        value={draft.languages}
                        onChange={(event) => updateDraft('languages', event.target.value)}
                        placeholder="Arabic, English"
                      />
                    </PmFormField>
                    <PmFormField
                      id="profile-certifications"
                      label="Certifications"
                      optional
                      hint="Separate certifications with commas."
                    >
                      <Input
                        value={draft.certifications}
                        onChange={(event) => updateDraft('certifications', event.target.value)}
                        placeholder="PMP, PMI-RMP, PRINCE2"
                      />
                    </PmFormField>
                  </PmFormGrid>
                ) : (
                  <PmFormReadonly>
                    <PmFormReadonlySection>
                      <PmFormReadonlyField
                        label="Languages"
                        value={profile?.languages?.join(', ')}
                      />
                      <PmFormReadonlyField
                        label="Certifications"
                        value={profile?.certifications?.join(', ')}
                      />
                    </PmFormReadonlySection>
                  </PmFormReadonly>
                )}
              </PmFormSection>

              <PmFormSection
                title="Collaboration preferences"
                description="Set expectations for availability and preferred ways of working."
              >
                {isEditing ? (
                  <PmFormGrid columns={2}>
                    <PmFormField id="profile-work-mode" label="Preferred work mode" optional>
                      <Input
                        value={draft.preferredWorkMode}
                        onChange={(event) => updateDraft('preferredWorkMode', event.target.value)}
                        placeholder="Hybrid, remote, or on-site"
                      />
                    </PmFormField>
                    <PmFormField id="profile-availability" label="Availability" optional>
                      <Input
                        value={draft.availability}
                        onChange={(event) => updateDraft('availability', event.target.value)}
                        placeholder="Available now, 20 hours/week"
                      />
                    </PmFormField>
                    <PmFormGridItem span="full" gridColumns={2}>
                      <PmFormField
                        id="profile-collaboration-preferences"
                        label="Preferred engagement types"
                        optional
                        hint="Separate preferences with commas."
                      >
                        <Input
                          value={draft.collaborationPreferences}
                          onChange={(event) =>
                            updateDraft('collaborationPreferences', event.target.value)
                          }
                          placeholder="Consulting, fixed-term projects, advisory"
                        />
                      </PmFormField>
                    </PmFormGridItem>
                  </PmFormGrid>
                ) : (
                  <PmFormReadonly>
                    <PmFormReadonlySection>
                      <PmFormReadonlyField
                        label="Work mode"
                        value={profile?.preferredWorkMode}
                      />
                      <PmFormReadonlyField label="Availability" value={profile?.availability} />
                      <PmFormReadonlyField
                        label="Engagement types"
                        value={profile?.collaborationPreferences?.join(', ')}
                      />
                    </PmFormReadonlySection>
                  </PmFormReadonly>
                )}
              </PmFormSection>
            </TabsContent>

            <TabsContent value="social">
              <PmFormSection
                title="Social media & professional links"
                description="Add full profile URLs. Public display is controlled from Settings → Privacy."
              >
                {isEditing ? (
                  <PmFormGrid columns={2}>
                    {SOCIAL_FIELDS.map((field) => (
                      <PmFormField
                        key={field.key}
                        id={`profile-${field.key}`}
                        label={field.label}
                        optional
                      >
                        <Input
                          value={draft[field.key]}
                          onChange={(event) => updateDraft(field.key, event.target.value)}
                          placeholder={field.placeholder}
                          type="url"
                          inputMode="url"
                          dir="ltr"
                        />
                      </PmFormField>
                    ))}
                  </PmFormGrid>
                ) : socialLinkCount > 0 ? (
                  <PmFormReadonly>
                    <PmFormReadonlySection>
                      {SOCIAL_FIELDS.map((field) => (
                        <PmFormReadonlyField
                          key={field.key}
                          label={field.label}
                          value={profile?.socialLinks?.[field.key]}
                          copyable
                        />
                      ))}
                    </PmFormReadonlySection>
                  </PmFormReadonly>
                ) : (
                  <PmEmptyState
                    size="compact"
                    title="No social links added"
                    description="Add Facebook, X, Instagram, YouTube, GitHub, or Behance to your professional profile."
                    icon={<Globe2 className="size-8" />}
                    action={
                      <PmButton size="sm" onClick={beginEditing} disabled={!onSave}>
                        Add social links
                      </PmButton>
                    }
                  />
                )}
              </PmFormSection>
            </TabsContent>

            <TabsContent value="experience">
              <PmFormSection
                title="Work experience"
                description="Show relevant roles, responsibilities, and measurable outcomes."
              >
                {isEditing ? (
                  <PmFormGrid columns={2}>
                    <PmFormField id="profile-years-experience" label="Years of experience" optional>
                      <Input
                        value={draft.yearsExperience}
                        onChange={(event) => updateDraft('yearsExperience', event.target.value)}
                        placeholder="10"
                        type="number"
                        min="0"
                        max="70"
                      />
                    </PmFormField>
                    {profileKind === 'company' ? (
                      <PmFormField id="profile-team-size" label="Team size" optional>
                        <Input
                          value={draft.teamSize}
                          onChange={(event) => updateDraft('teamSize', event.target.value)}
                          placeholder="11–50 employees"
                        />
                      </PmFormField>
                    ) : null}
                    <PmFormGridItem span="full" gridColumns={2}>
                      <PmFormField
                        id="profile-work-history"
                        label="Work history"
                        optional
                        hint="Add one role per line. Example: Senior PM — Company — 2022 to present"
                      >
                        <Textarea
                          value={draft.workHistory}
                          onChange={(event) => updateDraft('workHistory', event.target.value)}
                          placeholder={'Senior Project Manager — Company — 2022 to present\nProject Manager — Company — 2018 to 2022'}
                          rows={6}
                        />
                      </PmFormField>
                    </PmFormGridItem>
                  </PmFormGrid>
                ) : (
                  <PmFormReadonly>
                    <PmFormReadonlySection>
                      <PmFormReadonlyField
                        label="Experience"
                        value={
                          profile?.yearsExperience == null
                            ? undefined
                            : `${profile.yearsExperience} years`
                        }
                      />
                      {profileKind === 'company' ? (
                        <PmFormReadonlyField label="Team size" value={profile?.teamSize} />
                      ) : null}
                      <PmFormReadonlyField
                        label="Work history"
                        value={profile?.workHistory?.join(' · ')}
                      />
                    </PmFormReadonlySection>
                  </PmFormReadonly>
                )}
              </PmFormSection>

              <PmFormSection
                title="Education"
                description="List degrees, diplomas, and relevant professional learning."
              >
                {isEditing ? (
                  <PmFormField
                    id="profile-education"
                    label="Education"
                    optional
                    hint="Add one qualification per line."
                  >
                    <Textarea
                      value={draft.education}
                      onChange={(event) => updateDraft('education', event.target.value)}
                      placeholder={'BSc Engineering — King Saud University — 2016\nExecutive Leadership Program — 2023'}
                      rows={5}
                    />
                  </PmFormField>
                ) : (
                  <PmFormReadonly>
                    <PmFormReadonlySection>
                      <PmFormReadonlyField
                        label="Education"
                        value={profile?.education?.join(' · ')}
                      />
                    </PmFormReadonlySection>
                  </PmFormReadonly>
                )}
              </PmFormSection>

              <PmFormSection
                title="Portfolio & references"
                description="Add project highlights and testimonials that demonstrate delivery."
              >
                {isEditing ? (
                  <PmFormGrid columns={2}>
                    <PmFormField
                      id="profile-portfolio"
                      label="Projects & case studies"
                      optional
                      hint="Add one project per line."
                    >
                      <Textarea
                        value={draft.portfolio}
                        onChange={(event) => updateDraft('portfolio', event.target.value)}
                        placeholder="PMO transformation — delivered 18% schedule improvement"
                        rows={5}
                      />
                    </PmFormField>
                    <PmFormField
                      id="profile-testimonials"
                      label="References & testimonials"
                      optional
                      hint="Add one reference per line."
                    >
                      <Textarea
                        value={draft.testimonials}
                        onChange={(event) => updateDraft('testimonials', event.target.value)}
                        placeholder="Client name — role — short testimonial"
                        rows={5}
                      />
                    </PmFormField>
                  </PmFormGrid>
                ) : (
                  <PmFormReadonly>
                    <PmFormReadonlySection>
                      <PmFormReadonlyField
                        label="Projects & case studies"
                        value={profile?.portfolio?.join(' · ')}
                      />
                      <PmFormReadonlyField
                        label="References"
                        value={profile?.testimonials?.join(' · ')}
                      />
                    </PmFormReadonlySection>
                  </PmFormReadonly>
                )}
              </PmFormSection>
            </TabsContent>

            {profileKind === 'company' ? (
              <TabsContent value="company">
                <PmFormSection title="Company information" description="Organization details.">
                  {isEditing ? (
                    <PmFormGrid columns={2}>
                      <PmFormField id="profile-business-category" label="Business category" required>
                        <Input
                          value={draft.businessCategory}
                          onChange={(event) => updateDraft('businessCategory', event.target.value)}
                          placeholder="Project management consultancy"
                        />
                      </PmFormField>
                      <PmFormField id="profile-contact-person" label="Authorized contact" required>
                        <Input
                          value={draft.contactPerson}
                          onChange={(event) => updateDraft('contactPerson', event.target.value)}
                          placeholder="Full name"
                        />
                      </PmFormField>
                      <PmFormField id="profile-sectors" label="Sectors" required hint="Separate with commas.">
                        <Input
                          value={draft.sectors}
                          onChange={(event) => updateDraft('sectors', event.target.value)}
                          placeholder="Construction, Infrastructure"
                        />
                      </PmFormField>
                      <PmFormField
                        id="profile-project-categories"
                        label="Project categories"
                        required
                        hint="Separate with commas."
                      >
                        <Input
                          value={draft.projectCategories}
                          onChange={(event) => updateDraft('projectCategories', event.target.value)}
                          placeholder="Buildings, Transport, Utilities"
                        />
                      </PmFormField>
                      <PmFormField
                        id="profile-coverage-areas"
                        label="Coverage areas"
                        optional
                        hint="Separate with commas."
                      >
                        <Input
                          value={draft.coverageAreas}
                          onChange={(event) => updateDraft('coverageAreas', event.target.value)}
                          placeholder="Riyadh, Jeddah, Eastern Province"
                        />
                      </PmFormField>
                      <PmFormField id="profile-financial-capacity" label="Financial capacity (SAR)" optional>
                        <Input
                          value={draft.financialCapacity}
                          onChange={(event) => updateDraft('financialCapacity', event.target.value)}
                          type="number"
                          min="0"
                          inputMode="decimal"
                        />
                      </PmFormField>
                      <PmFormGridItem span="full" gridColumns={2}>
                        <PmFormField id="profile-description" label="Company description" optional>
                          <Textarea
                            value={draft.description}
                            onChange={(event) => updateDraft('description', event.target.value)}
                            placeholder="Describe the company, its services, and delivery capabilities."
                            rows={6}
                          />
                        </PmFormField>
                      </PmFormGridItem>
                    </PmFormGrid>
                  ) : (
                    <PmFormReadonly>
                      <PmFormReadonlySection>
                        <PmFormReadonlyField
                          label="Description"
                          value={profile?.description}
                        />
                        <PmFormReadonlyField
                          label="Business category"
                          value={profile?.businessCategory}
                        />
                        <PmFormReadonlyField
                          label="Sectors"
                          value={profile?.sectors?.join(', ')}
                        />
                        <PmFormReadonlyField
                          label="Project categories"
                          value={profile?.projectCategories?.join(', ')}
                        />
                        <PmFormReadonlyField
                          label="Contact person"
                          value={profile?.contactPerson}
                        />
                        <PmFormReadonlyField
                          label="Coverage areas"
                          value={profile?.coverageAreas?.join(', ')}
                        />
                        <PmFormReadonlyField
                          label="Financial capacity"
                          value={
                            profile?.financialCapacity == null
                              ? undefined
                              : `${profile.financialCapacity.toLocaleString()} SAR`
                          }
                        />
                      </PmFormReadonlySection>
                    </PmFormReadonly>
                  )}
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
