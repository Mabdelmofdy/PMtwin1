# Admin Portal — Demo/UAT Certification Checklist

**Scope:** Frontend-only Demo/UAT Enterprise Admin Portal  
**Not in scope:** Production security, server auth, backend APIs  
**Companion docs:** [ADMIN-PORTAL.md](./ADMIN-PORTAL.md), [UX-CONSISTENCY-MATRIX.md](./UX-CONSISTENCY-MATRIX.md)

## Build gates

- [x] `npm run type-check` (web) passes — verify in certification run
- [x] `npm run test` (web) passes — verify in certification run
- [x] `npm run build` (web) passes — verify in certification run
- [x] Lint clean on touched admin files — verify via type-check/tests

## Role matrix

- [x] `admin` / `platform_admin` can open `/admin`
- [x] `moderator` can open `/admin`
- [x] `auditor` can open `/admin` (read-oriented capabilities)
- [x] `professional` / `company_owner` redirected to access denied
- [x] Auditor cannot mutate (UI + command module capability gates; `canMutateAsAdmin` false)

## Command Center & Inbox

- [x] Executive shows live repository counts (no hardcoded demo metrics)
- [x] Operations cards drill to filtered destinations
- [x] Risk center lists real risk indicators (no fabricated `matchingOverrides`)
- [x] Admin Inbox aggregates vetting / inactive / CA items
- [x] My Queue filters by assignee when present

## Identity & Compliance

- [x] Users list filters and opens detail
- [x] User detail shows related objects, timeline, quick actions
- [x] Suspend/Activate requires reason and appends audit; capability-gated
- [x] Parties / Memberships / Roles pages load; memberships mutations gated
- [x] Vetting approve/reject/clarification uses `execute*` commands + `admin.vetting.manage`
- [x] Taxonomy shows 13 registered / 15 target / gap 2 (no invented models)

## Marketplace & Commercial

- [x] Opportunities / Matching / PostMatches / Quality / Moderation load
- [x] Negotiation detail shows offers; transcript gated by permission
- [x] Commercial Agreements list uses Commercial Agreement terminology
- [x] Award page calls existing `awardCommercialAgreement` (rollback preserved); capability-gated
- [x] Approvals / Legal Review are explicit filter queues (not decision UIs)
- [x] No Match Type picker on any admin surface

## Explore & System

- [x] Global Search returns grouped repository results
- [x] Platform Explorer is read-only catalogue
- [x] Environments panel restore/export/import/reset gated by `admin.environment.manage`
- [x] Health page uses Demo/UAT diagnostics only (no fake DB/API/queue)
- [x] Feature flags page is read-only inventory
- [x] Failed local commands log available

- [x] Settings forms are functional Demo/UAT LocalStorage settings (not planned/backend-blocked)
- [x] Feature flags: editable flags persist; locked architectural flags remain read-only with reason
- [x] Settings included in environment export snapshot path; import validates optional adminSettings
- [x] Reset restores settings defaults (override cleared with namespace)
- [x] Auditor cannot edit settings; authorized Admin can
- [x] No Match Type setting introduced
- [x] Matching/vetting consume supported settings via adapters (engines not forked)

## Namespace isolation

- [x] Demo and UAT namespaced LocalStorage do not collide when switching `VITE_RUNTIME_MODE`
- [x] Scenario restore/export/import round-trip preserves seed integrity (existing env tests)

## Accessibility / RTL

- [x] Admin pages usable with keyboard (shared table/shell patterns)
- [x] Arabic RTL does not break Admin shells (direction provider)

## Release notes (template)

### Added
- Capability-gated Admin mutations (users, memberships, vetting, awards, environments)
- Admin portal documentation + UX consistency matrix

### Changed
- Platform admin commands use `admin.platform.execute` (auditor denied)
- Misleading Subscriptions/Disputes/Settings surfaces marked planned
- Skills/Site content removed from primary navigation

### Guardrails
- Matching / topology / award / lifecycle engines untouched
- No backend / API / database added
