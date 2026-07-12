/**
 * Admin operational severity helpers — visual hierarchy for EOX.
 * UI-only; does not change domain status models.
 */

import type { AdminSeverity, AdminSlaState } from '@/domain/admin/read-models/types.ts'

export type AdminHealthTone = 'critical' | 'warning' | 'healthy' | 'blocked' | 'info' | 'success'

export function severityToBadgeTone(
  severity: AdminSeverity,
): 'danger' | 'warning' | 'muted' | 'info' | 'success' {
  switch (severity) {
    case 'critical':
      return 'danger'
    case 'high':
    case 'medium':
      return 'warning'
    case 'low':
      return 'muted'
    default:
      return 'info'
  }
}

export function slaToBadgeTone(
  sla: AdminSlaState,
): 'success' | 'warning' | 'danger' | 'muted' {
  switch (sla) {
    case 'ok':
      return 'success'
    case 'warning':
      return 'warning'
    case 'overdue':
      return 'danger'
    default:
      return 'muted'
  }
}

export function healthToneToBadgeTone(
  tone: AdminHealthTone,
): 'danger' | 'warning' | 'success' | 'muted' | 'info' {
  switch (tone) {
    case 'critical':
    case 'blocked':
      return 'danger'
    case 'warning':
      return 'warning'
    case 'healthy':
    case 'success':
      return 'success'
    case 'info':
      return 'info'
    default:
      return 'muted'
  }
}

/** Border/background accents for operational cards by severity. */
export function severityCardClass(severity: AdminSeverity): string {
  switch (severity) {
    case 'critical':
      return 'border-destructive/50 bg-destructive/5'
    case 'high':
      return 'border-warning/50 bg-warning/5'
    case 'medium':
      return 'border-warning/30 bg-warning/5'
    case 'low':
      return 'border-border/60'
    default:
      return 'border-border/50'
  }
}

export function healthToneCardClass(tone: AdminHealthTone): string {
  switch (tone) {
    case 'critical':
    case 'blocked':
      return 'border-destructive/40 bg-destructive/5'
    case 'warning':
      return 'border-warning/40 bg-warning/5'
    case 'healthy':
    case 'success':
      return 'border-success/40 bg-success/5'
    default:
      return 'border-border/60'
  }
}
