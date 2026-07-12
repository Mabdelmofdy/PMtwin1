import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react'
import { PmButton } from '@/components/ui/pm-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  createEmptyDeliverable,
  createEmptyMilestone,
  type OpportunityDeliverable,
  type OpportunityMilestone,
  type WorkPackage,
} from '@/domain/opportunity-creation'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

function reorder<T extends { sortOrder: number }>(
  items: T[],
  from: number,
  to: number,
): T[] {
  if (to < 0 || to >= items.length) return items
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  return next.map((entry, index) => ({ ...entry, sortOrder: index }))
}

export function DeliverablesBuilder({
  deliverables,
  workPackages,
  onChange,
}: {
  deliverables: OpportunityDeliverable[]
  workPackages: WorkPackage[]
  onChange: (items: OpportunityDeliverable[]) => void
}) {
  return (
    <div data-slot="deliverables-builder" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className={cn(pmTypography.h3)}>Deliverables</h3>
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Opportunity-level deliverables (packages can also own deliverables).
          </p>
        </div>
        <PmButton
          type="button"
          onClick={() =>
            onChange([
              ...deliverables,
              createEmptyDeliverable(deliverables.length),
            ])
          }
        >
          <Plus className="size-4" />
          Add Deliverable
        </PmButton>
      </div>
      {deliverables.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-md border border-border p-3">
          <div className="flex flex-wrap gap-1">
            <Input
              className="min-w-[12rem] flex-1"
              value={item.title}
              placeholder="Deliverable title"
              onChange={(e) =>
                onChange(
                  deliverables.map((d, i) =>
                    i === index ? { ...d, title: e.target.value } : d,
                  ),
                )
              }
            />
            <PmButton
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(reorder(deliverables, index, index - 1))}
            >
              <ArrowUp className="size-4" />
            </PmButton>
            <PmButton
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(reorder(deliverables, index, index + 1))}
            >
              <ArrowDown className="size-4" />
            </PmButton>
            <PmButton
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                const clone = {
                  ...structuredClone(item),
                  id: createEmptyDeliverable().id,
                  title: `${item.title || 'Deliverable'} (copy)`,
                  sortOrder: deliverables.length,
                }
                onChange([...deliverables, clone])
              }}
            >
              <Copy className="size-4" />
            </PmButton>
            <PmButton
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                onChange(deliverables.filter((_, i) => i !== index))
              }
            >
              <Trash2 className="size-4" />
            </PmButton>
          </div>
          <Textarea
            rows={2}
            value={item.acceptanceCriteria}
            placeholder="Acceptance criteria"
            onChange={(e) =>
              onChange(
                deliverables.map((d, i) =>
                  i === index
                    ? { ...d, acceptanceCriteria: e.target.value }
                    : d,
                ),
              )
            }
          />
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={item.workPackageId ?? ''}
            onChange={(e) =>
              onChange(
                deliverables.map((d, i) =>
                  i === index
                    ? {
                        ...d,
                        workPackageId: e.target.value || null,
                      }
                    : d,
                ),
              )
            }
          >
            <option value="">Entire opportunity</option>
            {workPackages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.title || pkg.id}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

export function MilestonesBuilder({
  milestones,
  onChange,
}: {
  milestones: OpportunityMilestone[]
  onChange: (items: OpportunityMilestone[]) => void
}) {
  return (
    <div data-slot="milestones-builder" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className={cn(pmTypography.h3)}>Milestones</h3>
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Explicit milestones for delivery planning and cash payment triggers.
          </p>
        </div>
        <PmButton
          type="button"
          onClick={() =>
            onChange([...milestones, createEmptyMilestone(milestones.length)])
          }
        >
          <Plus className="size-4" />
          Add Milestone
        </PmButton>
      </div>
      {milestones.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-md border border-border p-3">
          <div className="flex flex-wrap gap-1">
            <Input
              className="min-w-[12rem] flex-1"
              value={item.title}
              placeholder="Milestone title"
              onChange={(e) =>
                onChange(
                  milestones.map((m, i) =>
                    i === index ? { ...m, title: e.target.value } : m,
                  ),
                )
              }
            />
            <PmButton
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(reorder(milestones, index, index - 1))}
            >
              <ArrowUp className="size-4" />
            </PmButton>
            <PmButton
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(reorder(milestones, index, index + 1))}
            >
              <ArrowDown className="size-4" />
            </PmButton>
            <PmButton
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                onChange(milestones.filter((_, i) => i !== index))
              }
            >
              <Trash2 className="size-4" />
            </PmButton>
          </div>
          <Input
            type="date"
            value={item.targetDate ?? ''}
            onChange={(e) =>
              onChange(
                milestones.map((m, i) =>
                  i === index ? { ...m, targetDate: e.target.value } : m,
                ),
              )
            }
          />
          <Textarea
            rows={2}
            value={item.completionCriteria ?? ''}
            placeholder="Completion criteria"
            onChange={(e) =>
              onChange(
                milestones.map((m, i) =>
                  i === index
                    ? { ...m, completionCriteria: e.target.value }
                    : m,
                ),
              )
            }
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(item.paymentTrigger)}
              onChange={(e) =>
                onChange(
                  milestones.map((m, i) =>
                    i === index
                      ? { ...m, paymentTrigger: e.target.checked }
                      : m,
                  ),
                )
              }
            />
            Payment trigger
          </label>
        </div>
      ))}
    </div>
  )
}
