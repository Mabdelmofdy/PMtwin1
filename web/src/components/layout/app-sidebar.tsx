import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, LogOut, ShieldCheck } from 'lucide-react'
import {
  adminNavigationGroups,
  isNavActive,
  mainNavigation,
} from '@/config/navigation'
import { useAuth } from '@/providers/auth-provider'
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher'
import { getUserInitials } from '@/components/layout/workspace-display'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { PmNavBadge } from '@/components/ui/pm-badge'
import { PmButton } from '@/components/ui/pm-button'
import { pmInteraction } from '@/tokens'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'

const navButtonClass =
  cn(
    pmInteraction.navItem,
    'cursor-pointer transition-colors data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:shadow-[inset_2px_0_0_0_var(--primary)] rtl:data-[active=true]:shadow-[inset_-2px_0_0_0_var(--primary)]',
  )

export function AppSidebar() {
  const { pathname } = useLocation()
  const { user, signOut, isCompanyUser, canAccessAdmin } = useAuth()
  if (!user) return null
  const displayName = user.profile?.name || user.email
  const isAdminArea = pathname.startsWith('/admin') && canAccessAdmin
  const dashboardHref = isCompanyUser ? '/company-dashboard' : '/dashboard'

  const navGroups = isAdminArea
    ? adminNavigationGroups
    : mainNavigation.map((group) => ({
        ...group,
        items: group.items.map((item) =>
          item.href === '/dashboard'
            ? {
                ...item,
                href: dashboardHref,
                title: isCompanyUser ? 'Company Dashboard' : 'Dashboard',
              }
            : item,
        ),
      }))

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-e border-sidebar-border/80">
      <SidebarHeader className="gap-2 border-b border-sidebar-border/60 p-2">
        <WorkspaceSwitcher />
        <div className={cn(pmTypography.caption, 'flex items-center gap-2 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/30 px-2.5 py-2 group-data-[collapsible=icon]:hidden')}>
          <span className="truncate font-medium">{displayName}</span>
          <PmNavBadge className="ms-auto uppercase">{user.role}</PmNavBadge>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-1 py-2">
        {navGroups.map((group) => (
          <SidebarGroup key={group.title} className="px-1">
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = isNavActive(pathname, item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        className={navButtonClass}
                        asChild
                      >
                        <Link to={item.href}>
                          <Icon className="size-4 shrink-0" aria-hidden />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.badge ? (
                        <SidebarMenuBadge className="bg-primary/10 text-primary">
                          {item.badge}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {isAdminArea ? (
          <SidebarGroup className="px-1">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Back to workspace"
                    className={navButtonClass}
                    asChild
                  >
                    <Link to={dashboardHref}>
                      <ArrowLeft className="size-4" aria-hidden />
                      <span>Back to workspace</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : canAccessAdmin ? (
          <>
            <SidebarSeparator className="mx-2" />
            <SidebarGroup className="px-1">
              <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isNavActive(pathname, '/admin')}
                      tooltip="Admin"
                      className={navButtonClass}
                      asChild
                    >
                      <Link to="/admin">
                        <ShieldCheck className="size-4" aria-hidden />
                        <span>Admin</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-2">
        <PmButton
          variant="ghost"
          className="w-full cursor-pointer justify-start gap-2 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          onClick={signOut}
        >
          <LogOut className="size-4" aria-hidden />
          <span className={cn(pmTypography.bodySm, 'group-data-[collapsible=icon]:sr-only')}>
            Sign out ({getUserInitials(displayName)})
          </span>
        </PmButton>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
