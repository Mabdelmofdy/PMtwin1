import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/providers/theme-provider'
import { PmButton } from '@/components/ui/pm-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { resolveThemeById } from '@/theme'

/** Registry-backed options — visible labels unchanged for Phase 5. */
const THEME_TOGGLE_OPTIONS = [
  {
    preference: 'light' as const,
    label: 'Light',
    icon: Sun,
    registryTheme: resolveThemeById('enterprise-light'),
  },
  {
    preference: 'dark' as const,
    label: 'Dark',
    icon: Moon,
    registryTheme: resolveThemeById('enterprise-dark'),
  },
  {
    preference: 'system' as const,
    label: 'System',
    icon: Monitor,
    registryTheme: null,
  },
] as const

type ThemeToggleProps = {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const Icon =
    resolvedTheme === 'dark' ? Moon : resolvedTheme === 'light' ? Sun : Monitor

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PmButton
          variant="ghost"
          size={showLabel ? 'sm' : 'icon-sm'}
          className={cn('cursor-pointer', className)}
          aria-label="Change theme"
        >
          <Icon className="size-4" aria-hidden />
          {showLabel ? <span className="ms-2">Theme</span> : null}
        </PmButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) =>
            setTheme(value as 'light' | 'dark' | 'system')
          }
        >
          {THEME_TOGGLE_OPTIONS.map((option) => (
            <DropdownMenuRadioItem
              key={option.preference}
              value={option.preference}
              className="cursor-pointer"
              data-pm-theme-id={option.registryTheme?.id}
            >
              <option.icon className="size-4" aria-hidden />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
