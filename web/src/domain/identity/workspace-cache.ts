const WORKSPACE_CACHE_EVENT = 'pmtwin:workspace-cache-invalidated'

let workspaceCacheVersion = 0

export function getWorkspaceCacheVersion(): number {
  return workspaceCacheVersion
}

export function invalidateWorkspaceCache(): number {
  workspaceCacheVersion += 1
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(WORKSPACE_CACHE_EVENT, {
        detail: { version: workspaceCacheVersion },
      }),
    )
  }
  return workspaceCacheVersion
}

export function subscribeToWorkspaceCache(
  listener: (version: number) => void,
): () => void {
  if (typeof window === 'undefined') return () => undefined
  const handleInvalidation = (event: Event) => {
    const detail = (event as CustomEvent<{ version?: number }>).detail
    listener(detail?.version ?? workspaceCacheVersion)
  }
  window.addEventListener(WORKSPACE_CACHE_EVENT, handleInvalidation)
  return () =>
    window.removeEventListener(WORKSPACE_CACHE_EVENT, handleInvalidation)
}
