import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { evaluateAdminRouteAccess } from '@/domain/rbac/admin-route-access.ts'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

export function AdminRouteGuard() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  const decision = evaluateAdminRouteAccess({
    isLoading,
    isAuthenticated,
    userRole: user?.role,
  })

  if (decision === 'loading') {
    return (
      <div className="space-y-4 p-8">
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
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Access denied</h1>
      <p className="text-sm text-muted-foreground">
        You do not have permission to view this area. Admin access requires an
        authorized platform role.
      </p>
      {from ? (
        <p className="text-xs text-muted-foreground">
          Blocked path: <span className="font-mono">{from}</span>
        </p>
      ) : null}
      <Button className="cursor-pointer" asChild>
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  )
}
