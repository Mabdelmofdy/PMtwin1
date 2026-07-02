import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PUBLIC_CTA } from '@/config/public-marketing'
import { PUBLIC_BRAND_NAME } from '@/lib/public-brand'
import { MarketingReveal, MarketingTrustBand, useMarketingMotion } from '@/components/marketing/marketing-index'

const SEARCH_CHIPS = [
  'BIM coordination',
  'Architectural design',
  'MEP consultant',
] as const

function navigateHeroSearch(navigate: ReturnType<typeof useNavigate>, query: string) {
  const q = query.trim()
  navigate(q ? `/find?q=${encodeURIComponent(q)}` : '/find')
}

export function LegacyHomePage() {
  const navigate = useNavigate()
  const homeRef = useRef<HTMLDivElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { heroVisualFloat, reducedMotion } = useMarketingMotion()

  useEffect(() => {
    const home = homeRef.current
    const visual = visualRef.current
    if (!home || !visual || !window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    home.dataset.tilt = 'on'

    const onMove = (event: PointerEvent) => {
      const rect = visual.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5
      home.style.setProperty('--pm-tilt-x', `${x * 4}deg`)
      home.style.setProperty('--pm-tilt-y', `${y * -3}deg`)
    }

    const onLeave = () => {
      home.style.setProperty('--pm-tilt-x', '0deg')
      home.style.setProperty('--pm-tilt-y', '0deg')
    }

    visual.addEventListener('pointermove', onMove)
    visual.addEventListener('pointerleave', onLeave)
    return () => {
      visual.removeEventListener('pointermove', onMove)
      visual.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  const onSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    navigateHeroSearch(navigate, searchQuery)
  }

  return (
    <div className="legacy-poc-page pm-home" ref={homeRef}>
      <section className="pm-hero" aria-labelledby="pm-home-title">
        <div className="pm-hero-grid" aria-hidden="true" />
        <div className="pm-hero-shell">
          <div className="pm-hero-copy">
            <p className="pm-kicker">
              <i className="ph-duotone ph-cube-focus" aria-hidden="true" />
              Built environment collaboration
            </p>
            <h1 id="pm-home-title">{PUBLIC_BRAND_NAME}</h1>
            <p className="pm-hero-subtitle">
              3D design, BIM, and construction partners in one deal-ready workspace.
            </p>
            <p className="pm-hero-description">
              Match project needs with architects, BIM teams, contractors, consultants, equipment
              providers, and consortium partners across Saudi Arabia and the GCC.
            </p>
            <form
              className="pm-hero-search"
              role="search"
              aria-label="Search marketplace"
              onSubmit={onSearchSubmit}
            >
              <div className="pm-hero-search-input-wrap">
                <i className="ph-duotone ph-magnifying-glass" aria-hidden="true" />
                <input
                  type="search"
                  className="pm-hero-search-input"
                  placeholder="Search BIM, design, contractors…"
                  autoComplete="off"
                  aria-label="Search opportunities and partners"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="pm-hero-search-btn">
                <i className="ph-duotone ph-arrow-right" aria-hidden="true" />
                <span>Search</span>
              </button>
              <div className="pm-hero-search-suggestions" aria-label="Popular searches">
                {SEARCH_CHIPS.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="pm-hero-search-chip"
                    onClick={() => {
                      setSearchQuery(term)
                      navigateHeroSearch(navigate, term)
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </form>
            <div className="pm-hero-actions" aria-label="Primary actions">
              <Link to="/register" className="btn btn-primary pm-btn pm-btn-primary">
                <i className="ph-duotone ph-rocket-launch" aria-hidden="true" />
                <span>{PUBLIC_CTA.registrationPreview}</span>
              </Link>
              <Link to="/find" className="btn btn-secondary pm-btn pm-btn-secondary">
                <i className="ph-duotone ph-magnifying-glass" aria-hidden="true" />
                <span>Explore marketplace</span>
              </Link>
            </div>
            <div className="pm-trust-row" aria-label="Platform focus">
              <span>
                <strong>3D/BIM</strong> design services
              </span>
              <span>
                <strong>Consortium</strong> formation
              </span>
              <span>
                <strong>Deal</strong> workflow
              </span>
            </div>
          </div>

          <motion.div
            className="pm-hero-visual"
            aria-label="3D project collaboration preview"
            ref={visualRef}
            {...(!reducedMotion ? heroVisualFloat : {})}
          >
            <div className="pm-cad-toolbar">
              <span />
              <span />
              <span />
              <strong>BIM Coordination</strong>
            </div>
            <div className="pm-model-stage">
              <div className="pm-model-shadow" />
              <div className="pm-building pm-building-a">
                <span className="pm-face pm-face-front" />
                <span className="pm-face pm-face-side" />
                <span className="pm-face pm-face-top" />
              </div>
              <div className="pm-building pm-building-b">
                <span className="pm-face pm-face-front" />
                <span className="pm-face pm-face-side" />
                <span className="pm-face pm-face-top" />
              </div>
              <div className="pm-building pm-building-c">
                <span className="pm-face pm-face-front" />
                <span className="pm-face pm-face-side" />
                <span className="pm-face pm-face-top" />
              </div>
              <div className="pm-road pm-road-main" />
              <div className="pm-road pm-road-cross" />
              <div className="pm-site-pin pm-site-pin-a">
                <i className="ph-duotone ph-buildings" aria-hidden="true" />
              </div>
              <div className="pm-site-pin pm-site-pin-b">
                <i className="ph-duotone ph-crane" aria-hidden="true" />
              </div>
            </div>
            <div className="pm-match-panel pm-match-panel-left">
              <span className="pm-panel-label">Need</span>
              <strong>Mixed-use tower</strong>
              <small>Design lead + MEP + PM</small>
            </div>
            <div className="pm-match-panel pm-match-panel-right">
              <span className="pm-panel-label">Match</span>
              <strong>92%</strong>
              <small>BIM coordination ready</small>
            </div>
            <div className="pm-model-status">
              <span />
              Live project twin
            </div>
          </motion.div>
        </div>
      </section>

      <MarketingReveal className="pm-metrics" aria-label="Platform highlights">
        <div className="pm-container pm-metrics-grid">
          <article>
            <strong>3D + BIM</strong>
            <span>Architectural design, visualization, coordination, and clash detection.</span>
          </article>
          <article>
            <strong>Multi-party deals</strong>
            <span>
              Build consortiums with design, construction, finance, and equipment roles.
            </span>
          </article>
          <article>
            <strong>Value exchange</strong>
            <span>Support cash, barter, equity, profit sharing, and hybrid proposals.</span>
          </article>
        </div>
      </MarketingReveal>

      <MarketingReveal className="pm-process" aria-labelledby="pm-process-title">
        <div className="pm-container pm-split">
          <div>
            <p className="pm-section-kicker">Project flow</p>
            <h2 id="pm-process-title">From model intent to signed collaboration.</h2>
            <p className="pm-section-copy">
              {PUBLIC_BRAND_NAME} turns design and construction needs into structured opportunities, compares them
              with verified people and companies, then carries the relationship into negotiation and
              contract execution.
            </p>
            <Link to="/workflow" className="pm-text-link">
              <span>See how it works</span>
              <i className="ph-duotone ph-arrow-right" aria-hidden="true" />
            </Link>
          </div>
          <div className="pm-flow-board" aria-label={`${PUBLIC_BRAND_NAME} workflow`}>
            <div className="pm-flow-step is-active">
              <i className="ph-duotone ph-pencil-ruler" aria-hidden="true" />
              <span>Define scope</span>
              <strong>Design, BIM, site, budget</strong>
            </div>
            <div className="pm-flow-step">
              <i className="ph-duotone ph-graph" aria-hidden="true" />
              <span>Match partners</span>
              <strong>Skills, value, timeline</strong>
            </div>
            <div className="pm-flow-step">
              <i className="ph-duotone ph-handshake" aria-hidden="true" />
              <span>Negotiate</span>
              <strong>Cash, barter, hybrid</strong>
            </div>
            <div className="pm-flow-step">
              <i className="ph-duotone ph-file-text" aria-hidden="true" />
              <span>Contract</span>
              <strong>Deal record and status</strong>
            </div>
          </div>
        </div>
      </MarketingReveal>

      <MarketingReveal className="pm-audience" aria-labelledby="pm-audience-title">
        <div className="pm-container">
          <div className="pm-section-head">
            <p className="pm-section-kicker">Who it is for</p>
            <h2 id="pm-audience-title">
              A market surface for teams that design, build, and deliver.
            </h2>
          </div>
          <div className="pm-card-grid">
            <article className="pm-card">
              <i className="ph-duotone ph-cube" aria-hidden="true" />
              <h3>Design and BIM studios</h3>
              <p>
                Offer architecture, 3D visualization, BIM modeling, MEP design, and coordination
                packages.
              </p>
            </article>
            <article className="pm-card">
              <i className="ph-duotone ph-hard-hat" aria-hidden="true" />
              <h3>Contractors and suppliers</h3>
              <p>
                Join tenders, provide site execution, share equipment, or contribute construction
                material capacity.
              </p>
            </article>
            <article className="pm-card">
              <i className="ph-duotone ph-compass-tool" aria-hidden="true" />
              <h3>Consultants and PM teams</h3>
              <p>
                Match planning, supervision, sustainability, legal, finance, and project management
                capabilities.
              </p>
            </article>
          </div>
        </div>
      </MarketingReveal>

      <MarketingReveal className="pm-models" aria-labelledby="pm-models-title">
        <div className="pm-container">
          <div className="pm-section-head pm-section-head-row">
            <div>
              <p className="pm-section-kicker">Collaboration models</p>
              <h2 id="pm-models-title">Choose the structure that fits the opportunity.</h2>
            </div>
            <Link to="/collaboration-wizard" className="pm-text-link">
              <span>{PUBLIC_CTA.guidedModelSelector}</span>
              <i className="ph-duotone ph-magic-wand" aria-hidden="true" />
            </Link>
          </div>
          <div className="pm-model-grid">
            <article>
              <span>01</span>
              <h3>Project-based</h3>
              <p>Tasks, consortiums, joint ventures, and SPVs for defined project packages.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Strategic</h3>
              <p>Long-term alliances, mentorship, and strategic joint venture relationships.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Resource pooling</h3>
              <p>Equipment sharing, resource exchange, and bulk purchasing opportunities.</p>
            </article>
            <article>
              <span>04</span>
              <h3>Hiring and RFPs</h3>
              <p>Professional hiring, consultant engagement, design contests, and competitions.</p>
            </article>
          </div>
        </div>
      </MarketingReveal>

      <MarketingTrustBand />

      <MarketingReveal className="pm-cta" aria-labelledby="pm-cta-title">
        <div className="pm-container pm-cta-inner">
          <div>
            <p className="pm-section-kicker">Ready for the next package?</p>
            <h2 id="pm-cta-title">
              Bring your design, construction, and partner search into {PUBLIC_BRAND_NAME}.
            </h2>
          </div>
          <Link to="/register" className="btn btn-primary pm-btn pm-btn-primary">
            <i className="ph-duotone ph-user-plus" aria-hidden="true" />
            <span>{PUBLIC_CTA.registrationPreview}</span>
          </Link>
        </div>
      </MarketingReveal>
    </div>
  )
}
