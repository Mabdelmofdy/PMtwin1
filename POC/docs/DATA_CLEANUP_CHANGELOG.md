# Data cleanup changelog

### What this page is

Change log for **seed data** and cleanup passes in the POC.

### What happens next

Bump seed version when you change JSON under `POC/data/`.

---

## Version 1.13.0 – Database Audit and Unification

### Summary

Platform seed data was audited, consolidated, validated, and extended so the app runs on one consistent dataset. No core architecture changes; only data and reference files were updated.

### 1. Schema / field renames

- **Matches:** Seed used `userId` and `matchReasons`. The app and BRD expect `candidateId` and `criteria`. All match records now have:
  - `candidateId` (set from `userId` when missing)
  - `criteria` (set from `matchReasons` when missing)
  - `userId` and `matchReasons` kept for backward compatibility where the UI reads them.
- **matches.json** version bumped to 1.1.

### 2. Normalizations applied

- **Sectors / categories:** All `profile.sectors`, `profile.industry`, and `scope.sectors` normalized to a single canonical list (data-service `validSectors` plus Building, Commercial, Utilities, Oil and Gas). Casing standardized (e.g. "engineering" → "Engineering").
- **Skills:** All skill-like fields (profile.skills, profile.specializations, scope.requiredSkills, scope.offeredSkills, attributes.requiredSkills, profile.services) normalized via `skill-canonical.json` `skillSynonyms`. Unmapped skills added as canonical entries.
- **Locations:** Profile and opportunity location tokens normalized via `skill-canonical.json` `locationCanonical` (e.g. "riyadh" → "Riyadh", "eastern-province" → "Eastern Province"). Additional location keys added for UAE, Qatar, Kuwait, Makkah, Dammam, etc.

### 3. Records added

- **Barter (two-way):** Four opportunities so two creators (user-pro-005, user-pro-006) each have one need and one offer that mutually satisfy (Engineering Consulting ↔ Construction Materials).
- **Circular exchange:** Six opportunities so three creators (user-pro-002, user-pro-003, user-pro-004) form a need/offer cycle: Project Management ↔ Structural Analysis ↔ Project Management.
- **One-way** and **consortium** were already covered (existing needs/offers and opp-001 with memberRoles).

### 4. Records filled (no new IDs)

- **Users:** Admin (user-admin-001) received minimal profile fields: location, skills, specializations, yearsExperience, preferredPaymentModes so profile is complete. Other users received backfilled sectors, specializations, preferredPaymentModes where missing.
- **Companies:** Backfilled industry (from sectors), preferredPaymentModes, financialCapacity where missing.
- **Opportunities:** Backfilled intent (request/offer), collaborationModel, paymentModes, and scope (from attributes when scope was empty) so all opportunities are valid for matching.

### 5. Reference data updates

- **lookups.json:** `targetSectors` extended with Infrastructure, Building, Commercial, Utilities, Oil and Gas, Industrial, Architecture, Engineering.
- **skill-canonical.json:** 118+ skill synonyms added so all skills used in seed map to a canonical form. 16 location keys added (uae, dubai, khobar, makkah, doha, etc.).

### 6. Scripts added (POC/scripts/)

| Script | Purpose |
|--------|--------|
| `audit-data.js` | Runs full data audit; writes `docs/DATA_AUDIT_SUMMARY.md` and `docs/audit-report.json`. |
| `consolidate-data.js` | Normalizes matches (candidateId/criteria), sectors, skills, locations; backs up data to `data/backup/` before writing. |
| `validate-entities.js` | Fills missing required fields on users, companies, opportunities. |
| `add-matching-data.js` | Appends barter and circular opportunities so all matching models have data. |
| `fill-canonical-from-audit.js` | Merges audit-report inconsistent skills/locations into skill-canonical.json. |

### 7. Canonical lists used

- **Sectors:** Construction, Infrastructure, Technology, Energy, Manufacturing, Real Estate, Transportation, Architecture, Engineering, Hospitality, Industrial, Agriculture, Education, Legal Services, Building, Commercial, Utilities, Oil and Gas.
- **Skills:** Defined in `data/skill-canonical.json` (skillSynonyms). New skills use the value as canonical (e.g. "Structural Design").
- **Locations:** Defined in `data/skill-canonical.json` (locationCanonical) and `data/locations.json` for hierarchy.

### 8. Optional database reset

- In browser: `window.resetAppData()` (from app-init.js) clears localStorage and re-seeds from JSON. After upgrading to 1.13.0, reload and re-seed once so the new seed version is applied.
- No separate Node “reset” script; seed is loaded by the app on first load or when seed version changes.
