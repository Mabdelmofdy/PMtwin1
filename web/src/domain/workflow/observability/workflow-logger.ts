import type {
  TransitionLogEntry,
  WorkflowEntityType,
} from '@/domain/workflow/types.ts'

const MAX_LOG_ENTRIES = 200
const logBuffer: TransitionLogEntry[] = []

let loggingEnabled = false

export function setWorkflowLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled
}

export function isWorkflowLoggingEnabled(): boolean {
  if (loggingEnabled) return true
  return (
    typeof import.meta !== 'undefined' &&
    import.meta.env?.DEV === true &&
    import.meta.env?.VITE_WORKFLOW_LOG === 'true'
  )
}

function pushEntry(entry: Omit<TransitionLogEntry, 'at' | 'allowed'> & { allowed: boolean }): void {
  logBuffer.push({ ...entry, at: new Date().toISOString() })
  if (logBuffer.length > MAX_LOG_ENTRIES) {
    logBuffer.shift()
  }
}

export function getWorkflowLogBuffer(): readonly TransitionLogEntry[] {
  return logBuffer
}

export function clearWorkflowLogBuffer(): void {
  logBuffer.length = 0
}

type TransitionLogPayload = {
  entityType: WorkflowEntityType
  from: string
  to: string
  userId?: string
  userRole?: string
  reason?: string
}

export function logTransitionAttempt(payload: TransitionLogPayload): void {
  if (!isWorkflowLoggingEnabled()) return
  pushEntry({ ...payload, allowed: false })
  console.debug('[PMTwin Workflow] transition attempt', payload)
}

export function logAllowedTransition(payload: TransitionLogPayload): void {
  if (!isWorkflowLoggingEnabled()) return
  pushEntry({ ...payload, allowed: true })
  console.debug('[PMTwin Workflow] transition allowed', payload)
}

export function logBlockedTransition(payload: TransitionLogPayload): void {
  if (!isWorkflowLoggingEnabled()) return
  pushEntry({ ...payload, allowed: false })
  console.debug('[PMTwin Workflow] transition blocked (advisory)', payload)
}
