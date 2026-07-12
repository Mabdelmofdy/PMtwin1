/**
 * Platform explorer — entity catalogue with live repository counts.
 */

import {
  auditRepository,
  commercialAgreementRepository,
  contractRepository,
  negotiationRepository,
  notificationRepository,
  opportunityRepository,
  partyMembershipRepository,
  partyRepository,
  postMatchRepository,
  userRepository,
} from '@/repositories/index.ts'
import type { AdminPlatformEntityDefinition } from './types.ts'

export function listExplorerEntities(): readonly AdminPlatformEntityDefinition[] {
  return [
    {
      entityType: 'user',
      label: 'Users',
      description: 'Platform user accounts',
      recordCount: userRepository.getAll().length,
      href: '/admin/users',
      readOnly: false,
    },
    {
      entityType: 'party',
      label: 'Parties',
      description: 'Legal and operating parties',
      recordCount: partyRepository.getAll().length,
      href: '/admin/parties',
      readOnly: false,
    },
    {
      entityType: 'membership',
      label: 'Memberships',
      description: 'User–party memberships',
      recordCount: partyMembershipRepository.getAll().length,
      href: '/admin/memberships',
      readOnly: true,
    },
    {
      entityType: 'opportunity',
      label: 'Opportunities',
      description: 'Marketplace opportunities',
      recordCount: opportunityRepository.getAll().length,
      href: '/admin/opportunities',
      readOnly: false,
    },
    {
      entityType: 'post_match',
      label: 'PostMatches',
      description: 'Matching outcomes',
      recordCount: postMatchRepository.getAll().length,
      href: '/admin/post-matches',
      readOnly: true,
    },
    {
      entityType: 'negotiation',
      label: 'Negotiations',
      description: 'Active and historical negotiations',
      recordCount: negotiationRepository.getAll().length,
      href: '/admin/negotiations',
      readOnly: false,
    },
    {
      entityType: 'commercial_agreement',
      label: 'Commercial Agreements',
      description: 'Commercial agreement records',
      recordCount: commercialAgreementRepository.getAll().length,
      href: '/admin/commercial-agreements',
      readOnly: false,
    },
    {
      entityType: 'contract',
      label: 'Contracts',
      description: 'Contract records',
      recordCount: contractRepository.getAll().length,
      href: '/admin/contracts',
      readOnly: false,
    },
    {
      entityType: 'notification',
      label: 'Notifications',
      description: 'In-app notifications',
      recordCount: notificationRepository.getAll().length,
      href: '/admin/inbox',
      readOnly: true,
    },
    {
      entityType: 'audit',
      label: 'Audit entries',
      description: 'Append-only audit trail',
      recordCount: auditRepository.getAll().length,
      href: '/admin/audit',
      readOnly: true,
    },
  ]
}
