# Data audit and unification scripts

### What this page is

How to run **data audit / consolidate / validate** scripts for seed JSON.

### What happens next

See output under `POC/docs/` and `POC/data/backup/` after runs.

---

Run all scripts from the **repository root**: `node POC/scripts/<script>.js`

## Recommended order

1. **audit-data.js** – Audit current seed data. Writes `POC/docs/DATA_AUDIT_SUMMARY.md` and `POC/docs/audit-report.json`.
2. **consolidate-data.js** – Normalize matches (userId→candidateId, matchReasons→criteria), sectors, skills, locations. Backs up JSON to `POC/data/backup/` before writing.
3. **validate-entities.js** – Fill missing required fields on users, companies, opportunities.
4. **add-matching-data.js** – Add minimal barter and circular opportunities so all matching models have data.
5. **expand-demo-data.js** – Expand demo data for client presentation: 20–30 professionals, 10–15 companies, 40–50 opportunities, more applications and matches. Adds 2 pending users and 1 draft opportunity for admin demo. Run once; then bump `CURRENT_SEED_VERSION` in data-service.js so the app re-seeds.
6. **fill-canonical-from-audit.js** – Merge audit-report skills and locations into `skill-canonical.json` (run after audit).
7. **generate-reports.js** – Generate Data Coverage, Matching Readiness, and Missing Entities reports in `POC/docs/reports/`.

## Optional database reset (browser)

The app seeds from `POC/data/*.json` on first load or when the seed version changes. To force a full re-seed in the browser:

- Open the app, open the browser console, and run: **`window.resetAppData()`**
- Or clear localStorage for the app origin and reload.

Seed version is in `POC/src/core/data/data-service.js` (`CURRENT_SEED_VERSION`). After running expand-demo-data.js it is set to `1.15.0`. To reset demo data in the browser, use `window.resetAppData()` or clear localStorage and reload.
