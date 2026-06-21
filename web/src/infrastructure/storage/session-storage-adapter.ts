import type { IStorageAdapter } from '@/types/storage.ts'

export class SessionStorageAdapter implements IStorageAdapter {
  get<T>(key: string): T | null {
    try {
      const raw = window.sessionStorage.getItem(key)
      if (!raw) return null
      try {
        return JSON.parse(raw) as T
      } catch {
        return raw as unknown as T
      }
    } catch {
      return null
    }
  }

  set<T>(key: string, value: T): void {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // quota exceeded or private browsing — silently fail
    }
  }

  remove(key: string): void {
    window.sessionStorage.removeItem(key)
  }

  clear(): void {
    window.sessionStorage.clear()
  }
}

export const sessionStorageAdapter = new SessionStorageAdapter()
