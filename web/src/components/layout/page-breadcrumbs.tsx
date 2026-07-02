import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { buildBreadcrumbLabels } from '@/lib/breadcrumb-display'
import { pmResponsive } from '@/tokens'
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
  return buildBreadcrumbLabels(pathname)
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
      <BreadcrumbList className={cn('max-w-full flex-nowrap', pmResponsive.scrollX)}>
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
