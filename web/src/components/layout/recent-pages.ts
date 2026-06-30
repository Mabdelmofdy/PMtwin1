const STORAGE_KEY = 'pmtwin_recent_pages_v1'
const MAX_RECENT = 5

export type RecentPage = {
  href: string
  label: string
  visitedAt: string
}

let memoryFallback: RecentPage[] = []

function readFromStorage(): RecentPage[] {
  if (typeof window === 'undefined') return [...memoryFallback]
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...memoryFallback]
    const parsed = JSON.parse(raw) as RecentPage[]
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [...memoryFallback]
  } catch {
    return [...memoryFallback]
  }
}

function writeToStorage(pages: RecentPage[]): void {
  memoryFallback = pages
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pages))
  } catch {
    // In-memory fallback only (private mode, tests).
  }
}

export function readRecentPages(): RecentPage[] {
  return readFromStorage()
}

export function recordRecentPage(href: string, label: string): RecentPage[] {
  const existing = readFromStorage().filter((page) => page.href !== href)
  const next: RecentPage[] = [
    { href, label, visitedAt: new Date().toISOString() },
    ...existing,
  ].slice(0, MAX_RECENT)
  writeToStorage(next)
  return next
}

export function clearRecentPages(): void {
  memoryFallback = []
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // noop
  }
}
