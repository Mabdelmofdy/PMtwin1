import type { Application, Opportunity } from './domain.ts'

export interface IStorageAdapter {
  get<T>(key: string): T | null
  set<T>(key: string, value: T): void
  remove(key: string): void
  clear(): void
}

export type Overrides = {
  applications?: Record<string, Partial<Application>>
  opportunities?: Record<string, Partial<Opportunity>>
  newApplications?: Application[]
  notifications?: Record<string, Partial<{ read: boolean }>>
  newNotifications?: Array<{ id: string } & Record<string, unknown>>
  deletedNotifications?: string[]
  deals?: Record<string, Record<string, unknown>>
  newDeals?: Array<{ id: string } & Record<string, unknown>>
  negotiations?: Record<string, Record<string, unknown>>
  contracts?: Record<string, Record<string, unknown>>
  newContracts?: Array<{ id: string } & Record<string, unknown>>
}

export const OVERRIDES_KEY = 'pmtwin_web_overrides'
