import type { IStorageAdapter } from '@/types/storage.ts'

export class LocalStorageAdapter implements IStorageAdapter {
  get<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  }

  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // quota exceeded or private browsing — silently fail
    }
  }

  remove(key: string): void {
    window.localStorage.removeItem(key)
  }

  clear(): void {
    window.localStorage.clear()
  }
}

export const localStorageAdapter = new LocalStorageAdapter()
