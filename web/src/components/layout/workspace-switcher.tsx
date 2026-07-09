import { Link, useLocation } from 'react-router-dom'
import { ChevronsUpDown, ShieldCheck, Zap } from 'lucide-react'
import { APP_NAME } from '@/config/navigation'
import { resolveWorkspaceContext } from '@/components/layout/workspace-display'
import { useAuth } from '@/providers/auth-provider'
import { PmButton } from '@/components/ui/pm-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'

type WorkspaceSwitcherProps = {
  collapsed?: boolean
  className?: string
}

/** Visual workspace switcher — single workspace today; multi-tenant placeholder. */
export function WorkspaceSwitcher({
  collapsed = false,
  className,
}: WorkspaceSwitcherProps) {
  const { pathname } = useLocation()
  const { isCompanyUser, canAccessAdmin } = useAuth()
  const isAdminArea = pathname.startsWith('/admin') && canAccessAdmin
  const workspace = resolveWorkspaceContext(pathname, {
    isCompanyUser,
    isAdminArea,
  })
  const dashboardHref = isCompanyUser ? '/company-dashboard' : '/dashboard'
  const Icon = workspace.isAdmin ? ShieldCheck : Zap

  if (collapsed) {
    return (
      <PmButton
        variant="ghost"
        size="icon"
        className={cn('size-8 shrink-0', className)}
        asChild
        aria-label={`${workspace.title} workspace`}
      >
        <Link to={workspace.homeHref}>
          <Icon className="size-4" aria-hidden />
        </Link>
      </PmButton>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PmButton
          variant="ghost"
          className={cn(
            'h-auto w-full cursor-pointer justify-start gap-2 px-2 py-2',
            'group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0',
            className,
          )}
          aria-label="Switch workspace"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="grid min-w-0 flex-1 text-start leading-tight group-data-[collapsible=icon]:hidden">
            <span className={cn(pmTypography.bodySm, 'truncate font-semibold tracking-tight')}>
              {workspace.isAdmin ? `${APP_NAME} Admin` : APP_NAME}
            </span>
            <span className={cn(pmTypography.caption, 'truncate')}>
              {workspace.subtitle}
            </span>
          </span>
          <ChevronsUpDown
            className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden"
            aria-hidden
          />
        </PmButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className={pmTypography.caption}>
          Workspaces
        </DropdownMenuLabel>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link to={dashboardHref}>
            <Zap className="size-4" aria-hidden />
            {isCompanyUser ? 'Company workspace' : 'Personal workspace'}
          </Link>
        </DropdownMenuItem>
        {canAccessAdmin ? (
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link to="/admin">
              <ShieldCheck className="size-4" aria-hidden />
              Admin workspace
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className={pmTypography.caption}>
          More workspaces — coming soon
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
