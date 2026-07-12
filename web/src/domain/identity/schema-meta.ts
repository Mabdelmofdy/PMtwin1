import {
  createCurrentSchemaMeta,
  LEGACY_IDENTITY_SCHEMA_VERSION,
  LEGACY_OWNERSHIP_SCHEMA_VERSION,
  type IdentityOwnershipSchemaMeta,
} from '@pm-twin/identity'
import type { Overrides } from '@/types/storage.ts'

export function readIdentitySchemaMeta(
  overrides: Pick<Overrides, 'identitySchemaVersion' | 'ownershipSchemaVersion'>,
): IdentityOwnershipSchemaMeta {
  return {
    identitySchemaVersion:
      overrides.identitySchemaVersion ?? LEGACY_IDENTITY_SCHEMA_VERSION,
    ownershipSchemaVersion:
      overrides.ownershipSchemaVersion ?? LEGACY_OWNERSHIP_SCHEMA_VERSION,
  }
}

export function withCurrentIdentitySchemaMeta(overrides: Overrides): Overrides {
  return { ...overrides, ...createCurrentSchemaMeta() }
}

export function writeIdentitySchemaMeta(
  overrides: Overrides,
  meta: IdentityOwnershipSchemaMeta = createCurrentSchemaMeta(),
): Overrides {
  return {
    ...overrides,
    identitySchemaVersion: meta.identitySchemaVersion,
    ownershipSchemaVersion: meta.ownershipSchemaVersion,
  }
}
