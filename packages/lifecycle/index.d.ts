export type LifecycleEntityType =
  | 'application'
  | 'opportunity'
  | 'match'
  | 'negotiation'
  | 'deal'
  | 'contract'

export type EntityFsm = {
  entityType: LifecycleEntityType
  states: readonly string[]
  terminalStates: readonly string[]
  transitions: Readonly<Record<string, readonly string[]>>
}

export const ENTITY_TYPES: readonly LifecycleEntityType[]
export const MANIFEST: Readonly<Record<string, unknown>>
export const CANONICAL_STATES: Readonly<Record<string, readonly string[]>>
export const LEGACY_ALIASES: Readonly<Record<string, Readonly<Record<string, string>>>>

export function isEntityType(entityType: string): entityType is LifecycleEntityType
export function getCanonicalStates(entityType: string): readonly string[]
export function isCanonicalState(
  entityType: string,
  status: string | null | undefined,
): boolean
export function getLegacyAliases(
  entityType: string,
): Readonly<Record<string, string>>
export function toCanonical(
  entityType: string,
  status: string | null | undefined,
): string
export function getFsm(entityType: string): EntityFsm | null
export function isTerminal(
  entityType: string,
  status: string | null | undefined,
): boolean
export function allowedTransitions(
  entityType: string,
  fromStatus: string | null | undefined,
): readonly string[]
export function forbiddenTransitions(
  entityType: string,
  fromStatus: string | null | undefined,
): readonly string[]
