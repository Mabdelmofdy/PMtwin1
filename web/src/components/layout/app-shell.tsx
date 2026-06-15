import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { CommandMenu } from '@/components/layout/command-menu'
import { ContentContainer } from '@/components/layout/content-container'
import { PageBreadcrumbs } from '@/components/layout/page-breadcrumbs'

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
        <main id="main-content" className="flex flex-1 flex-col">
          <div className="border-b border-border/40 px-4 py-2 md:hidden">
            <PageBreadcrumbs />
          </div>
          <ContentContainer>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Outlet />
            </motion.div>
          </ContentContainer>
        </main>
      </SidebarInset>
      <CommandMenu />
    </SidebarProvider>
  )
}
