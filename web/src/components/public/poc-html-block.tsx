import { normalizePocHtml } from '@/lib/poc-site-content'

type PocHtmlBlockProps = {
  html: string
  className?: string
}

export function PocHtmlBlock({ html, className }: PocHtmlBlockProps) {
  if (!html) return null
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: normalizePocHtml(html) }}
    />
  )
}
