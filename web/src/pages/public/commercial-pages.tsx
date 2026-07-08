import { Link } from 'react-router-dom'
import { PUBLIC_CTA, PUBLIC_CONTACT } from '@/config/public-marketing'
import { PUBLIC_BRAND_NAME } from '@/lib/public-brand'
import {
  isMailtoHref,
  resolveContactHref,
  resolvePublicContactChannel,
} from '@/lib/public-contact'
import {
  MarketingButton,
  MarketingCard,
  MarketingCtaBand,
  MarketingHero,
  MarketingSection,
  useMarketingMotion,
} from '@/components/marketing/marketing-index'
import { motion } from 'framer-motion'

const FEATURES = [
  {
    id: '01',
    icon: 'ph-duotone ph-megaphone',
    title: 'Opportunity publishing',
    body: 'Publish Needs and Offers with scope, location, and collaboration model so the right partners can discover your work.',
  },
  {
    id: '02',
    icon: 'ph-duotone ph-user-circle',
    title: 'Profile readiness',
    body: 'Company and professional profiles surface skills, sectors, and capacity — the inputs partners review before engaging.',
  },
  {
    id: '03',
    icon: 'ph-duotone ph-graph',
    title: 'Matching readiness',
    body: 'Structured opportunity data supports compatibility scoring and ranked partner suggestions when matching runs.',
  },
  {
    id: '04',
    icon: 'ph-duotone ph-handshake',
    title: 'PostMatch-first collaboration',
    body: 'Relationships advance through accepted matches — keeping collaboration tied to mutual interest, not cold outreach alone.',
  },
  {
    id: '05',
    icon: 'ph-duotone ph-chats-circle',
    title: 'Negotiation',
    body: 'Carry terms forward with support for cash, barter, hybrid, and multi-party proposals in a structured negotiation flow.',
  },
  {
    id: '06',
    icon: 'ph-duotone ph-file-text',
    title: 'Commercial agreement & contract lifecycle',
    body: 'Move from agreed terms into commercial agreement records and contract status — aligned to a clear operational sequence.',
  },
  {
    id: '07',
    icon: 'ph-duotone ph-magnifying-glass',
    title: 'Marketplace discovery',
    body: 'Search people, companies, and published opportunities across the built-environment network before you commit.',
  },
] as const

const CONTACT_CHANNEL = resolvePublicContactChannel(PUBLIC_CONTACT)

const PRICING_TIERS = [
  {
    name: 'Pilot',
    summary: 'For teams evaluating PM-Twin on a focused package or consortium workflow.',
    points: ['Guided onboarding', 'Core marketplace access', 'Workflow preview'],
    cta: {
      label: PUBLIC_CTA.contactSales,
      href: resolveContactHref(CONTACT_CHANNEL, 'pricing'),
    },
    highlighted: false,
  },
  {
    name: 'Team',
    summary: 'For companies coordinating multiple opportunities, matches, and negotiations.',
    points: ['Multi-user workspace', 'Pipeline visibility', 'Collaboration models'],
    cta: {
      label: PUBLIC_CTA.contactSales,
      href: resolveContactHref(CONTACT_CHANNEL, 'pricing'),
    },
    highlighted: true,
  },
  {
    name: 'Enterprise',
    summary: 'For organizations with governance, vetting, or integration requirements.',
    points: ['Custom rollout planning', 'Admin and vetting workflows', 'Dedicated support path'],
    cta: {
      label: PUBLIC_CTA.contactSales,
      href: resolveContactHref(CONTACT_CHANNEL, 'pricing'),
    },
    highlighted: false,
  },
] as const

export function FeaturesPage() {
  const { staggerContainer, viewport } = useMarketingMotion()

  return (
    <div className="legacy-poc-page mkt-page">
      <MarketingHero
        centered
        eyebrow={
          <>
            <i className="ph-duotone ph-squares-four" aria-hidden="true" />
            Platform capabilities
          </>
        }
        title={`What ${PUBLIC_BRAND_NAME} helps your team do`}
        subtitle="From publishing an opportunity to signing a collaboration — one structured path for built-environment teams."
        actions={
          <>
            <MarketingButton to="/find" variant="primary">
              {PUBLIC_CTA.exploreMarketplace}
            </MarketingButton>
            <MarketingButton to="/workflow" variant="secondary">
              See how it works
            </MarketingButton>
          </>
        }
      />

      <MarketingSection
        eyebrow="Capabilities"
        title="End-to-end collaboration, presented clearly"
        subtitle="High-level capabilities available in the PM-Twin workspace. No backend implementation detail — just what teams can expect to work toward."
      >
        <motion.div
          className="mkt-card-grid mkt-card-grid--models"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={staggerContainer}
        >
          {FEATURES.map((feature) => (
            <MarketingCard
              key={feature.id}
              asStaggerItem
              index={feature.id}
              title={feature.title}
              icon={<i className={feature.icon} />}
            >
              <p>{feature.body}</p>
            </MarketingCard>
          ))}
        </motion.div>
      </MarketingSection>

      <MarketingCtaBand
        eyebrow="See it in context"
        title="Explore the marketplace or sign in to the demo workspace."
        actions={
          <>
            <MarketingButton to="/find" variant="primary">
              {PUBLIC_CTA.exploreMarketplace}
            </MarketingButton>
            <MarketingButton to="/login" variant="secondary">
              {PUBLIC_CTA.signInDemo}
            </MarketingButton>
          </>
        }
      />
    </div>
  )
}

export function PricingPage() {
  const { staggerContainer, viewport } = useMarketingMotion()

  return (
    <div className="legacy-poc-page mkt-page">
      <MarketingHero
        centered
        eyebrow={
          <>
            <i className="ph-duotone ph-credit-card" aria-hidden="true" />
            Plans
          </>
        }
        title="Honest pricing for pilot and enterprise teams"
        subtitle="We are not publishing subscription amounts yet. Talk to us about a pilot, team rollout, or enterprise plan that fits your workflow."
        description="All plans below are indicative structures — final terms are agreed during onboarding."
      />

      <MarketingSection
        eyebrow="Plan types"
        title="Choose a starting point"
        subtitle="No fabricated prices. Contact us to discuss scope, seats, and rollout."
      >
        <motion.div
          className="mkt-pricing-grid"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={staggerContainer}
        >
          {PRICING_TIERS.map((tier) => (
            <MarketingCard
              key={tier.name}
              asStaggerItem
              title={tier.name}
              className={tier.highlighted ? 'mkt-pricing-card--highlight' : undefined}
            >
              <p>{tier.summary}</p>
              <ul className="mkt-pricing-points">
                {tier.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <div className="mkt-pricing-cta">
                {isMailtoHref(tier.cta.href) ? (
                  <a
                    href={tier.cta.href}
                    className={`mkt-btn ${tier.highlighted ? 'mkt-btn-primary' : 'mkt-btn-secondary'}`}
                  >
                    {tier.cta.label}
                  </a>
                ) : (
                  <MarketingButton
                    to={tier.cta.href}
                    variant={tier.highlighted ? 'primary' : 'secondary'}
                  >
                    {tier.cta.label}
                  </MarketingButton>
                )}
              </div>
            </MarketingCard>
          ))}
        </motion.div>

        <p className="mkt-pricing-note" role="note">
          Subscription details in the admin area are for internal preview only and are not shown here.
        </p>
      </MarketingSection>

      <MarketingCtaBand
        eyebrow="Next step"
        title="Prefer to explore before talking to sales?"
        description="Use demo sign-in to walk through opportunities, matches, and pipeline views."
        actions={
          <>
            <MarketingButton to="/login" variant="primary">
              {PUBLIC_CTA.signInDemo}
            </MarketingButton>
            {isMailtoHref(resolveContactHref(CONTACT_CHANNEL, 'sales')) ? (
              <a
                href={resolveContactHref(CONTACT_CHANNEL, 'sales')}
                className="mkt-btn mkt-btn-secondary"
              >
                {PUBLIC_CTA.contactSales}
              </a>
            ) : (
              <MarketingButton to="/contact" variant="secondary">
                {PUBLIC_CTA.contactSales}
              </MarketingButton>
            )}
            <MarketingButton to="/register" variant="ghost">
              {PUBLIC_CTA.registrationPreview}
            </MarketingButton>
          </>
        }
      />
    </div>
  )
}

export function AboutPage() {
  return (
    <div className="legacy-poc-page mkt-page">
      <MarketingHero
        centered
        eyebrow={
          <>
            <i className="ph-duotone ph-buildings" aria-hidden="true" />
            About
          </>
        }
        title={`${PUBLIC_BRAND_NAME} connects built-environment teams`}
        subtitle="A construction collaboration platform for Saudi Arabia and the GCC — marketplace discovery, structured collaboration models, and lifecycle management in one workspace."
      />

      <MarketingSection
        eyebrow="Our focus"
        title="Marketplace, collaboration, and lifecycle — together"
        subtitle="PM-Twin is designed for companies and professionals who design, build, and deliver projects — not as a generic directory, but as a commercial-agreement-ready collaboration surface."
      >
        <div className="mkt-about-grid">
          <article className="mkt-about-block">
            <h3>Marketplace</h3>
            <p>
              Discover professionals, companies, and published opportunities across BIM, design,
              construction, and related sectors.
            </p>
          </article>
          <article className="mkt-about-block">
            <h3>Collaboration</h3>
            <p>
              Choose collaboration models that fit each package — from cash subcontracting and barter
              to joint ventures and resource sharing.
            </p>
          </article>
          <article className="mkt-about-block">
            <h3>Lifecycle management</h3>
            <p>
              Carry relationships from match through negotiation, commercial agreement, and contract stages with a
              clear operational sequence.
            </p>
          </article>
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Region"
        title="Built for KSA and the GCC"
        subtitle="PM-Twin is positioned for built-environment collaboration in Saudi Arabia and neighbouring markets — with Arabic and RTL support planned for a future release."
      >
        <p className="mkt-about-copy">
          We are building toward full bilingual support. The public site currently runs in English;
          layout foundations are being prepared for right-to-left presentation when Arabic content
          ships.
        </p>
      </MarketingSection>

      <MarketingCtaBand
        eyebrow="Learn more"
        title="See capabilities, pricing approach, or get in touch."
        actions={
          <>
            <MarketingButton to="/features" variant="primary">
              {PUBLIC_CTA.viewFeatures}
            </MarketingButton>
            <MarketingButton to="/pricing" variant="secondary">
              View pricing approach
            </MarketingButton>
            <MarketingButton to="/contact" variant="ghost">
              {PUBLIC_CTA.contactSales}
            </MarketingButton>
          </>
        }
      />
    </div>
  )
}

export function ContactPage() {
  return (
    <div className="legacy-poc-page mkt-page">
      <MarketingHero
        centered
        eyebrow={
          <>
            <i className="ph-duotone ph-envelope-simple" aria-hidden="true" />
            Contact
          </>
        }
        title="Talk to us about pilots and enterprise rollout"
        subtitle="Direct inquiry channels for KSA and GCC teams are being finalized."
      />

      <MarketingSection animate={false}>
        <div className="mkt-contact-options-grid">
          <article className="mkt-contact-option-card">
            <i className="ph-duotone ph-briefcase" aria-hidden="true" />
            <h2>{PUBLIC_CTA.contactSales}</h2>
            <p>
              Discuss pilot programs, team rollout, or enterprise requirements with our team.
            </p>
            {CONTACT_CHANNEL.salesEmail ? (
              <a
                href={resolveContactHref(CONTACT_CHANNEL, 'sales')}
                className="mkt-btn mkt-btn-secondary"
              >
                Email sales
              </a>
            ) : (
              <p className="mkt-contact-channel-status" role="status">
                Sales contact channel — coming soon
              </p>
            )}
            <Link to="/pricing" className="mkt-text-link">
              View pricing approach
            </Link>
          </article>

          <article className="mkt-contact-option-card">
            <i className="ph-duotone ph-monitor-play" aria-hidden="true" />
            <h2>{PUBLIC_CTA.requestDemo}</h2>
            <p>
              Walk through opportunities, matches, and pipeline views using demo accounts on the
              sign-in page.
            </p>
            {CONTACT_CHANNEL.salesEmail ? (
              <a href={resolveContactHref(CONTACT_CHANNEL, 'demo')} className="mkt-btn mkt-btn-primary">
                {PUBLIC_CTA.requestDemo}
              </a>
            ) : (
              <MarketingButton to="/login" variant="primary">
                {PUBLIC_CTA.signInDemo}
              </MarketingButton>
            )}
          </article>

          <article className="mkt-contact-option-card">
            <i className="ph-duotone ph-currency-circle-dollar" aria-hidden="true" />
            <h2>Pricing inquiry</h2>
            <p>Discuss indicative plan structure, rollout scope, and onboarding approach.</p>
            {CONTACT_CHANNEL.salesEmail ? (
              <a href={resolveContactHref(CONTACT_CHANNEL, 'pricing')} className="mkt-btn mkt-btn-secondary">
                Email pricing inquiry
              </a>
            ) : (
              <Link to="/pricing" className="mkt-text-link">
                View pricing approach
              </Link>
            )}
          </article>

          <article className="mkt-contact-option-card">
            <i className="ph-duotone ph-magnifying-glass" aria-hidden="true" />
            <h2>{PUBLIC_CTA.exploreMarketplace}</h2>
            <p>
              Browse people, companies, and published opportunities without creating an account.
            </p>
            <MarketingButton to="/find" variant="secondary">
              {PUBLIC_CTA.exploreMarketplace}
            </MarketingButton>
          </article>
        </div>

        {PUBLIC_CONTACT.channelsComingSoon ? (
          <p className="mkt-contact-coming-soon" role="note">
            Online message submission is not available in this preview. We will not display a working
            contact form until a backend channel is connected.
          </p>
        ) : null}
      </MarketingSection>

      <MarketingCtaBand
        eyebrow="Registration"
        title="Full account creation is not open yet."
        description="Use the registration preview to see the planned signup journey, or sign in with a demo account today."
        actions={
          <>
            <MarketingButton to="/register" variant="primary">
              {PUBLIC_CTA.registrationPreview}
            </MarketingButton>
            <MarketingButton to="/features" variant="secondary">
              {PUBLIC_CTA.viewFeatures}
            </MarketingButton>
          </>
        }
      />
    </div>
  )
}
