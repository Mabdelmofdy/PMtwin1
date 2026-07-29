import { useState } from 'react'
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react'
import { PmButton } from '@/components/ui/pm-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  createEmptyStructuredSkill,
  createEmptyTask,
  createEmptyWorkPackage,
  createEmptyDeliverable,
  skillNames,
  resolveWorkPackageInheritance,
  resolveTaskInheritance,
  type CoreInheritedFields,
  type OpportunityTask,
  type StructuredSkill,
  type WorkPackage,
} from '@/domain/opportunity-creation'
import { InheritedField } from './inherited-field.tsx'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

function reorder<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  return next.map((entry, index) =>
    typeof entry === 'object' && entry !== null && 'sortOrder' in entry
      ? ({ ...entry, sortOrder: index } as T)
      : entry,
  )
}

function skillsFromCsv(value: string): StructuredSkill[] {
  return value
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({
      ...createEmptyStructuredSkill(),
      name,
      mandatory: true,
    }))
}

function cloneSkills(
  skills: readonly StructuredSkill[] | undefined,
): StructuredSkill[] {
  if (!skills?.length) return []
  return skills.map((skill) => ({ ...skill }))
}

export type WorkPackagesBuilderProps = {
  packages: WorkPackage[]
  onChange: (packages: WorkPackage[]) => void
  /** Opportunity-level core fields used for inheritance. */
  inherited?: CoreInheritedFields
  showValidation?: boolean
}

export function WorkPackagesBuilder({
  packages,
  onChange,
  inherited = {},
  showValidation = false,
}: WorkPackagesBuilderProps) {
  const update = (index: number, patch: Partial<WorkPackage>) => {
    onChange(
      packages.map((pkg, i) => (i === index ? { ...pkg, ...patch } : pkg)),
    )
  }

  const addPackage = () => {
    onChange([...packages, createEmptyWorkPackage(packages.length)])
  }

  return (
    <div data-slot="work-packages-builder" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className={cn(pmTypography.h3)}>Work Packages</h3>
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Break the opportunity into manageable units of work. Location, dates,
            and skills inherit from the opportunity unless overridden.
          </p>
        </div>
        <PmButton type="button" onClick={addPackage}>
          <Plus className="size-4" />
          Add Work Package
        </PmButton>
      </div>

      {packages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className={cn(pmTypography.bodySm)}>No work packages yet</p>
          <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
            Break the opportunity into packages to improve matching, delivery
            planning, and commercial clarity.
          </p>
          <PmButton
            type="button"
            className="mt-3"
            variant="outline"
            onClick={addPackage}
          >
            Add First Work Package
          </PmButton>
        </div>
      ) : null}

      {packages.map((pkg, index) => {
        const tasks = pkg.tasks ?? []
        const resolved = resolveWorkPackageInheritance(pkg, inherited)
        const effectiveSkills = resolved.skills.value
        const missingSkills =
          showValidation && !effectiveSkills?.some((s) => s.name.trim())
        const missingDeadline = showValidation && !resolved.deadline.value
        const packageParent: CoreInheritedFields = {
          location: resolved.location.value,
          startDate: resolved.startDate.value,
          deadline: resolved.deadline.value,
          skills: resolved.skills.value,
          experienceLevel: resolved.experienceLevel.value,
        }

        return (
          <div
            key={pkg.id}
            className="space-y-3 rounded-lg border border-border p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                className={cn(pmTypography.label, 'text-start')}
                onClick={() => update(index, { collapsed: !pkg.collapsed })}
                aria-expanded={!pkg.collapsed}
              >
                {pkg.title || `Work Package ${index + 1}`}
              </button>
              <div className="flex flex-wrap gap-1">
                <PmButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label="Move up"
                  onClick={() => onChange(reorder(packages, index, index - 1))}
                >
                  <ArrowUp className="size-4" />
                </PmButton>
                <PmButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label="Move down"
                  onClick={() => onChange(reorder(packages, index, index + 1))}
                >
                  <ArrowDown className="size-4" />
                </PmButton>
                <PmButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label="Duplicate"
                  onClick={() => {
                    const clone: WorkPackage = {
                      ...structuredClone(pkg),
                      id: createEmptyWorkPackage().id,
                      title: `${pkg.title || 'Package'} (copy)`,
                      sortOrder: packages.length,
                      tasks: (pkg.tasks ?? []).map((t) => ({
                        ...t,
                        id: createEmptyTask(pkg.id).id,
                      })),
                    }
                    onChange([...packages, clone])
                  }}
                >
                  <Copy className="size-4" />
                </PmButton>
                <PmButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label="Delete"
                  onClick={() =>
                    onChange(packages.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="size-4" />
                </PmButton>
              </div>
            </div>

            {!pkg.collapsed ? (
              <div className="space-y-3">
                <Input
                  value={pkg.title}
                  placeholder="Package title"
                  onChange={(e) => update(index, { title: e.target.value })}
                />
                <Textarea
                  value={pkg.description}
                  placeholder="Description / scope"
                  rows={2}
                  onChange={(e) =>
                    update(index, { description: e.target.value })
                  }
                />

                <InheritedField
                  label="Package skills (required)"
                  required
                  displayValue={skillNames(effectiveSkills ?? []).join(', ')}
                  isOverridden={resolved.skills.isOverridden}
                  source={resolved.skills.source}
                  onOverride={() =>
                    update(index, {
                      requiredSkills: cloneSkills(
                        resolved.skills.inherited ?? inherited.skills,
                      ),
                    })
                  }
                  onClearOverride={() =>
                    update(index, { requiredSkills: [] })
                  }
                  error={
                    missingSkills
                      ? 'Every work package needs at least one skill (set on the opportunity or override here).'
                      : null
                  }
                >
                  <Input
                    value={skillNames(pkg.requiredSkills ?? []).join(', ')}
                    placeholder="BIM, Revit"
                    aria-invalid={missingSkills || undefined}
                    onChange={(e) =>
                      update(index, {
                        requiredSkills: skillsFromCsv(e.target.value),
                      })
                    }
                  />
                </InheritedField>

                {resolved.experienceLevel.value ? (
                  <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                    <p
                      className={cn(
                        pmTypography.caption,
                        'text-muted-foreground',
                      )}
                    >
                      Experience level
                    </p>
                    <p className={cn(pmTypography.bodySm, 'mt-0.5')}>
                      {resolved.experienceLevel.value}
                    </p>
                    <p
                      className={cn(
                        pmTypography.caption,
                        'mt-0.5 text-muted-foreground',
                      )}
                    >
                      Inherited from Opportunity
                    </p>
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <InheritedField
                    label="Location"
                    displayValue={resolved.location.value ?? ''}
                    isOverridden={resolved.location.isOverridden}
                    source={resolved.location.source}
                    onOverride={() =>
                      update(index, {
                        location:
                          resolved.location.inherited ??
                          inherited.location ??
                          '',
                      })
                    }
                    onClearOverride={() =>
                      update(index, { location: undefined })
                    }
                  >
                    <Input
                      value={pkg.location ?? ''}
                      placeholder="Riyadh, Saudi Arabia"
                      onChange={(e) =>
                        update(index, {
                          location: e.target.value || undefined,
                        })
                      }
                    />
                  </InheritedField>

                  <InheritedField
                    label="Start date"
                    displayValue={resolved.startDate.value ?? ''}
                    isOverridden={resolved.startDate.isOverridden}
                    source={resolved.startDate.source}
                    onOverride={() =>
                      update(index, {
                        startDate:
                          resolved.startDate.inherited ??
                          inherited.startDate ??
                          '',
                      })
                    }
                    onClearOverride={() =>
                      update(index, { startDate: undefined })
                    }
                  >
                    <Input
                      type="date"
                      value={pkg.startDate ?? ''}
                      onChange={(e) =>
                        update(index, {
                          startDate: e.target.value || undefined,
                        })
                      }
                    />
                  </InheritedField>

                  <InheritedField
                    label="Deadline (required)"
                    required
                    displayValue={resolved.deadline.value ?? ''}
                    isOverridden={resolved.deadline.isOverridden}
                    source={resolved.deadline.source}
                    onOverride={() =>
                      update(index, {
                        deadline:
                          resolved.deadline.inherited ??
                          inherited.deadline ??
                          '',
                      })
                    }
                    onClearOverride={() =>
                      update(index, { deadline: undefined })
                    }
                    error={
                      missingDeadline
                        ? 'Every work package needs a deadline (set on the opportunity or override here).'
                        : null
                    }
                  >
                    <Input
                      type="date"
                      value={pkg.deadline ?? ''}
                      aria-invalid={missingDeadline || undefined}
                      onChange={(e) =>
                        update(index, {
                          deadline: e.target.value || undefined,
                        })
                      }
                    />
                  </InheritedField>
                </div>

                <div className="space-y-2 border-t border-border/60 pt-3">
                  <div className="flex items-center justify-between">
                    <p className={cn(pmTypography.label)}>Tasks</p>
                    <PmButton
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        update(index, {
                          tasks: [
                            ...tasks,
                            createEmptyTask(pkg.id, tasks.length),
                          ],
                        })
                      }
                    >
                      <Plus className="size-4" />
                      Add Task
                    </PmButton>
                  </div>
                  {tasks.map((task, taskIndex) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      packageParent={packageParent}
                      onChange={(patch) => {
                        const next = tasks.map((t, i) =>
                          i === taskIndex ? { ...t, ...patch } : t,
                        )
                        update(index, { tasks: next })
                      }}
                      onDelete={() =>
                        update(index, {
                          tasks: tasks.filter((_, i) => i !== taskIndex),
                        })
                      }
                      onMove={(dir) =>
                        update(index, {
                          tasks: reorder(tasks, taskIndex, taskIndex + dir),
                        })
                      }
                      onDuplicate={() => {
                        const clone: OpportunityTask = {
                          ...structuredClone(task),
                          id: createEmptyTask(pkg.id).id,
                          title: `${task.title || 'Task'} (copy)`,
                          sortOrder: tasks.length,
                        }
                        update(index, { tasks: [...tasks, clone] })
                      }}
                    />
                  ))}
                </div>

                <div className="space-y-2 border-t border-border/60 pt-3">
                  {/* TODO: Remove per-package deliverables editor when consolidating
                      into one opportunity-level list (see DeliverablesBuilder). */}
                  <div className="flex items-center justify-between">
                    <p className={cn(pmTypography.label)}>Package deliverables</p>
                    <PmButton
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        update(index, {
                          deliverables: [
                            ...pkg.deliverables,
                            createEmptyDeliverable(
                              pkg.deliverables.length,
                              pkg.id,
                            ),
                          ],
                        })
                      }
                    >
                      <Plus className="size-4" />
                      Add Deliverable
                    </PmButton>
                  </div>
                  {pkg.deliverables.map((d, di) => (
                    <div key={d.id} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <Input
                        value={d.title}
                        placeholder="Deliverable title"
                        onChange={(e) =>
                          update(index, {
                            deliverables: pkg.deliverables.map((item, i) =>
                              i === di
                                ? { ...item, title: e.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <PmButton
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          update(index, {
                            deliverables: pkg.deliverables.filter(
                              (_, i) => i !== di,
                            ),
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </PmButton>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function TaskRow({
  task,
  packageParent,
  onChange,
  onDelete,
  onMove,
  onDuplicate,
}: {
  task: OpportunityTask
  packageParent: CoreInheritedFields
  onChange: (patch: Partial<OpportunityTask>) => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
  onDuplicate: () => void
}) {
  const [showOverrides, setShowOverrides] = useState(false)
  const resolved = resolveTaskInheritance(task, packageParent)
  const anyOverridden =
    resolved.location.isOverridden ||
    resolved.startDate.isOverridden ||
    resolved.endDate.isOverridden
  const summaryParts = [
    resolved.startDate.value
      ? `Start ${resolved.startDate.value}`
      : null,
    resolved.endDate.value ? `End ${resolved.endDate.value}` : null,
    resolved.location.value || null,
    resolved.skills.value
      ? skillNames(resolved.skills.value).join(', ')
      : null,
  ].filter(Boolean)

  return (
    <div className="space-y-2 rounded-md border border-border/60 p-3">
      <div className="flex flex-wrap gap-1">
        <Input
          className="min-w-[12rem] flex-1"
          value={task.title}
          placeholder="Task title"
          onChange={(e) => onChange({ title: e.target.value })}
        />
        <PmButton type="button" size="sm" variant="ghost" onClick={() => onMove(-1)}>
          <ArrowUp className="size-4" />
        </PmButton>
        <PmButton type="button" size="sm" variant="ghost" onClick={() => onMove(1)}>
          <ArrowDown className="size-4" />
        </PmButton>
        <PmButton type="button" size="sm" variant="ghost" onClick={onDuplicate}>
          <Copy className="size-4" />
        </PmButton>
        <PmButton type="button" size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="size-4" />
        </PmButton>
      </div>
      <Textarea
        rows={2}
        value={task.description ?? ''}
        placeholder="Task description"
        onChange={(e) => onChange({ description: e.target.value })}
      />

      <div className="rounded-md border border-border/40 bg-muted/15 px-2.5 py-2 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            {summaryParts.length > 0
              ? summaryParts.join(' · ')
              : 'Dates, location, and skills inherit from the work package'}
            {!anyOverridden && summaryParts.length > 0
              ? ' · Inherited from Work Package'
              : null}
          </p>
          <button
            type="button"
            className={cn(
              pmTypography.caption,
              'text-primary underline-offset-2 hover:underline',
            )}
            onClick={() => setShowOverrides((v) => !v)}
            aria-expanded={showOverrides}
          >
            {showOverrides || anyOverridden ? 'Hide overrides' : 'Override'}
          </button>
        </div>

        {showOverrides || anyOverridden ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <InheritedField
              label="Start date"
              displayValue={resolved.startDate.value ?? ''}
              isOverridden={resolved.startDate.isOverridden}
              source={resolved.startDate.source}
              onOverride={() =>
                onChange({
                  startDate:
                    resolved.startDate.inherited ??
                    packageParent.startDate ??
                    '',
                })
              }
              onClearOverride={() => onChange({ startDate: undefined })}
            >
              <Input
                type="date"
                value={task.startDate ?? ''}
                onChange={(e) =>
                  onChange({ startDate: e.target.value || undefined })
                }
              />
            </InheritedField>
            <InheritedField
              label="End date"
              displayValue={resolved.endDate.value ?? ''}
              isOverridden={resolved.endDate.isOverridden}
              source={resolved.endDate.source}
              onOverride={() =>
                onChange({
                  endDate:
                    resolved.endDate.inherited ?? packageParent.deadline ?? '',
                })
              }
              onClearOverride={() => onChange({ endDate: undefined })}
            >
              <Input
                type="date"
                value={task.endDate ?? ''}
                onChange={(e) =>
                  onChange({ endDate: e.target.value || undefined })
                }
              />
            </InheritedField>
            <InheritedField
              label="Location"
              displayValue={resolved.location.value ?? ''}
              isOverridden={resolved.location.isOverridden}
              source={resolved.location.source}
              onOverride={() =>
                onChange({
                  location:
                    resolved.location.inherited ??
                    packageParent.location ??
                    '',
                })
              }
              onClearOverride={() => onChange({ location: undefined })}
            >
              <Input
                value={task.location ?? ''}
                placeholder="Location"
                onChange={(e) =>
                  onChange({ location: e.target.value || undefined })
                }
              />
            </InheritedField>
          </div>
        ) : null}
      </div>
    </div>
  )
}
