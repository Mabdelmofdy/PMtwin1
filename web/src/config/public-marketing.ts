/** Public contact channels — no fake email unless explicitly configured. */
export const PUBLIC_CONTACT = {
  /** Set when a verified support address is approved for public display. */
  salesEmail: (import.meta.env.VITE_PUBLIC_SALES_EMAIL?.trim() || null) as string | null,
  channelsComingSoon: !(import.meta.env.VITE_PUBLIC_SALES_EMAIL?.trim() || null),
} as const

/** Public CTA labels — honest expectations for preview/stub flows. */
export const PUBLIC_CTA = {
  exploreMarketplace: 'Explore marketplace',
  signIn: 'Sign in',
  signInDemo: 'Sign in to demo workspace',
  registrationPreview: 'Registration preview',
  guidedModelSelector: 'Guided model selector',
  wizardPreview: 'Guided model selector',
  contactSales: 'Contact sales',
  requestDemo: 'Request demo',
  viewFeatures: 'View features',
  learnMore: 'Learn more',
} as const

/** Neutral trust band items — no fabricated metrics or logos. */
export const PUBLIC_TRUST_ITEMS = [
  {
    icon: 'ph-duotone ph-hard-hat',
    title: 'Built for construction teams',
    body: 'Architects, contractors, consultants, and suppliers in one collaboration surface.',
  },
  {
    icon: 'ph-duotone ph-shield-check',
    title: 'Security-minded design',
    body: 'Role-based access and workflow-aware permissions for multi-party commercial agreements.',
  },
  {
    icon: 'ph-duotone ph-globe-hemisphere-east',
    title: 'KSA & GCC ready',
    body: 'Positioned for built-environment collaboration across Saudi Arabia and the GCC.',
  },
  {
    icon: 'ph-duotone ph-lock-key',
    title: 'Privacy principles',
    body: 'Personal and company data handled with PDPL-aware practices in mind.',
  },
] as const

/** Locale placeholder — Arabic site not yet available. */
export const PUBLIC_LOCALE_NOTICE = 'العربية — coming soon'
