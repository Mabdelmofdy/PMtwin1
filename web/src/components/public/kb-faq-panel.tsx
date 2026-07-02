import { useMemo, useState } from 'react'
import { filterKbFaqItems, type KbFaqItem } from '@/lib/kb-faq-content'

type KbFaqPanelProps = {
  items: KbFaqItem[]
}

export function KbFaqPanel({ items }: KbFaqPanelProps) {
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null)

  const filtered = useMemo(() => filterKbFaqItems(items, query), [items, query])

  const onToggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id))
  }

  return (
    <div className="kb-faq-panel">
      <div className="kb-faq-search">
        <label htmlFor="kb-faq-search-input" className="sr-only">
          Search FAQ
        </label>
        <i className="ph-duotone ph-magnifying-glass" aria-hidden="true" />
        <input
          id="kb-faq-search-input"
          type="search"
          className="kb-faq-search-input"
          placeholder="Search questions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            className="kb-faq-search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <i className="ph-duotone ph-x" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="kb-faq-empty" role="status">
          No questions match your search. Try different keywords.
        </p>
      ) : (
        <div className="kb-faq-accordion">
          {filtered.map((item) => {
            const expanded = openId === item.id
            const panelId = `${item.id}-panel`
            const triggerId = `${item.id}-trigger`
            return (
              <article key={item.id} className="kb-faq-accordion-item">
                <h3 className="kb-faq-accordion-heading">
                  <button
                    type="button"
                    id={triggerId}
                    className="kb-faq-accordion-trigger"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => onToggle(item.id)}
                  >
                    <span>{item.question}</span>
                    <i
                      className={`ph-duotone ph-caret-${expanded ? 'up' : 'down'}`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="kb-faq-accordion-panel"
                  hidden={!expanded}
                >
                  <div
                    className="kb-answer"
                    dangerouslySetInnerHTML={{ __html: item.answerHtml }}
                  />
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
