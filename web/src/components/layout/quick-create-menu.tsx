import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { commandActions } from '@/config/navigation'
import { PmButton } from '@/components/ui/pm-button'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function QuickCreateMenu() {
  const primary = commandActions[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PmButton
          size="sm"
          className="cursor-pointer gap-1.5"
          aria-label="Quick create"
        >
          <Plus className="size-4" aria-hidden />
          <span className="hidden sm:inline">Create</span>
        </PmButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className={cn(pmTypography.caption, 'text-muted-foreground')}>
          Quick create
        </DropdownMenuLabel>
        {commandActions.map((action) => {
          const Icon = action.icon
          return (
            <DropdownMenuItem key={action.href} className="cursor-pointer" asChild>
              <Link to={action.href}>
                <Icon className="size-4" aria-hidden />
                {action.title}
              </Link>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className={cn(pmTypography.caption, 'text-muted-foreground')}>
          More actions — command palette
        </DropdownMenuItem>
        {primary ? (
          <DropdownMenuItem className="sr-only" asChild>
            <Link to={primary.href}>{primary.title}</Link>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
