import type { CommandResult } from '@pm-twin/commands'

/**
 * Builds the idempotency key for a command envelope.
 * Format: {commandType}:{aggregateId}:{clientRequestId}
 */
export function buildIdempotencyKey(
  commandType: string,
  aggregateId: string,
  clientRequestId: string,
): string {
  return `${commandType}:${aggregateId}:${clientRequestId}`
}

/**
 * In-memory idempotency store for command deduplication.
 * Phase 2.0 scaffolding — no persistence, no Redis.
 */
export class InMemoryIdempotencyStore {
  private readonly store = new Map<string, CommandResult>()

  get(key: string): CommandResult | undefined {
    return this.store.get(key)
  }

  put(key: string, result: CommandResult): void {
    this.store.set(key, result)
  }

  exists(key: string): boolean {
    return this.store.has(key)
  }

  clear(): void {
    this.store.clear()
  }
}
