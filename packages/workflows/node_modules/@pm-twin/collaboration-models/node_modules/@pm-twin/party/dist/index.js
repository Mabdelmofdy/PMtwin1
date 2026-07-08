// src/eligibility/can-party-own.ts
function canPartyOwnSubModel(partyType, applicability) {
  if (!applicability) return true;
  if (!applicability.allowedPartyTypes?.length) return true;
  return applicability.allowedPartyTypes.includes(partyType);
}

// src/eligibility/relationship.ts
function getRelationshipType(ownerType, participantType) {
  if (ownerType === "company" && participantType === "company") return "B2B";
  if (ownerType === "company" && participantType === "individual") return "B2P";
  if (ownerType === "individual" && participantType === "company") return "P2B";
  return "P2P";
}
function resolvePrimaryRelationship(applicability) {
  if (applicability.primaryRelationship) return applicability.primaryRelationship;
  return applicability.supportedRelationships[0];
}
function relationshipFlagsFromSupported(supported) {
  return {
    supportsB2B: supported.includes("B2B"),
    supportsB2P: supported.includes("B2P"),
    supportsP2B: supported.includes("P2B"),
    supportsP2P: supported.includes("P2P")
  };
}
function isRelationshipSupported(applicability, relationship) {
  if (applicability.supportedRelationships.includes(relationship)) return true;
  switch (relationship) {
    case "B2B":
      return applicability.supportsB2B === true;
    case "B2P":
      return applicability.supportsB2P === true;
    case "P2B":
      return applicability.supportsP2B === true;
    case "P2P":
      return applicability.supportsP2P === true;
    default:
      return false;
  }
}

// src/eligibility/can-party-participate.ts
function canPartyParticipate(ownerType, participantType, applicability) {
  if (!applicability) return true;
  const relationship = getRelationshipType(ownerType, participantType);
  return isRelationshipSupported(applicability, relationship);
}

// src/eligibility/validate.ts
function validatePartyEligibility(context, applicability) {
  const errors = [];
  const warnings = [];
  if (!applicability) {
    return { valid: true, errors, warnings };
  }
  if (!canPartyOwnSubModel(context.ownerPartyType, applicability)) {
    errors.push(
      applicability.reason ?? `Party type "${context.ownerPartyType}" cannot own this collaboration sub-model`
    );
  }
  if (context.participantPartyType) {
    if (!canPartyParticipate(
      context.ownerPartyType,
      context.participantPartyType,
      applicability
    )) {
      const relationship = getRelationshipType(
        context.ownerPartyType,
        context.participantPartyType
      );
      errors.push(
        `Relationship ${relationship} is not supported for this collaboration sub-model`
      );
    }
  }
  const primary = resolvePrimaryRelationship(applicability);
  if (primary && context.participantPartyType) {
    const actual = getRelationshipType(context.ownerPartyType, context.participantPartyType);
    if (actual !== primary) {
      warnings.push(
        `Primary relationship for this sub-model is ${primary}; current pairing is ${actual}`
      );
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// src/legacy/party-type.ts
var IMPLEMENTED_PARTY_TYPES = ["company", "individual"];
var RESERVED_PARTY_TYPES = [
  "government",
  "bank",
  "investor",
  "university",
  "consortium",
  "association",
  "ngo"
];
function isImplementedPartyType(type) {
  return IMPLEMENTED_PARTY_TYPES.includes(type);
}
function isReservedPartyType(type) {
  return RESERVED_PARTY_TYPES.includes(type);
}
function assertCreatablePartyType(type) {
  if (isImplementedPartyType(type)) return type;
  if (isReservedPartyType(type)) {
    throw new Error(`Party type "${type}" is reserved and not implemented in Sprint 2.5`);
  }
  throw new Error(`Unknown party type "${type}"`);
}
function resolveSourceEntityType(isCompanyAccount) {
  return isCompanyAccount ? "company" : "individual";
}
function resolvePartyTypeFromSourceEntity(sourceEntityType) {
  return sourceEntityType;
}

// src/legacy/ownership.ts
function resolveOwnerPartyId(entity) {
  if (entity.ownerPartyId) return entity.ownerPartyId;
  if (entity.creatorId) return entity.creatorId;
  if (entity.companyId) return entity.companyId;
  return void 0;
}

// src/legacy/synthesis.ts
function partyFromSourceEntity(account, sourceEntityType) {
  const partyType = resolvePartyTypeFromSourceEntity(sourceEntityType);
  const displayName = account.profile?.name?.trim() || account.email?.trim() || account.id;
  return {
    id: account.id,
    partyType,
    displayName,
    status: account.status ?? "active",
    sourceEntityId: account.id,
    sourceEntityType,
    primaryContactId: sourceEntityType === "individual" ? account.id : void 0,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  };
}
function partyFromAccount(account, isCompanyAccount) {
  const sourceEntityType = resolveSourceEntityType(isCompanyAccount);
  return partyFromSourceEntity(account, sourceEntityType);
}
function synthesizePrimaryMembership(userId, partyId, membershipRole = "owner") {
  return {
    userId,
    partyId,
    membershipRole,
    status: "active",
    isPrimary: true,
    joinedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function resolvePartyTypeFromAccount(account, companyIds) {
  return companyIds.has(account.id) ? "company" : "individual";
}
export {
  assertCreatablePartyType,
  canPartyOwnSubModel,
  canPartyParticipate,
  getRelationshipType,
  isImplementedPartyType,
  isRelationshipSupported,
  isReservedPartyType,
  partyFromAccount,
  partyFromSourceEntity,
  relationshipFlagsFromSupported,
  resolveOwnerPartyId,
  resolvePartyTypeFromAccount,
  resolvePartyTypeFromSourceEntity,
  resolvePrimaryRelationship,
  resolveSourceEntityType,
  synthesizePrimaryMembership,
  validatePartyEligibility
};
