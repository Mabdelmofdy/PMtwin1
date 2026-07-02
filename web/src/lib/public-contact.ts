export type ContactIntent = 'sales' | 'demo' | 'pricing'

type PublicContactConfig = {
  salesEmail: string | null
}

export type PublicContactChannel = {
  salesEmail: string | null
  hasLiveEmailChannel: boolean
}

const SUBJECT_BY_INTENT: Record<ContactIntent, string> = {
  sales: 'PM-Twin sales inquiry',
  demo: 'PM-Twin demo request',
  pricing: 'PM-Twin pricing inquiry',
}

export function normalizeContactEmail(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? ''
  if (!normalized) return null
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  return isEmail ? normalized : null
}

export function resolvePublicContactChannel(
  config: PublicContactConfig,
): PublicContactChannel {
  const salesEmail = normalizeContactEmail(config.salesEmail)
  return {
    salesEmail,
    hasLiveEmailChannel: !!salesEmail,
  }
}

export function buildContactMailto(email: string, intent: ContactIntent): string {
  return `mailto:${email}?subject=${encodeURIComponent(SUBJECT_BY_INTENT[intent])}`
}

export function resolveContactHref(
  channel: PublicContactChannel,
  intent: ContactIntent,
): string {
  if (!channel.salesEmail) return '/contact'
  return buildContactMailto(channel.salesEmail, intent)
}

export function isMailtoHref(href: string): boolean {
  return href.startsWith('mailto:')
}
