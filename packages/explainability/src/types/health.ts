export const HEALTH = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const

export type Health = (typeof HEALTH)[keyof typeof HEALTH]
