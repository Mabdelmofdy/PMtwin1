import type { ValidationRule } from '../types.ts'
import { DATE_RULES } from './dates.ts'
import { BUDGET_RULES } from './budget.ts'
import { SKILL_RULES } from './skills.ts'
import { WORK_PACKAGE_RULES } from './work-packages.ts'
import { COMMERCIAL_RULES } from './commercial.ts'
import { CAPACITY_RULES } from './capacity.ts'
import { DOCUMENT_RULES } from './documents.ts'
import { LOCATION_RULES } from './location.ts'
import { DUPLICATE_RULES } from './duplicates.ts'
import { NEED_OFFER_RULES } from './need-offer.ts'
import { TAXONOMY_RULES } from './taxonomy.ts'

export const BUSINESS_RULES: readonly ValidationRule[] = [
  ...DATE_RULES,
  ...BUDGET_RULES,
  ...SKILL_RULES,
  ...WORK_PACKAGE_RULES,
  ...COMMERCIAL_RULES,
  ...CAPACITY_RULES,
  ...DOCUMENT_RULES,
  ...LOCATION_RULES,
  ...DUPLICATE_RULES,
  ...NEED_OFFER_RULES,
  ...TAXONOMY_RULES,
]

export {
  DATE_RULES,
  BUDGET_RULES,
  SKILL_RULES,
  WORK_PACKAGE_RULES,
  COMMERCIAL_RULES,
  CAPACITY_RULES,
  DOCUMENT_RULES,
  LOCATION_RULES,
  DUPLICATE_RULES,
  NEED_OFFER_RULES,
  TAXONOMY_RULES,
}
