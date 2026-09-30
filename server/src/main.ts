import { loadConfig } from './infrastructure/config.js'
import { prisma } from './infrastructure/prisma.js'
import { buildApp } from './app.js'

async function main(): Promise<void> {
  const config = loadConfig()
  const app = await buildApp(config)
  const shutdown = async () => {
    await app.close()
    await prisma.$disconnect()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  await app.listen({ port: config.port, host: '0.0.0.0' })
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
