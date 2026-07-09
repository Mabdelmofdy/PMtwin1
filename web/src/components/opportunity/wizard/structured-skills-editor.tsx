import { Plus, Trash2 } from 'lucide-react'
import { PmFormField, PmFormGrid, PmFormSection } from '@/components/forms/pm-form-index'
import { PmButton } from '@/components/ui/pm-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createEmptyStructuredSkill,
  type StructuredSkill,
} from '@/domain/opportunity-creation'

export function StructuredSkillsEditor({
  label,
  skills,
  onChange,
}: {
  label: string
  skills: StructuredSkill[]
  onChange: (skills: StructuredSkill[]) => void
}) {
  const updateAt = (index: number, patch: Partial<StructuredSkill>) => {
    onChange(skills.map((skill, i) => (i === index ? { ...skill, ...patch } : skill)))
  }

  return (
    <PmFormSection title={label} description="Structured skills with level and requirements.">
      <div className="space-y-3" data-testid="structured-skills-editor">
        {skills.map((skill, index) => (
          <div
            key={`skill-${index}`}
            className="rounded-lg border border-border/60 p-3 space-y-2"
          >
            <PmFormGrid columns={2}>
              <PmFormField id={`skill-name-${index}`} label="Skill name" required>
                <Input
                  value={skill.name}
                  onChange={(e) => updateAt(index, { name: e.target.value })}
                  placeholder="BIM Coordination"
                />
              </PmFormField>
              <PmFormField id={`skill-level-${index}`} label="Level">
                <Select
                  value={skill.level}
                  onValueChange={(value) =>
                    updateAt(index, {
                      level: value as StructuredSkill['level'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </PmFormField>
              <PmFormField id={`skill-years-${index}`} label="Years required">
                <Input
                  type="number"
                  min={0}
                  value={skill.yearsRequired ?? ''}
                  onChange={(e) =>
                    updateAt(index, {
                      yearsRequired: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </PmFormField>
              <div className="flex flex-wrap items-end gap-3 pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={skill.certificationRequired}
                    onChange={(e) =>
                      updateAt(index, { certificationRequired: e.target.checked })
                    }
                  />
                  Certification required
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={skill.mandatory}
                    onChange={(e) => updateAt(index, { mandatory: e.target.checked })}
                  />
                  Mandatory
                </label>
                <PmButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(skills.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4" />
                  Remove
                </PmButton>
              </div>
            </PmFormGrid>
          </div>
        ))}
        <PmButton
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...skills, createEmptyStructuredSkill()])}
        >
          <Plus className="size-4" />
          Add skill
        </PmButton>
      </div>
    </PmFormSection>
  )
}

export function ServicesField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <PmFormField id="opp-services" label={label} help="Comma-separated">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Design Review, Coordination'}
        rows={2}
      />
    </PmFormField>
  )
}
