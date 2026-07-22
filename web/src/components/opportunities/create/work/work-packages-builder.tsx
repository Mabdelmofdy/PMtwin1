import { useEffect, useRef } from 'react'
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
  type OpportunityTask,
  type StructuredSkill,
  type WorkPackage,
} from '@/domain/opportunity-creation'
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

export type WorkPackagesBuilderProps = {
  packages: WorkPackage[]
  onChange: (packages: WorkPackage[]) => void
  /** Opportunity-level skills used to seed new packages. */
  seedSkills?: readonly StructuredSkill[]
  showValidation?: boolean
}

export function WorkPackagesBuilder({
  packages,
  onChange,
  seedSkills = [],
  showValidation = false,
}: WorkPackagesBuilderProps) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const update = (index: number, patch: Partial<WorkPackage>) => {
    onChange(
      packages.map((pkg, i) => (i === index ? { ...pkg, ...patch } : pkg)),
    )
  }

  const addPackage = () => {
    const next = createEmptyWorkPackage(packages.length)
    const seeded = skillNames(seedSkills)
    if (seeded.length > 0) {
      next.requiredSkills = seeded.map((name) => ({
        ...createEmptyStructuredSkill(),
        name,
        mandatory: true,
      }))
    }
    onChange([...packages, next])
  }

  useEffect(() => {
    const seeded = skillNames(seedSkills)
    if (seeded.length === 0 || packages.length === 0) return
    let changed = false
    const next = packages.map((pkg) => {
      if (pkg.requiredSkills?.some((skill) => skill.name.trim())) return pkg
      changed = true
      return {
        ...pkg,
        requiredSkills: seeded.map((name) => ({
          ...createEmptyStructuredSkill(),
          name,
          mandatory: true,
        })),
      }
    })
    if (changed) onChangeRef.current(next)
  }, [packages, seedSkills])

  return (
    <div data-slot="work-packages-builder" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className={cn(pmTypography.h3)}>Work Packages</h3>
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Break the opportunity into manageable units of work.
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
        const missingSkills =
          showValidation && !(pkg.requiredSkills?.some((s) => s.name.trim()) ?? false)
        const missingDeadline = showValidation && !pkg.deadline?.trim()
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
                <div>
                  <label className={cn(pmTypography.caption, 'mb-1 block text-muted-foreground')}>
                    Package skills (required)
                  </label>
                  <Input
                    value={skillNames(pkg.requiredSkills ?? []).join(', ')}
                    placeholder="BIM, Revit"
                    aria-invalid={missingSkills || undefined}
                    onChange={(e) =>
                      update(index, { requiredSkills: skillsFromCsv(e.target.value) })
                    }
                  />
                  {missingSkills ? (
                    <p className="mt-1 text-sm text-danger" role="alert">
                      Every work package needs at least one skill.
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className={cn(pmTypography.caption, 'mb-1 block text-muted-foreground')}>
                      Start date
                    </label>
                    <Input
                      type="date"
                      value={pkg.startDate ?? ''}
                      onChange={(e) => update(index, { startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={cn(pmTypography.caption, 'mb-1 block text-muted-foreground')}>
                      Deadline (required)
                    </label>
                    <Input
                      type="date"
                      value={pkg.deadline ?? ''}
                      aria-invalid={missingDeadline || undefined}
                      onChange={(e) => update(index, { deadline: e.target.value })}
                    />
                    {missingDeadline ? (
                      <p className="mt-1 text-sm text-danger" role="alert">
                        Every work package needs a deadline.
                      </p>
                    ) : null}
                  </div>
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
  onChange,
  onDelete,
  onMove,
  onDuplicate,
}: {
  task: OpportunityTask
  onChange: (patch: Partial<OpportunityTask>) => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
  onDuplicate: () => void
}) {
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
    </div>
  )
}
