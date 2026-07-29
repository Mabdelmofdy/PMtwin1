import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { PUBLIC_CTA } from '@/config/public-marketing'
import { useMarketingMotion } from '@/components/marketing/marketing-motion'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { useAuth } from '@/providers/auth-provider'
import type { Company, Opportunity, PlatformUser } from '@/types/domain.ts'
import {
  formatLocation,
  opportunityMatchesLocationScopes,
  primaryLocationSelectOptions,
} from '@/domain/locations'

type FindTab = 'people' | 'companies' | 'opportunities'

function cardInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function matchesSearch(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase())
}

function profileSearchBlob(profile: Record<string, unknown>): string {
  const skills = Array.isArray(profile.skills) ? profile.skills.join(' ') : ''
  const sectors = Array.isArray(profile.sectors) ? profile.sectors.join(' ') : ''
  return [profile.name, profile.headline, profile.title, profile.bio, skills, sectors]
    .filter(Boolean)
    .join(' ')
}

export function LegacyFindPage() {
  const { isAuthenticated } = useAuth()
  const { tabPanel, reducedMotion } = useMarketingMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [tab, setTab] = useState<FindTab>('people')
  const [location, setLocation] = useState('')
  const [sector, setSector] = useState('')
  const [oppType, setOppType] = useState('')
  const [model, setModel] = useState('')

  const people = useMemo(
    () =>
      peopleApi.listUsers().filter((user) => {
        const profile = user.profile || {}
        const type = profile.type
        const isProfessional =
          type === 'professional' ||
          type === 'consultant' ||
          user.role === 'professional' ||
          user.role === 'consultant'
        return user.status === 'active' && user.role !== 'admin' && isProfessional
      }),
    [],
  )

  const companies = useMemo(
    () => peopleApi.listCompanies().filter((company) => company.status === 'active'),
    [],
  )

  const opportunities = useMemo(
    () =>
      opportunitiesApi
        .list()
        .filter((opp) => (opp.visibilityStatus ?? '').toLowerCase() === 'published'),
    [],
  )

  const filteredPeople = useMemo(() => filterPeople(people, query, location, sector), [people, query, location, sector])
  const filteredCompanies = useMemo(
    () => filterCompanies(companies, query, location, sector),
    [companies, query, location, sector],
  )
  const filteredOpportunities = useMemo(
    () => filterOpportunities(opportunities, query, location, oppType, model),
    [opportunities, query, location, oppType, model],
  )

  const runSearch = () => {
    const next = query.trim()
    if (next) setSearchParams({ q: next })
    else setSearchParams({})
  }

  return (
    <div className="legacy-poc-page page-container find-page pm-find-page">
      <section className="find-hero">
        <div className="find-hero-grid" aria-hidden="true" />
        <div className="find-hero-content">
          <div className="find-hero-copy">
            <p className="find-kicker">
              <i className="ph-duotone ph-radar" aria-hidden="true" />
              Marketplace search
            </p>
            <h1>Find design, BIM, and construction partners.</h1>
            <p className="find-subtitle">
              Search professionals, companies, and live opportunities across the built-environment network.
            </p>
            <div className="find-search-form">
              <div className="search-input-wrapper">
                <i className="ph-duotone ph-magnifying-glass" aria-hidden="true" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search BIM, MEP, 3D visualization, contractors, tenders..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      runSearch()
                    }
                  }}
                />
              </div>
              <button type="button" className="btn btn-primary" onClick={runSearch}>
                <i className="ph-duotone ph-magnifying-glass" aria-hidden="true" />
                <span>Search</span>
              </button>
            </div>
          </div>
          <div className="find-hero-visual" aria-hidden="true">
            <div className="find-map-plane">
              <span className="find-node find-node-a">
                <i className="ph-duotone ph-cube" />
              </span>
              <span className="find-node find-node-b">
                <i className="ph-duotone ph-buildings" />
              </span>
              <span className="find-node find-node-c">
                <i className="ph-duotone ph-hard-hat" />
              </span>
              <span className="find-node find-node-d">
                <i className="ph-duotone ph-handshake" />
              </span>
              <span className="find-link find-link-a" />
              <span className="find-link find-link-b" />
              <span className="find-link find-link-c" />
            </div>
            <div className="find-floating-card find-floating-card-a">
              <strong>BIM coordination</strong>
              <span>92% exchange compatibility</span>
            </div>
            <div className="find-floating-card find-floating-card-b">
              <strong>Riyadh</strong>
              <span>Design + MEP demand</span>
            </div>
          </div>
        </div>
      </section>

      <section className="find-content">
        <div className="container">
          <div className="find-tabs" role="tablist" aria-label="Search result type">
            {(
              [
                ['people', 'ph-users', 'People', filteredPeople.length],
                ['companies', 'ph-buildings', 'Companies', filteredCompanies.length],
                ['opportunities', 'ph-handshake', 'Opportunities', filteredOpportunities.length],
              ] as const
            ).map(([id, icon, label, count]) => {
              const selected = tab === id
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`find-tab-${id}`}
                  className={`find-tab${selected ? ' active' : ''}`}
                  aria-selected={selected}
                  aria-controls={`find-panel-${id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(id)}
                >
                  <i className={`ph-duotone ${icon}`} aria-hidden="true" />
                  <span>{label}</span>
                  <span className="tab-count">{count}</span>
                </button>
              )
            })}
          </div>

          <div className="find-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="filter-location">Location</label>
                <select
                  id="filter-location"
                  className="form-select"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="">All Locations</option>
                  {primaryLocationSelectOptions()
                    .filter((opt) => opt.description === 'City' || opt.id === 'remote')
                    .slice(0, 40)
                    .map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                </select>
              </div>
              {tab !== 'opportunities' ? (
                <div className="filter-group" id="sector-filter-group">
                  <label htmlFor="filter-sector">Sector</label>
                  <select
                    id="filter-sector"
                    className="form-select"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                  >
                    <option value="">All Sectors</option>
                    {['Construction', 'Infrastructure', 'Real Estate', 'MEP', 'Engineering'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="filter-group">
                    <label htmlFor="filter-opp-type">Type</label>
                    <select
                      id="filter-opp-type"
                      className="form-select"
                      value={oppType}
                      onChange={(e) => setOppType(e.target.value)}
                    >
                      <option value="">All Types</option>
                      <option value="request">Needs</option>
                      <option value="offer">Offers</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label htmlFor="filter-model">Model</label>
                    <select
                      id="filter-model"
                      className="form-select"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    >
                      <option value="">All Models</option>
                      <option value="project_based">Project Based</option>
                      <option value="strategic_partnership">Strategic Partnership</option>
                      <option value="resource_pooling">Resource Pooling</option>
                      <option value="hiring">Hiring</option>
                      <option value="competition">Competition</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="login-banner">
              <div className="login-banner-content">
                <i className="ph-duotone ph-lock-simple" aria-hidden="true" />
                <div className="login-banner-text">
                  <h3>Login to view full details</h3>
                  <p>
                    Create an account or login to see complete profiles, contact information, and apply
                    to opportunities.
                  </p>
                </div>
                <div className="login-banner-actions">
                  <Link to="/login" className="btn btn-primary">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-secondary">
                    {PUBLIC_CTA.registrationPreview}
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            <motion.div
              key={`${tab}-${query}-${location}-${sector}-${oppType}-${model}`}
              id={`find-panel-${tab}`}
              role="tabpanel"
              aria-labelledby={`find-tab-${tab}`}
              className="find-results find-results-motion"
              initial={reducedMotion ? false : 'hidden'}
              animate="visible"
              exit="exit"
              variants={tabPanel}
            >
              {tab === 'people' ? (
                <FindPeopleResults people={filteredPeople} isAuthenticated={isAuthenticated} />
              ) : null}
              {tab === 'companies' ? (
                <FindCompaniesResults companies={filteredCompanies} isAuthenticated={isAuthenticated} />
              ) : null}
              {tab === 'opportunities' ? (
                <FindOpportunityResults opportunities={filteredOpportunities} isAuthenticated={isAuthenticated} />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}

function filterPeople(users: PlatformUser[], query: string, location: string, sector: string) {
  return users.filter((user) => {
    const profile = (user.profile || {}) as Record<string, unknown>
    if (query && !matchesSearch(profileSearchBlob(profile), query)) return false
    if (location && !String(profile.location || '').toLowerCase().includes(location.toLowerCase())) return false
    if (sector) {
      const sectors = Array.isArray(profile.sectors) ? profile.sectors : []
      if (!sectors.some((s) => String(s).toLowerCase().includes(sector.toLowerCase()))) return false
    }
    return true
  })
}

function filterCompanies(companies: Company[], query: string, location: string, sector: string) {
  return companies.filter((company) => {
    const profile = (company.profile || {}) as Record<string, unknown>
    if (query && !matchesSearch(profileSearchBlob(profile), query)) return false
    if (location) {
      const loc = String(profile.location || profile.address || '')
      if (!loc.toLowerCase().includes(location.toLowerCase())) return false
    }
    if (sector) {
      const sectors = [...(Array.isArray(profile.sectors) ? profile.sectors : []), profile.industry]
        .filter(Boolean)
        .map(String)
      if (!sectors.some((s) => s.toLowerCase().includes(sector.toLowerCase()))) return false
    }
    return true
  })
}

function filterOpportunities(
  opportunities: Opportunity[],
  query: string,
  location: string,
  oppType: string,
  model: string,
) {
  return opportunities.filter((opp) => {
    if (query) {
      const blob = [
        opp.title,
        opp.description,
        ...(opp.scope?.coreSkills || []),
        ...(opp.scope?.sectors || []),
      ]
        .filter(Boolean)
        .join(' ')
      if (!matchesSearch(blob, query)) return false
    }
    if (location) {
      if (!opportunityMatchesLocationScopes(opp, [location])) return false
    }
    if (oppType && opp.intent !== oppType) return false
    if (model && opp.modelType !== model) return false
    return true
  })
}

function FindPeopleResults({
  people,
  isAuthenticated,
}: {
  people: PlatformUser[]
  isAuthenticated: boolean
}) {
  if (people.length === 0) {
    return (
      <div className="empty-state">
        <i className="ph-duotone ph-users" aria-hidden="true" />
        <h3>No people found</h3>
        <p>Try adjusting your search criteria</p>
      </div>
    )
  }
  return (
    <div className="results-grid">
      {people.map((person) => {
        const profile = person.profile || {}
        const name = profile.name || 'Professional'
        const initials = cardInitials(name)
        const skills = (profile.skills || []).slice(0, 3)
        return (
          <article key={person.id} className={isAuthenticated ? 'full-card' : 'preview-card'}>
            <div className="preview-card-header">
              <div className="preview-avatar">{initials}</div>
              <div className="preview-info">
                <div className="preview-name">{name}</div>
                <div className="preview-headline">
                  {profile.headline || (profile as { title?: string }).title || 'Construction Professional'}
                </div>
                <div className="preview-location">
                  <i className="ph-duotone ph-map-pin" />
                  {profile.location || 'Saudi Arabia'}
                </div>
              </div>
            </div>
            {skills.length > 0 ? (
              <div className="preview-meta">{skills.join(' • ')}</div>
            ) : null}
            <div className="preview-footer">
              {isAuthenticated ? (
                <Link to={`/people/${person.id}`} className="btn btn-primary btn-sm">
                  View Profile
                </Link>
              ) : (
                <Link to="/login" className="btn btn-secondary btn-sm">
                  <i className="ph-duotone ph-lock-simple" /> Login to View
                </Link>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function FindCompaniesResults({
  companies,
  isAuthenticated,
}: {
  companies: Company[]
  isAuthenticated: boolean
}) {
  if (companies.length === 0) {
    return (
      <div className="empty-state">
        <i className="ph-duotone ph-buildings" aria-hidden="true" />
        <h3>No companies found</h3>
        <p>Try adjusting your search criteria</p>
      </div>
    )
  }
  return (
    <div className="results-grid">
      {companies.map((company) => {
        const profile = company.profile || {}
        const name = profile.name || 'Company'
        const initials = cardInitials(name)
        return (
          <article key={company.id} className={isAuthenticated ? 'full-card' : 'preview-card'}>
            <div className="preview-card-header">
              <div className="preview-avatar">{initials}</div>
              <div className="preview-info">
                <div className="preview-name">{name}</div>
                <div className="preview-headline">{profile.headline || 'Construction Company'}</div>
                <div className="preview-location">
                  <i className="ph-duotone ph-map-pin" />
                  {String(profile.location || (profile as { address?: string }).address || 'Saudi Arabia')}
                </div>
              </div>
            </div>
            <div className="preview-footer">
              {isAuthenticated ? (
                <Link to={`/people/${company.id}`} className="btn btn-primary btn-sm">
                  View Company
                </Link>
              ) : (
                <Link to="/login" className="btn btn-secondary btn-sm">
                  <i className="ph-duotone ph-lock-simple" /> Login to View
                </Link>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function FindOpportunityResults({
  opportunities,
  isAuthenticated,
}: {
  opportunities: Opportunity[]
  isAuthenticated: boolean
}) {
  if (opportunities.length === 0) {
    return (
      <div className="empty-state">
        <i className="ph-duotone ph-handshake" aria-hidden="true" />
        <h3>No opportunities found</h3>
        <p>Try adjusting your search criteria</p>
      </div>
    )
  }
  return (
    <div className="results-grid">
      {opportunities.map((opp) => (
        <article key={opp.id} className={isAuthenticated ? 'full-card' : 'preview-card'}>
          <div className="preview-info">
            <div className="preview-name">{opp.title}</div>
            <div className="preview-headline">{opp.description?.slice(0, 120) || 'Opportunity'}</div>
            <div className="preview-location">
              <i className="ph-duotone ph-map-pin" />
              {formatLocation(opp.location) || 'Saudi Arabia'}
            </div>
          </div>
          <div className="preview-badges">
            <span className="badge badge-secondary">{opp.intent === 'offer' ? 'Offer' : 'Need'}</span>
            {opp.modelType ? <span className="badge badge-outline">{opp.modelType.replace(/_/g, ' ')}</span> : null}
          </div>
          <div className="preview-footer">
            {isAuthenticated ? (
              <Link to={`/opportunities/${opp.id}`} className="btn btn-primary btn-sm">
                View Opportunity
              </Link>
            ) : (
              <Link to="/login" className="btn btn-secondary btn-sm">
                <i className="ph-duotone ph-lock-simple" /> Login to View
              </Link>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
