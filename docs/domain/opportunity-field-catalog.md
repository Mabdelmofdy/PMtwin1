# Opportunity Field Catalog

**Module:** Opportunity (Enterprise Reference)  
**Authority:** Opportunity Module Enterprise Reference Specification  
**Scope:** Presentation / read-model contract only — does not change persistence or repositories.

Every persisted business field must have a presentation strategy: Displayed | Displayed With Formatting | Displayed With Redaction | Intentionally Hidden | Unsupported.

---

## Identity and lifecycle

| Name | Description | Type | Create Step | Persistence | Read Model | Workspace | Visibility | Marketplace | Export | Searchable | Filterable | Strategy |
|------|-------------|------|-------------|-------------|------------|-----------|------------|-------------|--------|------------|------------|----------|
| title | Opportunity name | string | Opportunity | opportunity.title | opportunity.title | Header / Overview | All authorized | Yes | Yes | Yes | Yes | Displayed |
| description | Short description | string | Opportunity | opportunity.description | opportunity.description | Overview | Full description flag | Teaser omit | Yes | Yes | No | Displayed |
| intent | Need / Offer / Hybrid | enum | Opportunity | opportunity.intent | collaboration.postIntent | Header / Overview | All | Yes | Yes | No | Yes | Displayed With Formatting |
| status | Lifecycle status | string | System | opportunity.status | collaboration.lifecycle / KPIs | Header / Journey | All | Lifecycle badge | Yes | Yes | Yes | Displayed With Formatting |
| visibilityStatus | Published / archived / etc. | string | System | opportunity.visibilityStatus | collaboration.visibilityStatus | Header | All | Lifecycle badge | Yes | No | Yes | Displayed |
| creatorId | Owner user id | id | System | opportunity.creatorId | creatorName only | Header | Creator name flag | No raw id | No raw id | No | No | Intentionally Hidden (id); Displayed (name) |
| createdAt / updatedAt | Timestamps | ISO | System | opportunity.* | formatters | Overview / History | History capability | No | Yes | No | No | Displayed With Formatting |

---

## Collaboration taxonomy

| Name | Description | Type | Create Step | Persistence | Read Model | Workspace | Visibility | Marketplace | Export | Searchable | Filterable | Strategy |
|------|-------------|------|-------------|-------------|------------|-----------|------------|-------------|--------|------------|------------|----------|
| mainCollaborationModel | Main model | string | Collaboration | opportunity.mainCollaborationModel | collaboration.mainModel | Overview / Header | All | Yes | Yes | No | Yes | Displayed |
| subModelType | Sub-model | string | Collaboration | opportunity.subModelType | collaboration.subModel | Overview / Header | All | Yes | Yes | No | Yes | Displayed |
| exchangeMode | Value exchange mode | string | Collaboration / Commercial | opportunity.exchangeMode | collaboration.commercialLabel | Overview / Commercial | Budget flag | Redacted summary | Yes | No | Yes | Displayed With Redaction |
| preferredMatchingTopology | Derived topology | string | System-derived | preferredMatchingTopology / derive | collaboration.matchingTopology | Overview / Matching | All | Yes | Yes | No | Yes | Displayed (read-only) |
| relationshipType | Business relationship | string | Collaboration attrs | collaborationAttributes | collaboration.relationshipType | Overview | All | No | Yes | No | No | Displayed when present |
| collaborationAttributes.* | Sub-model dynamic fields | record | Collaboration | collaborationAttributes | overview extras | Overview | Owner/participant | No | Partial | No | No | Displayed when present |

---

## Location and delivery

| Name | Description | Type | Create Step | Persistence | Read Model | Workspace | Visibility | Marketplace | Export | Searchable | Filterable | Strategy |
|------|-------------|------|-------------|-------------|------------|-----------|------------|-------------|--------|------------|------------|----------|
| location / city / country | Primary location | string | Opportunity / Timeline | opportunity.* | opportunity.location | Overview / Scope | All | Yes | Yes | Yes | Yes | Displayed |
| serviceArea | Service area | string | Opportunity / Timeline | collaborationAttributes.serviceArea | scope/overview.serviceArea | Overview / Scope | All | Optional | Yes | No | No | Displayed |
| richTimeline.serviceAreas | Service areas list | string[] | Timeline | attrs.richTimeline | scope.timeline | Scope | All | No | Yes | No | No | Displayed |
| workMode / deliveryMethod | Delivery mode | string | Timeline | opportunity.workMode / richTimeline.deliveryMethod | scope.deliveryMethod | Scope / Overview | All | Optional | Yes | No | No | Displayed |
| languages | Languages | string[] | Opportunity attrs | attrs.languages | overview.languages | Overview | All | No | Yes | No | No | Displayed |
| priority | Priority | string | Opportunity attrs | attrs.priority | overview.priority | Overview | Owner+ | No | Yes | No | No | Displayed |

---

## Skills, services, resources, capacity

| Name | Description | Type | Create Step | Persistence | Read Model | Workspace | Visibility | Marketplace | Export | Searchable | Filterable | Strategy |
|------|-------------|------|-------------|-------------|------------|-----------|------------|-------------|--------|------------|------------|----------|
| structuredSkills / coreSkills | Required/preferred skills | StructuredSkill[] | Scope | structuredSkills / scope / attrs | scope.skills | Scope | Full description | Counts only | Yes | Partial | Partial | Displayed With Formatting |
| requiredServices / offeredServices | Services | string[] | Scope | normalized.* / attrs | scope.requiredServices / offeredServices | Scope | Full description | No | Yes | No | No | Displayed |
| resources | Structured resources | OpportunityResource[] | Scope | attrs.resources | scope.structuredResources | Scope | Full description | No | Yes | No | No | Displayed |
| offerCapacity | Offer capacity | OfferCapacity | Scope | attrs.offerCapacity | scope.offerCapacity | Scope | Full description | No | Yes | No | No | Displayed |
| capacity | Legacy capacity | {required,available} | Legacy | opportunity.capacity | scope.capacity | Scope | Full description | No | Yes | No | No | Displayed |
| preferredPartnerType | Preferred partner | string | Opportunity | preferredPartnerType / attrs | scope.preferredPartnerType | Scope | All | No | Yes | No | No | Displayed |
| experienceLevel / certifications / teamSize / minimumQualifications | Qualifications | mixed | Scope | attrs.* | scope.qualifications | Scope / Overview | Full description | No | Yes | No | No | Displayed |

---

## Scope structure

| Name | Description | Type | Create Step | Persistence | Read Model | Workspace | Visibility | Marketplace | Export | Searchable | Filterable | Strategy |
|------|-------------|------|-------------|-------------|------------|-----------|------------|-------------|--------|------------|------------|----------|
| workPackages | Work packages | WorkPackage[] | Scope | attrs.workPackages | scope.workPackages | Scope | Full description | Counts | Yes | No | No | Displayed |
| tasks | Tasks (nested) | OpportunityTask[] | Scope | wp.tasks | scope.tasks | Scope | Full description | Counts | Yes | No | No | Displayed |
| deliverables | Package + top-level | OpportunityDeliverable[] | Scope | wp + attrs.deliverables | scope.deliverables | Scope | Full description | Counts | Yes | No | No | Displayed |
| milestones | Milestones | OpportunityMilestone[] | Scope | attrs.milestones / deliveryMilestones | scope.milestones | Scope | Full description | Counts | Yes | No | No | Displayed |
| richTimeline | Timeline windows | RichTimeline | Timeline | attrs.richTimeline | scope.richTimeline | Scope | Full description | No | Yes | No | No | Displayed |
| startDate / endDate / deliveryDeadline / duration | Dates | string/number | Timeline | opportunity / attrs | kpis.timeline | KPI / Scope | Budget/timeline flag | Partial | Yes | No | No | Displayed With Formatting |
| complianceRequirements | Compliance | string[] | Scope | opportunity / wp | scope.compliance | Scope | Full description | No | Yes | No | No | Displayed |

---

## Documents

| Name | Description | Type | Create Step | Persistence | Read Model | Workspace | Visibility | Marketplace | Export | Searchable | Filterable | Strategy |
|------|-------------|------|-------------|-------------|------------|-----------|------------|-------------|--------|------------|------------|----------|
| attachments | Attachments | array | Scope | opportunity / attrs | documents | Documents | Documents workspace | No | Names | No | No | Displayed |
| portfolio | Portfolio refs | string/array | Scope | attrs.portfolio | documents (Portfolio) | Documents | Documents workspace | No | Yes | No | No | Displayed |
| WP required/optional documents | Doc requirements | WorkPackageDocumentRequirement[] | Scope | wp.* | documents | Documents | Documents workspace | No | Yes | No | No | Displayed |

---

## Commercial

| Name | Description | Type | Create Step | Persistence | Read Model | Workspace | Visibility | Marketplace | Export | Searchable | Filterable | Strategy |
|------|-------------|------|-------------|-------------|------------|-----------|------------|-------------|--------|------------|------------|----------|
| commercialStructure | Multi-component structure | OpportunityCommercialStructure | Commercial | attrs / exchangeData / commercialStructure | commercial.* | Commercial | Audience redaction | Component types / hybrid | Owner+ amounts | No | Yes (mode) | Displayed With Redaction |
| cash fields (budget, currency, advance, retention, VAT, schedule, guarantees, penalties, …) | Payment details | CashCommercialComponent | Commercial | structure.components | commercial + Payment section | Commercial | showAmounts | Redacted | Owner+ | No | No | Displayed With Redaction |
| barter / profit_sharing / revenue_sharing / equity / custom | Component details | components | Commercial | structure.components | commercial | Commercial | showAmounts | Types only | Owner+ | No | No | Displayed With Redaction |
| allocationMethod / constraints | Allocation & constraints | structure | Commercial | structure.* | commercial | Commercial | showAmounts for amounts | Hidden amounts | Owner+ | No | No | Displayed With Redaction |
| commercialConstraints (legacy) | Legacy constraints | CommercialConstraints | Commercial | attrs | commercial.constraints (merged presentation) | Commercial | showAmounts | No | Owner+ | No | No | Displayed With Redaction |

---

## Intentionally Hidden / Unsupported

| Name | Strategy | Reason |
|------|----------|--------|
| Repository / seed IDs in UI copy | Intentionally Hidden | Routing only; never display |
| Views / bookmarks / shares | Unsupported | Not stored |
| Fake map coordinates | Unsupported | Geospatial not configured |
| Execution progress % | Unsupported | Pre-contract opportunity has no execution engine data |
| MatchingInsight estimated partners | Intentionally Hidden | Heuristic; not Matching Engine |

---

## Related matrices

- Workspace Coverage: see [`opportunity-coverage-matrices.md`](./opportunity-coverage-matrices.md)
- Commercial Coverage: same document
- Field Coverage Matrix: same document
