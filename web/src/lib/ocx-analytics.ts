/**
 * Local/demo-safe Opportunity Creation analytics.
 * No external trackers. Never throws. Never blocks user actions.
 * Uses localStorage when available; otherwise an in-memory store (tests/SSR).
 */

export type OcxAnalyticsEventName =
  | 'wizard_started'
  | 'step_viewed'
  | 'step_completed'
  | 'validation_error_seen'
  | 'duplicate_warning_seen'
  | 'draft_saved'
  | 'wizard_abandoned'
  | 'published_from_detail'

export type OcxAnalyticsEvent = {
  readonly name: OcxAnalyticsEventName
  readonly at: string
  readonly payload?: Readonly<Record<string, unknown>>
}

const STORAGE_KEY = 'pmtwin.ocx.analytics.v1'
const MAX_EVENTS = 200

let memoryStore: OcxAnalyticsEvent[] = []

function safeNow(): string {
  return new Date().toISOString()
}

function canUseLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage != null
  } catch {
    return false
  }
}

function readStore(): OcxAnalyticsEvent[] {
  if (!canUseLocalStorage()) return [...memoryStore]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as OcxAnalyticsEvent[]) : []
  } catch {
    return [...memoryStore]
  }
}

function writeStore(events: readonly OcxAnalyticsEvent[]): void {
  const trimmed = events.slice(-MAX_EVENTS)
  memoryStore = [...trimmed]
  if (!canUseLocalStorage()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function trackOcxEvent(
  name: OcxAnalyticsEventName,
  payload?: Readonly<Record<string, unknown>>,
): void {
  try {
    const event: OcxAnalyticsEvent = {
      name,
      at: safeNow(),
      payload,
    }
    writeStore([...readStore(), event])
  } catch {
    // Never block UX.
  }
}

export type OcxAnalyticsMetrics = {
  readonly wizardStarts: number
  readonly draftSaves: number
  readonly publishes: number
  readonly abandons: number
  readonly wizardCompletionRate: number
  readonly draftConversionRate: number
  readonly publishRate: number
  readonly mostAbandonedStep: string | null
  readonly averageCompletionMs: number | null
}

export function getOcxEvents(): readonly OcxAnalyticsEvent[] {
  return readStore()
}

export function clearOcxEvents(): void {
  memoryStore = []
  if (!canUseLocalStorage()) return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function computeOcxMetrics(
  events: readonly OcxAnalyticsEvent[] = readStore(),
): OcxAnalyticsMetrics {
  const wizardStarts = events.filter((e) => e.name === 'wizard_started').length
  const draftSaves = events.filter((e) => e.name === 'draft_saved').length
  const publishes = events.filter((e) => e.name === 'published_from_detail').length
  const abandons = events.filter((e) => e.name === 'wizard_abandoned').length

  const abandonedSteps = events
    .filter((e) => e.name === 'wizard_abandoned')
    .map((e) => String(e.payload?.stepId ?? 'unknown'))
  const stepCounts = new Map<string, number>()
  for (const step of abandonedSteps) {
    stepCounts.set(step, (stepCounts.get(step) ?? 0) + 1)
  }
  let mostAbandonedStep: string | null = null
  let max = 0
  for (const [step, count] of stepCounts) {
    if (count > max) {
      max = count
      mostAbandonedStep = step
    }
  }

  const startTimes = events
    .filter((e) => e.name === 'wizard_started')
    .map((e) => Date.parse(e.at))
    .filter((n) => Number.isFinite(n))
  const saveTimes = events
    .filter((e) => e.name === 'draft_saved')
    .map((e) => Date.parse(e.at))
    .filter((n) => Number.isFinite(n))
  let averageCompletionMs: number | null = null
  if (startTimes.length > 0 && saveTimes.length > 0) {
    const pairs: number[] = []
    for (const start of startTimes) {
      const nextSave = saveTimes.find((s) => s >= start)
      if (nextSave != null) pairs.push(nextSave - start)
    }
    if (pairs.length > 0) {
      averageCompletionMs = Math.round(pairs.reduce((a, b) => a + b, 0) / pairs.length)
    }
  }

  return {
    wizardStarts,
    draftSaves,
    publishes,
    abandons,
    wizardCompletionRate: wizardStarts === 0 ? 0 : draftSaves / wizardStarts,
    draftConversionRate: draftSaves === 0 ? 0 : publishes / draftSaves,
    publishRate: wizardStarts === 0 ? 0 : publishes / wizardStarts,
    mostAbandonedStep,
    averageCompletionMs,
  }
}
