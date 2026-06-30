import { APP_NAME, routeLabels } from '@/config/navigation'

export function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export type WorkspaceContext = {
  title: string
  subtitle: string
  homeHref: string
  isAdmin: boolean
}

export function resolveWorkspaceContext(
  pathname: string,
  options: {
    isCompanyUser: boolean
    isAdminArea: boolean
  },
): WorkspaceContext {
  const dashboardHref = options.isCompanyUser
    ? '/company-dashboard'
    : '/dashboard'

  if (options.isAdminArea || pathname.startsWith('/admin')) {
    return {
      title: `${APP_NAME} Admin`,
      subtitle: 'Platform operations',
      homeHref: '/admin',
      isAdmin: true,
    }
  }

  if (pathname === '/dashboard' || pathname === '/company-dashboard') {
    return {
      title: options.isCompanyUser ? 'Company workspace' : 'Workspace',
      subtitle: APP_NAME,
      homeHref: dashboardHref,
      isAdmin: false,
    }
  }

  const segments = pathname.split('/').filter(Boolean)
  const last = segments[segments.length - 1]
  const sectionKey = segments[0]
  const sectionLabel =
    routeLabels[sectionKey] ??
    sectionKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const pageLabel =
    last && last !== sectionKey
      ? routeLabels[last] ??
        last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : sectionLabel

  return {
    title: pageLabel,
    subtitle: sectionLabel,
    homeHref: dashboardHref,
    isAdmin: false,
  }
}

export function resolveBreadcrumbHomeHref(
  pathname: string,
  isCompanyUser: boolean,
): string {
  if (pathname.startsWith('/admin')) return '/admin'
  return isCompanyUser ? '/company-dashboard' : '/dashboard'
}
