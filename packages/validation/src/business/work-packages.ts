import type { ValidationIssue, ValidationRule } from '../types.ts'
import { VAL_CODES } from '../rules/codes.ts'
import { messageForCode } from '../messages/catalog.ts'
import { hasText, parseIsoDate } from '../validators/primitives.ts'

const DRAFT_UPDATE_PUBLISH = ['draft', 'update', 'publish'] as const

function packageIssue(
  code: string,
  fieldPaths: readonly string[],
): ValidationIssue {
  return {
    code,
    source: 'business',
    severity: 'error',
    scope: DRAFT_UPDATE_PUBLISH,
    fieldPaths,
    message: messageForCode(code),
    layer: 'business',
    group: 'workPackages',
  }
}

export const packageFieldsRequired: ValidationRule = {
  id: 'package-fields-required',
  code: VAL_CODES.PACKAGE_TITLE_REQUIRED,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['workPackages'],
  group: 'workPackages',
  execute(input) {
    const packages = input.workPackages
    if (!packages || packages.length === 0) return null
    const issues: ValidationIssue[] = []
    packages.forEach((pkg, index) => {
      const base = `workPackages[${index}]`
      if (!hasText(pkg.title)) {
        issues.push(packageIssue(VAL_CODES.PACKAGE_TITLE_REQUIRED, [`${base}.title`]))
      }
      if (!hasText(pkg.description)) {
        issues.push(
          packageIssue(VAL_CODES.PACKAGE_DESCRIPTION_REQUIRED, [
            `${base}.description`,
          ]),
        )
      }
      if (!pkg.skills || pkg.skills.length === 0) {
        issues.push(
          packageIssue(VAL_CODES.PACKAGE_SKILL_REQUIRED, [`${base}.skills`]),
        )
      }
      if (!hasText(pkg.deadline)) {
        issues.push(
          packageIssue(VAL_CODES.PACKAGE_DEADLINE_REQUIRED, [`${base}.deadline`]),
        )
      }
    })
    return issues
  },
}

export const packageDeadlineAfterProject: ValidationRule = {
  id: 'package-deadline-after-project',
  code: VAL_CODES.PACKAGE_DEADLINE_AFTER_PROJECT,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['workPackages.deadline', 'endDate'],
  group: 'workPackages',
  execute(input) {
    const end = parseIsoDate(input.endDate)
    if (!end || !input.workPackages) return null
    for (let i = 0; i < input.workPackages.length; i++) {
      const deadline = parseIsoDate(input.workPackages[i]?.deadline)
      if (!deadline) continue
      if (deadline.getTime() > end.getTime()) {
        return packageIssue(VAL_CODES.PACKAGE_DEADLINE_AFTER_PROJECT, [
          `workPackages[${i}].deadline`,
        ])
      }
    }
    return null
  },
}

export const packageDuplicateName: ValidationRule = {
  id: 'package-duplicate-name',
  code: VAL_CODES.PACKAGE_DUPLICATE_NAME,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['workPackages.title'],
  group: 'workPackages',
  execute(input) {
    const packages = input.workPackages
    if (!packages) return null
    const seen = new Set<string>()
    for (const pkg of packages) {
      const title = (pkg.title ?? '').toLowerCase().trim()
      if (!title) continue
      if (seen.has(title)) {
        return packageIssue(VAL_CODES.PACKAGE_DUPLICATE_NAME, ['workPackages.title'])
      }
      seen.add(title)
    }
    return null
  },
}

export const packageCountExceeded: ValidationRule = {
  id: 'package-count-exceeded',
  code: VAL_CODES.PACKAGE_COUNT_EXCEEDED,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['workPackages'],
  group: 'workPackages',
  execute(input, _ctx, config) {
    if (!input.workPackages || config.maxPackageCount === undefined) return null
    if (input.workPackages.length <= config.maxPackageCount) return null
    return packageIssue(VAL_CODES.PACKAGE_COUNT_EXCEEDED, ['workPackages'])
  },
}

export const WORK_PACKAGE_RULES: readonly ValidationRule[] = [
  packageFieldsRequired,
  packageDeadlineAfterProject,
  packageDuplicateName,
  packageCountExceeded,
]
