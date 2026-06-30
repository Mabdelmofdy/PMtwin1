import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { routeLabels } from '@/config/navigation'
import { resolveBreadcrumbHomeHref } from '@/components/layout/workspace-display'
import { useAuth } from '@/providers/auth-provider'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'

export function buildCrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) {
    return [{ label: 'Dashboard', href: '/dashboard', isCurrent: true }]
  }

  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`
    const label =
      routeLabels[segment] ??
      segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    return {
      label,
      href,
      isCurrent: index === segments.length - 1,
    }
  })
}

export function PageBreadcrumbs({ className }: { className?: string }) {
  const { pathname } = useLocation()
  const { isCompanyUser } = useAuth()
  const crumbs = buildCrumbs(pathname)
  const homeHref = resolveBreadcrumbHomeHref(pathname, isCompanyUser)

  if (crumbs.length <= 1 && crumbs[0]?.isCurrent) {
    return null
  }

  return (
    <Breadcrumb className={cn('min-w-0', className)}>
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              to={homeHref}
              className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb) => (
          <Fragment key={crumb.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.isCurrent ? (
                <BreadcrumbPage className="max-w-[12rem] truncate font-medium sm:max-w-xs">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    to={crumb.href}
                    className="max-w-[10rem] cursor-pointer truncate transition-colors hover:text-foreground sm:max-w-xs"
                  >
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
