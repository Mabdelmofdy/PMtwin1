/**
 * SaaS organization model (Phase F — preparation only).
 * Not yet wired to repositories or UI. Future mapping:
 * Organization → Users, Opportunities, Deals, Contracts, Billing
 */
export type OrganizationStatus = 'active' | 'pending' | 'suspended'

export type Organization = {
  id: string
  name: string
  slug?: string
  type: 'company' | 'enterprise'
  status: OrganizationStatus | string
  registrationNumber?: string
  tenantId?: string
  createdAt?: string
  updatedAt?: string
}
