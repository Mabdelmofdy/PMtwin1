# Admin Portal — Demo/UAT Certification Checklist

**Scope:** Frontend-only Demo/UAT Enterprise Admin Portal  
**Not in scope:** Production security, server auth, backend APIs

## Build gates

- [ ] `npm run type-check` (web) passes
- [ ] `npm run test` (relevant admin suites) passes
- [ ] `npm run build` (web) passes
- [ ] Lint clean on touched admin files

## Role matrix

- [ ] `admin` / `platform_admin` can open `/admin`
- [ ] `moderator` can open `/admin`
- [ ] `auditor` can open `/admin` (read-oriented capabilities)
- [ ] `professional` / `company_owner` redirected to access denied
- [ ] Auditor cannot mutate user status when capability denied

## Command Center & Inbox

- [ ] Executive shows live repository counts (no hardcoded demo metrics)
- [ ] Operations cards drill to filtered destinations
- [ ] Risk center lists real risk indicators
- [ ] Admin Inbox aggregates vetting / inactive / CA items
- [ ] My Queue filters by assignee when present

## Identity & Compliance

- [ ] Users list filters and opens detail
- [ ] User detail shows related objects, timeline, quick actions
- [ ] Suspend/Activate requires reason and appends audit
- [ ] Parties / Memberships / Roles pages load
- [ ] Vetting approve/reject/clarification uses vetting admin commands + audit
- [ ] Taxonomy shows 13 registered / 15 target / gap 2 (no invented models)

## Marketplace & Commercial

- [ ] Opportunities / Matching / PostMatches / Quality / Moderation load
- [ ] Negotiation detail shows offers; transcript gated by permission
- [ ] Commercial Agreements list uses Commercial Agreement terminology
- [ ] Award page calls existing `awardCommercialAgreement` (rollback preserved by handler)
- [ ] Approvals / Legal Review queues link to canonical details
- [ ] No Match Type picker on any admin surface

## Explore & System

- [ ] Global Search returns grouped repository results
- [ ] Platform Explorer is read-only catalogue
- [ ] Environments panel restore/export/import/reset works in demo/uat; hidden/non-destructive in production mode
- [ ] Health page uses Demo/UAT diagnostics only (no fake DB/API/queue)
- [ ] Feature flags and data quality pages load
- [ ] Failed local commands log available

## Namespace isolation

- [ ] Demo and UAT namespaced LocalStorage do not collide when switching `VITE_RUNTIME_MODE`
- [ ] Scenario restore/export/import round-trip preserves seed integrity

## Accessibility / RTL

- [ ] Admin pages usable with keyboard (skip links / focus in tables)
- [ ] Arabic RTL does not break Admin shells (direction provider)

## Release notes (template)

### Added
- Enterprise Admin IA: Command Center, Workspaces, Explore, domain sections
- Admin Inbox, Global Search, Platform Explorer
- Identity / Compliance / Marketplace / Commercial workspace hubs
- Universal timeline, related objects, quick actions contracts
- Demo/UAT health diagnostics; Environment Management under System

### Changed
- Admin navigation regrouped; Environment Management moved off Settings
- Fake health/report metrics removed

### Guardrails
- Matching / topology / award / lifecycle engines untouched
- Frontend-only Demo/UAT persistence retained
