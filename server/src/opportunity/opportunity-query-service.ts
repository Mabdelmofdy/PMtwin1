import { prisma } from '../infrastructure/prisma.js'

export async function listOpportunities(status?: string) {
  return prisma.opportunity.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: 'desc' },
    take: 200,
  })
}

export async function getOpportunityById(id: string) {
  return prisma.opportunity.findUnique({ where: { id } })
}

export async function databaseReady(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}
