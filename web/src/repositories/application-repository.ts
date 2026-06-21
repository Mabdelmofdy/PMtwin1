import type { Application } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { BaseRepository } from './base-repository.ts'

export class ApplicationRepository extends BaseRepository<Application> {
  constructor(storage: IStorageAdapter, loadSeed: () => Application[]) {
    super(storage, 'applications', loadSeed)
  }

  override getAll(): Application[] {
    const base = this.loadSeed()
    const overrides = this.readOverrides()
    const patched = base.map((a) => ({
      ...a,
      ...overrides.applications?.[a.id],
    }))
    return [...patched, ...(overrides.newApplications ?? [])]
  }

  getByOpportunity(opportunityId: string): Application[] {
    return this.getAll().filter((a) => a.opportunityId === opportunityId)
  }

  getByApplicant(applicantId: string): Application[] {
    return this.getAll().filter((a) => a.applicantId === applicantId)
  }

  update(id: string, patch: Partial<Application>): void {
    const overrides = this.readOverrides()
    const isNew = overrides.newApplications?.some((a) => a.id === id)
    if (isNew) {
      overrides.newApplications = overrides.newApplications!.map((a) =>
        a.id === id
          ? { ...a, ...patch, updatedAt: new Date().toISOString() }
          : a,
      )
    } else {
      overrides.applications = {
        ...overrides.applications,
        [id]: {
          ...overrides.applications?.[id],
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      }
    }
    this.writeOverrides(overrides)
  }

  create(
    data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>,
  ): Application {
    const overrides = this.readOverrides()
    const application: Application = {
      ...data,
      id: `app-${Date.now()}`,
      status: data.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    overrides.newApplications = [
      ...(overrides.newApplications ?? []),
      application,
    ]
    this.writeOverrides(overrides)
    return application
  }
}
