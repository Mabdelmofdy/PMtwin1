import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import {
  PmForm,
  PmFormActions,
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
  PmFormSection,
} from '@/components/forms/pm-form-index'
import { usePmDirection } from '@/components/layout/pm-direction-provider'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge } from '@/components/ui/pm-index'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatUserRoleLabel } from '@/components/user/user-display'
import { useAuth } from '@/providers/auth-provider'
import { useTheme } from '@/providers/theme-provider'
import {
  userSettingsRepository,
} from '@/repositories/index.ts'
import { resolveRuntimeProfileSubject } from '@/domain/profile/profile-subject-service.ts'
import type { PlatformUser } from '@/types/domain.ts'
import type {
  UserSettingsPreferences,
} from '@/domain/user-settings/types.ts'
import { updateUserSettingsThroughCommand } from '@/services/user-settings-command-service.ts'
import {
  setProfileVisibilityThroughCommand,
  updateProfileThroughCommand,
} from '@/services/profile-command-service.ts'

const SETTINGS_SECTIONS = [
  'account',
  'privacy',
  'notifications',
  'appearance',
  'matching',
  'security',
] as const

type SettingsSection = (typeof SETTINGS_SECTIONS)[number]

function isSettingsSection(value: string | undefined): value is SettingsSection {
  return SETTINGS_SECTIONS.includes(value as SettingsSection)
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly checked: boolean
  readonly onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4">
      <div className="space-y-1">
        <Label htmlFor={id} className="cursor-pointer">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  )
}

function preferencesFromRepository(
  userId: string,
  profileAccount?: PlatformUser,
): UserSettingsPreferences {
  const document = userSettingsRepository.get(userId)
  return {
    privacy: {
      contactOptIns: { ...document.privacy.contactOptIns },
      publicProfile: {
        ...document.privacy.publicProfile,
        published:
          document.privacy.publicProfile.published ||
          profileAccount?.isPublic !== false,
        showPhone:
          document.privacy.publicProfile.showPhone ||
          profileAccount?.profile?.visibility?.showPhone === true,
        showWebsite:
          document.privacy.publicProfile.showWebsite ||
          profileAccount?.profile?.visibility?.showWebsite === true,
        showLinkedIn:
          document.privacy.publicProfile.showLinkedIn ||
          profileAccount?.profile?.visibility?.showLinkedIn === true,
        showSocialLinks:
          document.privacy.publicProfile.showSocialLinks ||
          profileAccount?.profile?.visibility?.showSocialLinks === true,
      },
    },
    notifications: {
      inApp: { ...document.notifications.inApp },
    },
    interface: { ...document.interface },
    matching: { ...document.matching },
  }
}

/** Private account preferences. Professional/public content remains on Profile. */
export function SettingsView() {
  const { section } = useParams()
  const navigate = useNavigate()
  const { user, activeParty, activeWorkspace } = useAuth()
  const { setDirection } = usePmDirection()
  const { setTheme } = useTheme()
  const userId = user?.id ?? ''
  const profileSubject = user
    ? resolveRuntimeProfileSubject({
        partyId: activeParty?.id,
        workspaceId: activeWorkspace?.id,
        legacyAccountId: user.id,
      })
    : undefined
  const [draft, setDraft] = useState<UserSettingsPreferences>(() =>
    userId
      ? preferencesFromRepository(userId, profileSubject?.account)
      : preferencesFromRepository('anonymous-preview'),
  )
  const activeSection = isSettingsSection(section) ? section : 'account'

  const save = () => {
    if (!user) {
      toast.error('Sign in to update settings.')
      return
    }
    const subject = {
      partyId: activeParty?.id,
      workspaceId: activeWorkspace?.id,
      legacyAccountId: user.id,
    }
    if (activeSection === 'privacy') {
      const visibilityPatch = {
        visibility: {
          showPhone: draft.privacy.publicProfile.showPhone,
          showWebsite: draft.privacy.publicProfile.showWebsite,
          showLinkedIn: draft.privacy.publicProfile.showLinkedIn,
          showSocialLinks: draft.privacy.publicProfile.showSocialLinks,
        },
      }
      const profileResult = updateProfileThroughCommand(subject, visibilityPatch)
      if (!profileResult.success) {
        toast.error(profileResult.errors?.[0] ?? 'Privacy settings could not be saved.')
        return
      }
      const visibilityResult = setProfileVisibilityThroughCommand(
        subject,
        draft.privacy.publicProfile.published,
      )
      if (!visibilityResult.success) {
        toast.error(visibilityResult.errors?.[0] ?? 'Profile visibility could not be saved.')
        return
      }
    }
    const result = updateUserSettingsThroughCommand(user.id, draft)
    if (!result.success) {
      toast.error(result.errors?.[0] ?? 'Settings could not be saved.')
      return
    }
    if (draft.interface.direction !== 'auto') {
      setDirection(draft.interface.direction)
    }
    setTheme(draft.interface.theme)
    toast.success('Settings saved')
  }

  return (
    <PmForm
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
      footer={<PmFormActions submitLabel="Save settings" onSubmit={save} />}
    >
      <Tabs
        value={activeSection}
        onValueChange={(value) => navigate(`/settings/${value}`)}
        className="w-full"
      >
        <TabsList className="mb-6 w-full justify-start overflow-x-auto">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Language & appearance</TabsTrigger>
          <TabsTrigger value="matching">Matching</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <PmFormSection title="Account" description="Private identity and membership details.">
            <PmFormReadonly>
              <PmFormReadonlySection>
                <PmFormReadonlyField label="Email" value={user?.email} copyable />
                <PmFormReadonlyField label="Account type" value={formatUserRoleLabel(user?.role)} />
                <PmFormReadonlyField label="Account status" value={user?.status} />
                <PmFormReadonlyField
                  label="Member since"
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                />
              </PmFormReadonlySection>
            </PmFormReadonly>
          </PmFormSection>
        </TabsContent>

        <TabsContent value="privacy">
          <PmFormSection
            title="Profile privacy"
            description="Profiles are private by default. Choose what marketplace members may see."
          >
            <div className="space-y-3">
              <ToggleRow
                id="profile-published"
                label="Publish profile"
                description="List this professional or company profile in marketplace discovery."
                checked={draft.privacy.publicProfile.published}
                onCheckedChange={(published) =>
                  setDraft((current) => ({
                    ...current,
                    privacy: {
                      ...current.privacy,
                      publicProfile: { ...current.privacy.publicProfile, published },
                    },
                  }))
                }
              />
              {(['showPhone', 'showWebsite', 'showLinkedIn', 'showSocialLinks'] as const).map((field) => (
                <ToggleRow
                  key={field}
                  id={field}
                  label={{
                    showPhone: 'Show business phone',
                    showWebsite: 'Show website',
                    showLinkedIn: 'Show LinkedIn',
                    showSocialLinks: 'Show social media links',
                  }[field]}
                  description="Only shown when the profile is published and this option is enabled."
                  checked={draft.privacy.publicProfile[field]}
                  onCheckedChange={(checked) =>
                    setDraft((current) => ({
                      ...current,
                      privacy: {
                        ...current.privacy,
                        publicProfile: {
                          ...current.privacy.publicProfile,
                          [field]: checked,
                        },
                      },
                    }))
                  }
                />
              ))}
            </div>
          </PmFormSection>
        </TabsContent>

        <TabsContent value="notifications">
          <PmFormSection
            title="In-app notifications"
            description="Choose the categories that should appear in your PM Twin inbox."
          >
            <div className="space-y-3">
              {(Object.keys(draft.notifications.inApp) as Array<
                keyof UserSettingsPreferences['notifications']['inApp']
              >).map((category) => (
                <ToggleRow
                  key={category}
                  id={`notification-${category}`}
                  label={category.charAt(0).toUpperCase() + category.slice(1)}
                  description={`Receive ${category} activity in the in-app notification center.`}
                  checked={draft.notifications.inApp[category]}
                  onCheckedChange={(checked) =>
                    setDraft((current) => ({
                      ...current,
                      notifications: {
                        inApp: { ...current.notifications.inApp, [category]: checked },
                      },
                    }))
                  }
                />
              ))}
            </div>
          </PmFormSection>
        </TabsContent>

        <TabsContent value="appearance">
          <PmFormSection
            title="Language & appearance"
            description="Arabic layout direction is supported; full Arabic translation is not yet available."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settings-direction">Layout direction</Label>
                <Select
                  value={draft.interface.direction}
                  onValueChange={(direction) =>
                    setDraft((current) => ({
                      ...current,
                      interface: {
                        ...current.interface,
                        direction: direction as UserSettingsPreferences['interface']['direction'],
                      },
                    }))
                  }
                >
                  <SelectTrigger id="settings-direction" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">System default</SelectItem>
                    <SelectItem value="ltr">English (LTR)</SelectItem>
                    <SelectItem value="rtl">العربية (RTL layout)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-theme">Theme</Label>
                <Select
                  value={draft.interface.theme}
                  onValueChange={(theme) =>
                    setDraft((current) => ({
                      ...current,
                      interface: {
                        ...current.interface,
                        theme: theme as UserSettingsPreferences['interface']['theme'],
                      },
                    }))
                  }
                >
                  <SelectTrigger id="settings-theme" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PmFormSection>
        </TabsContent>

        <TabsContent value="matching">
          <PmFormSection
            title="Matching preferences"
            description="Private controls for profile discovery and project recommendations."
          >
            <div className="space-y-3">
              {([
                ['participateInMatching', 'Participate in matching', 'Use the active profile in eligible project matching.'],
                ['allowProfileDiscovery', 'Allow profile discovery', 'Allow eligible marketplace users to discover this profile.'],
                ['receiveRecommendations', 'Receive recommendations', 'Show profile-fit project recommendations and explanations.'],
              ] as const).map(([field, label, description]) => (
                <ToggleRow
                  key={field}
                  id={field}
                  label={label}
                  description={description}
                  checked={draft.matching[field]}
                  onCheckedChange={(checked) =>
                    setDraft((current) => ({
                      ...current,
                      matching: { ...current.matching, [field]: checked },
                    }))
                  }
                />
              ))}
            </div>
          </PmFormSection>
        </TabsContent>

        <TabsContent value="security">
          <PmContentCard
            title="Security"
            description="Security-sensitive actions require a backend identity provider."
          >
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
              <div className="space-y-2">
                <PmBadge tone="muted">Unavailable in browser-only preview</PmBadge>
                <p className="text-sm text-muted-foreground">
                  Password changes, multi-factor authentication, and session/device management
                  are intentionally disabled. No password data is stored by this settings form.
                </p>
              </div>
            </div>
          </PmContentCard>
        </TabsContent>
      </Tabs>
    </PmForm>
  )
}
