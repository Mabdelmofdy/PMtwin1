import { useParams, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { peopleApi } from '@/api/people.ts'
import { notificationsApi } from '@/api/notifications.ts'
import { useAuth } from '@/providers/auth-provider'
import { PeopleListSection } from '@/components/user/people-list-section'
import { MessagesView } from '@/components/user/messages-view'
import { NotificationsListSection, type ReadFilter } from '@/components/user/notifications-list-section'
import { ProfileView } from '@/components/user/profile-view'
import { SettingsView } from '@/components/user/settings-view'
import {
  PublicProfileNotFound,
  PublicProfileView,
  resolveCompanyIds,
} from '@/components/user/public-profile-view'
import { MOCK_MESSAGE_THREADS } from '@/components/user/user-display'
import type { PeopleScopeFilter } from '@/components/user/user-display'
import {
  PmTableFilter,
  PmTableSearch,
  PmTableToolbar,
} from '@/components/data/pm-data-index'
import {
  PmBadge,
  PmFilterChips,
  PmPage,
  PmPageHeader,
  PmPageHeroMetric,
  PmPageActions,
} from '@/components/ui/pm-index'
import { PmToolbarSurface } from '@/components/ui/pm-toolbar-surface'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'
import { readProductNavState } from '@/config/product-identity'
import { resolveProfileReadiness } from '@/components/readiness/profile-readiness-card'

export function PeoplePage() {
  const location = useLocation()
  const navState = readProductNavState(location.state)
  const profileCount = peopleApi.listAll().length
  const peopleScope = navState?.peopleScope
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<PeopleScopeFilter>(peopleScope ?? 'all')
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

  const scopeLabels: Record<PeopleScopeFilter, string> = {
    all: 'All',
    people: 'Professionals',
    companies: 'Companies',
  }

  return (
    <PmPage
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
        <PmToolbarSurface>
          <PmTableToolbar
            search={
              <PmTableSearch
                placeholder="Search by name, skills, sector…"
                value={search}
                onValueChange={setSearch}
              />
            }
            filters={
              <PmTableFilter activeCount={scope !== 'all' ? 1 : 0} label="Type">
                <div className="space-y-1.5">
                  <label className={cn(pmTypography.bodySm, 'font-medium')}>Entity type</label>
                  <Select
                    value={scope}
                    onValueChange={(v) => setScope(v as PeopleScopeFilter)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="people">Professionals</SelectItem>
                      <SelectItem value="companies">Companies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </PmTableFilter>
            }
          >
            <PmFilterChips
              chips={
                scope !== 'all'
                  ? [
                      {
                        id: 'scope',
                        label: 'Type',
                        value: scopeLabels[scope as Exclude<PeopleScopeFilter, never>],
                        onRemove: () => setScope('all'),
                      },
                    ]
                  : []
              }
              onClearAll={() => {
                setSearch('')
                setScope('all')
              }}
            />
          </PmTableToolbar>
        </PmToolbarSurface>
      }
    >
      <PeopleListSection
        initialScope={peopleScope ?? 'all'}
        search={search}
        scope={scope}
        onSearchChange={setSearch}
        onScopeChange={setScope}
      />
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
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')

  const handleMarkAllRead = () => {
    notificationsApi.markAllRead(userId)
  }

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
        notifications.length > 0 ? (
          <PmToolbarSurface>
            <PmTableToolbar
              filters={
                <PmTableFilter activeCount={readFilter !== 'all' ? 1 : 0} label="Filter">
                  <div className="space-y-1.5">
                    <label className={cn(pmTypography.bodySm, 'font-medium')}>Read state</label>
                    <Select value={readFilter} onValueChange={(v) => setReadFilter(v as ReadFilter)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="unread">Unread only</SelectItem>
                        <SelectItem value="read">Read only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </PmTableFilter>
              }
            />
          </PmToolbarSurface>
        ) : undefined
      }
    >
      <NotificationsListSection readFilter={readFilter} />
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
