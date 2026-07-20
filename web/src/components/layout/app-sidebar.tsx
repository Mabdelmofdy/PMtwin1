import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, LogOut, ShieldCheck } from 'lucide-react'
import { notificationsApi } from '@/api/notifications.ts'
import {
  adminNavigationGroups,
  isNavActive,
  mainNavigation,
} from '@/config/navigation'
import { useAuth } from '@/providers/auth-provider'
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher'
import { getUserInitials } from '@/components/layout/workspace-display'
import { formatUserRoleLabel, MOCK_MESSAGE_THREADS } from '@/components/user/user-display'
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
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'
import { useProductLanguage } from '@/providers/product-language-provider'

const navButtonClass =
  cn(
    pmInteraction.navItem,
    'group cursor-pointer rounded-2xl border border-transparent px-3 py-3 text-[0.875rem] transition-all data-[active=true]:border-primary/20 data-[active=true]:bg-sidebar-primary/95 data-[active=true]:text-sidebar-primary-foreground data-[active=true]:font-semibold data-[active=true]:shadow-[0_14px_30px_-20px_color-mix(in_oklch,var(--primary)_78%,black)] hover:border-sidebar-border/70 hover:bg-sidebar-accent/82',
  )

export function AppSidebar() {
  const { pathname } = useLocation()
  const { user, signOut, isCompanyUser, canAccessAdmin, exitPlatformContext } = useAuth()
  const { productLanguage } = useProductLanguage()
  if (!user) return null
  const displayName = user.profile?.name || user.email
  const isAdminArea = pathname.startsWith('/admin') && canAccessAdmin
  const dashboardHref = isCompanyUser ? '/company-dashboard' : '/dashboard'

  const unreadNotifications = useMemo(() => {
    if (!user.id) return 0
    return notificationsApi.list(user.id).filter((n) => !n.read).length
  }, [user.id])

  const unreadMessages = useMemo(
    () => MOCK_MESSAGE_THREADS.reduce((sum, thread) => sum + thread.unread, 0),
    [],
  )

  const resolveNavBadge = (href: string): number | undefined => {
    if (href === '/notifications' && unreadNotifications > 0) return unreadNotifications
    if (href === '/messages' && unreadMessages > 0) return unreadMessages
    return undefined
  }

  const navGroups = isAdminArea
    ? adminNavigationGroups
    : mainNavigation.map((group) => ({
        ...group,
        items: group.items.map((item) =>
          item.href === '/dashboard'
            ? {
                ...item,
                href: dashboardHref,
                title: isCompanyUser ? 'Company Dashboard' : 'My Workspace',
              }
            : item.href === '/opportunities'
              ? { ...item, title: `My ${productLanguage.navigationLabel('opportunities')}` }
              : item.href === '/negotiations'
                ? { ...item, title: `My ${productLanguage.navigationLabel('negotiations')}` }
                : item.href === '/commercial-agreements'
                  ? { ...item, title: `My ${productLanguage.navigationLabel('commercialAgreements')}` }
                  : item.href === '/contracts'
                    ? { ...item, title: `My ${productLanguage.navigationLabel('contracts')}` }
            : item,
        ),
      }))

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-e border-sidebar-border/35">
      <SidebarHeader className="gap-3 border-b border-sidebar-border/45 px-3 pb-4 pt-3">
        <WorkspaceSwitcher />
        <div className={cn('group-data-[collapsible=icon]:hidden')}>
          <div className="rounded-2xl border border-sidebar-border/55 bg-sidebar-accent/45 px-3 py-3">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/85">
              My profile
            </p>
            <div className="mt-1.5 flex items-start gap-2">
              <div className="min-w-0">
                <p className={cn(pmTypography.bodySm, 'truncate font-semibold text-sidebar-foreground')}>
                  {displayName}
                </p>
                <p className={cn(pmTypography.caption, 'truncate text-muted-foreground')}>
                  {user.email}
                </p>
              </div>
              <PmNavBadge className="ms-auto mt-0.5">{formatUserRoleLabel(user.role)}</PmNavBadge>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-3 px-2 py-4">
        {navGroups.map((group) => (
          <SidebarGroup key={group.title} className="rounded-2xl border border-transparent bg-sidebar/10 px-1.5 py-2">
            <SidebarGroupLabel className="px-2 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/72">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = isNavActive(pathname, item.href)
                  const badge = resolveNavBadge(item.href)
                  const itemKey = `${group.title}-${item.title}`
                  const linkHref =
                    item.href === '/dashboard' ? dashboardHref : item.href
                  return (
                    <SidebarMenuItem key={itemKey}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        className={navButtonClass}
                        asChild
                      >
                        <Link
                          to={linkHref}
                          state={item.state}
                          className="min-h-10"
                        >
                          <Icon className="size-4 shrink-0 text-sidebar-foreground/75 transition-colors group-data-[active=true]/menu-button:text-sidebar-primary-foreground" aria-hidden />
                          <span className="truncate">{item.title}</span>
                          {item.preview ? (
                            <PmNavBadge className="ms-auto shrink-0 text-[10px] uppercase tracking-wide">
                              Preview
                            </PmNavBadge>
                          ) : null}
                        </Link>
                      </SidebarMenuButton>
                      {badge ? (
                        <SidebarMenuBadge className="rounded-full border border-primary/20 bg-primary/12 px-1.5 text-primary">
                          {badge}
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
                    tooltip="Back to My Workspace"
                    className={navButtonClass}
                    asChild
                  >
                    <Link
                      to={dashboardHref}
                      onClick={() => exitPlatformContext()}
                    >
                      <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
                      <span>Back to My Workspace</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : canAccessAdmin ? (
          <>
            <SidebarSeparator className="mx-3 my-1" />
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

      <SidebarFooter className="border-t border-sidebar-border/45 px-3 pb-3 pt-2.5">
        <PmButton
          variant="ghost"
          className="w-full cursor-pointer justify-start gap-2 rounded-xl border border-transparent text-muted-foreground hover:border-sidebar-border/65 hover:bg-sidebar-accent/75 hover:text-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
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
