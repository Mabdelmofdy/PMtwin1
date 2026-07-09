export const ENGINE_ID = {
  PROFILE: 'profile',
  VETTING: 'vetting',
  OPPORTUNITY: 'opportunity',
  READINESS: 'readiness',
  MATCHING: 'matching',
  NEGOTIATION: 'negotiation',
  AGREEMENT: 'agreement',
  CONTRACT: 'contract',
  COMMERCIAL: 'commercial',
  DASHBOARD: 'dashboard',
  ANALYTICS: 'analytics',
  AI: 'ai',
} as const

export type EngineId = (typeof ENGINE_ID)[keyof typeof ENGINE_ID]
