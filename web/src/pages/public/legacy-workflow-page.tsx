import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PUBLIC_CTA } from '@/config/public-marketing'
import { PocHtmlBlock } from '@/components/public/poc-html-block'
import { useAuth } from '@/providers/auth-provider'
import { sanitizeAnonymousPublicLinks } from '@/lib/public-link-safety'
import { getPocSectionHtml } from '@/lib/poc-site-content'

const WORKFLOW_HERO = getPocSectionHtml('workflow', 'hero')
const WORKFLOW_STEPS = getPocSectionHtml('workflow', 'steps')

export function LegacyWorkflowPage() {
  const { isAuthenticated } = useAuth()
  const stepsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = stepsRef.current
    if (!root) return
    root.querySelectorAll('.workflow-step h2').forEach((heading) => {
      const h3 = document.createElement('h3')
      h3.innerHTML = heading.innerHTML
      heading.replaceWith(h3)
    })
    if (!isAuthenticated) {
      sanitizeAnonymousPublicLinks(root)
    }
  }, [isAuthenticated])

  return (
    <div className="legacy-poc-page page-container workflow-page pm-workflow-page">
      <section className="wf-hero">
        <PocHtmlBlock html={WORKFLOW_HERO} />
      </section>

      <section className="wf-body">
        <div ref={stepsRef} className="wf-steps-motion-host">
          <PocHtmlBlock html={WORKFLOW_STEPS} />
        </div>

        <section className="wf-next-steps wf-container" aria-labelledby="wf-next-steps-title">
          <h2 id="wf-next-steps-title">Next steps</h2>
          <p>
            {isAuthenticated
              ? 'Continue in your workspace or explore partners on the marketplace.'
              : 'Create an account to post opportunities, or explore the marketplace to discover partners.'}
          </p>
          <div className="wf-next-steps-actions">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-primary wf-btn-primary">
                  Open dashboard
                </Link>
                <Link to="/find" className="btn btn-secondary wf-btn-secondary">
                  Explore marketplace
                </Link>
                <Link to="/knowledge-base" className="btn btn-secondary wf-btn-secondary">
                  Knowledge Base
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary wf-btn-primary">
                  {PUBLIC_CTA.registrationPreview}
                </Link>
                <Link to="/find" className="btn btn-secondary wf-btn-secondary">
                  Explore marketplace
                </Link>
                <Link to="/login" className="btn btn-secondary wf-btn-secondary">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </section>
      </section>
    </div>
  )
}
