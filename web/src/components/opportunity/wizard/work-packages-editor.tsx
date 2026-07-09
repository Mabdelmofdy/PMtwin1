import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { PmFormField, PmFormGrid, PmFormSection } from '@/components/forms/pm-form-index'
import { PmButton } from '@/components/ui/pm-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  createEmptyDeliverable,
  createEmptyWorkPackage,
  type Deliverable,
  type WorkPackage,
  type WorkPackageDocumentRequirement,
} from '@/domain/opportunity-creation'

function DocListEditor({
  label,
  docs,
  onChange,
}: {
  label: string
  docs: WorkPackageDocumentRequirement[]
  onChange: (docs: WorkPackageDocumentRequirement[]) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {docs.map((doc, index) => (
        <div key={`${label}-${index}`} className="flex gap-2">
          <Input
            value={doc.name}
            onChange={(e) =>
              onChange(
                docs.map((item, i) =>
                  i === index ? { ...item, name: e.target.value } : item,
                ),
              )
            }
            placeholder="Safety Certificate"
          />
          <PmButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(docs.filter((_, i) => i !== index))}
          >
            <Trash2 className="size-4" />
          </PmButton>
        </div>
      ))}
      <PmButton
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...docs, { name: '' }])}
      >
        <Plus className="size-4" />
        Add document
      </PmButton>
    </div>
  )
}

function DeliverablesEditor({
  deliverables,
  onChange,
}: {
  deliverables: Deliverable[]
  onChange: (items: Deliverable[]) => void
}) {
  return (
    <div className="space-y-2" data-testid="deliverables-editor">
      <p className="text-sm font-medium">Deliverables</p>
      {deliverables.map((item, index) => (
        <div key={`del-${index}`} className="rounded border border-border/50 p-2 space-y-2">
          <Input
            value={item.title}
            onChange={(e) =>
              onChange(
                deliverables.map((d, i) =>
                  i === index ? { ...d, title: e.target.value } : d,
                ),
              )
            }
            placeholder="Deliverable title"
          />
          <Textarea
            value={item.acceptanceCriteria}
            onChange={(e) =>
              onChange(
                deliverables.map((d, i) =>
                  i === index
                    ? { ...d, acceptanceCriteria: e.target.value }
                    : d,
                ),
              )
            }
            placeholder="Acceptance criteria"
            rows={2}
          />
          <Input
            value={item.milestoneReference ?? ''}
            onChange={(e) =>
              onChange(
                deliverables.map((d, i) =>
                  i === index
                    ? { ...d, milestoneReference: e.target.value || undefined }
                    : d,
                ),
              )
            }
            placeholder="Milestone reference"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.mandatory}
                onChange={(e) =>
                  onChange(
                    deliverables.map((d, i) =>
                      i === index ? { ...d, mandatory: e.target.checked } : d,
                    ),
                  )
                }
              />
              Mandatory
            </label>
            <PmButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(deliverables.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" />
            </PmButton>
          </div>
        </div>
      ))}
      <PmButton
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...deliverables, createEmptyDeliverable()])}
      >
        <Plus className="size-4" />
        Add deliverable
      </PmButton>
    </div>
  )
}

export function WorkPackagesEditor({
  packages,
  onChange,
}: {
  packages: WorkPackage[]
  onChange: (packages: WorkPackage[]) => void
}) {
  const updateAt = (index: number, patch: Partial<WorkPackage>) => {
    onChange(packages.map((pkg, i) => (i === index ? { ...pkg, ...patch } : pkg)))
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= packages.length) return
    const next = [...packages]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item!)
    onChange(next.map((pkg, i) => ({ ...pkg, sortOrder: i })))
  }

  return (
    <PmFormSection
      title="Work packages / tasks"
      description="Add multiple task packages with deliverables and document requirements."
    >
      <div className="space-y-4" data-testid="work-packages-editor">
        {packages.map((pkg, index) => (
          <div
            key={pkg.id}
            className="rounded-lg border border-border/60 p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">Package {index + 1}</p>
              <div className="flex gap-1">
                <PmButton type="button" variant="ghost" size="sm" onClick={() => move(index, -1)}>
                  <ArrowUp className="size-4" />
                </PmButton>
                <PmButton type="button" variant="ghost" size="sm" onClick={() => move(index, 1)}>
                  <ArrowDown className="size-4" />
                </PmButton>
                <PmButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(packages.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4" />
                </PmButton>
              </div>
            </div>
            <PmFormGrid columns={2}>
              <PmFormField id={`wp-title-${pkg.id}`} label="Title" required>
                <Input
                  value={pkg.title}
                  onChange={(e) => updateAt(index, { title: e.target.value })}
                />
              </PmFormField>
              <PmFormField id={`wp-location-${pkg.id}`} label="Location">
                <Input
                  value={pkg.location ?? ''}
                  onChange={(e) => updateAt(index, { location: e.target.value })}
                />
              </PmFormField>
              <PmFormGridItemFull>
                <PmFormField id={`wp-desc-${pkg.id}`} label="Description">
                  <Textarea
                    value={pkg.description}
                    onChange={(e) => updateAt(index, { description: e.target.value })}
                    rows={2}
                  />
                </PmFormField>
              </PmFormGridItemFull>
              <PmFormField id={`wp-start-${pkg.id}`} label="Start date">
                <Input
                  type="date"
                  value={pkg.startDate ?? ''}
                  onChange={(e) => updateAt(index, { startDate: e.target.value })}
                />
              </PmFormField>
              <PmFormField id={`wp-deadline-${pkg.id}`} label="Deadline">
                <Input
                  type="date"
                  value={pkg.deadline ?? ''}
                  onChange={(e) => updateAt(index, { deadline: e.target.value })}
                />
              </PmFormField>
              <PmFormField id={`wp-budget-${pkg.id}`} label="Estimated budget / value">
                <Input
                  type="number"
                  value={pkg.estimatedBudget ?? ''}
                  onChange={(e) =>
                    updateAt(index, {
                      estimatedBudget: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </PmFormField>
              <PmFormField id={`wp-currency-${pkg.id}`} label="Currency">
                <Input
                  value={pkg.currency ?? 'SAR'}
                  onChange={(e) => updateAt(index, { currency: e.target.value })}
                />
              </PmFormField>
            </PmFormGrid>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pkg.mandatory}
                onChange={(e) => updateAt(index, { mandatory: e.target.checked })}
              />
              Mandatory package
            </label>
            <DeliverablesEditor
              deliverables={pkg.deliverables}
              onChange={(deliverables) => updateAt(index, { deliverables })}
            />
            <DocListEditor
              label="Required documents"
              docs={pkg.requiredDocuments ?? []}
              onChange={(requiredDocuments) => updateAt(index, { requiredDocuments })}
            />
            <DocListEditor
              label="Optional documents"
              docs={pkg.optionalDocuments ?? []}
              onChange={(optionalDocuments) => updateAt(index, { optionalDocuments })}
            />
          </div>
        ))}
        <PmButton
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([...packages, createEmptyWorkPackage(packages.length)])
          }
        >
          <Plus className="size-4" />
          Add work package
        </PmButton>
      </div>
    </PmFormSection>
  )
}

function PmFormGridItemFull({ children }: { children: ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>
}
