import { Link } from 'react-router-dom'
import { PUBLIC_BRAND_NAME } from '@/lib/public-brand'
import {
  MarketingHero,
  MarketingSection,
  MarketingButton,
} from '@/components/marketing/marketing-index'
import { PUBLIC_CTA } from '@/config/public-marketing'

const DRAFT_NOTICE =
  'Draft policy — final legal review required. This document is for preview purposes only and does not constitute legal advice or a binding commitment.'

export function PrivacyPage() {
  return (
    <div className="legacy-poc-page mkt-page mkt-legal-page">
      <MarketingHero
        centered
        compact
        eyebrow={
          <>
            <i className="ph-duotone ph-shield-check" aria-hidden="true" />
            Privacy
          </>
        }
        title="Privacy principles (draft)"
        subtitle={DRAFT_NOTICE}
      />

      <MarketingSection animate={false}>
        <article className="mkt-legal-article">
          <h2>Overview</h2>
          <p>
            {PUBLIC_BRAND_NAME} is being built as a collaboration platform for the built environment
            in Saudi Arabia and the GCC. This draft describes high-level privacy principles intended
            to guide product design — not a final PDPL compliance statement.
          </p>

          <h2>Data we may process</h2>
          <ul>
            <li>Account and profile information for companies and professionals</li>
            <li>Opportunity, match, negotiation, and contract workflow data</li>
            <li>Technical logs required to operate and secure the service</li>
          </ul>

          <h2>Principles (non-binding draft)</h2>
          <ul>
            <li>Collect only what is needed for the stated collaboration purpose</li>
            <li>Provide role-based access within multi-party workflows</li>
            <li>Support user requests regarding access and correction where applicable law requires</li>
            <li>Apply security controls appropriate to a B2B SaaS platform</li>
          </ul>

          <h2>Not covered in this draft</h2>
          <p>
            Data processing agreements, subprocessors, retention schedules, cross-border transfer
            terms, and PDPL-specific notices will be published after legal review.
          </p>

          <p className="mkt-legal-updated">Last updated: preview draft — 2026</p>
        </article>
      </MarketingSection>

      <div className="mkt-legal-footer-links">
        <Link to="/terms">Terms of use (draft)</Link>
        <MarketingButton to="/contact" variant="ghost">
          {PUBLIC_CTA.contactSales}
        </MarketingButton>
      </div>
    </div>
  )
}

export function TermsPage() {
  return (
    <div className="legacy-poc-page mkt-page mkt-legal-page">
      <MarketingHero
        centered
        compact
        eyebrow={
          <>
            <i className="ph-duotone ph-scroll" aria-hidden="true" />
            Terms
          </>
        }
        title="Terms of use (draft)"
        subtitle={DRAFT_NOTICE}
      />

      <MarketingSection animate={false}>
        <article className="mkt-legal-article">
          <h2>Preview terms</h2>
          <p>
            These draft terms describe how the {PUBLIC_BRAND_NAME} preview may be used during pilot
            and evaluation. A binding agreement will be provided before commercial launch.
          </p>

          <h2>Acceptable use (draft)</h2>
          <ul>
            <li>Use the platform for legitimate built-environment collaboration purposes</li>
            <li>Do not misrepresent identity, credentials, or opportunity details</li>
            <li>Do not attempt to disrupt, scrape, or reverse engineer the service</li>
            <li>Respect confidentiality of other parties in negotiations and contracts</li>
          </ul>

          <h2>No warranties in preview</h2>
          <p>
            The preview is provided as-is for evaluation. Availability, features, and data handling
            may change without notice until general availability.
          </p>

          <h2>Limitation (draft)</h2>
          <p>
            Liability limits, governing law, dispute resolution, and service-level terms will be
            defined in the final commercial agreement.
          </p>

          <p className="mkt-legal-updated">Last updated: preview draft — 2026</p>
        </article>
      </MarketingSection>

      <div className="mkt-legal-footer-links">
        <Link to="/privacy">Privacy principles (draft)</Link>
        <MarketingButton to="/contact" variant="ghost">
          {PUBLIC_CTA.contactSales}
        </MarketingButton>
      </div>
    </div>
  )
}
