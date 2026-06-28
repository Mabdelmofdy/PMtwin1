/** Optional metadata attached to a command for tracing and audit. */
export interface CommandMetadata {
  readonly issuedAt?: string
  readonly issuedBy?: string
  readonly correlationId?: string
  readonly [key: string]: unknown
}

/** Execution context supplied by the caller (no I/O). */
export interface CommandContext {
  readonly userId?: string
  readonly tenantId?: string
  readonly metadata?: CommandMetadata
}

/** Base command envelope shared by all command DTOs. */
export interface Command {
  readonly commandType: string
  readonly aggregateId: string
  readonly clientRequestId: string
}

/** Outcome of a command execution (transport shape only). */
export interface CommandResult {
  readonly success: boolean
  readonly aggregateId: string
  readonly commandType: string
  readonly errors?: readonly string[]
}
