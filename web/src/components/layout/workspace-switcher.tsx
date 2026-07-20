import { useNavigate } from 'react-router-dom'
import { Building2, ChevronsUpDown, ShieldCheck, UserRound } from 'lucide-react'
import { APP_NAME } from '@/config/navigation'
import { useAuth } from '@/providers/auth-provider'
import { workspaceRepository } from '@/repositories/index.ts'
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

export function WorkspaceSwitcher({
  collapsed = false,
  className,
}: WorkspaceSwitcherProps) {
  const navigate = useNavigate()
  const {
    activeWorkspace,
    memberships,
    platformRoles,
    platformContextActive,
    switchWorkspace,
    enterPlatformContext,
  } = useAuth()
  const workspaces = memberships
    .filter((membership) => membership.status === 'active')
    .map((membership) => workspaceRepository.getById(membership.workspaceId))
    .filter((workspace) => workspace !== undefined)
  const currentTitle = platformContextActive
    ? `${APP_NAME} Platform`
    : activeWorkspace?.name ?? 'Select workspace'
  const currentSubtitle = platformContextActive
    ? 'Platform operations'
    : activeWorkspace?.type === 'company'
      ? 'Company Workspace'
      : 'Personal Workspace'
  const CurrentIcon = platformContextActive
    ? ShieldCheck
    : activeWorkspace?.type === 'company'
      ? Building2
      : UserRound
  const currentHome = platformContextActive
    ? '/admin'
    : activeWorkspace?.type === 'company'
      ? '/company-dashboard'
      : '/dashboard'

  const selectWorkspace = (workspaceId: string, type: 'personal' | 'company') => {
    switchWorkspace(workspaceId)
    navigate(type === 'company' ? '/company-dashboard' : '/dashboard')
  }

  const selectPlatform = () => {
    try {
      if (!platformContextActive) {
        enterPlatformContext()
      }
    } catch (error) {
      console.error('Failed to enter platform context', error)
    }
    navigate('/admin')
  }

  if (collapsed) {
    return (
      <PmButton
        variant="ghost"
        size="icon"
        className={cn('size-8 shrink-0', className)}
        aria-label={`${currentTitle} workspace`}
        onClick={() => navigate(currentHome)}
      >
        <CurrentIcon className="size-4" aria-hidden />
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
            <CurrentIcon className="size-4" aria-hidden />
          </span>
          <span className="grid min-w-0 flex-1 text-start leading-tight group-data-[collapsible=icon]:hidden">
            <span className={cn(pmTypography.bodySm, 'truncate font-semibold tracking-tight')}>
              {currentTitle}
            </span>
            <span className={cn(pmTypography.caption, 'truncate')}>
              {currentSubtitle}
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
        {workspaces.map((workspace) => {
          const Icon = workspace.type === 'company' ? Building2 : UserRound
          return (
            <DropdownMenuItem
              key={workspace.id}
              className="cursor-pointer"
              onSelect={() => selectWorkspace(workspace.id, workspace.type)}
            >
              <Icon className="size-4" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
              <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
                {workspace.type === 'company' ? 'Company' : 'Personal'}
              </span>
            </DropdownMenuItem>
          )
        })}
        {platformRoles.length > 0 ? (
          <DropdownMenuItem className="cursor-pointer" onSelect={selectPlatform}>
            <ShieldCheck className="size-4" aria-hidden />
            Platform operations
          </DropdownMenuItem>
        ) : null}
        {workspaces.length === 0 && platformRoles.length === 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className={pmTypography.caption}>
              No active workspaces
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
