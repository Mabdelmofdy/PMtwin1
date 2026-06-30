import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { userMenuLinks } from '@/config/navigation'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { useAuth } from '@/providers/auth-provider'
import { getUserInitials } from '@/components/layout/workspace-display'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PmButton } from '@/components/ui/pm-button'
import { PmNavBadge } from '@/components/ui/pm-badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function UserMenu() {
  const { user, signOut } = useAuth()
  if (!user) return null
  const displayName = user.profile?.name || user.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PmButton
          variant="ghost"
          size="icon-sm"
          className="cursor-pointer rounded-full"
          aria-label="Open profile menu"
        >
          <Avatar className="size-8 ring-2 ring-border/60">
            <AvatarFallback className={cn(pmTypography.badge, 'bg-primary/10 font-semibold text-primary')}>
              {getUserInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        </PmButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <p className={pmTypography.label}>{displayName}</p>
              <PmNavBadge className="uppercase">{user.role}</PmNavBadge>
            </div>
            <p className={pmTypography.caption}>{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {userMenuLinks.map((link) => {
            const Icon = link.icon
            return (
              <DropdownMenuItem key={link.href} className="cursor-pointer" asChild>
                <Link to={link.href}>
                  <Icon className="size-4" aria-hidden />
                  {link.title}
                </Link>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={signOut}
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
