'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmIconSize, pmTypography } from '@/tokens'
import { PmButton } from '@/components/ui/pm-button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export type PmMultiSelectOption = {
  readonly id: string
  readonly label: string
  readonly group?: string
  readonly description?: string
  readonly disabled?: boolean
}

export type PmMultiSelectProps = {
  options: readonly PmMultiSelectOption[]
  value: readonly string[]
  onChange: (next: string[]) => void
  mode?: 'single' | 'multi'
  maxSelected?: number
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  'aria-invalid'?: boolean
  id?: string
}

/**
 * Searchable single / multi select built from Popover + cmdk Command.
 * Multi mode shows removable chips; single mode shows the selected label.
 */
export function PmMultiSelect({
  options,
  value,
  onChange,
  mode = 'multi',
  maxSelected = 25,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results found.',
  disabled = false,
  className,
  'aria-invalid': ariaInvalid,
  id,
}: PmMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const selected = new Set(value)

  const optionById = React.useMemo(() => {
    const map = new Map<string, PmMultiSelectOption>()
    for (const option of options) map.set(option.id, option)
    return map
  }, [options])

  const groups = React.useMemo(() => {
    const order: string[] = []
    const byGroup = new Map<string, PmMultiSelectOption[]>()
    for (const option of options) {
      const group = option.group ?? ''
      if (!byGroup.has(group)) {
        byGroup.set(group, [])
        order.push(group)
      }
      byGroup.get(group)!.push(option)
    }
    return order.map((group) => ({
      group,
      items: byGroup.get(group)!,
    }))
  }, [options])

  const toggle = (optionId: string) => {
    if (mode === 'single') {
      onChange(selected.has(optionId) ? [] : [optionId])
      setOpen(false)
      return
    }
    if (selected.has(optionId)) {
      onChange(value.filter((id) => id !== optionId))
      return
    }
    if (value.length >= maxSelected) return
    onChange([...value, optionId])
  }

  const remove = (optionId: string) => {
    onChange(value.filter((id) => id !== optionId))
  }

  const clearAll = () => onChange([])

  const triggerLabel =
    mode === 'single' && value[0]
      ? (optionById.get(value[0])?.label ?? value[0])
      : null

  return (
    <div className={cn('space-y-2', className)} data-slot="pm-multi-select">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <PmButton
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={ariaInvalid}
            disabled={disabled}
            className={cn(
              'h-auto min-h-10 w-full justify-between px-3 py-2 font-normal',
              !triggerLabel && mode === 'single' && 'text-muted-foreground',
            )}
          >
            <span className="truncate text-start">
              {mode === 'single'
                ? (triggerLabel ?? placeholder)
                : value.length > 0
                  ? `${value.length} selected`
                  : placeholder}
            </span>
            <ChevronsUpDown
              className={cn(pmIconSize.compact, 'ms-2 shrink-0 opacity-50')}
              aria-hidden
            />
          </PmButton>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0"
          align="start"
        >
          <Command className="rounded-3xl">
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="max-h-64">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {groups.map(({ group, items }) => (
                <CommandGroup
                  key={group || '__ungrouped__'}
                  heading={group || undefined}
                >
                  {items.map((option) => {
                    const isSelected = selected.has(option.id)
                    const atCap =
                      mode === 'multi' &&
                      !isSelected &&
                      value.length >= maxSelected
                    return (
                      <CommandItem
                        key={option.id}
                        value={`${option.label} ${option.id} ${option.description ?? ''}`}
                        disabled={option.disabled || atCap}
                        data-checked={isSelected || undefined}
                        onSelect={() => toggle(option.id)}
                      >
                        <Check
                          className={cn(
                            'me-2 size-4 shrink-0',
                            isSelected ? 'opacity-100' : 'opacity-0',
                          )}
                          aria-hidden
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate">{option.label}</span>
                          {option.description ? (
                            <span
                              className={cn(
                                pmTypography.caption,
                                'text-muted-foreground',
                              )}
                            >
                              {option.description}
                            </span>
                          ) : null}
                        </span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {mode === 'multi' && value.length > 0 ? (
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="list"
          aria-label="Selected values"
        >
          {value.map((id) => {
            const label = optionById.get(id)?.label ?? id
            return (
              <span
                key={id}
                role="listitem"
                className={cn(
                  pmTypography.caption,
                  'inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/8 py-0.5 ps-2.5 pe-1 text-primary',
                )}
              >
                <span className="font-medium">{label}</span>
                <button
                  type="button"
                  onClick={() => remove(id)}
                  disabled={disabled}
                  aria-label={`Remove ${label}`}
                  className="relative flex size-7 cursor-pointer items-center justify-center rounded-full outline-none transition-colors hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  <X className={pmIconSize.compact} aria-hidden />
                </button>
              </span>
            )
          })}
          {value.length > 1 ? (
            <PmButton
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 min-h-8 px-2 text-xs text-muted-foreground"
              onClick={clearAll}
              disabled={disabled}
            >
              Clear all
            </PmButton>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** Thin single-select wrapper over PmMultiSelect. */
export function PmSingleSelect({
  value,
  onChange,
  ...rest
}: Omit<PmMultiSelectProps, 'mode' | 'value' | 'onChange' | 'maxSelected'> & {
  value: string
  onChange: (next: string) => void
}) {
  return (
    <PmMultiSelect
      {...rest}
      mode="single"
      value={value ? [value] : []}
      onChange={(next) => onChange(next[0] ?? '')}
    />
  )
}
