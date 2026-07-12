import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BookOpen, Clock, Compass, Sparkles } from 'lucide-react'
import {
  adminNavigationGroups,
  commandActions,
  mainNavigation,
  userMenuLinks,
  type NavItem,
} from '@/config/navigation'
import { useCommandMenu } from '@/providers/command-menu-provider'
import { pmTypography } from '@/tokens'
import { useAuth } from '@/providers/auth-provider'
import { readRecentPages } from '@/components/layout/recent-pages'
import { cn } from '@/lib/utils'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

const futureCommandPlaceholders = [
  { title: 'Export report (soon)', keywords: ['export', 'report'] },
] as const

export function CommandMenu() {
  const { open, setOpen } = useCommandMenu()
  const navigate = useNavigate()
  const { canAccessAdmin, isCompanyUser, signOut } = useAuth()

  const recentPages = useMemo(
    () => (open ? readRecentPages() : []),
    [open],
  )

  const runCommand = (href: string, state?: NavItem['state']) => {
    setOpen(false)
    navigate(href, state ? { state } : undefined)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command menu"
      description="Search pages and actions across PM-Twin"
      className="pm-shadow-modal"
    >
      <CommandInput placeholder="Search pages, actions, settings…" />
      <CommandList>
        <CommandEmpty>
          <div className={cn('py-6 text-center', pmTypography.bodySm, 'text-muted-foreground')}>
            <p>No results found.</p>
            <p className={cn('mt-1', pmTypography.caption)}>Try a page name, action, or keyword from navigation.</p>
          </div>
        </CommandEmpty>

        {recentPages.length > 0 ? (
          <>
            <CommandGroup heading="Recent">
              {recentPages.map((page) => (
                <CommandItem
                  key={page.href}
                  className="cursor-pointer"
                  onSelect={() => runCommand(page.href)}
                  keywords={[page.label]}
                >
                  <Clock className="size-4 text-muted-foreground" aria-hidden />
                  <span>{page.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}

        {mainNavigation.map((group) => (
          <CommandGroup key={group.title} heading={group.title}>
            {group.items.map((item) => {
              const Icon = item.icon
              const href =
                item.href === '/dashboard' && isCompanyUser
                  ? '/company-dashboard'
                  : item.href
              return (
                <CommandItem
                  key={`${group.title}-${item.title}`}
                  className="cursor-pointer"
                  onSelect={() => runCommand(href, item.state)}
                  keywords={item.keywords}
                >
                  <Icon className="size-4" aria-hidden />
                  <span>{item.title}</span>
                  {item.preview ? (
                    <CommandShortcut>Preview</CommandShortcut>
                  ) : null}
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}

        <CommandSeparator />

        <CommandGroup heading="Quick actions">
          {commandActions.map((action) => {
            const Icon = action.icon
            return (
              <CommandItem
                key={action.href}
                className="cursor-pointer"
                onSelect={() => runCommand(action.href)}
                keywords={[...action.keywords]}
              >
                <Icon className="size-4" aria-hidden />
                <span>{action.title}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          {userMenuLinks.map((link) => {
            const Icon = link.icon
            return (
              <CommandItem
                key={link.href}
                className="cursor-pointer"
                onSelect={() => runCommand(link.href)}
              >
                <Icon className="size-4" aria-hidden />
                <span>{link.title}</span>
              </CommandItem>
            )
          })}
          <CommandItem
            className="cursor-pointer"
            onSelect={() => {
              setOpen(false)
              signOut()
            }}
          >
            <span>Sign out</span>
          </CommandItem>
        </CommandGroup>

        {canAccessAdmin ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Admin Explore">
              <CommandItem
                className="cursor-pointer"
                onSelect={() => runCommand('/admin/search')}
                keywords={['admin', 'search', 'global', 'find']}
              >
                <Compass className="size-4" aria-hidden />
                <span>Admin Global Search</span>
              </CommandItem>
              <CommandItem
                className="cursor-pointer"
                onSelect={() => runCommand('/admin/inbox')}
                keywords={['admin', 'inbox', 'queue']}
              >
                <Bell className="size-4" aria-hidden />
                <span>Admin Inbox</span>
              </CommandItem>
              <CommandItem
                className="cursor-pointer"
                onSelect={() => runCommand('/admin/explorer')}
                keywords={['admin', 'explorer', 'catalogue']}
              >
                <BookOpen className="size-4" aria-hidden />
                <span>Platform Explorer</span>
              </CommandItem>
            </CommandGroup>
            {adminNavigationGroups.map((group) => (
              <CommandGroup key={group.title} heading={group.title}>
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <CommandItem
                      key={item.href}
                      className="cursor-pointer"
                      onSelect={() => runCommand(item.href)}
                      keywords={item.keywords}
                    >
                      <Icon className="size-4" aria-hidden />
                      <span>{item.title}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </>
        ) : null}

        <CommandSeparator />

        <CommandGroup heading="Coming soon">
          {futureCommandPlaceholders.map((item) => (
            <CommandItem
              key={item.title}
              disabled
              className="text-muted-foreground"
              keywords={[...item.keywords]}
            >
              <Sparkles className="size-4" aria-hidden />
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      <div className={cn('flex flex-wrap items-center justify-between gap-2 border-t border-border/50 px-3 py-2', pmTypography.caption)}>
        <span>↑↓ Navigate · Enter Select · Esc Close</span>
        <CommandShortcut>Ctrl+K</CommandShortcut>
      </div>
    </CommandDialog>
  )
}
