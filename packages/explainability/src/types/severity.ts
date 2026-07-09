export const EXPLANATION_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const

export type ExplanationSeverity =
  (typeof EXPLANATION_SEVERITY)[keyof typeof EXPLANATION_SEVERITY]

export const RECOMMENDATION_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const

export type RecommendationPriority =
  (typeof RECOMMENDATION_PRIORITY)[keyof typeof RECOMMENDATION_PRIORITY]

export const TIMELINE_EVENT_STATUS = {
  COMPLETED: 'completed',
  ACTIVE: 'active',
  PENDING: 'pending',
  BLOCKED: 'blocked',
} as const

export type TimelineEventStatus =
  (typeof TIMELINE_EVENT_STATUS)[keyof typeof TIMELINE_EVENT_STATUS]
