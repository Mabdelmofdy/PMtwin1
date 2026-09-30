export type AppConfig = {
  readonly port: number
  readonly nodeEnv: string
  readonly databaseUrl: string
  readonly jwtSecret: string
  /**
   * Reserved name for a later refresh-token phase. Loaded so local env files
   * stay stable. This scaffold does not sign or verify refresh tokens.
   */
  readonly jwtRefreshSecret: string
  readonly jwtAccessTtl: string
  /** Reserved with `jwtRefreshSecret`. Not applied to any issued token. */
  readonly jwtRefreshTtl: string
  readonly seedMode: 'local' | 'disabled'
  readonly seedDataDir: string
  readonly corsOrigin: string
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`)
  }
  return value
}

export function loadConfig(): AppConfig {
  const seedMode = process.env.SEED_MODE === 'local' ? 'local' : 'disabled'
  return {
    port: Number(process.env.PORT ?? 3001),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    databaseUrl: required('DATABASE_URL'),
    jwtSecret: required('JWT_SECRET'),
    jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
    jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
    seedMode,
    seedDataDir: process.env.SEED_DATA_DIR ?? '../POC/data',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  }
}
