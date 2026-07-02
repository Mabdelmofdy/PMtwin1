import { normalizePublicBrandCopy } from '@/lib/public-brand'
import { normalizePocHtml } from '@/lib/poc-site-content'

export type KbFaqItem = {
  id: string
  question: string
  answerHtml: string
}

function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Parse FAQ Q&A blocks from seed HTML — preserves content, normalizes brand. */
export function parseKbFaqItems(html: string): KbFaqItem[] {
  if (!html.trim()) return []

  const normalized = normalizePocHtml(html)
  const chunks = normalized.split(/<div class="kb-qa-item">/i).slice(1)

  return chunks
    .map((chunk, index) => {
      const questionMatch = chunk.match(/<h3 class="kb-question">([\s\S]*?)<\/h3>/i)
      const answerMatch = chunk.match(/<div class="kb-answer">([\s\S]*?)<\/div>/i)
      const questionRaw = questionMatch?.[1] ?? ''
      const answerRaw = answerMatch?.[1] ?? ''
      if (!questionRaw && !answerRaw) return null

      return {
        id: `kb-faq-${index + 1}`,
        question: normalizePublicBrandCopy(stripHtmlTags(questionRaw)),
        answerHtml: normalizePublicBrandCopy(answerRaw.trim()),
      }
    })
    .filter((item): item is KbFaqItem => item !== null)
}

export function filterKbFaqItems(items: KbFaqItem[], query: string): KbFaqItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter((item) => {
    const blob = `${item.question} ${stripHtmlTags(item.answerHtml)}`.toLowerCase()
    return blob.includes(q)
  })
}
