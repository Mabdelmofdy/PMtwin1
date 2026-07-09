import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { peopleApi } from '@/api/people.ts'
import { notificationsApi } from '@/api/notifications.ts'
import { partiesApi } from '@/api/parties.ts'
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
  PmButton,
  PmPage,
  PmPageHeader,
  PmPageHeroMetric,
  PmPageActions,
} from '@/components/ui/pm-index'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { PmBrowsePage, PmBrowseToolbar, PmContentCard } from '@/components/layout/pm-layout-index'
import { readProductNavState } from '@/config/product-identity'
import { resolveProfileReadiness } from '@/components/readiness/profile-readiness-card'
import { useProductLanguage } from '@/providers/product-language-provider'
import { vettingService } from '@/lib/vetting-service.ts'

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
  const { productLanguage } = useProductLanguage()
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
          description={`Alerts for matches, ${productLanguage.plural('commercialAgreement').toLowerCase()}, ${productLanguage.plural('negotiation').toLowerCase()}, and messages.`}
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
  const navigate = useNavigate()
  const { user, isCompanyUser, isVettingRestricted } = useAuth()
  const profileKind = isCompanyUser ? 'company' : 'individual'
  const [skillsDraft, setSkillsDraft] = useState(user?.profile?.skills?.join(', ') ?? '')
  const [documentType, setDocumentType] = useState('Commercial Registration')
  const [documentFileName, setDocumentFileName] = useState('')
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
      {user && isVettingRestricted ? (
        <PmContentCard
          title="Vetting updates"
          description="Your account is under review. You can update profile skills, upload replacement PartyDocument metadata, and resubmit."
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Skills (comma-separated)</label>
              <Input
                value={skillsDraft}
                onChange={(event) => setSkillsDraft(event.target.value)}
                placeholder="Project Management, Risk, Procurement"
              />
              <PmButton
                size="sm"
                variant="outline"
                onClick={() => {
                  const skills = skillsDraft
                    .split(',')
                    .map((skill) => skill.trim())
                    .filter(Boolean)
                  vettingService.updateProfile(user.id, { skills })
                  toast.success('Profile updated for vetting review')
                  navigate(0)
                }}
              >
                Save profile update
              </PmButton>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">PartyDocument type</label>
              <Input
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
                placeholder="Commercial Registration"
              />
              <label className="text-sm font-medium">File name (metadata only)</label>
              <Input
                value={documentFileName}
                onChange={(event) => setDocumentFileName(event.target.value)}
                placeholder="cr-valid-2026.pdf"
              />
              <PmButton
                size="sm"
                variant="outline"
                onClick={() => {
                  const partyId = partiesApi.resolveActivePartyId(user.id)
                  if (!documentType.trim() || !documentFileName.trim()) {
                    toast.error('Document type and file name are required.')
                    return
                  }
                  vettingService.replacePartyDocument({
                    ownerPartyId: partyId,
                    uploadedByUserId: user.id,
                    documentCategory: 'vetting',
                    documentType: documentType.trim(),
                    fileName: documentFileName.trim(),
                  })
                  toast.success('PartyDocument metadata added for review')
                  setDocumentFileName('')
                }}
              >
                Upload replacement metadata
              </PmButton>
            </div>

            <PmButton
              size="sm"
              onClick={() => {
                const partyId = partiesApi.resolveActivePartyId(user.id)
                vettingService.resubmitForReview(user.id, partyId)
                toast.success('Resubmitted for vetting review')
                navigate(0)
              }}
            >
              Resubmit for review
            </PmButton>
          </div>
        </PmContentCard>
      ) : null}
    </PmPage>
  )
}

export function SettingsPage() {
  const { productLanguage } = useProductLanguage()
  return (
    <PmPage
      header={
        <PmPageHeader
          label="Account"
          title="Settings"
          description={`Account security, notification preferences, and ${productLanguage.label('commercialAgreement').toLowerCase()} terminology settings.`}
        />
      }
    >
      <SettingsView />
    </PmPage>
  )
}
