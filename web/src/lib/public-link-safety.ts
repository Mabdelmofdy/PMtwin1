/** Strip workspace/admin deep links from public marketing HTML for anonymous visitors. */
const ANONYMOUS_BLOCKED_PREFIXES = [
  '/admin',
  '/contracts',
  '/deals',
  '/negotiations',
  '/pipeline',
  '/opportunities/create',
] as const

export function isAnonymousBlockedHref(href: string): boolean {
  return ANONYMOUS_BLOCKED_PREFIXES.some((prefix) => href.startsWith(prefix))
}

export function sanitizeAnonymousPublicLinks(root: HTMLElement | null): void {
  if (!root) return

  root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? ''
    if (isAnonymousBlockedHref(href)) {
      anchor.remove()
      return
    }
    if (href === '/register' && /register/i.test(anchor.textContent ?? '')) {
      anchor.textContent = 'Registration preview'
    }
    if (href === '/collaboration-wizard' && /wizard/i.test(anchor.textContent ?? '')) {
      anchor.textContent = 'Guided model selector'
    }
  })
}
