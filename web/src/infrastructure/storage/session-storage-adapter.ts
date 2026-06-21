import type { IStorageAdapter } from '@/types/storage.ts'

export class SessionStorageAdapter implements IStorageAdapter {
  get<T>(key: string): T | null {
    try {
      const raw = window.sessionStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
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
