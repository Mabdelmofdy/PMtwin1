import { useParams, useLocation } from 'react-router-dom'
import { peopleApi } from '@/api/people.ts'
import { notificationsApi } from '@/api/notifications.ts'
import { useAuth } from '@/providers/auth-provider'
import {
  PeopleBrowseToolbar,
  PeopleListSection,
  usePeopleListFilters,
} from '@/components/user/people-list-section'
import { MessagesView } from '@/components/user/messages-view'
import {
  NotificationsBrowseToolbar,
  NotificationsListSection,
  useNotificationsListFilters,
} from '@/components/user/notifications-list-section'
import { ProfileView } from '@/components/user/profile-view'
import { SettingsView } from '@/components/user/settings-view'
import {
  PublicProfileNotFound,
  PublicProfileView,
  resolveCompanyIds,
} from '@/components/user/public-profile-view'
import { MOCK_MESSAGE_THREADS } from '@/components/user/user-display'
import { PmTablePagination } from '@/components/data/pm-data-index'
import {
  PmBadge,
  PmPage,
  PmPageHeader,
  PmPageHeroMetric,
  PmPageActions,
} from '@/components/ui/pm-index'
import { PmBrowsePage, PmBrowseToolbar } from '@/components/layout/pm-layout-index'
import { readProductNavState } from '@/config/product-identity'
import { resolveProfileReadiness } from '@/components/readiness/profile-readiness-card'

export function PeoplePage() {
  const location = useLocation()
  const navState = readProductNavState(location.state)
  const profileCount = peopleApi.listAll().length
  const peopleScope = navState?.peopleScope
  const listFilters = usePeopleListFilters(peopleScope ?? 'all')
  const title =
    peopleScope === 'companies'
      ? 'Browse companies'
      : peopleScope === 'people'
        ? 'Browse professionals'
        : 'Discover'
  const description =
    peopleScope === 'companies'
      ? 'Explore construction companies available on the marketplace.'
      : peopleScope === 'people'
        ? 'Explore professionals and talent available for collaboration.'
        : 'Search and discover professionals and companies across the built environment.'

  return (
    <PmBrowsePage
      header={
        <PmPageHeader
          label="Marketplace"
          title={title}
          description={description}
          tone="default"
          metric={<PmPageHeroMetric value={profileCount} label="Available profiles" />}
        />
      }
      toolbar={
        <PmBrowseToolbar>
          <PeopleBrowseToolbar
            search={listFilters.search}
            setSearch={listFilters.setSearch}
            scope={listFilters.scope}
            setScope={listFilters.setScope}
            activeFilterChips={listFilters.activeFilterChips}
            clearAllFilters={listFilters.clearAllFilters}
          />
        </PmBrowseToolbar>
      }
      pagination={
        listFilters.totalItems > 0 ? (
          <PmTablePagination
            page={listFilters.safePage}
            pageSize={listFilters.pageSize}
            totalItems={listFilters.totalItems}
            pageSizeOptions={[12, 24, 48]}
            onPageChange={listFilters.setPage}
            onPageSizeChange={listFilters.setPageSize}
          />
        ) : null
      }
    >
      <PeopleListSection
        filters={listFilters}
        showToolbar={false}
        showPagination={false}
        initialScope={peopleScope ?? 'all'}
      />
    </PmBrowsePage>
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
          description="Direct conversations with your network. Messaging is in preview — sample threads illustrate the inbox experience."
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
  const listFilters = useNotificationsListFilters(userId)
  const unreadCount = listFilters.notifications.filter((n) => !n.read).length

  const handleMarkAllRead = () => {
    notificationsApi.markAllRead(userId)
  }

  return (
    <PmBrowsePage
      header={
        <PmPageHeader
          label="Communication"
          title="Notifications"
          description="Alerts for matches, deals, negotiations, and messages."
          metric={<PmPageHeroMetric value={unreadCount} label="Unread" />}
          badges={
            <PmBadge tone={unreadCount > 0 ? 'warning' : 'success'}>
              {listFilters.notifications.length} total
            </PmBadge>
          }
          actions={
            unreadCount > 0 ? (
              <PmPageActions
                secondary={{
                  label: 'Mark all read',
                  onClick: handleMarkAllRead,
                  variant: 'outline',
                }}
              />
            ) : undefined
          }
        />
      }
      toolbar={
        listFilters.notifications.length > 0 ? (
          <PmBrowseToolbar>
            <NotificationsBrowseToolbar
              readFilter={listFilters.readFilter}
              setReadFilter={listFilters.setReadFilter}
            />
          </PmBrowseToolbar>
        ) : undefined
      }
      pagination={
        listFilters.totalItems > 0 ? (
          <PmTablePagination
            page={listFilters.safePage}
            pageSize={listFilters.pageSize}
            totalItems={listFilters.totalItems}
            pageSizeOptions={[12, 24, 48]}
            onPageChange={listFilters.setPage}
            onPageSizeChange={listFilters.setPageSize}
          />
        ) : null
      }
    >
      <NotificationsListSection
        filters={listFilters}
        showToolbar={false}
        showPagination={false}
      />
    </PmBrowsePage>
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
