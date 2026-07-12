# PM-Twin Enterprise Admin Portal (Demo/UAT)

**Runtime:** `web/` only (frontend LocalStorage overrides)  
**Status:** Demo/UAT — LocalStorage is the authoritative persistence layer for Admin Settings

## Architecture

- **Active runtime:** React SPA under `web/src/pages/admin/**`
- **Admin Settings:** `web/src/domain/admin/settings/**` + `AdminSettingsRepository`
- **Persistence:** `overrides.adminSettings` inside namespaced `pmtwin_web_overrides`
- **Physical keys:** `PMTWIN_DEMO_pmtwin_web_overrides` / `PMTWIN_UAT_pmtwin_web_overrides`
- **No backend:** settings are fully functional without a settings API

## Settings mutation flow

```text
AdminSettingsPage
→ executeUpdateAdminSettingsSection / executeUpdateFeatureFlag
→ validateAdminSettings*
→ capability check (admin.settings.manage or section capability)
→ adminSettingsRepository.save
→ auditRepository.append
→ runtime refresh (matching cache reset, data-store notify)
```

## Feature flags

| Kind | Examples | Behavior |
|------|----------|----------|
| Editable | `showLegacyApplications`, `showEnvironmentBanner` | Persist + audit + export/import |
| Locked | `runtimeMode`, `usesNamespacedLocalStorage`, `storageTypeLabel` | Read-only with reason |

## Environment export / import / reset

- Export includes optional `adminSettings` + `productLanguageSettings` (backward compatible)
- Import validates settings schema when present; rejects locked flag overrides
- Reset clears namespace overrides → settings fall back to defaults
- Scenario restore clears overrides then applies entity patches → settings return to defaults unless a future scenario defines settings patches

## Permissions

Granular: `settings.*.manage`, `feature-flags.manage`, plus umbrella `admin.settings.manage`.  
Auditor remains read-only.

## Future Production Dependencies (not shown as operational forms)

- Server-authenticated settings API
- Real email/SMS/WhatsApp delivery
- Skills CMS / site-content publishing
- Production authentication policy enforcement

See also: `UX-CONSISTENCY-MATRIX.md`, `UAT-CERTIFICATION-CHECKLIST.md`
