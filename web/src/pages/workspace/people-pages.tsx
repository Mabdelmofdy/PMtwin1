import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { FileText, Upload } from 'lucide-react'
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
import { InviteEmployeePanel } from '@/components/workspace/invite-employee-panel.tsx'
import {
  PublicProfileNotFound,
  PublicProfileView,
  resolveCompanyIds,
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
        userId={user?.id}
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
      <div className="space-y-6">
        <InviteEmployeePanel />
        <SettingsView />
      </div>
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
