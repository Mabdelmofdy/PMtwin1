import { loadSiteContent } from '@/infrastructure/seed/seed-loader.ts'

export function getPocSectionHtml(pageKey: string, sectionKey: string): string {
  const content = loadSiteContent()
  return content[pageKey]?.sections?.[sectionKey]?.html ?? ''
}

export function normalizePocHtml(html: string): string {
  return html
    .replace(/href="#" data-route="([^"]+)"/g, 'href="$1"')
    .replace(/\bPMTwin\b/g, 'PM-Twin')
}
