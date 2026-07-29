import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createEmptyStructuredSkill,
  createEmptyTask,
  createEmptyWorkPackage,
  opportunityCoreFields,
  resolveTaskInheritance,
  resolveWorkPackageInheritance,
  resolveWorkPackagesEffective,
  type StructuredSkill,
} from '@/domain/opportunity-creation'

function skill(name: string): StructuredSkill {
  return { ...createEmptyStructuredSkill(), name, mandatory: true }
}

describe('opportunityCoreFields', () => {
  it('extracts trimmed core fields and drops empties', () => {
    const core = opportunityCoreFields({
      location: '  Riyadh  ',
      startDate: '2026-09-01',
      tenderDeadline: '',
      structuredSkills: [skill('BIM'), { ...skill(''), name: '  ' }],
      experienceLevel: ' Senior ',
    })
    assert.equal(core.location, 'Riyadh')
    assert.equal(core.startDate, '2026-09-01')
    assert.equal(core.deadline, undefined)
    assert.equal(core.experienceLevel, 'Senior')
    assert.deepEqual(
      core.skills?.map((s) => s.name),
      ['BIM'],
    )
  })

  it('returns undefined skills when none are named', () => {
    const core = opportunityCoreFields({
      structuredSkills: [{ ...createEmptyStructuredSkill(), name: '' }],
    })
    assert.equal(core.skills, undefined)
  })
})

describe('resolveWorkPackageInheritance', () => {
  it('inherits empty package fields from opportunity', () => {
    const parent = opportunityCoreFields({
      location: 'Jeddah',
      startDate: '2026-10-01',
      tenderDeadline: '2026-12-01',
      structuredSkills: [skill('Revit')],
      experienceLevel: 'expert',
    })
    const pkg = createEmptyWorkPackage()
    const resolved = resolveWorkPackageInheritance(pkg, parent)

    assert.equal(resolved.location.isOverridden, false)
    assert.equal(resolved.location.source, 'opportunity')
    assert.equal(resolved.location.value, 'Jeddah')
    assert.equal(resolved.startDate.value, '2026-10-01')
    assert.equal(resolved.deadline.value, '2026-12-01')
    assert.equal(resolved.skills.source, 'opportunity')
    assert.deepEqual(
      resolved.skills.value?.map((s) => s.name),
      ['Revit'],
    )
    assert.equal(resolved.experienceLevel.value, 'expert')
    assert.equal(resolved.experienceLevel.isOverridden, false)
  })

  it('treats non-empty package values as overrides', () => {
    const parent = opportunityCoreFields({
      location: 'Jeddah',
      startDate: '2026-10-01',
      tenderDeadline: '2026-12-01',
      structuredSkills: [skill('Revit')],
    })
    const pkg = {
      ...createEmptyWorkPackage(),
      location: 'Dammam',
      startDate: '2026-11-01',
      deadline: '2027-01-15',
      requiredSkills: [skill('Navisworks')],
    }
    const resolved = resolveWorkPackageInheritance(pkg, parent)

    assert.equal(resolved.location.isOverridden, true)
    assert.equal(resolved.location.source, 'own')
    assert.equal(resolved.location.value, 'Dammam')
    assert.equal(resolved.location.inherited, 'Jeddah')
    assert.equal(resolved.startDate.value, '2026-11-01')
    assert.equal(resolved.deadline.value, '2027-01-15')
    assert.deepEqual(
      resolved.skills.value?.map((s) => s.name),
      ['Navisworks'],
    )
  })

  it('reports none when both package and opportunity are empty', () => {
    const resolved = resolveWorkPackageInheritance(
      createEmptyWorkPackage(),
      opportunityCoreFields({}),
    )
    assert.equal(resolved.deadline.source, 'none')
    assert.equal(resolved.deadline.value, undefined)
    assert.equal(resolved.skills.source, 'none')
  })
})

describe('resolveTaskInheritance', () => {
  it('inherits from effective work-package parent', () => {
    const parent = {
      location: 'Riyadh',
      startDate: '2026-09-01',
      deadline: '2026-11-01',
      skills: [skill('BIM')],
    }
    const task = createEmptyTask('wp-1')
    const resolved = resolveTaskInheritance(task, parent)

    assert.equal(resolved.location.value, 'Riyadh')
    assert.equal(resolved.location.source, 'workPackage')
    assert.equal(resolved.startDate.value, '2026-09-01')
    assert.equal(resolved.endDate.value, '2026-11-01')
    assert.deepEqual(
      resolved.skills.value?.map((s) => s.name),
      ['BIM'],
    )
  })

  it('allows task-level overrides', () => {
    const parent = {
      location: 'Riyadh',
      startDate: '2026-09-01',
      deadline: '2026-11-01',
      skills: [skill('BIM')],
    }
    const task = {
      ...createEmptyTask('wp-1'),
      location: 'On site',
      endDate: '2026-10-15',
    }
    const resolved = resolveTaskInheritance(task, parent)
    assert.equal(resolved.location.isOverridden, true)
    assert.equal(resolved.location.value, 'On site')
    assert.equal(resolved.endDate.value, '2026-10-15')
    assert.equal(resolved.startDate.isOverridden, false)
  })
})

describe('resolveWorkPackagesEffective', () => {
  it('materializes inherited package and nested task fields', () => {
    const parent = opportunityCoreFields({
      location: 'Riyadh',
      startDate: '2026-08-01',
      tenderDeadline: '2026-12-31',
      structuredSkills: [skill('BIM'), skill('Revit')],
      experienceLevel: 'Senior',
    })
    const pkg = {
      ...createEmptyWorkPackage(),
      title: 'Federation',
      description: 'Model federation',
      requiredSkills: [],
      tasks: [
        {
          ...createEmptyTask('wp-x'),
          title: 'Clash detection',
        },
      ],
    }
    const [effective] = resolveWorkPackagesEffective([pkg], parent)
    assert.ok(effective)
    assert.equal(effective.location, 'Riyadh')
    assert.equal(effective.startDate, '2026-08-01')
    assert.equal(effective.deadline, '2026-12-31')
    assert.deepEqual(
      effective.requiredSkills.map((s) => s.name),
      ['BIM', 'Revit'],
    )
    assert.equal(effective.tasks?.[0]?.location, 'Riyadh')
    assert.equal(effective.tasks?.[0]?.startDate, '2026-08-01')
    assert.equal(effective.tasks?.[0]?.endDate, '2026-12-31')
    assert.deepEqual(
      effective.tasks?.[0]?.requiredSkills?.map((s) => s.name),
      ['BIM', 'Revit'],
    )
  })

  it('preserves package overrides when materializing', () => {
    const parent = opportunityCoreFields({
      location: 'Riyadh',
      tenderDeadline: '2026-12-31',
      structuredSkills: [skill('BIM')],
    })
    const pkg = {
      ...createEmptyWorkPackage(),
      title: 'Override package',
      description: 'Scoped differently',
      location: 'NEOM',
      deadline: '2026-10-01',
      requiredSkills: [skill('Civil 3D')],
    }
    const [effective] = resolveWorkPackagesEffective([pkg], parent)
    assert.equal(effective?.location, 'NEOM')
    assert.equal(effective?.deadline, '2026-10-01')
    assert.deepEqual(
      effective?.requiredSkills.map((s) => s.name),
      ['Civil 3D'],
    )
  })
})
