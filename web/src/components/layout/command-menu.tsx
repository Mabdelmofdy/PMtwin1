import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Sparkles } from 'lucide-react'
import {
  adminNavigationGroups,
  commandActions,
  mainNavigation,
  userMenuLinks,
} from '@/config/navigation'
import { useCommandMenu } from '@/providers/command-menu-provider'
import { useAuth } from '@/providers/auth-provider'
import { readRecentPages } from '@/components/layout/recent-pages'
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
  { title: 'Run matching (soon)', keywords: ['matching', 'engine'] },
  { title: 'Export report (soon)', keywords: ['export', 'report'] },
  { title: 'Invite teammate (soon)', keywords: ['invite', 'team'] },
] as const

export function CommandMenu() {
  const { open, setOpen } = useCommandMenu()
  const navigate = useNavigate()
  const { canAccessAdmin, isCompanyUser, signOut } = useAuth()

  const recentPages = useMemo(
    () => (open ? readRecentPages() : []),
    [open],
  )

  const runCommand = (href: string) => {
    setOpen(false)
    navigate(href)
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
          <div className="py-6 text-center text-sm text-muted-foreground">
            <p>No results found.</p>
            <p className="mt-1 text-xs">Try a page name, action, or keyword from navigation.</p>
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
                  key={item.href}
                  className="cursor-pointer"
                  onSelect={() => runCommand(href)}
                  keywords={item.keywords}
                >
                  <Icon className="size-4" aria-hidden />
                  <span>{item.title}</span>
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

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 px-3 py-2 text-xs text-muted-foreground">
        <span>↑↓ Navigate · Enter Select · Esc Close</span>
        <CommandShortcut>Ctrl+K</CommandShortcut>
      </div>
    </CommandDialog>
  )
}
