import { useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { PageBreadcrumbs } from '@/components/layout/page-breadcrumbs'
import { NotificationCenter } from '@/components/layout/notification-center'
import { UserMenu } from '@/components/layout/user-menu'
import { GlobalSearch } from '@/components/layout/global-search'
import { QuickCreateMenu } from '@/components/layout/quick-create-menu'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { resolveWorkspaceContext } from '@/components/layout/workspace-display'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'

export function AppHeader() {
  const { pathname } = useLocation()
  const { isCompanyUser, canAccessAdmin } = useAuth()
  const isAdminArea = pathname.startsWith('/admin') && canAccessAdmin
  const workspace = resolveWorkspaceContext(pathname, {
    isCompanyUser,
    isAdminArea,
  })

  return (
    <header
      data-slot="app-header"
      className={cn(
        'sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/60',
        'bg-background/90 px-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80',
        'md:gap-3 md:px-4',
      )}
    >
      <SidebarTrigger
        className="cursor-pointer md:hidden"
        aria-label="Open navigation menu"
      />
      <SidebarTrigger
        className="hidden cursor-pointer lg:inline-flex"
        aria-label="Toggle sidebar"
      />

      <div className="flex min-w-0 flex-col md:hidden">
        <span className={cn(pmTypography.label, 'truncate leading-none')}>
          {workspace.title}
        </span>
        <span className="truncate text-[11px] text-muted-foreground">
          {workspace.subtitle}
        </span>
      </div>

      <Separator orientation="vertical" className="mx-0.5 hidden h-5 md:block" />

      <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
        <div className="hidden min-w-0 xl:block">
          <p className={cn(pmTypography.caption, 'leading-none')}>Workspace</p>
          <p className={cn(pmTypography.label, 'truncate')}>{workspace.title}</p>
        </div>
        <Separator orientation="vertical" className="hidden h-5 xl:block" />
        <PageBreadcrumbs className="min-w-0 flex-1" />
      </div>

      <div className="hidden flex-1 justify-center px-2 md:flex lg:max-w-md xl:max-w-lg">
        <GlobalSearch className="max-w-full" />
      </div>

      <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
        <GlobalSearch variant="compact" className="md:hidden" />
        <QuickCreateMenu />
        <NotificationCenter />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
