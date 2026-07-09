export type ExplainabilityTrace = {
  readonly label: string
  readonly engine?: string
  readonly entityId?: string
  readonly durationMs: number
  readonly enriched: boolean
  readonly knowledgeHit: boolean
}

export type ExplainabilityTraceResult<T> = {
  readonly result: T
  readonly trace: ExplainabilityTrace
}

function resolveTraceMetadata<T>(
  result: T,
): { engine?: string; entityId?: string; enriched: boolean; knowledgeHit: boolean } {
  if (
    typeof result !== 'object' ||
    result === null ||
    !('metadata' in result)
  ) {
    return { enriched: false, knowledgeHit: false }
  }

  const candidate = result as {
    engine?: string
    entityId?: string
    metadata?: { extensions?: { knowledge?: unknown } }
  }

  const knowledge = candidate.metadata?.extensions?.knowledge
  return {
    engine: candidate.engine,
    entityId: candidate.entityId,
    enriched: knowledge != null,
    knowledgeHit: knowledge != null,
  }
}

/**
 * Wraps sync or async explainability build calls with lightweight timing metadata.
 */
export function traceExplainabilityBuild<T>(
  label: string,
  fn: () => T,
): ExplainabilityTraceResult<T>
export function traceExplainabilityBuild<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<ExplainabilityTraceResult<T>>
export function traceExplainabilityBuild<T>(
  label: string,
  fn: () => T | Promise<T>,
): ExplainabilityTraceResult<T> | Promise<ExplainabilityTraceResult<T>> {
  const startedAt = performance.now()

  const finalize = (result: T): ExplainabilityTraceResult<T> => {
    const meta = resolveTraceMetadata(result)
    return {
      result,
      trace: {
        label,
        engine: meta.engine,
        entityId: meta.entityId,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        enriched: meta.enriched,
        knowledgeHit: meta.knowledgeHit,
      },
    }
  }

  const output = fn()
  if (output instanceof Promise) {
    return output.then(finalize)
  }
  return finalize(output)
}
