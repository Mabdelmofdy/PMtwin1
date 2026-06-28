import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, LogOut, ShieldCheck, Zap } from 'lucide-react'
import {
  APP_NAME,
  adminNavigationGroups,
  isNavActive,
  mainNavigation,
} from '@/config/navigation'
import { useAuth } from '@/providers/auth-provider'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

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
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-3 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-pointer"
              asChild
            >
              <Link to={isAdminArea ? '/admin' : dashboardHref}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  {isAdminArea ? (
                    <ShieldCheck className="size-4" aria-hidden />
                  ) : (
                    <Zap className="size-4" aria-hidden />
                  )}
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold tracking-tight">
                    {isAdminArea ? `${APP_NAME} Admin` : APP_NAME}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {isAdminArea ? 'Platform operations' : 'Project marketplace'}
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="flex items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-2 py-2 group-data-[collapsible=icon]:hidden">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase">
                {user.role}
              </Badge>
              {user.status === 'active' && (
                <span className="text-[10px] text-muted-foreground">Active</span>
              )}
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = isNavActive(pathname, item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        className="cursor-pointer"
                        asChild
                      >
                        <Link to={item.href}>
                          <Icon aria-hidden />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.badge ? (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {isAdminArea ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Back to workspace"
                    className="cursor-pointer"
                    asChild
                  >
                    <Link to={dashboardHref}>
                      <ArrowLeft aria-hidden />
                      <span>Back to workspace</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : canAccessAdmin ? (
          <>
            <SidebarSeparator className="mx-0" />
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isNavActive(pathname, '/admin')}
                      tooltip="Admin"
                      className="cursor-pointer"
                      asChild
                    >
                      <Link to="/admin">
                        <ShieldCheck aria-hidden />
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

      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          className="w-full cursor-pointer justify-start gap-2 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          onClick={signOut}
        >
          <LogOut className="size-4" aria-hidden />
          <span className="text-sm group-data-[collapsible=icon]:sr-only">
            Sign out
          </span>
        </Button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
