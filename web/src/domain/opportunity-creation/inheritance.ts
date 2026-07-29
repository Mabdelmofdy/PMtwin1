/**
 * Opportunity Wizard field inheritance — developer note
 * =====================================================
 *
 * Opportunity is the Single Source of Truth for Location, Start Date, Deadline,
 * Skills, and Experience Level.
 *
 * Implicit model (no schema flags):
 * - Empty / undefined child value = inherited from parent.
 * - Non-empty child value = override.
 * Existing records that already carry values read back as overridden.
 *
 * Resolution seam:
 * - Authoring draft stores sparse overrides only (child fields left empty when
 *   inheriting).
 * - Effective values are materialized in
 *   `web/src/components/opportunity/wizard/draft-model.ts`
 *   (`buildOpportunityDraftInput` → `resolveWorkPackagesEffective`).
 * - `collaborationAttributes.workPackages` = sparse overrides (round-trip for
 *   edit / reload / clone).
 * - Top-level `workPackages` = resolved (effective) values for compatibility
 *   with validation, command payloads, and older consumers.
 *
 * Downstream consumers (validation, readiness, command payloads, details) read
 * resolved / opportunity-level values. Matching currently evaluates
 * opportunity-level skills only — work-package skill overrides are
 * intentionally ignored by the matching engine.
 *
 * Deferred (see TODOs at call sites):
 * - Deliverables consolidation (opp-level list vs per-package lists)
 * - Payment terms inheritance (no opportunity-level source yet)
 * - Experience level vocabulary alignment with skill level enum
 * - Remove legacy unused wizard components (WorkPackagesEditor, CommercialTermsStep)
 */

import type {
  OpportunityTask,
  StructuredSkill,
  WorkPackage,
} from './types.ts'

export type CoreInheritedFields = {
  readonly location?: string
  readonly startDate?: string
  readonly deadline?: string
  readonly skills?: readonly StructuredSkill[]
  /**
   * Display-only downstream — packages/tasks have no override field.
   * TODO: Align experience-level vocabulary with skill level enum
   * (`basic` | `intermediate` | `expert`) so per-skill Level can inherit it.
   */
  readonly experienceLevel?: string
}

export type InheritedValueSource =
  | 'own'
  | 'opportunity'
  | 'workPackage'
  | 'none'

export type InheritedValue<T> = {
  /** Effective value after inheritance. */
  readonly value: T | undefined
  /** Parent value available for inheritance. */
  readonly inherited: T | undefined
  readonly isOverridden: boolean
  readonly source: InheritedValueSource
}

export type WorkPackageInheritance = {
  readonly location: InheritedValue<string>
  readonly startDate: InheritedValue<string>
  readonly deadline: InheritedValue<string>
  readonly skills: InheritedValue<readonly StructuredSkill[]>
  readonly experienceLevel: InheritedValue<string>
}

export type TaskInheritance = {
  readonly location: InheritedValue<string>
  readonly startDate: InheritedValue<string>
  readonly endDate: InheritedValue<string>
  readonly skills: InheritedValue<readonly StructuredSkill[]>
}

function hasText(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hasNamedSkills(
  skills: readonly StructuredSkill[] | undefined | null,
): boolean {
  return Boolean(skills?.some((skill) => skill.name.trim()))
}

function textOrUndefined(value: string | undefined | null): string | undefined {
  return hasText(value) ? String(value).trim() : undefined
}

function skillsOrUndefined(
  skills: readonly StructuredSkill[] | undefined | null,
): readonly StructuredSkill[] | undefined {
  if (!skills?.length) return undefined
  const named = skills.filter((skill) => skill.name.trim())
  return named.length > 0 ? named : undefined
}

function resolveString(
  own: string | undefined | null,
  parent: string | undefined,
  parentSource: 'opportunity' | 'workPackage',
): InheritedValue<string> {
  const inherited = textOrUndefined(parent)
  if (hasText(own)) {
    return {
      value: String(own).trim(),
      inherited,
      isOverridden: true,
      source: 'own',
    }
  }
  if (inherited) {
    return {
      value: inherited,
      inherited,
      isOverridden: false,
      source: parentSource,
    }
  }
  return {
    value: undefined,
    inherited: undefined,
    isOverridden: false,
    source: 'none',
  }
}

function resolveSkills(
  own: readonly StructuredSkill[] | undefined | null,
  parent: readonly StructuredSkill[] | undefined,
  parentSource: 'opportunity' | 'workPackage',
): InheritedValue<readonly StructuredSkill[]> {
  const inherited = skillsOrUndefined(parent)
  if (hasNamedSkills(own)) {
    return {
      value: own!,
      inherited,
      isOverridden: true,
      source: 'own',
    }
  }
  if (inherited) {
    return {
      value: inherited,
      inherited,
      isOverridden: false,
      source: parentSource,
    }
  }
  return {
    value: undefined,
    inherited: undefined,
    isOverridden: false,
    source: 'none',
  }
}

/**
 * Extract opportunity-level core fields used as the inheritance parent.
 * Accepts a structural shape so draft-model can pass OpportunityDraft without
 * the domain layer importing wizard component types.
 */
export function opportunityCoreFields(source: {
  location?: string
  startDate?: string
  tenderDeadline?: string
  structuredSkills?: readonly StructuredSkill[]
  experienceLevel?: string
}): CoreInheritedFields {
  return {
    location: textOrUndefined(source.location),
    startDate: textOrUndefined(source.startDate),
    deadline: textOrUndefined(source.tenderDeadline),
    skills: skillsOrUndefined(source.structuredSkills),
    experienceLevel: textOrUndefined(source.experienceLevel),
  }
}

export function resolveWorkPackageInheritance(
  pkg: WorkPackage,
  parent: CoreInheritedFields,
): WorkPackageInheritance {
  return {
    location: resolveString(pkg.location, parent.location, 'opportunity'),
    startDate: resolveString(pkg.startDate, parent.startDate, 'opportunity'),
    deadline: resolveString(pkg.deadline, parent.deadline, 'opportunity'),
    skills: resolveSkills(pkg.requiredSkills, parent.skills, 'opportunity'),
    experienceLevel: resolveString(
      undefined,
      parent.experienceLevel,
      'opportunity',
    ),
  }
}

/**
 * Task parent is the *effective* work-package core fields
 * (package own override or opportunity inheritance).
 */
export function resolveTaskInheritance(
  task: OpportunityTask,
  parent: CoreInheritedFields,
): TaskInheritance {
  return {
    location: resolveString(task.location, parent.location, 'workPackage'),
    startDate: resolveString(task.startDate, parent.startDate, 'workPackage'),
    endDate: resolveString(task.endDate, parent.deadline, 'workPackage'),
    skills: resolveSkills(task.requiredSkills, parent.skills, 'workPackage'),
  }
}

/**
 * Materialize effective work packages for validation / command payload /
 * details display. Nested tasks also receive effective dates, location, skills.
 */
export function resolveWorkPackagesEffective(
  pkgs: readonly WorkPackage[],
  parent: CoreInheritedFields,
): WorkPackage[] {
  return pkgs.map((pkg) => {
    const resolved = resolveWorkPackageInheritance(pkg, parent)
    const effectiveSkills = resolved.skills.value
      ? [...resolved.skills.value]
      : []
    const packageParent: CoreInheritedFields = {
      location: resolved.location.value,
      startDate: resolved.startDate.value,
      deadline: resolved.deadline.value,
      skills: resolved.skills.value,
      experienceLevel: resolved.experienceLevel.value,
    }
    const tasks = (pkg.tasks ?? []).map((task) => {
      const taskResolved = resolveTaskInheritance(task, packageParent)
      return {
        ...task,
        location: taskResolved.location.value,
        startDate: taskResolved.startDate.value,
        endDate: taskResolved.endDate.value,
        requiredSkills: taskResolved.skills.value
          ? [...taskResolved.skills.value]
          : task.requiredSkills,
      }
    })
    return {
      ...pkg,
      location: resolved.location.value,
      startDate: resolved.startDate.value,
      deadline: resolved.deadline.value,
      requiredSkills: effectiveSkills,
      tasks,
    }
  })
}
