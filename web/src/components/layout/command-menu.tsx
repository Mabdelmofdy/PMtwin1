import { useNavigate } from 'react-router-dom'
import {
  adminNavigationGroups,
  commandActions,
  mainNavigation,
  userMenuLinks,
} from '@/config/navigation'
import { useCommandMenu } from '@/providers/command-menu-provider'
import { useAuth } from '@/providers/auth-provider'
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

export function CommandMenu() {
  const { open, setOpen } = useCommandMenu()
  const navigate = useNavigate()
  const { canAccessAdmin, isCompanyUser, signOut } = useAuth()

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
    >
      <CommandInput placeholder="Search pages, actions, settings…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

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
      </CommandList>

      <div className="flex items-center justify-between border-t border-border/50 px-3 py-2 text-xs text-muted-foreground">
        <span>Navigate PM-Twin</span>
        <CommandShortcut>⌘K</CommandShortcut>
      </div>
    </CommandDialog>
  )
}
