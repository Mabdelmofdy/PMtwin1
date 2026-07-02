/** Public marketing navigation — shared by header, mobile menu, and footer. */

export const PUBLIC_HEADER_NAV = [
  { href: '/features', label: 'Features' },
  { href: '/find', label: 'Find' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/workflow', label: 'How it works' },
] as const

/** Additional links for mobile drawer and footer — keeps header uncluttered. */
export const PUBLIC_SECONDARY_NAV = [
  { href: '/knowledge-base', label: 'Knowledge Base' },
  { href: '/collaboration-models', label: 'Collaboration models' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

/** @deprecated Use PUBLIC_HEADER_NAV — kept for tests referencing legacy export name. */
export const PUBLIC_NAV_LINKS = PUBLIC_HEADER_NAV

export const PUBLIC_FOOTER_EXPLORE = [
  { href: '/', label: 'Home' },
  ...PUBLIC_HEADER_NAV,
  ...PUBLIC_SECONDARY_NAV.filter((l) => l.href !== '/about' && l.href !== '/contact'),
] as const

export const PUBLIC_FOOTER_COMPANY = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/features', label: 'Features' },
  { href: '/privacy', label: 'Privacy (draft)' },
  { href: '/terms', label: 'Terms (draft)' },
] as const

export const PUBLIC_TAGLINE =
  'Built environment collaboration for companies and professionals across the GCC.'
