import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { CommandMenu } from '@/components/layout/command-menu'
import { AppPageChrome } from '@/components/layout/page-chrome'
import { PageBreadcrumbs } from '@/components/layout/page-breadcrumbs'
import { recordRecentPage } from '@/components/layout/recent-pages'
import { resolveWorkspaceContext } from '@/components/layout/workspace-display'
import { useAuth } from '@/providers/auth-provider'

function RecentPageTracker() {
  const { pathname } = useLocation()
  const { isCompanyUser, canAccessAdmin } = useAuth()

  useEffect(() => {
    if (pathname === '/login' || pathname === '/register') return
    const isAdminArea = pathname.startsWith('/admin') && canAccessAdmin
    const { title } = resolveWorkspaceContext(pathname, {
      isCompanyUser,
      isAdminArea,
    })
    recordRecentPage(pathname, title)
  }, [pathname, isCompanyUser, canAccessAdmin])

  return null
}

export function AppShell() {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="min-h-svh bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <AppHeader />
        <RecentPageTracker />
        <main id="main-content" className="flex flex-1 flex-col">
          <div className="border-b border-border/40 px-3 py-2 md:hidden">
            <PageBreadcrumbs />
          </div>
          <AppPageChrome>
            <Outlet />
          </AppPageChrome>
        </main>
      </SidebarInset>
      <CommandMenu />
    </SidebarProvider>
  )
}
