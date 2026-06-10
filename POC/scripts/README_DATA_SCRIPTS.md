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

## E2E workflow seed (40 opportunities)

`npm run seed:e2e` (from `POC/`) runs `scripts/seed-e2e-workflow.js`, the re-runnable generator that produces one clean, realistic end-to-end dataset tied to the 40 `seed-opp-*` opportunities and their 18 `seed-user-*` owners. It is idempotent:

1. Resets all 40 opportunities to `published`.
2. Regenerates `demo-post-matches.json` through the real engine (`seed-post-matches.js`).
3. Applies a deterministic lifecycle and writes `demo-applications.json`, `demo-negotiations.json`, `demo-deals.json`, `demo-contracts.json`, `demo-notifications.json`, and `demo-connections.json`, then sets the final opportunity/match statuses.

**Credentials:** all 18 workflow users and 6 B2B company accounts share the password **`Pmtwin@2026`** (e.g. `khalid.alharbi@pmtwin.test`, `contact@alriyadh-construction.test`); profiles are enriched to clear the GAP-P05 publish gate (>=70%). Companies own 11 of 40 opportunities (`seed-co-corp-001`–`006`). The base admin (`admin@pmtwin.com` / `admin123`) is unchanged. Legacy demo40 accounts (`demo*@demo.test`, `company*@demo.test`) have been wiped.

**Stage distribution:**

- **Published + pending matches** — most opportunities (Scenario A–G, circular ring `017`-`022`, fillers `023`-`025`, exchange block `029`-`038`).
- **Active applications/proposals** — `seed-opp-007`, `023`, `024`, `031`, `032`, `037` (statuses `pending`/`reviewing`/`shortlisted`).
- **Active negotiation** — barter `010`/`012`, task-based barter `026`/`027`, equity JV `028`/`040`, cash `005`.
- **Closed -> active contracts/deals** — one-way `001`/`002` (completed), highway consortium `014`/`015` (active), wind consortium `039`/`035` (profit-sharing, active).

After running, bump `CURRENT_SEED_VERSION` in `data-service.js` (currently `2.2.0` for this dataset) so browsers re-seed, or run `window.resetAppData()`.

## Optional database reset (browser)

The app seeds from `POC/data/*.json` on first load or when the seed version changes. To force a full re-seed in the browser:

- Open the app, open the browser console, and run: **`window.resetAppData()`**
- Or clear localStorage for the app origin and reload.

**Seed trace (POC debug, off by default):** Set `CONFIG.SEED_TRACE.enabled = true` in `POC/src/core/config/config.js` to show the bottom **Seed trace** bar and inline page hints. Compares localStorage vs bundled JSON seed counts.

Seed version is in `POC/src/core/data/data-service.js` (`CURRENT_SEED_VERSION`). After running expand-demo-data.js it is set to `1.15.0`. To reset demo data in the browser, use `window.resetAppData()` or clear localStorage and reload.
