import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { APP_NAME } from '@/config/navigation'

import { PUBLIC_HEADER_NAV } from '@/config/public-navigation'

import { PublicFooter } from '@/components/layout/public-footer'

import { PublicMobileNav } from '@/components/layout/public-mobile-nav'

import { useAuth } from '@/providers/auth-provider'

import { cn } from '@/lib/utils'

const FLUSH_PUBLIC_PATHS = new Set([
  '/',
  '/find',
  '/workflow',
  '/knowledge-base',
  '/login',
  '/register',
  '/collaboration-models',
  '/collaboration-wizard',
  '/forgot-password',
  '/reset-password',
  '/features',
  '/pricing',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
])

export function PublicLayout() {
  const { isAuthenticated } = useAuth()
  const { pathname } = useLocation()
  const isFlush = FLUSH_PUBLIC_PATHS.has(pathname)

  return (
    <div className={cn('flex min-h-svh flex-col', isFlush ? 'bg-[#f7f9fb]' : 'bg-background')}>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <PublicMobileNav />
            <Link
              to="/"
              className="cursor-pointer truncate text-xl font-bold text-[#0369a1] no-underline transition-colors hover:text-[#0284c7]"
            >
              {APP_NAME}
            </Link>
          </div>

          <nav className="hidden items-center gap-5 lg:flex" aria-label="Public">
            {PUBLIC_HEADER_NAV.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  cn(
                    'cursor-pointer text-sm font-medium text-gray-900 no-underline transition-colors hover:text-[#0369a1]',
                    isActive && 'text-[#0369a1]',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3 text-sm font-medium sm:gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="cursor-pointer text-gray-900 no-underline transition-colors hover:text-[#0369a1]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden cursor-pointer text-gray-900 no-underline transition-colors hover:text-[#0369a1] sm:inline"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="hidden cursor-pointer text-gray-900 no-underline transition-colors hover:text-[#0369a1] md:inline"
                >
                  Registration preview
                </Link>
                <Link
                  to="/login"
                  className="cursor-pointer rounded-lg bg-[#0369a1] px-3 py-1.5 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#0284c7] sm:hidden"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main
        className={cn(
          'flex-1',
          isFlush && 'public-layout-main--flush public-layout-main--with-footer',
        )}
      >
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  )
}
