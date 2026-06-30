import { ThemeProvider } from '@/providers/theme-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { CommandMenuProvider } from '@/providers/command-menu-provider'
import { PmDirectionProvider } from '@/components/layout/pm-direction-provider'
import { PmToaster } from '@/components/layout/pm-toaster'
import { TooltipProvider } from '@/components/ui/tooltip'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <PmDirectionProvider>
        <AuthProvider>
          <CommandMenuProvider>
            <TooltipProvider delayDuration={0}>
              {children}
              <PmToaster richColors />
            </TooltipProvider>
          </CommandMenuProvider>
        </AuthProvider>
      </PmDirectionProvider>
    </ThemeProvider>
  )
}
