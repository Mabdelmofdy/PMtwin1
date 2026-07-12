/**
 * Admin experience read-model contracts (Demo/UAT).
 */

export type AdminSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type AdminSlaState = 'ok' | 'warning' | 'overdue' | 'none'
export type AdminTimelineEventKind =
  | 'domain'
  | 'audit'
  | 'status_change'
  | 'admin_intervention'
  | 'notification'
  | 'environment'

export type AdminInboxItem = {
  readonly id: string
  readonly itemType: string
  readonly entityType: string
  readonly entityId: string
  readonly title: string
  readonly summary: string
  readonly priority: 'urgent' | 'high' | 'normal' | 'low'
  readonly severity: AdminSeverity
  readonly sla: AdminSlaState
  readonly ageMs: number
  readonly assigneeId?: string | null
  readonly requiredPermission: string
  readonly availableActions: readonly string[]
  readonly sourceWorkspace: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly auditHref?: string
  readonly destinationHref: string
  readonly completed?: boolean
}

export type AdminGlobalSearchResult = {
  readonly id: string
  readonly entityType: string
  readonly primaryLabel: string
  readonly secondaryContext?: string
  readonly status?: string
  readonly relatedPartyLabel?: string
  readonly environment: string
  readonly lastUpdated?: string
  readonly href: string
  readonly rank: number
  readonly masked?: boolean
}

export type AdminTimelineEvent = {
  readonly id: string
  readonly kind: AdminTimelineEventKind
  readonly timestamp: string
  readonly sequence: number
  readonly title: string
  readonly description?: string
  readonly entityType?: string
  readonly entityId?: string
  readonly href?: string
  readonly actorId?: string
}

export type AdminRelatedObject = {
  readonly entityType: string
  readonly label: string
  readonly count: number
  readonly statusSummary?: string
  readonly permission: string
  readonly href: string
  readonly emptyLabel?: string
}

export type AdminQuickActionDefinition = {
  readonly id: string
  readonly label: string
  readonly entityType: string
  readonly requiredPermission: string
  readonly commandType?: string
  readonly href?: string
  readonly sensitive?: boolean
  readonly requiresReason?: boolean
}

export type AdminOpsActionCard = {
  readonly id: string
  readonly title: string
  readonly count: number
  readonly severity: AdminSeverity
  readonly sla: AdminSlaState
  readonly oldestAgeMs: number
  readonly assignedTeam?: string
  readonly trend?: 'up' | 'down' | 'flat'
  readonly destinationHref: string
  readonly quickActions: readonly string[]
  readonly requiredPermission: string
}

export type AdminCommandCenterSummary = {
  readonly generatedAt: string
  readonly environment: string
  readonly totalUsers: number
  readonly totalParties: number
  readonly publishedOpportunities: number
  readonly activeMatches: number
  readonly activeNegotiations: number
  readonly commercialAgreements: number
  readonly activeContracts: number
  readonly pendingVetting: number
  readonly platformHealthLabel: string
}

export type AdminOperationsSummary = {
  readonly cards: readonly AdminOpsActionCard[]
}

export type AdminRiskSummary = {
  readonly suspendedUsers: number
  readonly rejectedDocuments: number
  readonly orphanHints: number
  readonly items: readonly AdminOpsActionCard[]
  readonly buckets: readonly AdminRiskBucket[]
}

export type AdminHealthTone = 'critical' | 'warning' | 'healthy' | 'blocked' | 'info' | 'success'

export type AdminPlatformHealthFacet = {
  readonly id: string
  readonly label: string
  readonly tone: AdminHealthTone
  readonly detail: string
  readonly href: string
  readonly value?: string | number
}

export type AdminPlatformHealthSummary = {
  readonly facets: readonly AdminPlatformHealthFacet[]
  readonly overallTone: AdminHealthTone
  readonly overallLabel: string
}

export type AdminPipelineStage = {
  readonly id: string
  readonly label: string
  readonly count: number
  readonly href: string
}

export type AdminPipelineSummary = {
  readonly stages: readonly AdminPipelineStage[]
}

export type AdminRiskBucket = {
  readonly id: AdminHealthTone
  readonly label: string
  readonly count: number
  readonly items: readonly AdminOpsActionCard[]
}

export type AdminRecentOperation = {
  readonly id: string
  readonly title: string
  readonly summary: string
  readonly timestamp: string
  readonly href: string
  readonly kind: string
}

export type AdminWorkspaceSummary = {
  readonly workspaceId: string
  readonly title: string
  readonly description: string
  readonly kpiLabels: readonly { readonly label: string; readonly value: string | number; readonly href?: string }[]
  readonly inboxPreview: readonly AdminInboxItem[]
  readonly domainLinks: readonly { readonly label: string; readonly href: string; readonly description?: string }[]
  readonly actionCards: readonly AdminOpsActionCard[]
  readonly riskTone: AdminHealthTone
  readonly analytics: readonly { readonly label: string; readonly value: string | number; readonly href?: string }[]
  readonly recentOps: readonly AdminRecentOperation[]
}

export type AdminPlatformEntityDefinition = {
  readonly entityType: string
  readonly label: string
  readonly description: string
  readonly recordCount: number
  readonly href: string
  readonly readOnly: boolean
}

export type AdminPlatformEntityRecord = {
  readonly id: string
  readonly entityType: string
  readonly primaryLabel: string
  readonly status?: string
  readonly href: string
  readonly updatedAt?: string
}

export type AdminUserSummary = {
  readonly id: string
  readonly fullName: string
  readonly employeeNumber: string
  readonly email: string
  readonly mobile?: string
  readonly accountType?: string
  readonly primaryPartyId?: string
  readonly primaryPartyLabel?: string
  readonly membershipCount: number
  readonly role: string
  readonly roleLabel: string
  readonly vettingStatus?: string
  readonly accountStatus: string
  readonly profileCompletion?: number
  readonly lastLoginAt?: string
  readonly registeredAt?: string
  readonly riskFlag?: boolean
  readonly supportOwnerId?: string
}

export type AdminUserDetail = AdminUserSummary & {
  readonly locked?: boolean
  readonly requirePasswordReset?: boolean
  readonly notes?: readonly string[]
}
