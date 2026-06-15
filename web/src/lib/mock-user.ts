export type UserRole = 'individual' | 'company' | 'admin' | 'moderator' | 'auditor'

export type UserStatus = 'active' | 'pending' | 'suspended'

export type AppUser = {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  profile: {
    name: string
    avatarUrl?: string
  }
  isCompanyUser: boolean
  canAccessAdmin: boolean
}

export const mockUser: AppUser = {
  id: 'user-1',
  email: 'sarah.chen@northbridge.ae',
  role: 'company',
  status: 'active',
  profile: {
    name: 'Sarah Chen',
  },
  isCompanyUser: true,
  canAccessAdmin: true,
}

export type AppNotification = {
  id: string
  title: string
  description: string
  href?: string
  read: boolean
  createdAt: string
  type: 'match' | 'message' | 'deal' | 'system'
}

export const mockNotifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'New match for BIM Lead role',
    description: 'Alex Rivera matched 94% on your Dubai Tower project.',
    href: '/matches',
    read: false,
    createdAt: '2026-06-15T09:12:00Z',
    type: 'match',
  },
  {
    id: 'n2',
    title: 'Contract ready for review',
    description: 'MEP Services Agreement is awaiting your signature.',
    href: '/contracts',
    read: false,
    createdAt: '2026-06-15T07:45:00Z',
    type: 'deal',
  },
  {
    id: 'n3',
    title: 'Message from Alex Rivera',
    description: '“Happy to walk through the LOD 400 deliverables…”',
    href: '/messages',
    read: false,
    createdAt: '2026-06-14T18:30:00Z',
    type: 'message',
  },
  {
    id: 'n4',
    title: 'Pipeline stage updated',
    description: 'Negotiation moved to Contract Draft for Site Logistics.',
    href: '/pipeline',
    read: true,
    createdAt: '2026-06-14T11:00:00Z',
    type: 'system',
  },
  {
    id: 'n5',
    title: 'Weekly digest available',
    description: '12 new applicants and 4 shortlisted matches this week.',
    read: true,
    createdAt: '2026-06-13T08:00:00Z',
    type: 'system',
  },
]
