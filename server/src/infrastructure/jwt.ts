import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { AppConfig } from './config.js'

export type AuthActor = {
  readonly sub: string
  readonly email: string
  readonly role: string
  readonly accountType: 'user' | 'company'
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthActor
    user: AuthActor
  }
}

export async function registerJwt(app: FastifyInstance, config: AppConfig): Promise<void> {
  await app.register(import('@fastify/jwt'), {
    secret: config.jwtSecret,
    sign: { expiresIn: config.jwtAccessTtl },
  })
}

export function signAccessToken(app: FastifyInstance, actor: AuthActor): string {
  return app.jwt.sign(actor)
}

export async function authenticateRequest(request: FastifyRequest): Promise<AuthActor> {
  await request.jwtVerify()
  return request.user
}
