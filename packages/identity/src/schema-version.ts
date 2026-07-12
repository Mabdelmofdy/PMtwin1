/** Identity / ownership schema versions for bootstrap, export, import, overrides. */
export const IDENTITY_SCHEMA_VERSION = 1
export const OWNERSHIP_SCHEMA_VERSION = 1

export const LEGACY_IDENTITY_SCHEMA_VERSION = 0
export const LEGACY_OWNERSHIP_SCHEMA_VERSION = 0

export type IdentityOwnershipSchemaMeta = {
  readonly identitySchemaVersion: number
  readonly ownershipSchemaVersion: number
}

export function createCurrentSchemaMeta(): IdentityOwnershipSchemaMeta {
  return {
    identitySchemaVersion: IDENTITY_SCHEMA_VERSION,
    ownershipSchemaVersion: OWNERSHIP_SCHEMA_VERSION,
  }
}

export function isSupportedIdentitySchemaVersion(version: number): boolean {
  return version === LEGACY_IDENTITY_SCHEMA_VERSION || version === IDENTITY_SCHEMA_VERSION
}

export function isSupportedOwnershipSchemaVersion(version: number): boolean {
  return version === LEGACY_OWNERSHIP_SCHEMA_VERSION || version === OWNERSHIP_SCHEMA_VERSION
}

export function assertImportSchemaVersions(meta: {
  readonly identitySchemaVersion?: number
  readonly ownershipSchemaVersion?: number
}): { ok: true } | { ok: false; reason: string } {
  const identity = meta.identitySchemaVersion ?? LEGACY_IDENTITY_SCHEMA_VERSION
  const ownership = meta.ownershipSchemaVersion ?? LEGACY_OWNERSHIP_SCHEMA_VERSION
  if (!isSupportedIdentitySchemaVersion(identity)) {
    return { ok: false, reason: `Unsupported identitySchemaVersion: ${identity}` }
  }
  if (!isSupportedOwnershipSchemaVersion(ownership)) {
    return { ok: false, reason: `Unsupported ownershipSchemaVersion: ${ownership}` }
  }
  if (identity > IDENTITY_SCHEMA_VERSION || ownership > OWNERSHIP_SCHEMA_VERSION) {
    return { ok: false, reason: 'Future schema version is not supported by this runtime' }
  }
  return { ok: true }
}
