import { ThemeProvider } from '@/providers/theme-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { CommandMenuProvider } from '@/providers/command-menu-provider'
import { PmDirectionProvider } from '@/components/layout/pm-direction-provider'
import { PmToaster } from '@/components/layout/pm-toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ProductLanguageProvider } from '@/providers/product-language-provider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <PmDirectionProvider>
        <AuthProvider>
          <ProductLanguageProvider>
            <CommandMenuProvider>
              <TooltipProvider delayDuration={0}>
                {children}
                <PmToaster richColors />
              </TooltipProvider>
            </CommandMenuProvider>
          </ProductLanguageProvider>
        </AuthProvider>
      </PmDirectionProvider>
    </ThemeProvider>
  )
}
