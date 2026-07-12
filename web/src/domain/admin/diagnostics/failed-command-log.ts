/**
 * Local failed-command log for Demo/UAT System Administration.
 */

export type FailedLocalCommandEntry = {
  readonly id: string
  readonly commandType: string
  readonly aggregateId?: string
  readonly message: string
  readonly timestamp: string
  readonly actorId?: string
}

const STORAGE_KEY = 'pmtwin_admin_failed_commands'
const MAX_ENTRIES = 100

function readEntries(): FailedLocalCommandEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as FailedLocalCommandEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeEntries(entries: readonly FailedLocalCommandEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
  } catch {
    // ignore quota errors in Demo/UAT
  }
}

export function listFailedLocalCommands(): readonly FailedLocalCommandEntry[] {
  if (typeof window === 'undefined') return []
  return readEntries()
}

export function recordFailedLocalCommand(input: {
  readonly commandType: string
  readonly message: string
  readonly aggregateId?: string
  readonly actorId?: string
}): FailedLocalCommandEntry {
  const entry: FailedLocalCommandEntry = {
    id: `fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    commandType: input.commandType,
    aggregateId: input.aggregateId,
    message: input.message,
    timestamp: new Date().toISOString(),
    actorId: input.actorId,
  }
  if (typeof window !== 'undefined') {
    writeEntries([entry, ...readEntries()])
  }
  return entry
}

export function clearFailedLocalCommands(): void {
  if (typeof window === 'undefined') return
  writeEntries([])
}
