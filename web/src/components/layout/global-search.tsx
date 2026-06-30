import { Search } from 'lucide-react'
import { useCommandMenu } from '@/providers/command-menu-provider'
import { PmButton } from '@/components/ui/pm-button'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'

type GlobalSearchProps = {
  className?: string
  variant?: 'compact' | 'full'
}

export function GlobalSearch({
  className,
  variant = 'full',
}: GlobalSearchProps) {
  const { setOpen } = useCommandMenu()

  if (variant === 'compact') {
    return (
      <PmButton
        variant="ghost"
        size="icon-sm"
        className={cn('cursor-pointer', className)}
        onClick={() => setOpen(true)}
        aria-label="Open command menu"
      >
        <Search className="size-4" aria-hidden />
      </PmButton>
    )
  }

  return (
    <PmButton
      variant="outline"
      size="sm"
      className={cn(
        'h-8 w-full max-w-md cursor-pointer justify-start gap-2 border-border/60 bg-surface-muted/40 text-muted-foreground hover:bg-surface-muted',
        className,
      )}
      onClick={() => setOpen(true)}
      aria-label="Open command menu"
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <span className={cn(pmTypography.bodySm, 'truncate')}>Search or jump to…</span>
      <kbd className="pointer-events-none ms-auto hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-block">
        Ctrl+K
      </kbd>
    </PmButton>
  )
}
