import { Link, NavLink, Outlet } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { APP_NAME } from '@/config/navigation'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const publicLinks = [
  { href: '/find', label: 'Find' },
  { href: '/workflow', label: 'How it works' },
  { href: '/knowledge-base', label: 'Knowledge Base' },
  { href: '/collaboration-models', label: 'Models' },
] as const

export function PublicLayout() {
  const { isAuthenticated } = useAuth()
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link
            to="/"
            className="flex cursor-pointer items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-4" aria-hidden />
            </span>
            {APP_NAME}
          </Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Public">
            {publicLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  cn(
                    'cursor-pointer text-sm font-medium transition-colors hover:text-primary',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button size="sm" className="cursor-pointer" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="cursor-pointer" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" className="cursor-pointer" asChild>
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground md:px-8">
          © {new Date().getFullYear()} {APP_NAME}. Built environment collaboration.
        </div>
      </footer>
    </div>
  )
}
