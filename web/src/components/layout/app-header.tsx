import { useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  PageBreadcrumbs,
  buildCrumbs,
} from '@/components/layout/page-breadcrumbs'
import { NotificationCenter } from '@/components/layout/notification-center'
import { UserMenu } from '@/components/layout/user-menu'
import { GlobalSearch } from '@/components/layout/global-search'
import { QuickCreateMenu } from '@/components/layout/quick-create-menu'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { resolveWorkspaceContext } from '@/components/layout/workspace-display'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'

function HeaderContext({ title }: { title: string }) {
  const { pathname } = useLocation()
  const crumbs = buildCrumbs(pathname)
  const hasCrumbs = !(crumbs.length <= 1 && crumbs[0]?.isCurrent)

  if (hasCrumbs) {
    return <PageBreadcrumbs className="min-w-0 max-w-[min(42vw,18rem)] lg:max-w-xs xl:max-w-md" />
  }

  return (
    <p className={cn(pmTypography.label, 'truncate text-foreground/90')}>
      {title}
    </p>
  )
}

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
        'sticky top-0 z-20 grid min-w-0 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0',
        'border-b border-border/45 bg-background/95 px-3 py-2 shadow-[0_1px_0_0_var(--border)]',
        'backdrop-blur-md supports-[backdrop-filter]:bg-background/80 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] md:px-5',
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <SidebarTrigger
          className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Toggle navigation"
        />
        <Separator orientation="vertical" className="hidden h-5 shrink-0 md:block" />
        <div className="hidden min-w-0 md:block">
          <HeaderContext title={workspace.title} />
        </div>
        <p className={cn(pmTypography.label, 'min-w-0 truncate md:hidden')}>
          {workspace.title}
        </p>
      </div>

      <div className="col-span-2 flex justify-center px-0.5 md:col-span-1 md:px-2">
        <GlobalSearch className="hidden w-full max-w-[17.5rem] md:flex lg:max-w-sm xl:max-w-md" />
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
        <GlobalSearch variant="compact" className="md:hidden" />
        <QuickCreateMenu />
        <div
          className="flex items-center gap-0.5 rounded-xl border border-border/45 bg-muted/35 p-0.5 sm:gap-0"
          role="toolbar"
          aria-label="Account and preferences"
        >
          <NotificationCenter />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
