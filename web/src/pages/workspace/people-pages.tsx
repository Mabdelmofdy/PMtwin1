import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { FileText, Upload } from 'lucide-react'
import { peopleApi } from '@/api/people.ts'
import { notificationsApi } from '@/api/notifications.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
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
} from '@/components/user/public-profile-view'
import { MOCK_MESSAGE_THREADS } from '@/components/user/user-display'
import { PmTablePagination, PmTableEmpty } from '@/components/data/pm-data-index'
import {
  PmBadge,
  PmButton,
  PmEmptyState,
  PmPage,
  PmPageHeader,
  PmPageHeroMetric,
  PmPageActions,
  PmSurface,
} from '@/components/ui/pm-index'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PmForm,
  PmFormField,
  PmFormSection,
} from '@/components/forms/pm-form-index'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'
import { getRequiredDocuments } from '@/components/vetting/vetting-documents-provider.ts'
import type { PmBadgeTone } from '@/components/ui/pm-badge'
import { toast } from 'sonner'
import { PmBrowsePage, PmBrowseToolbar, PmContentCard } from '@/components/layout/pm-layout-index'
import { readProductNavState } from '@/config/product-identity'
import { resolveProfileReadiness } from '@/components/readiness/profile-readiness-card'
import { useProductLanguage } from '@/providers/product-language-provider'
import { vettingService } from '@/lib/vetting-service.ts'
import { updateProfileThroughCommand } from '@/services/profile-command-service.ts'
import { resolveRuntimeProfileSubject } from '@/domain/profile/profile-subject-service.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store.ts'
import { userSettingsRepository } from '@/repositories/index.ts'
import { listProfileOpportunityRecommendations } from '@/services/matching/profile-fit-service.ts'

export function PeoplePage() {
  const location = useLocation()
  const navState = readProductNavState(location.state)
  const profileCount = peopleApi.listMarketplaceVisible().length
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
  const person = id ? peopleApi.getPublicProfile(id) : undefined

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
          title={person.displayName}
          description={person.headline}
        />
      }
    >
      <PublicProfileView profile={person} />
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
  const { user, activeWorkspace, activeParty, isVettingRestricted, refreshUser } = useAuth()
  useDataStoreVersion()
  const profileSubject = user
    ? resolveRuntimeProfileSubject({
        partyId: activeParty?.id,
        workspaceId: activeWorkspace?.id,
        legacyAccountId: user.id,
      })
    : undefined
  const profileKind = profileSubject?.profileKind ?? 'individual'
  const profile = profileSubject?.account.profile
  const [skillsDraft, setSkillsDraft] = useState(profile?.skills?.join(', ') ?? '')
  const [documentType, setDocumentType] = useState('Commercial Registration')
  const [documentFileName, setDocumentFileName] = useState('')
  const readiness = profile
    ? resolveProfileReadiness(profile, profileKind)
    : null
  const recommendations =
    user && profileSubject
      ? listProfileOpportunityRecommendations({
          account: profileSubject.account,
          opportunities: opportunitiesApi.listMarketplace(),
          settings: userSettingsRepository.get(user.id),
          limit: 3,
        })
      : []

  return (
    <PmPage
      header={
        <PmPageHeader
          label={profileKind === 'company' ? 'Company workspace profile' : 'My professional profile'}
          title={profile?.name ?? 'Profile'}
          description={
            profileKind === 'company'
              ? 'Manage the active company profile used for discovery, readiness, and matching.'
              : 'Manage your professional identity, evidence, readiness, and matching profile.'
          }
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
        profile={profile}
        profileKind={profileKind}
        email={user?.email}
        userId={user?.id}
        onSave={(profilePatch) => {
          if (!user) {
            toast.error('Sign in to update your profile.')
            return false
          }
          const commandResult = updateProfileThroughCommand(
            {
              partyId: profileSubject?.partyId,
              workspaceId: profileSubject?.workspaceId,
              legacyAccountId: user.id,
            },
            profilePatch,
          )
          if (!commandResult.success) {
            toast.error(commandResult.errors?.[0] ?? 'Profile could not be updated.')
            return false
          }
          refreshUser()
          toast.success('Profile updated')
          return true
        }}
      />
      {recommendations.length > 0 ? (
        <PmContentCard
          title="Recommended projects"
          description="Profile-fit recommendations use non-sensitive capabilities and preferences. They do not change automatic match ranking yet."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {recommendations.map((recommendation) => {
              const strongestFactor = [...recommendation.explanation.factors]
                .filter((factor) => factor.applicable)
                .sort((left, right) => right.score - left.score)[0]
              return (
                <PmSurface key={recommendation.opportunity.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{recommendation.opportunity.title}</p>
                    <PmBadge tone="info" size="sm">
                      {Math.round(recommendation.score * 100)}% fit
                    </PmBadge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {strongestFactor?.explanation ?? 'Profile fit explanation available.'}
                  </p>
                  <PmButton size="sm" variant="outline" asChild>
                    <Link to={`/opportunities/${recommendation.opportunity.id}`}>View project</Link>
                  </PmButton>
                </PmSurface>
              )
            })}
          </div>
        </PmContentCard>
      ) : null}
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
                  const result = updateProfileThroughCommand(
                    {
                      partyId: profileSubject?.partyId,
                      workspaceId: profileSubject?.workspaceId,
                      legacyAccountId: user.id,
                    },
                    { skills },
                  )
                  if (!result.success) {
                    toast.error(result.errors?.[0] ?? 'Profile update failed')
                    return
                  }
                  refreshUser()
                  toast.success('Profile updated for vetting review')
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
  return (
    <PmPage
      header={
        <PmPageHeader
          label="Account"
          title="Settings"
          description="Manage your account, workspace preferences, notifications, and security."
        />
      }
    >
      <SettingsView />
    </PmPage>
  )
}

const PARTY_DOCUMENT_CATEGORIES = [
  'profile',
  'vetting',
  'legal',
  'technical',
  'commercial',
  'financial',
  'insurance',
  'certification',
  'attachment',
] as const

const VETTING_REQUIRED_LABELS = new Set(
  getRequiredDocuments().map((entry) => entry.label.toLowerCase()),
)

function resolveDocumentStatusTone(status: string | undefined): PmBadgeTone {
  const normalized = (status ?? '').toLowerCase()
  if (normalized === 'approved') return 'success'
  if (normalized === 'pending_review' || normalized === 'pending') return 'warning'
  if (normalized === 'rejected' || normalized === 'expired') return 'danger'
  return 'neutral'
}

function formatDocumentStatusLabel(status: string | undefined): string {
  const normalized = (status ?? 'unknown').replace(/_/g, ' ')
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export function PartyDocumentsPage() {
  const { user } = useAuth()
  const [documentType, setDocumentType] = useState('General')
  const [fileName, setFileName] = useState('')
  const [category, setCategory] = useState<(typeof PARTY_DOCUMENT_CATEGORIES)[number]>('profile')
  const [documentSearch, setDocumentSearch] = useState('')
  const ownerPartyId = user ? partiesApi.resolveActivePartyId(user.id) : ''
  const documents = ownerPartyId ? vettingService.listPartyDocuments(ownerPartyId) : []

  const filteredDocuments = useMemo(() => {
    const query = documentSearch.trim().toLowerCase()
    if (!query) return documents
    return documents.filter(
      (document) =>
        document.documentType.toLowerCase().includes(query)
        || document.fileName.toLowerCase().includes(query)
        || document.documentCategory.toLowerCase().includes(query),
    )
  }, [documentSearch, documents])

  const grouped = PARTY_DOCUMENT_CATEGORIES.map((group) => ({
    group,
    items: filteredDocuments.filter((document) => document.documentCategory === group),
  }))

  const hasDocuments = documents.length > 0
  const hasFilteredResults = filteredDocuments.length > 0

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Account"
          title="Party Documents"
          description="Unified metadata-only document center grouped by category."
          metric={<PmPageHeroMetric value={documents.length} label="Documents" />}
        />
      }
    >
      {!hasDocuments ? (
        <PmEmptyState
          title="No documents uploaded yet"
          description="Upload document metadata to support vetting and compliance checks."
          icon={<FileText className="size-10" />}
          action={
            <PmButton size="sm" type="button" onClick={() => document.getElementById('party-document-upload')?.scrollIntoView({ behavior: 'smooth' })}>
              Start upload
            </PmButton>
          }
          secondaryAction={
            <PmButton size="sm" variant="outline" asChild>
              <Link to="/profile">Review profile readiness</Link>
            </PmButton>
          }
        />
      ) : null}

      <div id="party-document-upload">
      <PmContentCard title="Upload metadata">
        <PmForm
          onSubmit={(event) => {
            event.preventDefault()
            if (!user || !ownerPartyId) {
              toast.error('Sign in first.')
              return
            }
            if (!documentType.trim() || !fileName.trim()) {
              toast.error('Document type and file name are required.')
              return
            }
            vettingService.replacePartyDocument({
              ownerPartyId,
              uploadedByUserId: user.id,
              documentCategory: category,
              documentType: documentType.trim(),
              fileName: fileName.trim(),
            })
            toast.success('PartyDocument metadata uploaded')
            setFileName('')
          }}
        >
          <PmFormSection title="Document details" description="Metadata-only upload for vetting and compliance tracking.">
            <div className="grid gap-3 md:grid-cols-3">
              <PmFormField id="party-document-type" label="Document type" required>
                <Input
                  id="party-document-type"
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
                  placeholder="Document type"
                />
              </PmFormField>
              <PmFormField id="party-document-file-name" label="File name" required>
                <Input
                  id="party-document-file-name"
                  value={fileName}
                  onChange={(event) => setFileName(event.target.value)}
                  placeholder="File name"
                />
              </PmFormField>
              <PmFormField id="party-document-category" label="Category" required>
                <Select
                  value={category}
                  onValueChange={(value) =>
                    setCategory(value as (typeof PARTY_DOCUMENT_CATEGORIES)[number])}
                >
                  <SelectTrigger id="party-document-category" aria-label="Document category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTY_DOCUMENT_CATEGORIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value[0].toUpperCase() + value.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PmFormField>
            </div>
            <div className="mt-3">
              <PmButton size="sm" type="submit">
                <Upload className="size-4" aria-hidden />
                Upload metadata
              </PmButton>
            </div>
          </PmFormSection>
        </PmForm>
      </PmContentCard>
      </div>

      {hasDocuments ? (
        <div className="mt-4">
          <Input
            value={documentSearch}
            onChange={(event) => setDocumentSearch(event.target.value)}
            placeholder="Search documents by type, file name, or category"
            aria-label="Search documents"
          />
        </div>
      ) : null}

      {hasDocuments && !hasFilteredResults ? (
        <div className="mt-4">
          <PmTableEmpty
            variant="no-results"
            title="No documents match your search"
            description="Try a different query or clear the search field."
            primaryAction={
              <PmButton size="sm" variant="outline" onClick={() => setDocumentSearch('')}>
                Clear search
              </PmButton>
            }
          />
        </div>
      ) : null}

      <div className="mt-4 grid gap-4">
        {grouped.map(({ group, items }) => {
          if (documentSearch.trim() && items.length === 0) return null
          const isVettingGroup = group === 'vetting'
          return (
            <PmContentCard
              key={group}
              title={group[0].toUpperCase() + group.slice(1)}
              description={
                isVettingGroup
                  ? 'Includes required vetting documents for account approval.'
                  : undefined
              }
            >
              {isVettingGroup ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {getRequiredDocuments().map((entry) => (
                    <PmBadge key={entry.id} tone="warning" size="sm">
                      Required: {entry.label}
                    </PmBadge>
                  ))}
                </div>
              ) : (
                <PmBadge tone="neutral" size="sm" className="mb-3">
                  Optional category
                </PmBadge>
              )}
              {items.length === 0 ? (
                <PmEmptyState
                  size="compact"
                  title={`No ${group} documents yet`}
                  description="Upload metadata for this category to keep your party record complete."
                  icon={<FileText className="size-7" />}
                  action={
                    <PmButton
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setCategory(group)
                        document.getElementById('party-document-upload')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      Upload to this category
                    </PmButton>
                  }
                />
              ) : (
                <div className="space-y-2">
                  {items.map((document) => {
                    const isRequiredType = VETTING_REQUIRED_LABELS.has(
                      document.documentType.replace(/_/g, ' ').toLowerCase(),
                    ) || VETTING_REQUIRED_LABELS.has(document.documentType.toLowerCase())
                    return (
                      <PmSurface key={document.id} variant="default" className="p-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={cn(pmTypography.label, 'font-medium')}>{document.documentType}</p>
                          <PmBadge tone={resolveDocumentStatusTone(document.status)} size="sm">
                            {formatDocumentStatusLabel(document.status)}
                          </PmBadge>
                          {isRequiredType ? (
                            <PmBadge tone="warning" size="sm">
                              Required
                            </PmBadge>
                          ) : (
                            <PmBadge tone="neutral" size="sm">
                              Optional
                            </PmBadge>
                          )}
                        </div>
                        <p className="mt-2 text-muted-foreground">
                          <span className="font-medium text-foreground">File:</span> {document.fileName}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Expiry:</span> {document.expiryDate ?? '—'}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Review notes:</span> {document.reviewNotes ?? '—'}
                        </p>
                        <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                          Version history is not available in this metadata-only view.
                        </p>
                      </PmSurface>
                    )
                  })}
                </div>
              )}
            </PmContentCard>
          )
        })}
      </div>
    </PmPage>
  )
}
