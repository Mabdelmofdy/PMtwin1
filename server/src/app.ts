import Fastify from 'fastify'
import cors from '@fastify/cors'
import type { AppConfig } from './infrastructure/config.js'
import { registerJwt } from './infrastructure/jwt.js'
import { registerRoutes } from './api/register-routes.js'

export async function buildApp(config: AppConfig) {
  const app = Fastify({ logger: true })
  await app.register(cors, { origin: config.corsOrigin, credentials: true })
  await registerJwt(app, config)
  app.setErrorHandler((error, request, reply) => {
    const code = (error as { code?: string; statusCode?: number }).code
    const status = (error as { statusCode?: number }).statusCode
    if (
      status === 401
      || code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER'
      || code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID'
      || code === 'FAST_JWT_INVALID_ALGORITHM'
    ) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
    request.log.error(error)
    const exposed = config.nodeEnv === 'development' ? String(error) : 'Internal Server Error'
    return reply.code(status && status >= 400 ? status : 500).send({ error: exposed })
  })
  await registerRoutes(app)
  return app
}
