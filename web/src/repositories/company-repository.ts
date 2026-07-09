import type { Company } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { REPOSITORY_ENTITY_KEYS } from './repository-entity-keys.ts'
import { BaseRepository } from './base-repository.ts'
import { mergeSeedWithOverrides } from './seed-override-merge.ts'

export class CompanyRepository extends BaseRepository<Company> {
  constructor(storage: IStorageAdapter, loadSeed: () => Company[]) {
    super(storage, REPOSITORY_ENTITY_KEYS.company, loadSeed)
  }

  override getAll(): Company[] {
    const overrides = this.readOverrides()
    return mergeSeedWithOverrides({
      seed: this.loadSeed(),
      patches: overrides.companies,
      newItems: overrides.newCompanies ?? [],
      deletedIds: overrides.deletedCompanies ?? [],
    })
  }

  override getById(id: string): Company | undefined {
    return this.getAll().find((item) => item.id === id)
  }

  create(
    data: Omit<Company, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string },
  ): Company {
    const overrides = this.readOverrides()
    const now = new Date().toISOString()
    const company: Company = {
      ...data,
      status: data.status || 'active',
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    }
    overrides.newCompanies = [...(overrides.newCompanies ?? []), company]
    this.writeOverrides(overrides)
    return company
  }

  update(id: string, patch: Partial<Company>): Company | undefined {
    const overrides = this.readOverrides()
    const existing = this.getById(id)
    if (!existing) return undefined

    const updated: Company = {
      ...existing,
      ...patch,
      profile: patch.profile ? { ...existing.profile, ...patch.profile } : existing.profile,
      updatedAt: new Date().toISOString(),
    }

    const isNew = overrides.newCompanies?.some((company) => company.id === id)
    if (isNew) {
      overrides.newCompanies = overrides.newCompanies!.map((company) =>
        company.id === id ? updated : company,
      )
    } else {
      overrides.companies = {
        ...overrides.companies,
        [id]: {
          ...overrides.companies?.[id],
          ...patch,
          profile: updated.profile,
          updatedAt: updated.updatedAt,
        },
      }
    }

    this.writeOverrides(overrides)
    return updated
  }
}
