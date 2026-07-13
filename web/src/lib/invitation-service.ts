/**
 * Company employee invitations — token-based join of existing company workspace.
 * Employee never creates a Company party/workspace.
 */

import {
  membershipIdFor,
  workspaceIdForSource,
  type WorkspaceMembership,
  type WorkspaceRole,
} from '@pm-twin/identity'
import { environmentContext } from '@/infrastructure/environment/environment-context.ts'
import { localStorageAdapter } from '@/infrastructure/storage/local-storage-adapter.ts'
import { notifyDataStore } from '@/hooks/use-data-store.ts'
import {
  notificationRepository,
  userRepository,
  workspaceMembershipRepository,
  workspaceRepository,
} from '@/repositories/index.ts'
import { auditRepository } from '@/repositories/index.ts'
import {
  OVERRIDES_KEY,
  type IStorageAdapter,
  type Overrides,
} from '@/types/storage.ts'
import { resolveOtpDelivery } from '@/domain/otp'
import { registerLocalAccount } from '@/lib/local-registration-service.ts'
import { authService } from '@/lib/auth-service.ts'

export type WorkspaceInvitationStatus =
  | 'pending'
  | 'accepted'
  | 'cancelled'
  | 'expired'

export type WorkspaceInvitation = {
  readonly id: string
  readonly token: string
  readonly email: string
  readonly workspaceId: string
  readonly companyPartyId: string
  readonly companySourceId: string
  readonly role: WorkspaceRole
  readonly invitedByUserId: string
  readonly status: WorkspaceInvitationStatus
  readonly expiresAt: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly acceptedByUserId?: string
}

const INVITES_OVERRIDE_KEY = 'workspaceInvitations'

function createToken(): string {
  return `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`
}

function createInviteId(): string {
  return `wsinvite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function readInvites(storage: IStorageAdapter): WorkspaceInvitation[] {
  const overrides = storage.get<Overrides>(OVERRIDES_KEY) ?? {}
  const raw = (overrides as Record<string, unknown>)[INVITES_OVERRIDE_KEY]
  return Array.isArray(raw) ? (raw as WorkspaceInvitation[]) : []
}

function writeInvites(storage: IStorageAdapter, invites: WorkspaceInvitation[]): void {
  const overrides = storage.get<Overrides>(OVERRIDES_KEY) ?? {}
  ;(overrides as Record<string, unknown>)[INVITES_OVERRIDE_KEY] = invites
  storage.set(OVERRIDES_KEY, overrides)
  notifyDataStore()
}

export type InvitationServiceDeps = {
  readonly storageAdapter: IStorageAdapter
}

const defaultDeps: InvitationServiceDeps = {
  storageAdapter: environmentContext.storageAdapter ?? localStorageAdapter,
}

export function createInvitationService(deps: InvitationServiceDeps = defaultDeps) {
  return {
    listForWorkspace(workspaceId: string): WorkspaceInvitation[] {
      return readInvites(deps.storageAdapter).filter((i) => i.workspaceId === workspaceId)
    },

    getByToken(token: string): WorkspaceInvitation | undefined {
      return readInvites(deps.storageAdapter).find((i) => i.token === token)
    },

    inviteEmployee(input: {
      readonly email: string
      readonly companySourceId: string
      readonly companyPartyId: string
      readonly invitedByUserId: string
      readonly role?: WorkspaceRole
      readonly expiryDays?: number
    }): { ok: true; invitation: WorkspaceInvitation } | { ok: false; error: string } {
      const email = input.email.trim().toLowerCase()
      if (!email) return { ok: false, error: 'Email is required' }
      const workspaceId = workspaceIdForSource(input.companySourceId, 'company')
      const workspace = workspaceRepository.getById(workspaceId)
      if (!workspace) return { ok: false, error: 'Company workspace not found' }

      const now = Date.now()
      const expiryDays = input.expiryDays ?? 14
      const invitation: WorkspaceInvitation = {
        id: createInviteId(),
        token: createToken(),
        email,
        workspaceId,
        companyPartyId: input.companyPartyId,
        companySourceId: input.companySourceId,
        role: input.role ?? 'member',
        invitedByUserId: input.invitedByUserId,
        status: 'pending',
        expiresAt: new Date(now + expiryDays * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
      }

      const invites = readInvites(deps.storageAdapter)
      writeInvites(deps.storageAdapter, [...invites, invitation])

      auditRepository.append({
        action: 'invitation.created',
        userId: input.invitedByUserId,
        entityType: 'user',
        entityId: invitation.id,
        details: { email, workspaceId, role: invitation.role },
      })

      // Notify existing user if already registered
      const existing = userRepository
        .getAll()
        .find((u) => u.email.trim().toLowerCase() === email)
      if (existing) {
        notificationRepository.create({
          userId: existing.id,
          title: 'Invitation received',
          message: `You were invited to join a company workspace.`,
          read: false,
          type: 'invitation_received',
          entityType: 'user',
          entityId: invitation.id,
        })
      }

      return { ok: true, invitation }
    },

    async acceptInvitation(input: {
      readonly token: string
      readonly password?: string
      readonly displayName?: string
      readonly otpChallengeId?: string
      readonly otpCode?: string
      readonly existingUserId?: string
    }): Promise<
      | {
          ok: true
          userId: string
          workspaceId: string
          membershipId: string
        }
      | { ok: false; error: string }
    > {
      const invitation = this.getByToken(input.token)
      if (!invitation) return { ok: false, error: 'Invitation not found' }
      if (invitation.status !== 'pending') {
        return { ok: false, error: `Invitation is ${invitation.status}` }
      }
      if (Date.parse(invitation.expiresAt) < Date.now()) {
        this.markStatus(invitation.id, 'expired')
        return { ok: false, error: 'Invitation expired' }
      }

      if (input.otpChallengeId && input.otpCode) {
        const otp = resolveOtpDelivery()
        const verified = await otp.verify({
          challengeId: input.otpChallengeId,
          code: input.otpCode,
        })
        // Challenge may already be consumed by the UI verify step — treat NOT_FOUND
        // after UI verification as acceptable when caller already verified OTP.
        if (!verified.ok && verified.code !== 'NOT_FOUND') {
          return { ok: false, error: verified.message }
        }
      }

      let userId = input.existingUserId
      if (!userId) {
        const existing = userRepository
          .getAll()
          .find((u) => u.email.trim().toLowerCase() === invitation.email)
        if (existing) {
          userId = existing.id
        } else {
          if (!input.password || !input.displayName) {
            return {
              ok: false,
              error: 'Registration requires display name and password for new users',
            }
          }
          // Create individual user + personal workspace only — never a company.
          const created = registerLocalAccount({
            accountType: 'individual',
            email: invitation.email,
            password: input.password,
            profile: {
              displayName: input.displayName,
            },
          })
          userId = created.userId
        }
      }

      const membershipId = membershipIdFor(userId, invitation.workspaceId)
      const existingMembership = workspaceMembershipRepository.getById(membershipId)
      const now = new Date().toISOString()
      if (!existingMembership) {
        const membership: WorkspaceMembership = {
          id: membershipId,
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
          status: 'invited',
          invitedByUserId: invitation.invitedByUserId,
          createdAt: now,
          updatedAt: now,
        }
        workspaceMembershipRepository.create(membership)
      }

      this.markStatus(invitation.id, 'accepted', userId)

      notificationRepository.create({
        userId,
        title: 'Invitation accepted',
        message: 'Your company invitation was accepted. Membership is pending activation.',
        read: false,
        type: 'invitation_accepted',
        entityType: 'user',
        entityId: invitation.id,
      })

      auditRepository.append({
        action: 'invitation.accepted',
        userId,
        entityType: 'user',
        entityId: invitation.id,
        details: { workspaceId: invitation.workspaceId, membershipId },
      })

      return {
        ok: true,
        userId,
        workspaceId: invitation.workspaceId,
        membershipId,
      }
    },

    approveMembership(input: {
      readonly membershipId: string
      readonly actorId: string
    }): { ok: true } | { ok: false; error: string } {
      const updated = workspaceMembershipRepository.updateStatus(
        input.membershipId,
        'active',
      )
      if (!updated) return { ok: false, error: 'Membership not found' }
      notificationRepository.create({
        userId: updated.userId,
        title: 'Membership activated',
        message: 'Your company workspace membership is now active.',
        read: false,
        type: 'membership_activated',
        entityType: 'user',
        entityId: updated.id,
      })
      auditRepository.append({
        action: 'membership.activated',
        userId: input.actorId,
        entityType: 'user',
        entityId: updated.userId,
        details: { membershipId: updated.id, workspaceId: updated.workspaceId },
      })
      return { ok: true }
    },

    markStatus(
      invitationId: string,
      status: WorkspaceInvitationStatus,
      acceptedByUserId?: string,
    ): void {
      const invites = readInvites(deps.storageAdapter).map((invite) =>
        invite.id === invitationId
          ? {
              ...invite,
              status,
              updatedAt: new Date().toISOString(),
              ...(acceptedByUserId ? { acceptedByUserId } : {}),
            }
          : invite,
      )
      writeInvites(deps.storageAdapter, invites)
    },
  }
}

export const invitationService = createInvitationService()

/** Login helper used by invite accept when user already exists. */
export function verifyInviteLogin(email: string, password: string): string | null {
  const user = userRepository
    .getAll()
    .find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase())
  if (!user) return null
  if (user.passwordHash !== authService.encodePassword(password)) return null
  return user.id
}
