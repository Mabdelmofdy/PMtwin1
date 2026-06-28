export { evaluateProfileReadiness } from '@/domain/profile-readiness/profile-readiness-evaluator.ts'
export {
  getProfileReadinessRules,
  PROFILE_READINESS_SCORE_WEIGHTS,
  PROFILE_READINESS_STATUS_THRESHOLDS,
} from '@/domain/profile-readiness/profile-readiness-rules.ts'
export type {
  ProfileFieldRule,
  ProfileKind,
  ProfileReadinessInput,
  ProfileReadinessProfile,
  ProfileReadinessResult,
  ProfileReadinessStatus,
} from '@/domain/profile-readiness/types.ts'
