import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { routeLabels } from '@/config/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

function buildCrumbs(pathname: string) {
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

export function PageBreadcrumbs() {
  const { pathname } = useLocation()
  const crumbs = buildCrumbs(pathname)

  if (crumbs.length <= 1 && crumbs[0]?.isCurrent) {
    return null
  }

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              to="/dashboard"
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
                <BreadcrumbPage className="truncate font-medium">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    to={crumb.href}
                    className="cursor-pointer truncate transition-colors hover:text-foreground"
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
