import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PocHtmlBlock } from '@/components/public/poc-html-block'
import { KbFaqPanel } from '@/components/public/kb-faq-panel'
import { useMarketingMotion } from '@/components/marketing/marketing-motion'
import { parseKbFaqItems } from '@/lib/kb-faq-content'
import { getPocSectionHtml } from '@/lib/poc-site-content'

const KB_HERO = getPocSectionHtml('knowledge-base', 'hero')
const KB_SIDEBAR = getPocSectionHtml('knowledge-base', 'sidebar')
const KB_PANELS = {
  models: getPocSectionHtml('knowledge-base', 'panel-models'),
  spv: getPocSectionHtml('knowledge-base', 'panel-spv'),
  faq: getPocSectionHtml('knowledge-base', 'panel-faq'),
} as const

type KbTab = keyof typeof KB_PANELS

const TABS: { id: KbTab; label: string; icon: string }[] = [
  { id: 'models', label: 'Collaboration Models', icon: 'ph-stack' },
  { id: 'spv', label: 'SPV & Legal', icon: 'ph-buildings' },
  { id: 'faq', label: 'FAQ', icon: 'ph-question' },
]

export function LegacyKnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<KbTab>('models')
  const { tabPanel, reducedMotion } = useMarketingMotion()
  const faqItems = useMemo(() => parseKbFaqItems(KB_PANELS.faq), [])

  return (
    <div className="legacy-poc-page page-container knowledge-base-page pm-kb-page">
      <section className="kb-hero">
        <PocHtmlBlock html={KB_HERO} />
      </section>

      <div className="page-body kb-body">
        <aside className="kb-sidebar" aria-label="Knowledge categories">
          <PocHtmlBlock html={KB_SIDEBAR} />
        </aside>

        <main className="kb-main">
          <div className="kb-tabs" role="tablist" aria-label="Knowledge base sections">
            {TABS.map((tab) => {
              const selected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`kb-tab-${tab.id}`}
                  className={`kb-tab${selected ? ' kb-tab-active' : ''}`}
                  aria-selected={selected}
                  aria-controls={`kb-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={`ph-duotone ${tab.icon}`} aria-hidden="true" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="kb-panels-host">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                id={`kb-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`kb-tab-${activeTab}`}
                className="kb-panel kb-panel-active kb-panel-motion"
                initial={reducedMotion ? false : 'hidden'}
                animate="visible"
                exit="exit"
                variants={tabPanel}
              >
                {activeTab === 'faq' ? (
                  <KbFaqPanel items={faqItems} />
                ) : (
                  <PocHtmlBlock html={KB_PANELS[activeTab]} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
