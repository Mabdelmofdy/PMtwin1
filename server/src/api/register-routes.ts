import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import { authenticateAccount, AuthError, findAccountById } from '../identity/auth-service.js'
import { signAccessToken, authenticateRequest } from '../infrastructure/jwt.js'
import { executeCommand, invalidEnvelopeResult, isCommandEnvelope } from '../application/command-gateway.js'
import { databaseReady, getOpportunityById, listOpportunities } from '../opportunity/opportunity-query-service.js'

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  accountType: z.enum(['auto', 'individual', 'company']).optional(),
})

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/health', async () => {
    const db = await databaseReady()
    return {
      status: db ? 'ok' : 'degraded',
      db: db ? 'up' : 'down',
      runtime: 'server-scaffold',
      phase: 'foundation',
    }
  })

  app.post('/api/v1/auth/login', async (request, reply) => {
    const parsed = loginBody.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid login payload' })
    }
    try {
      const account = await authenticateAccount(
        parsed.data.email,
        parsed.data.password,
        parsed.data.accountType ?? 'auto',
      )
      const actor = {
        sub: account.id,
        email: account.email,
        role: account.role,
        accountType: account.accountType,
      }
      const token = signAccessToken(app, actor)
      return { token, user: account }
    } catch (error) {
      if (error instanceof AuthError) {
        return reply.code(error.statusCode).send({ error: error.message })
      }
      throw error
    }
  })

  app.get('/api/v1/auth/me', async (request, reply) => {
    const actor = await authenticateRequest(request)
    const user = await findAccountById(actor.sub, actor.accountType)
    if (!user) {
      return reply.code(401).send({ error: 'Account not found' })
    }
    return { user }
  })

  app.get('/api/v1/opportunities', async (request) => {
    await authenticateRequest(request)
    const status = typeof request.query === 'object' && request.query && 'status' in request.query
      ? String((request.query as { status?: string }).status ?? '')
      : ''
    const rows = await listOpportunities(status || undefined)
    return { data: rows }
  })

  app.get('/api/v1/opportunities/:id', async (request, reply) => {
    await authenticateRequest(request)
    const { id } = request.params as { id: string }
    const row = await getOpportunityById(id)
    if (!row) return reply.code(404).send({ error: 'Opportunity not found' })
    return { data: row }
  })

  app.post('/api/v1/commands', async (request, reply) => {
    const actor = await authenticateRequest(request)
    if (!isCommandEnvelope(request.body)) {
      return reply.code(400).send(invalidEnvelopeResult())
    }
    const result = await executeCommand(request.body, actor)
    return reply.code(result.success ? 200 : 501).send(result)
  })
}
