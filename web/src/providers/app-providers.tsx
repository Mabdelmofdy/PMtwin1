import { ThemeProvider } from '@/providers/theme-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { CommandMenuProvider } from '@/providers/command-menu-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <CommandMenuProvider>
          <TooltipProvider delayDuration={0}>
            {children}
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </CommandMenuProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
