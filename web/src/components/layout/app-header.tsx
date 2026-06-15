import { Search } from 'lucide-react'
import { useCommandMenu } from '@/providers/command-menu-provider'
import { useTheme } from '@/providers/theme-provider'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PageBreadcrumbs } from '@/components/layout/page-breadcrumbs'
import { NotificationCenter } from '@/components/layout/notification-center'
import { UserMenu } from '@/components/layout/user-menu'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const { setOpen } = useCommandMenu()
  const { resolvedTheme } = useTheme()

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/70',
      )}
    >
      <SidebarTrigger className="cursor-pointer md:hidden" aria-label="Open navigation" />
      <SidebarTrigger className="hidden cursor-pointer md:inline-flex" aria-label="Toggle sidebar" />

      <Separator orientation="vertical" className="mx-1 hidden h-5 md:block" />

      <div className="hidden min-w-0 flex-1 md:block">
        <PageBreadcrumbs />
      </div>

      <div className="flex flex-1 items-center justify-end gap-1 md:flex-none">
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 w-full max-w-xs cursor-pointer justify-start gap-2 text-muted-foreground md:flex lg:max-w-sm"
          onClick={() => setOpen(true)}
          aria-label="Open command menu"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="truncate">Search…</span>
          <kbd className="pointer-events-none ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-block">
            Ctrl+K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="cursor-pointer md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open command menu"
        >
          <Search className="size-4" aria-hidden />
        </Button>

        <NotificationCenter />
        <UserMenu />
      </div>

      <span className="sr-only">Current theme: {resolvedTheme}</span>
    </header>
  )
}
