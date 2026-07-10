import type {
  OpportunityValidationInput,
  StructuredSkillInput,
  ValidationIssue,
  ValidationRule,
} from '../types.ts'
import { VAL_CODES } from '../rules/codes.ts'
import { messageForCode } from '../messages/catalog.ts'
import {
  hasText,
  normalizeIntent,
  skillKey,
  toNumber,
} from '../validators/primitives.ts'

const DRAFT_UPDATE_PUBLISH = ['draft', 'update', 'publish'] as const
const PUBLISH_ONLY = ['publish'] as const

function skillIssue(
  code: string,
  fieldPaths: readonly string[],
  scope: readonly ('draft' | 'update' | 'publish')[] = DRAFT_UPDATE_PUBLISH,
): ValidationIssue {
  return {
    code,
    source: 'business',
    severity: 'error',
    scope,
    fieldPaths,
    message: messageForCode(code),
    layer: 'business',
    group: 'skills',
  }
}

function coerceScopeSkill(
  entry: unknown,
  role: 'required' | 'provided',
): StructuredSkillInput | null {
  if (typeof entry === 'string') {
    const name = entry.trim()
    if (!name) return null
    return { name, role }
  }
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null
  const record = entry as Record<string, unknown>
  const name = hasText(record.name)
    ? String(record.name).trim()
    : hasText(record.skillId)
      ? String(record.skillId).trim()
      : ''
  if (!name) return null
  const entryRole =
    record.role === 'provided' || record.role === 'required'
      ? record.role
      : role
  return {
    name,
    role: entryRole,
    skillId: hasText(record.skillId) ? String(record.skillId) : undefined,
    level: hasText(record.level) ? String(record.level) : undefined,
    years:
      toNumber(record.years) ??
      toNumber(record.yearsRequired) ??
      undefined,
  }
}

function coerceScopeSkillList(
  value: unknown,
  role: 'required' | 'provided',
): StructuredSkillInput[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => coerceScopeSkill(entry, role))
    .filter((skill): skill is StructuredSkillInput => skill != null)
}

function resolveSkills(input: OpportunityValidationInput) {
  if (input.structuredSkills && input.structuredSkills.length > 0) {
    return input.structuredSkills
  }
  const intent = normalizeIntent(input.intent)
  const scope = input.scope ?? {}
  const offered = coerceScopeSkillList(scope.offeredSkills, 'provided')
  const requiredListed = coerceScopeSkillList(scope.requiredSkills, 'required')

  // Legacy readiness/matching fixtures often store offer skills in requiredSkills.
  // Treat those as provided when intent is offer/hybrid and offeredSkills is empty.
  if (
    (intent === 'offer' || intent === 'hybrid') &&
    offered.length === 0 &&
    requiredListed.length > 0
  ) {
    return requiredListed.map((skill) => ({
      ...skill,
      role: 'provided' as const,
    }))
  }

  return [...requiredListed, ...offered]
}

export const skillRequiredMissing: ValidationRule = {
  id: 'skill-required-missing',
  code: VAL_CODES.SKILL_REQUIRED_MISSING,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: PUBLISH_ONLY,
  fieldPaths: ['structuredSkills'],
  group: 'skills',
  execute(input) {
    const intent = normalizeIntent(input.intent)
    if (intent !== 'need' && intent !== 'hybrid') return null
    const skills = resolveSkills(input)
    // Only enforce when skills section was touched or intent is need with empty structured
    if (skills.length === 0 && !input.structuredSkills) return null
    const hasRequired = skills.some((s) => s.role === 'required')
    if (hasRequired) return null
    if (skills.length === 0 && input.structuredSkills) {
      return skillIssue(
        VAL_CODES.SKILL_REQUIRED_MISSING,
        ['structuredSkills'],
        PUBLISH_ONLY,
      )
    }
    if (skills.length > 0 && !hasRequired) {
      return skillIssue(
        VAL_CODES.SKILL_REQUIRED_MISSING,
        ['structuredSkills'],
        PUBLISH_ONLY,
      )
    }
    return null
  },
}

export const skillProvidedMissing: ValidationRule = {
  id: 'skill-provided-missing',
  code: VAL_CODES.SKILL_PROVIDED_MISSING,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: PUBLISH_ONLY,
  fieldPaths: ['structuredSkills'],
  group: 'skills',
  execute(input) {
    const intent = normalizeIntent(input.intent)
    if (intent !== 'offer' && intent !== 'hybrid') return null
    const skills = resolveSkills(input)
    if (!input.structuredSkills && skills.length === 0) return null
    const hasProvided = skills.some((s) => s.role === 'provided')
    if (hasProvided) return null
    return skillIssue(
      VAL_CODES.SKILL_PROVIDED_MISSING,
      ['structuredSkills'],
      PUBLISH_ONLY,
    )
  },
}

export const skillDuplicate: ValidationRule = {
  id: 'skill-duplicate',
  code: VAL_CODES.SKILL_DUPLICATE,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['structuredSkills'],
  group: 'skills',
  execute(input) {
    const skills = resolveSkills(input)
    const seen = new Set<string>()
    for (const s of skills) {
      const key = skillKey(s)
      if (!key || key === '::required' || key === '::provided') continue
      if (seen.has(key)) {
        return skillIssue(VAL_CODES.SKILL_DUPLICATE, ['structuredSkills'])
      }
      seen.add(key)
    }
    return null
  },
}

export const skillYearsNegative: ValidationRule = {
  id: 'skill-years-negative',
  code: VAL_CODES.SKILL_YEARS_NEGATIVE,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['structuredSkills.years'],
  group: 'skills',
  execute(input) {
    const skills = input.structuredSkills ?? []
    for (const s of skills) {
      const years = toNumber(s.years)
      if (years !== null && years < 0) {
        return skillIssue(VAL_CODES.SKILL_YEARS_NEGATIVE, ['structuredSkills.years'])
      }
    }
    return null
  },
}

export const skillLevelYearsImpossible: ValidationRule = {
  id: 'skill-level-years-impossible',
  code: VAL_CODES.SKILL_LEVEL_YEARS_IMPOSSIBLE,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['structuredSkills'],
  group: 'skills',
  execute(input, _ctx, config) {
    const skills = input.structuredSkills ?? []
    for (const s of skills) {
      if (!s.level) continue
      const years = toNumber(s.years)
      if (years === null) continue
      const levelKey = String(s.level).toLowerCase().trim()
      const minYears = config.skillLevelMinYears[levelKey]
      if (minYears === undefined) continue
      if (years < minYears) {
        return skillIssue(VAL_CODES.SKILL_LEVEL_YEARS_IMPOSSIBLE, [
          'structuredSkills',
        ])
      }
    }
    return null
  },
}

export const SKILL_RULES: readonly ValidationRule[] = [
  skillRequiredMissing,
  skillProvidedMissing,
  skillDuplicate,
  skillYearsNegative,
  skillLevelYearsImpossible,
]
