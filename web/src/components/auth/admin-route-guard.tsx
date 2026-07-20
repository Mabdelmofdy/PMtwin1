import { useEffect, useRef } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { evaluateAdminRouteAccess } from '@/domain/rbac/admin-route-access.ts'
import { PmButton, PmPage, PmPageHeader } from '@/components/ui/pm-index'
import { Skeleton } from '@/components/ui/skeleton'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'

export function AdminRouteGuard() {
  const {
    isAuthenticated,
    isLoading,
    user,
    platformContextActive,
    enterPlatformContext,
  } = useAuth()
  const location = useLocation()
  const activatedRef = useRef(false)

  const decision = evaluateAdminRouteAccess({
    isLoading,
    isAuthenticated,
    userRole: user?.role,
    pathname: location.pathname,
  })

  useEffect(() => {
    if (decision !== 'allow' || platformContextActive || !user) return
    if (activatedRef.current) return
    activatedRef.current = true
    try {
      enterPlatformContext()
    } catch (error) {
      activatedRef.current = false
      console.error('Failed to enter platform context', error)
    }
  }, [decision, platformContextActive, user, enterPlatformContext])

  if (decision === 'loading') {
    return (
      <div
        className="space-y-4 p-8"
        role="status"
        aria-busy="true"
        aria-label="Loading admin workspace"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (decision === 'redirect-login') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (decision === 'access-denied') {
    return <Navigate to="/access-denied" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function AccessDeniedPage() {
  const location = useLocation()
  const from =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : null

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Access"
          title="Access denied"
          description="You do not have permission to view this area. Admin access requires an authorized platform role."
        />
      }
    >
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-8 text-center">
        {from ? (
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Blocked path: <span className={pmTypography.mono}>{from}</span>
          </p>
        ) : null}
        <PmButton className="cursor-pointer" asChild>
          <Link to="/dashboard">Back to dashboard</Link>
        </PmButton>
      </div>
    </PmPage>
  )
}
