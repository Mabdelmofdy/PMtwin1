export type ServerApiConfig = {
  readonly enabled: boolean
  readonly baseUrl: string
}

export function getServerApiConfig(): ServerApiConfig {
  const enabled = import.meta.env.VITE_USE_SERVER_API === 'true'
  const baseUrl = String(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001')
  return { enabled, baseUrl }
}

/**
 * Disconnected HTTP client. Nothing in the active SPA imports this module.
 * The active runtime remains browser storage and client-side auth.
 * DO NOT ENABLE SERVER API CUTOVER UNTIL COMMAND HANDLER PARITY AND CANONICAL SERVER DATA MODEL ARE COMPLETE.
 */
export async function serverApiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const config = getServerApiConfig()
  if (!config.enabled) {
    throw new Error('Server API is disabled. VITE_USE_SERVER_API must stay false until command handler parity.')
  }
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`)
  const response = await fetch(`${config.baseUrl}${path}`, { ...options, headers })
  if (!response.ok) {
    throw new Error(`Server API ${response.status}`)
  }
  return response.json() as Promise<T>
}
