import { useParams } from 'react-router-dom'
import { peopleApi } from '@/api/people.ts'
import { useAuth } from '@/providers/auth-provider'
import { PeopleListSection } from '@/components/user/people-list-section'
import { MessagesView } from '@/components/user/messages-view'
import { NotificationsListSection } from '@/components/user/notifications-list-section'
import { ProfileView } from '@/components/user/profile-view'
import { SettingsView } from '@/components/user/settings-view'
import {
  PublicProfileNotFound,
  PublicProfileView,
  resolveCompanyIds,
} from '@/components/user/public-profile-view'
import { PmPageLayout } from '@/components/layout/pm-layout-index'
import { PmPageHeader } from '@/components/ui/pm-index'

export function PeoplePage() {
  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Directory"
          title="Find"
          description="Search professionals and companies."
        />
      }
    >
      <PeopleListSection />
    </PmPageLayout>
  )
}

export function PersonProfilePage() {
  const { id } = useParams()
  const person = id ? peopleApi.get(id) : undefined
  const companyIds = resolveCompanyIds()

  if (!person) {
    return (
      <PmPageLayout header={<PmPageHeader title="Profile" />}>
        <PublicProfileNotFound />
      </PmPageLayout>
    )
  }

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Public profile"
          title={person.profile?.name ?? person.email}
          description={person.profile?.headline}
        />
      }
    >
      <PublicProfileView person={person} companyIds={companyIds} />
    </PmPageLayout>
  )
}

export function MessagesPage() {
  const { id } = useParams()

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          title="Messages"
          description="Direct conversations with your network."
        />
      }
    >
      <MessagesView activeThreadId={id} />
    </PmPageLayout>
  )
}

export function NotificationsPage() {
  return (
    <PmPageLayout
      header={
        <PmPageHeader
          title="Notifications"
          description="Alerts for matches, applications, deals, and messages."
        />
      }
    >
      <NotificationsListSection />
    </PmPageLayout>
  )
}

export function ProfilePage() {
  const { user, isCompanyUser } = useAuth()
  const profileKind = isCompanyUser ? 'company' : 'individual'

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          title="Profile"
          description="Your public profile and vetting status."
        />
      }
    >
      <ProfileView
        profile={user?.profile}
        profileKind={profileKind}
        email={user?.email}
      />
    </PmPageLayout>
  )
}

export function SettingsPage() {
  return (
    <PmPageLayout
      header={
        <PmPageHeader
          title="Settings"
          description="Account security and notification preferences."
        />
      }
    >
      <SettingsView />
    </PmPageLayout>
  )
}
