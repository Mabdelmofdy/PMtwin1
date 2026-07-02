import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PUBLIC_CTA } from '@/config/public-marketing'
import { PUBLIC_BRAND_NAME } from '@/lib/public-brand'
import {
  MarketingButton,
  MarketingCard,
  MarketingCtaBand,
  MarketingHero,
  MarketingSection,
  useMarketingMotion,
} from '@/components/marketing/marketing-index'
import { useAuth } from '@/providers/auth-provider'

const COLLABORATION_MODELS = [
  {
    id: '01',
    icon: 'ph-duotone ph-currency-circle-dollar',
    title: 'Cash Subcontracting',
    summary:
      'Traditional paid engagements where one party delivers defined scope for an agreed fee.',
    bestFor: 'Defined deliverables with clear payment milestones',
    exchange: 'Cash payment',
    risk: 'Contractor carries delivery risk within agreed scope',
  },
  {
    id: '02',
    icon: 'ph-duotone ph-arrows-left-right',
    title: 'Service Exchange / Barter',
    summary:
      'Parties trade services or resources of comparable value instead of cash — useful when liquidity is tight or complementary skills align.',
    bestFor: 'Complementary capabilities and mutual capacity swaps',
    exchange: 'In-kind services or resources',
    risk: 'Requires fair value alignment and clear scope boundaries',
  },
  {
    id: '03',
    icon: 'ph-duotone ph-handshake',
    title: 'Joint Venture',
    summary:
      'Shared delivery structure for a specific project or strategic objective — partners co-invest skills, governance, and outcomes.',
    bestFor: 'Multi-party packages, consortiums, and SPV-style collaborations',
    exchange: 'Shared contribution and profit/risk sharing',
    risk: 'Partners share governance and delivery accountability',
  },
  {
    id: '04',
    icon: 'ph-duotone ph-share-network',
    title: 'Resource Sharing',
    summary:
      'Pool equipment, specialist teams, or bulk purchasing capacity across projects to reduce idle cost and improve utilization.',
    bestFor: 'Equipment, specialist crews, and shared procurement',
    exchange: 'Shared access or pooled capacity',
    risk: 'Scheduling and availability coordination required',
  },
] as const

const COMPARISON_ROWS = [
  { label: 'Primary exchange', key: 'exchange' as const },
  { label: 'Ideal when', key: 'bestFor' as const },
  { label: 'Coordination focus', key: 'risk' as const },
]

function CollaborationModelsVisual() {
  return (
    <div className="mkt-models-visual" aria-hidden="true">
      <div className="mkt-models-stage">
        <span className="mkt-models-block mkt-models-block-a" />
        <span className="mkt-models-block mkt-models-block-b" />
        <span className="mkt-models-block mkt-models-block-c" />
        <span className="mkt-models-link mkt-models-link-a" />
        <span className="mkt-models-link mkt-models-link-b" />
      </div>
      <div className="mkt-models-float-card">
        <span className="mkt-models-float-label">Model fit</span>
        <strong>Cash · Barter · JV · Pool</strong>
        <small>Structured in {PUBLIC_BRAND_NAME} negotiations</small>
      </div>
    </div>
  )
}

export function CollaborationModelsPage() {
  const { isAuthenticated } = useAuth()
  const { staggerContainer, staggerItem, viewport } = useMarketingMotion()

  return (
    <div className="legacy-poc-page mkt-page mkt-collab-models-page">
      <MarketingHero
        centered
        eyebrow={
          <>
            <i className="ph-duotone ph-git-branch" aria-hidden="true" />
            Collaboration models
          </>
        }
        title="Structure value exchange before you post or apply."
        subtitle={`Four proven ways built-environment teams collaborate on ${PUBLIC_BRAND_NAME} — from cash subcontracting to pooled resources.`}
        description="Choose the model that matches your opportunity, then carry it through matching, negotiation, and contract execution in one workspace."
        visual={<CollaborationModelsVisual />}
        actions={
          <>
            <MarketingButton to="/find" variant="primary">
              <i className="ph-duotone ph-magnifying-glass" aria-hidden="true" />
              <span>Explore marketplace</span>
            </MarketingButton>
            <MarketingButton to="/knowledge-base" variant="secondary">
              <i className="ph-duotone ph-books" aria-hidden="true" />
              <span>Learn in Knowledge Base</span>
            </MarketingButton>
          </>
        }
      />

      <MarketingSection
        eyebrow="Core models"
        title="Four ways teams collaborate on built-environment work"
        subtitle={`Each model maps to how opportunities are structured, negotiated, and contracted on ${PUBLIC_BRAND_NAME}.`}
      >
        <motion.div
          className="mkt-card-grid mkt-card-grid--models"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={staggerContainer}
        >
          {COLLABORATION_MODELS.map((model) => (
            <MarketingCard
              key={model.id}
              asStaggerItem
              index={model.id}
              title={model.title}
              icon={<i className={model.icon} />}
            >
              <p>{model.summary}</p>
            </MarketingCard>
          ))}
        </motion.div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Compare at a glance"
        title="How the models differ"
        subtitle="Use this overview to align stakeholders before you publish a Need or respond to an Offer."
        wide
      >
        <div className="mkt-compare-table-wrap">
          <table className="mkt-compare-table">
            <caption className="sr-only">Collaboration model comparison</caption>
            <thead>
              <tr>
                <th scope="col">Dimension</th>
                {COLLABORATION_MODELS.map((model) => (
                  <th key={model.id} scope="col">
                    {model.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  {COLLABORATION_MODELS.map((model) => (
                    <td key={`${model.id}-${row.key}`}>{model[row.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <motion.div
          className="mkt-compare-cards"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={staggerContainer}
        >
          {COLLABORATION_MODELS.map((model) => (
            <motion.article key={model.id} className="mkt-compare-card" variants={staggerItem}>
              <h3>{model.title}</h3>
              <dl>
                {COMPARISON_ROWS.map((row) => (
                  <div key={row.key}>
                    <dt>{row.label}</dt>
                    <dd>{model[row.key]}</dd>
                  </div>
                ))}
              </dl>
            </motion.article>
          ))}
        </motion.div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Next step"
        title="Not sure which model fits?"
        subtitle="The Collaboration Wizard is being prepared. Until then, browse models here or read detailed guides in the Knowledge Base."
      >
        <div className="mkt-inline-cta">
          <MarketingButton to="/collaboration-wizard" variant="secondary">
            <i className="ph-duotone ph-magic-wand" aria-hidden="true" />
            <span>{PUBLIC_CTA.guidedModelSelector}</span>
          </MarketingButton>
          <Link to="/workflow" className="mkt-text-link">
            <span>See the full project lifecycle</span>
            <i className="ph-duotone ph-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </MarketingSection>

      <MarketingCtaBand
        eyebrow="Ready to collaborate"
        title="Find partners or sign in to manage your pipeline."
        description="Explore published opportunities and profiles, or access your workspace to post Needs and respond to matches."
        actions={
          <>
            <MarketingButton to="/find" variant="primary">
              Explore marketplace
            </MarketingButton>
            <MarketingButton to="/knowledge-base" variant="secondary">
              Knowledge Base
            </MarketingButton>
            {isAuthenticated ? (
              <MarketingButton to="/dashboard" variant="ghost">
                Go to dashboard
              </MarketingButton>
            ) : (
              <>
                <MarketingButton to="/login" variant="ghost">
                  Sign in
                </MarketingButton>
                <MarketingButton to="/register" variant="ghost">
                  {PUBLIC_CTA.registrationPreview}
                </MarketingButton>
              </>
            )}
          </>
        }
      />
    </div>
  )
}
