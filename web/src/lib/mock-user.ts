/**
 * @deprecated Legacy fixture data — not used by the application.
 * Canonical types live in @/types/domain.ts
 */
import type { AppNotification, PlatformUser } from '@/types/domain.ts'

/** @deprecated Use PlatformUser from @/types/domain.ts */
export type AppUser = PlatformUser & {
  isCompanyUser?: boolean
  canAccessAdmin?: boolean
}

/** @deprecated Unused demo fixture — prefer seed JSON via repositories */
export const mockUser: AppUser = {
  id: 'user-1',
  email: 'sarah.chen@northbridge.ae',
  role: 'company_owner',
  status: 'active',
  profile: { name: 'Sarah Chen' },
  isCompanyUser: true,
  canAccessAdmin: true,
}

/** @deprecated Unused demo fixture */
export const mockNotifications: AppNotification[] = []
