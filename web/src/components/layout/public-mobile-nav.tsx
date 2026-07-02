import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import {
  PUBLIC_HEADER_NAV,
  PUBLIC_SECONDARY_NAV,
} from '@/config/public-navigation'
import { useAuth } from '@/providers/auth-provider'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'block cursor-pointer rounded-lg px-3 py-2.5 text-base font-medium text-gray-900 no-underline transition-colors hover:bg-gray-50 hover:text-[#0369a1]',
    isActive && 'bg-gray-50 text-[#0369a1]',
  )

const authLinkClass =
  'block cursor-pointer rounded-lg px-3 py-2.5 text-base font-medium text-gray-900 no-underline transition-colors hover:bg-gray-50 hover:text-[#0369a1]'

/** Mobile hamburger + drawer for public marketing routes. */
export function PublicMobileNav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <button
        type="button"
        className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-900 transition-colors hover:bg-gray-50 hover:text-[#0369a1] md:hidden pm-focus-ring"
        aria-label="Open site menu"
        aria-expanded={open}
        aria-controls="public-mobile-nav"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          id="public-mobile-nav"
          side="right"
          className="w-[min(20rem,calc(100vw-2rem))] gap-0 p-0"
          aria-describedby={undefined}
        >
          <SheetHeader className="border-b border-gray-100 px-4 py-4 text-start">
            <SheetTitle className="text-lg font-bold text-[#0369a1]">Menu</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1 p-3" aria-label="Public mobile primary">
            {PUBLIC_HEADER_NAV.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={navLinkClass}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <nav
            className="flex flex-col gap-1 border-t border-gray-100 p-3"
            aria-label="Public mobile secondary"
          >
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              More
            </p>
            {PUBLIC_SECONDARY_NAV.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={navLinkClass}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-gray-100 p-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className={authLinkClass}
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex flex-col gap-1">
                <Link
                  to="/login"
                  className={authLinkClass}
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className={authLinkClass}
                  onClick={() => setOpen(false)}
                >
                  Registration preview
                </Link>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
