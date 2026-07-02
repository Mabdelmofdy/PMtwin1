import { useParams } from 'react-router-dom'
import { peopleApi } from '@/api/people.ts'
import { notificationsApi } from '@/api/notifications.ts'
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
import { MOCK_MESSAGE_THREADS } from '@/components/user/user-display'
import { PmBadge, PmPage, PmPageHeader, PmPageHeroMetric, PmPageActions } from '@/components/ui/pm-index'
import { resolveProfileReadiness } from '@/components/readiness/profile-readiness-card'

export function PeoplePage() {
  const profileCount = peopleApi.listAll().length

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Workspace"
          title="Find"
          description="Search professionals and companies across the built environment."
          metric={<PmPageHeroMetric value={profileCount} label="Profiles" />}
        />
      }
    >
      <PeopleListSection />
    </PmPage>
  )
}

export function PersonProfilePage() {
  const { id } = useParams()
  const person = id ? peopleApi.get(id) : undefined
  const companyIds = resolveCompanyIds()

  if (!person) {
    return (
      <PmPage header={<PmPageHeader title="Profile" />}>
        <PublicProfileNotFound />
      </PmPage>
    )
  }

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Public profile"
          title={person.profile?.name ?? person.email}
          description={person.profile?.headline}
        />
      }
    >
      <PublicProfileView person={person} companyIds={companyIds} />
    </PmPage>
  )
}

export function MessagesPage() {
  const { id } = useParams()
  const unreadTotal = MOCK_MESSAGE_THREADS.reduce((sum, t) => sum + t.unread, 0)

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Inbox"
          title="Messages"
          description="Direct conversations with your network."
          metric={
            <PmPageHeroMetric value={MOCK_MESSAGE_THREADS.length} label="Threads" />
          }
          badges={
            unreadTotal > 0 ? (
              <PmBadge tone="primary">{unreadTotal} unread</PmBadge>
            ) : (
              <PmBadge tone="muted">All read</PmBadge>
            )
          }
        />
      }
    >
      <MessagesView activeThreadId={id} />
    </PmPage>
  )
}

export function NotificationsPage() {
  const { user } = useAuth()
  const userId = user?.id ?? 'seed-user-001'
  const notifications = notificationsApi.list(userId)
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Communication"
          title="Notifications"
          description="Alerts for matches, deals, negotiations, and messages."
          metric={<PmPageHeroMetric value={unreadCount} label="Unread" />}
          badges={
            <PmBadge tone={unreadCount > 0 ? 'warning' : 'success'}>
              {notifications.length} total
            </PmBadge>
          }
        />
      }
    >
      <NotificationsListSection />
    </PmPage>
  )
}

export function ProfilePage() {
  const { user, isCompanyUser } = useAuth()
  const profileKind = isCompanyUser ? 'company' : 'individual'
  const readiness = user?.profile
    ? resolveProfileReadiness(user.profile, profileKind)
    : null

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Account"
          title={user?.profile?.name ?? 'Profile'}
          description="Your public profile, readiness score, and vetting status."
          metric={
            readiness ? (
              <PmPageHeroMetric
                value={`${Math.round(readiness.score)}%`}
                label="Readiness"
              />
            ) : undefined
          }
          actions={
            <PmPageActions
              secondary={{ label: 'Settings', href: '/settings', variant: 'outline' }}
            />
          }
        />
      }
    >
      <ProfileView
        profile={user?.profile}
        profileKind={profileKind}
        email={user?.email}
      />
    </PmPage>
  )
}

export function SettingsPage() {
  return (
    <PmPage
      header={
        <PmPageHeader
          label="Account"
          title="Settings"
          description="Account security and notification preferences."
        />
      }
    >
      <SettingsView />
    </PmPage>
  )
}
