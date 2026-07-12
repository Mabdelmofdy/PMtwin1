// src/capabilities.ts
var ALL_CAPABILITIES = [
  "opportunity.create",
  "opportunity.edit",
  "opportunity.publish",
  "match.respond",
  "negotiation.manage",
  "agreement.approve",
  "agreement.award",
  "contract.prepare",
  "contract.sign",
  "workspace.members.manage",
  "workspace.settings.manage"
];
var ROLE_CAPABILITIES = {
  workspace_owner: ALL_CAPABILITIES,
  company_admin: ALL_CAPABILITIES,
  manager: [
    "opportunity.create",
    "opportunity.edit",
    "opportunity.publish",
    "match.respond",
    "negotiation.manage",
    "agreement.approve",
    "contract.prepare"
  ],
  commercial_manager: [
    "opportunity.create",
    "opportunity.edit",
    "opportunity.publish",
    "match.respond",
    "negotiation.manage",
    "agreement.approve",
    "agreement.award",
    "contract.prepare"
  ],
  project_manager: [
    "opportunity.create",
    "opportunity.edit",
    "opportunity.publish",
    "match.respond",
    "negotiation.manage",
    "contract.prepare"
  ],
  legal: [
    "negotiation.manage",
    "agreement.approve",
    "contract.prepare",
    "contract.sign"
  ],
  finance: [
    "agreement.approve",
    "agreement.award",
    "contract.prepare"
  ],
  member: [
    "opportunity.create",
    "opportunity.edit",
    "match.respond",
    "negotiation.manage"
  ],
  viewer: []
};
function resolveWorkspaceCapabilities(role) {
  return ROLE_CAPABILITIES[role] ?? [];
}
function hasWorkspaceCapability(context, capability) {
  const caps = context.capabilities ?? (context.workspaceRole ? resolveWorkspaceCapabilities(context.workspaceRole) : []);
  return caps.includes(capability);
}
var PLATFORM_ROLE_SET = /* @__PURE__ */ new Set([
  "platform_admin",
  "admin",
  "moderator",
  "auditor",
  "support",
  "super_admin"
]);
function isPlatformRole(role) {
  return PLATFORM_ROLE_SET.has(role);
}
function resolveLegacyRoleToPlatformRoles(legacyRole) {
  if (!legacyRole) return [];
  const normalized = legacyRole.trim().toLowerCase();
  if (normalized === "super_admin" || normalized === "platform_admin") {
    return ["platform_admin"];
  }
  if (normalized === "admin") return ["admin"];
  if (normalized === "moderator") return ["moderator"];
  if (normalized === "auditor") return ["auditor"];
  if (normalized === "support" || normalized === "support_admin") return ["support"];
  return [];
}
function resolveLegacyRoleToWorkspaceMembership(legacyRole) {
  if (!legacyRole) return null;
  const normalized = legacyRole.trim().toLowerCase();
  if (normalized === "company_owner") return "workspace_owner";
  if (normalized === "professional" || normalized === "user") return "workspace_owner";
  if (isPlatformRole(normalized)) return null;
  return "member";
}
function isBusinessWorkspaceType(type) {
  return type === "personal" || type === "company";
}

// src/ownership-integrity.ts
function issue(code, message, entityId, path) {
  return { code, message, entityId, path };
}
function validatePartyWorkspaceAlignment(party, workspace) {
  const issues = [];
  if (!workspace) {
    issues.push(issue("missing_workspace", `Workspace ${party.workspaceId} not found for party ${party.id}`, party.id, "workspaceId"));
    return issues;
  }
  if (!isBusinessWorkspaceType(workspace.type)) {
    issues.push(issue("platform_workspace_party", "Platform context must not own a Marketplace Party", party.id));
    return issues;
  }
  if (workspace.ownerPartyId !== party.id && getPrimaryPartyId(workspace, [party]) !== party.id) {
  }
  if (workspace.type === "personal" && party.type !== "individual") {
    issues.push(issue("party_type_mismatch", "Personal Workspace requires Individual Party", party.id));
  }
  if (workspace.type === "company" && party.type !== "company") {
    issues.push(issue("party_type_mismatch", "Company Workspace requires Company Party", party.id));
  }
  if (party.workspaceId !== workspace.id) {
    issues.push(issue("party_workspace_mismatch", "Party.workspaceId does not match Workspace.id", party.id));
  }
  return issues;
}
function getPrimaryPartyId(workspace, parties) {
  if (workspace.ownerPartyId) return workspace.ownerPartyId;
  const linked = parties.filter((p) => p.workspaceId === workspace.id);
  return linked[0]?.id;
}
function validateWorkspacePartyInvariants(workspaces, parties) {
  const issues = [];
  const partiesByWorkspace = /* @__PURE__ */ new Map();
  for (const party of parties) {
    if (!party.workspaceId) {
      issues.push(issue("party_without_workspace", `Party ${party.id} has no workspaceId`, party.id));
      continue;
    }
    const list = partiesByWorkspace.get(party.workspaceId) ?? [];
    list.push(party);
    partiesByWorkspace.set(party.workspaceId, list);
  }
  for (const workspace of workspaces) {
    if (!isBusinessWorkspaceType(workspace.type)) {
      issues.push(issue("invalid_business_workspace_type", `Workspace ${workspace.id} is not a business workspace`, workspace.id));
      continue;
    }
    const linked = partiesByWorkspace.get(workspace.id) ?? [];
    if (linked.length === 0) {
      issues.push(issue("workspace_without_party", `Business Workspace ${workspace.id} has no primary Party`, workspace.id));
      continue;
    }
    const primaries = linked.filter((p) => p.id === workspace.ownerPartyId);
    if (workspace.ownerPartyId && primaries.length === 0) {
      issues.push(issue("owner_party_missing", `Workspace ${workspace.id} ownerPartyId not found among parties`, workspace.id));
    }
    if (linked.length > 1) {
      const companyDupes = linked.filter((p) => p.type === "company");
      if (companyDupes.length > 1) {
        issues.push(issue("duplicate_company_parties", `Workspace ${workspace.id} has multiple Company Parties`, workspace.id));
      }
      if (linked.filter((p) => p.id === workspace.ownerPartyId).length > 1) {
        issues.push(issue("multiple_primary_parties", `Workspace ${workspace.id} has multiple primary Parties`, workspace.id));
      }
    }
    for (const party of linked) {
      issues.push(...validatePartyWorkspaceAlignment(party, workspace));
    }
  }
  return issues;
}
function validateParticipantsAlignment(participants, entityId) {
  const issues = [];
  const seen = /* @__PURE__ */ new Set();
  for (const participant of participants) {
    if (!participant.partyId || !participant.workspaceId) {
      issues.push(issue("participant_incomplete", "Participant requires partyId and workspaceId", entityId));
      continue;
    }
    const key = participant.partyId;
    if (seen.has(key)) {
      issues.push(issue("participant_duplication", `Duplicate participant party ${key}`, entityId));
    }
    seen.add(key);
  }
  return issues;
}
function validateOwnershipIntegrity(input) {
  const issues = [
    ...validateWorkspacePartyInvariants(input.workspaces, input.parties)
  ];
  if (input.platformAccess && input.entity?.ownerPartyId && !input.allowPlatformOwner) {
    issues.push(
      issue(
        "platform_owner_party",
        "Platform context must not be used as Marketplace ownerPartyId",
        input.entity.id,
        "ownerPartyId"
      )
    );
  }
  const entity = input.entity;
  if (entity) {
    if (entity.workspaceId) {
      const workspace = input.workspaces.find((w) => w.id === entity.workspaceId);
      if (!workspace) {
        issues.push(issue("missing_workspace", `Entity workspace ${entity.workspaceId} not found`, entity.id));
      } else if (!isBusinessWorkspaceType(workspace.type)) {
        issues.push(issue("platform_workspace_entity", "Entity must not use Platform context as workspaceId", entity.id));
      }
    }
    if (entity.ownerPartyId) {
      const party = input.parties.find((p) => p.id === entity.ownerPartyId);
      if (!party) {
        issues.push(issue("missing_party", `Entity ownerPartyId ${entity.ownerPartyId} not found`, entity.id));
      } else if (entity.workspaceId && party.workspaceId !== entity.workspaceId) {
        issues.push(issue("party_workspace_mismatch", "ownerPartyId does not match entity workspaceId", entity.id));
      }
    }
    if (entity.participants) {
      issues.push(...validateParticipantsAlignment(entity.participants, entity.id));
      for (const p of entity.participants) {
        const party = input.parties.find((x) => x.id === p.partyId);
        if (!party) {
          issues.push(issue("missing_party", `Participant party ${p.partyId} not found`, entity.id));
        } else if (party.workspaceId !== p.workspaceId) {
          issues.push(issue("party_workspace_mismatch", `Participant party/workspace mismatch for ${p.partyId}`, entity.id));
        }
      }
    }
    if (entity.createdByUserId && input.users) {
      const userExists = input.users.some((u) => u.id === entity.createdByUserId);
      if (!userExists && entity.createdByActorType !== "system") {
        issues.push(issue("invalid_actor_user", `createdByUserId ${entity.createdByUserId} not found`, entity.id));
      }
    }
  }
  for (const membership of input.memberships) {
    if (membership.status === "removed") continue;
    const workspace = input.workspaces.find((w) => w.id === membership.workspaceId);
    if (!workspace) {
      issues.push(issue("membership_workspace_missing", `Membership ${membership.id} references missing workspace`, membership.id));
    }
  }
  return { valid: issues.length === 0, issues };
}
function deriveParticipantIds(participants) {
  return {
    participantPartyIds: participants.map((p) => p.partyId),
    participantWorkspaceIds: participants.map((p) => p.workspaceId)
  };
}
function assertParallelParticipantArrays(partyIds, workspaceIds) {
  if (partyIds.length !== workspaceIds.length) {
    return [issue("parallel_array_misaligned", "participantPartyIds and participantWorkspaceIds length mismatch")];
  }
  return [];
}

// src/resolvers.ts
function workspaceIdForSource(sourceEntityId, type) {
  return `ws-${type}-${sourceEntityId}`;
}
function partyIdForSource(sourceEntityId, type) {
  return `party-${type}-${sourceEntityId}`;
}
function membershipIdFor(userId, workspaceId) {
  return `wsm-${userId}-${workspaceId}`;
}
var SYSTEM_MIGRATION_USER_ID = "system-migration-actor";
function createdByActorFromHuman(userId) {
  return { actorType: "marketplace_user", actorUserId: userId };
}
function createdByActorSystem() {
  return { actorType: "system" };
}
function resolveCreatedByActor(input) {
  if (input.createdByActor) return input.createdByActor;
  if (input.createdByActorType === "system" && !input.createdByUserId) {
    return createdByActorSystem();
  }
  const userId = input.createdByUserId ?? input.creatorId;
  if (userId === SYSTEM_MIGRATION_USER_ID) {
    return { actorType: "system", actorUserId: SYSTEM_MIGRATION_USER_ID };
  }
  if (userId) {
    return {
      actorType: input.createdByActorType ?? "marketplace_user",
      actorUserId: userId
    };
  }
  return createdByActorSystem();
}
function buildWorkflowActorContext(input) {
  const capabilities = input.workspaceRole ? resolveWorkspaceCapabilities(input.workspaceRole) : void 0;
  return {
    actorUserId: input.actorUserId,
    actorType: input.actorType,
    workspaceId: input.workspaceId,
    partyId: input.partyId,
    workspaceRole: input.workspaceRole,
    platformRoles: input.platformRoles,
    capabilities
  };
}
function recoverActiveBusinessContext(input) {
  const activeMemberships = input.memberships.filter(
    (m) => m.userId === input.userId && m.status === "active"
  );
  const validWorkspaces = input.workspaces.filter(
    (w) => w.status === "active" && activeMemberships.some((m) => m.workspaceId === w.id)
  );
  const preferredStillValid = input.preferredWorkspaceId && validWorkspaces.some((w) => w.id === input.preferredWorkspaceId);
  if (preferredStillValid) {
    const workspace = validWorkspaces.find((w) => w.id === input.preferredWorkspaceId);
    const party = input.parties.find((p) => p.id === (input.preferredPartyId ?? workspace.ownerPartyId)) ?? input.parties.find((p) => p.workspaceId === workspace.id);
    return {
      activeWorkspaceId: workspace.id,
      activePartyId: party?.id ?? workspace.ownerPartyId,
      requiresWorkspaceSelection: false,
      clearedInvalid: Boolean(
        input.preferredPartyId && party?.id !== input.preferredPartyId
      )
    };
  }
  if (validWorkspaces.length === 1) {
    const workspace = validWorkspaces[0];
    return {
      activeWorkspaceId: workspace.id,
      activePartyId: workspace.ownerPartyId,
      requiresWorkspaceSelection: false,
      clearedInvalid: true,
      reason: "recovered_unambiguous_workspace"
    };
  }
  if (validWorkspaces.length === 0) {
    return {
      requiresWorkspaceSelection: true,
      clearedInvalid: true,
      reason: "no_valid_business_workspace"
    };
  }
  return {
    requiresWorkspaceSelection: true,
    clearedInvalid: true,
    reason: "ambiguous_workspace_selection"
  };
}
function canAccessWorkspaceEntity(input) {
  if (!input.activeWorkspaceId || !input.entityWorkspaceId) return false;
  return input.activeWorkspaceId === input.entityWorkspaceId;
}
function entityBelongsToOwnerParty(input) {
  if (!input.activePartyId || !input.ownerPartyId) return false;
  return input.activePartyId === input.ownerPartyId;
}

// src/migration.ts
function nowIso() {
  return "2020-01-01T00:00:00.000Z";
}
function displayName(account) {
  return account.profile?.name?.trim() || account.profile?.accountLabel?.trim() || account.email || account.id;
}
function projectIdentityFromLegacyAccounts(input) {
  const workspaces = [];
  const parties = [];
  const memberships = [];
  const timestamp = nowIso();
  const platformIds = input.platformUserIds ?? /* @__PURE__ */ new Set();
  const companyIds = new Set(input.companies.map((c) => c.id));
  for (const company of input.companies) {
    const workspaceId = workspaceIdForSource(company.id, "company");
    const partyId = partyIdForSource(company.id, "company");
    const createdBy = input.companyOwnerLinks?.find((l) => l.companyId === company.id)?.userId ?? company.id;
    const name = displayName(company);
    workspaces.push({
      id: workspaceId,
      type: "company",
      name,
      ownerPartyId: partyId,
      status: "active",
      createdByUserId: createdBy,
      createdAt: company.createdAt ?? timestamp,
      updatedAt: company.updatedAt ?? timestamp
    });
    parties.push({
      id: partyId,
      type: "company",
      workspaceId,
      displayName: name,
      status: company.status ?? "active",
      companyProfileId: company.id,
      createdByUserId: createdBy,
      createdAt: company.createdAt ?? timestamp,
      updatedAt: company.updatedAt ?? timestamp
    });
  }
  for (const user of input.users) {
    if (platformIds.has(user.id)) continue;
    const workspaceId = workspaceIdForSource(user.id, "personal");
    const partyId = partyIdForSource(user.id, "individual");
    const name = displayName(user);
    workspaces.push({
      id: workspaceId,
      type: "personal",
      name: `${name} \u2014 Personal Workspace`,
      ownerPartyId: partyId,
      status: "active",
      createdByUserId: user.id,
      createdAt: user.createdAt ?? timestamp,
      updatedAt: user.updatedAt ?? timestamp
    });
    parties.push({
      id: partyId,
      type: "individual",
      workspaceId,
      displayName: name,
      status: user.status ?? "active",
      individualProfileId: user.id,
      createdByUserId: user.id,
      createdAt: user.createdAt ?? timestamp,
      updatedAt: user.updatedAt ?? timestamp
    });
    memberships.push({
      id: membershipIdFor(user.id, workspaceId),
      workspaceId,
      userId: user.id,
      role: "workspace_owner",
      status: "active",
      joinedAt: user.createdAt ?? timestamp,
      createdAt: user.createdAt ?? timestamp,
      updatedAt: user.updatedAt ?? timestamp
    });
  }
  for (const link of input.companyOwnerLinks ?? []) {
    if (!companyIds.has(link.companyId)) continue;
    const workspaceId = workspaceIdForSource(link.companyId, "company");
    memberships.push({
      id: membershipIdFor(link.userId, workspaceId),
      workspaceId,
      userId: link.userId,
      role: link.role ?? "workspace_owner",
      status: "active",
      joinedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
  return {
    workspaces: uniqueById(workspaces),
    parties: uniqueById(parties),
    memberships: uniqueById(memberships)
  };
}
function uniqueById(items) {
  const map = /* @__PURE__ */ new Map();
  for (const item of items) {
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return [...map.values()];
}
function mergeIdentityProjections(a, b) {
  return {
    workspaces: uniqueById([...a.workspaces, ...b.workspaces]),
    parties: uniqueById([...a.parties, ...b.parties]),
    memberships: uniqueById([...a.memberships, ...b.memberships])
  };
}
function resolveLegacyOpportunityOwnership(input) {
  if (input.ownerPartyId?.startsWith("party-")) {
    const isCompany = input.ownerPartyId.includes("-company-");
    const sourceId = input.ownerPartyId.replace(/^party-(individual|company)-/, "");
    return {
      workspaceId: workspaceIdForSource(sourceId, isCompany ? "company" : "personal"),
      ownerPartyId: input.ownerPartyId,
      createdByUserId: input.creatorId,
      workspaceType: isCompany ? "company" : "personal",
      unresolvedActor: false
    };
  }
  const creatorId = input.creatorId;
  if (!creatorId) {
    return { unresolvedActor: true };
  }
  if (input.companyIds.has(creatorId)) {
    return {
      workspaceId: workspaceIdForSource(creatorId, "company"),
      ownerPartyId: partyIdForSource(creatorId, "company"),
      createdByUserId: void 0,
      workspaceType: "company",
      unresolvedActor: true
    };
  }
  if (input.userIds.has(creatorId)) {
    return {
      workspaceId: workspaceIdForSource(creatorId, "personal"),
      ownerPartyId: partyIdForSource(creatorId, "individual"),
      createdByUserId: creatorId,
      workspaceType: "personal",
      unresolvedActor: false
    };
  }
  if (creatorId) {
    const asCompany = input.companyIds.has(creatorId);
    return {
      workspaceId: workspaceIdForSource(creatorId, asCompany ? "company" : "personal"),
      ownerPartyId: partyIdForSource(creatorId, asCompany ? "company" : "individual"),
      createdByUserId: asCompany ? void 0 : creatorId,
      workspaceType: asCompany ? "company" : "personal",
      unresolvedActor: asCompany
    };
  }
  return { unresolvedActor: true };
}

// src/schema-version.ts
var IDENTITY_SCHEMA_VERSION = 1;
var OWNERSHIP_SCHEMA_VERSION = 1;
var LEGACY_IDENTITY_SCHEMA_VERSION = 0;
var LEGACY_OWNERSHIP_SCHEMA_VERSION = 0;
function createCurrentSchemaMeta() {
  return {
    identitySchemaVersion: IDENTITY_SCHEMA_VERSION,
    ownershipSchemaVersion: OWNERSHIP_SCHEMA_VERSION
  };
}
function isSupportedIdentitySchemaVersion(version) {
  return version === LEGACY_IDENTITY_SCHEMA_VERSION || version === IDENTITY_SCHEMA_VERSION;
}
function isSupportedOwnershipSchemaVersion(version) {
  return version === LEGACY_OWNERSHIP_SCHEMA_VERSION || version === OWNERSHIP_SCHEMA_VERSION;
}
function assertImportSchemaVersions(meta) {
  const identity = meta.identitySchemaVersion ?? LEGACY_IDENTITY_SCHEMA_VERSION;
  const ownership = meta.ownershipSchemaVersion ?? LEGACY_OWNERSHIP_SCHEMA_VERSION;
  if (!isSupportedIdentitySchemaVersion(identity)) {
    return { ok: false, reason: `Unsupported identitySchemaVersion: ${identity}` };
  }
  if (!isSupportedOwnershipSchemaVersion(ownership)) {
    return { ok: false, reason: `Unsupported ownershipSchemaVersion: ${ownership}` };
  }
  if (identity > IDENTITY_SCHEMA_VERSION || ownership > OWNERSHIP_SCHEMA_VERSION) {
    return { ok: false, reason: "Future schema version is not supported by this runtime" };
  }
  return { ok: true };
}
export {
  IDENTITY_SCHEMA_VERSION,
  LEGACY_IDENTITY_SCHEMA_VERSION,
  LEGACY_OWNERSHIP_SCHEMA_VERSION,
  OWNERSHIP_SCHEMA_VERSION,
  SYSTEM_MIGRATION_USER_ID,
  assertImportSchemaVersions,
  assertParallelParticipantArrays,
  buildWorkflowActorContext,
  canAccessWorkspaceEntity,
  createCurrentSchemaMeta,
  createdByActorFromHuman,
  createdByActorSystem,
  deriveParticipantIds,
  entityBelongsToOwnerParty,
  getPrimaryPartyId,
  hasWorkspaceCapability,
  isBusinessWorkspaceType,
  isPlatformRole,
  isSupportedIdentitySchemaVersion,
  isSupportedOwnershipSchemaVersion,
  membershipIdFor,
  mergeIdentityProjections,
  partyIdForSource,
  projectIdentityFromLegacyAccounts,
  recoverActiveBusinessContext,
  resolveCreatedByActor,
  resolveLegacyOpportunityOwnership,
  resolveLegacyRoleToPlatformRoles,
  resolveLegacyRoleToWorkspaceMembership,
  resolveWorkspaceCapabilities,
  validateOwnershipIntegrity,
  validateParticipantsAlignment,
  validatePartyWorkspaceAlignment,
  validateWorkspacePartyInvariants,
  workspaceIdForSource
};
