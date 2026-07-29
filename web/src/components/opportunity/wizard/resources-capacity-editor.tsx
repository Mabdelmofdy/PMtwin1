import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PmFormField, PmFormGrid, PmFormSection } from '@/components/forms/pm-form-index'
import { PmButton } from '@/components/ui/pm-button'
import { Input } from '@/components/ui/input'
import { PmSingleSelect } from '@/components/ui/pm-multi-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createEmptyResource,
  type OfferCapacity,
  type OpportunityResource,
  type WorkPackage,
} from '@/domain/opportunity-creation'
import {
  isAssetOutsideCoverage,
  primaryLocationSelectOptions,
} from '@/domain/locations'

const RESOURCE_TYPES: OpportunityResource['type'][] = [
  'people',
  'equipment',
  'vehicles',
  'materials',
  'software',
  'licenses',
]

export function ResourcesCapacityEditor({
  resources,
  capacity,
  workPackages,
  showCapacity,
  onResourcesChange,
  onCapacityChange,
  fieldStatus,
  primaryLocation,
  coverageAreas = [],
}: {
  resources: OpportunityResource[]
  capacity: OfferCapacity
  workPackages: WorkPackage[]
  showCapacity: boolean
  onResourcesChange: (resources: OpportunityResource[]) => void
  onCapacityChange: (capacity: OfferCapacity) => void
  fieldStatus?: ReactNode
  /** Opportunity primary location scope ID — for asset-outside-coverage hints. */
  primaryLocation?: string
  coverageAreas?: readonly string[]
}) {
  const updateAt = (index: number, patch: Partial<OpportunityResource>) => {
    onResourcesChange(
      resources.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    )
  }

  const locationOptions = useMemo(() => primaryLocationSelectOptions(), [])

  return (
    <div className="space-y-4" data-testid="resources-capacity-editor">
      {fieldStatus}
      <PmFormSection
        title="Resources"
        description="People, equipment, vehicles, materials, software, and licenses. Optionally associate with a work package."
      >
        <div className="space-y-3">
          {resources.map((resource, index) => (
            <div
              key={`res-${index}`}
              className="rounded-lg border border-border/60 p-3 space-y-2"
            >
              <PmFormGrid columns={2}>
                <PmFormField id={`res-type-${index}`} label="Type">
                  <Select
                    value={resource.type}
                    onValueChange={(value) =>
                      updateAt(index, {
                        type: value as OpportunityResource['type'],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PmFormField>
                <PmFormField id={`res-name-${index}`} label="Name" required>
                  <Input
                    value={resource.name}
                    onChange={(e) => updateAt(index, { name: e.target.value })}
                  />
                </PmFormField>
                <PmFormField id={`res-qty-${index}`} label="Quantity">
                  <Input
                    type="number"
                    value={resource.quantity}
                    onChange={(e) =>
                      updateAt(index, { quantity: Number(e.target.value) || 0 })
                    }
                  />
                </PmFormField>
                <PmFormField id={`res-unit-${index}`} label="Unit">
                  <Input
                    value={resource.unit}
                    onChange={(e) => updateAt(index, { unit: e.target.value })}
                  />
                </PmFormField>
                <PmFormField id={`res-avail-${index}`} label="Availability">
                  <Input
                    value={resource.availability ?? ''}
                    onChange={(e) =>
                      updateAt(index, { availability: e.target.value })
                    }
                  />
                </PmFormField>
                <PmFormField
                  id={`res-location-${index}`}
                  label="Asset location"
                  hint="Optional — where this asset sits"
                  error={
                    isAssetOutsideCoverage(
                      resource.location,
                      primaryLocation,
                      coverageAreas,
                    )
                      ? 'Outside declared coverage areas'
                      : null
                  }
                >
                  <PmSingleSelect
                    id={`res-location-${index}`}
                    value={resource.location ?? ''}
                    onChange={(next) =>
                      updateAt(index, {
                        location: next || undefined,
                      })
                    }
                    options={locationOptions}
                    placeholder="Select location (optional)"
                    searchPlaceholder="Search locations…"
                  />
                </PmFormField>
                <PmFormField id={`res-wp-${index}`} label="Work package (optional)">
                  <Select
                    value={resource.workPackageId ?? '__global__'}
                    onValueChange={(value) =>
                      updateAt(index, {
                        workPackageId: value === '__global__' ? null : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Global" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__global__">Global (opportunity-level)</SelectItem>
                      {workPackages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.title || pkg.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PmFormField>
              </PmFormGrid>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={resource.mandatory}
                    onChange={(e) =>
                      updateAt(index, { mandatory: e.target.checked })
                    }
                  />
                  Mandatory
                </label>
                <PmButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onResourcesChange(resources.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="size-4" />
                  Remove
                </PmButton>
              </div>
              <PmFormField id={`res-notes-${index}`} label="Notes">
                <Input
                  value={resource.notes ?? ''}
                  onChange={(e) => updateAt(index, { notes: e.target.value })}
                />
              </PmFormField>
            </div>
          ))}
          <PmButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onResourcesChange([...resources, createEmptyResource()])}
          >
            <Plus className="size-4" />
            Add resource
          </PmButton>
        </div>
      </PmFormSection>

      {showCapacity ? (
        <PmFormSection
          title="Available capacity"
          description="Offer capacity metadata only — not used by matching."
        >
          <PmFormGrid columns={2}>
            <PmFormField id="cap-available" label="Available capacity">
              <Input
                type="number"
                value={capacity.availableCapacity ?? ''}
                onChange={(e) =>
                  onCapacityChange({
                    ...capacity,
                    availableCapacity: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </PmFormField>
            <PmFormField id="cap-reserved" label="Reserved capacity">
              <Input
                type="number"
                value={capacity.reservedCapacity ?? ''}
                onChange={(e) =>
                  onCapacityChange({
                    ...capacity,
                    reservedCapacity: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </PmFormField>
            <PmFormField id="cap-max" label="Maximum capacity">
              <Input
                type="number"
                value={capacity.maximumCapacity ?? ''}
                onChange={(e) =>
                  onCapacityChange({
                    ...capacity,
                    maximumCapacity: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </PmFormField>
            <PmFormField id="cap-from" label="Available from">
              <Input
                type="date"
                value={capacity.availableFrom ?? ''}
                onChange={(e) =>
                  onCapacityChange({
                    ...capacity,
                    availableFrom: e.target.value || undefined,
                  })
                }
              />
            </PmFormField>
          </PmFormGrid>
        </PmFormSection>
      ) : null}
    </div>
  )
}
