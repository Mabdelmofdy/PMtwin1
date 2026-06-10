# Demo user credentials list

### What this page is

List of **demo accounts** and passwords for testing the POC with seeded data.

### Why it matters

QA and trainers need logins without reading JSON files.

### What you can do here

- Copy an email/password pair for a scenario.
- Understand how demo data merges on first load.

### What happens next

Sign in through the normal **Login** page (demo picker when available).

### Tips

**For demo and testing only** — never use these passwords in production.

---

**Passwords:**
- **Admin:** `admin123`
- **40-opportunity workflow users and companies:** `Pmtwin@2026`
- **Legacy Demo40 and Pending accounts:** `demo123`

Data is loaded automatically on first launch: the app merges demo users, demo companies, demo opportunities, demo applications, demo contracts, demo matches, demo notifications, **demo connections** (pre-accepted pairs for People and Messages), and pending users from the JSON files under `POC/data/`.

**Profile page data source:** Profile data (skills, certificates, experience, etc.) does not come from the JSON files directly. The data service (`POC/src/core/data/data-service.js`) loads `users.json` and `companies.json`, then merges `demo-users.json`, `demo-companies.json`, and other demo files via `mergeDemoData()` into localStorage. The profile page reads the current user via `dataService.getUserOrCompanyById(user.id)` (with fallback to `getUsers()` / `getCompanies()` when needed) after login.

**On the login page:** Click "Demo user credentials" (or the equivalent link) to open a modal that lists these accounts; click a row to fill the login form.

---

## Quick reference (suggested logins)

**40-opportunity workflow (current canonical dataset):** Run `npm run seed:controlled` then `npm run seed:e2e` from `POC/`. Log in with account type **Individual** (professionals) or **Company** (B2B accounts). Reset browser data with `window.resetAppData()` after seeding.

| Type | Email | Password | Note |
|------|--------|----------|------|
| Admin | admin@pmtwin.com | admin123 | Platform admin; access vetting, matching, reports |
| Company (contractor) | contact@alriyadh-construction.test | Pmtwin@2026 | Owns `seed-opp-007`, `023`; applications and matches |
| Company (developer) | contact@gulf-development.test | Pmtwin@2026 | Owns `seed-opp-005`, `024`; active negotiation on 005 |
| Company (equipment) | contact@eastern-equipment.test | Pmtwin@2026 | Owns `seed-opp-025` (MEP offer) |
| Company (investor) | contact@najd-investment.test | Pmtwin@2026 | Owns `seed-opp-028`, `037`; equity JV negotiation |
| Company (infrastructure) | contact@sa-infra-partners.test | Pmtwin@2026 | Owns `seed-opp-014`, `039`; consortium deals in execution |
| Company (developer) | contact@redsea-building.test | Pmtwin@2026 | Owns `seed-opp-029`, `034`; hybrid exchange needs |
| Professional | khalid.alharbi@pmtwin.test | Pmtwin@2026 | Architect; owns `seed-opp-001`; completed one-way deal |
| Professional | sara.almutairi@pmtwin.test | Pmtwin@2026 | BIM consultant; owns `seed-opp-002`; applications on company needs |

**Legacy Demo40 (cleared from browser seed):** Use **demo06@demo.test** or **demo07@demo.test** for full profile UI testing if legacy data is restored.

| Type | Email | Password | Note |
|------|--------|----------|------|
| Pending (vetting) | pending01@demo.test | demo123 | Professional awaiting approval; use to test vetting flow |
| Pending (clarification) | pending02@demo.test | demo123 | Company in clarification_requested; use to test vetting flow |
| Professional | demo04@demo.test | demo123 | Legacy full workflow demo |
| Company (construction) | company01@demo.test | demo123 | Legacy; cleared from current seed |

---

## Pre-seeded connections (Demo40)

These rows are merged from [demo-connections.json](../data/demo-connections.json) on every app load (by stable `id`). All are **accepted** so **Find / People** and **Messages** show partners without sending requests first. Log in as any participant in a row to see the other side in your network.

| From | To | Scenario |
|------|-----|----------|
| Al-Riyadh Construction (`demo-c01`) | Ahmed Hassan (`demo-u01`) | Company ↔ professional |
| Al-Riyadh Construction (`demo-c01`) | Sara Al-Mutairi (`demo-u04`) | Company ↔ applicant-style contact |
| Al-Riyadh Construction (`demo-c01`) | Layla Al-Qahtani (`demo-u06`) | Contractor ↔ structural consultant |
| Gulf Development Co (`demo-c02`) | Sara Al-Mutairi (`demo-u04`) | Developer ↔ professional |
| Gulf Development Co (`demo-c02`) | Mohammed Al-Saud (`demo-u07`) | Developer ↔ PM consultant |
| Ahmed Hassan (`demo-u01`) | Fatima Al-Rashid (`demo-u02`) | Professional ↔ professional |
| Ahmed Hassan (`demo-u01`) | Sara Al-Mutairi (`demo-u04`) | Professional ↔ professional |
| Fatima Al-Rashid (`demo-u02`) | Omar Khalid (`demo-u03`) | Professional ↔ professional |
| Sara Al-Mutairi (`demo-u04`) | Layla Al-Qahtani (`demo-u06`) | QS ↔ structural consultant |
| Sara Al-Mutairi (`demo-u04`) | Mohammed Al-Saud (`demo-u07`) | Professional ↔ consultant |

---

## Pending accounts (vetting flow testing)

Use these to test the **registration → vetting → activation** flow. Both can log in; Apply and other mutating actions are disabled until approved. Admins see them in **Admin → Vetting**.

| ID | Name | Email | Password | Role | Status |
|----|------|--------|----------|------|--------|
| demo-pending-01 | Khalid Al-Mutairi | pending01@demo.test | demo123 | professional | pending |
| demo-pending-02 | Jeddah Contracting Co | pending02@demo.test | demo123 | company_owner | clarification_requested |

---

## Admin

| Email | Password | Role |
|--------|----------|------|
| admin@pmtwin.com | admin123 | admin |

---

## Demo users (individuals)

| ID | Name | Email | Password | Role |
|----|------|--------|----------|------|
| demo-u01 | Ahmed Hassan | demo01@demo.test | demo123 | professional |
| demo-u02 | Fatima Al-Rashid | demo02@demo.test | demo123 | professional |
| demo-u03 | Omar Khalid | demo03@demo.test | demo123 | professional |
| demo-u04 | Sara Al-Mutairi | demo04@demo.test | demo123 | professional |
| demo-u05 | Youssef Ibrahim | demo05@demo.test | demo123 | professional |
| demo-u06 | Layla Al-Qahtani | demo06@demo.test | demo123 | consultant |
| demo-u07 | Mohammed Al-Saud | demo07@demo.test | demo123 | consultant |
| demo-u08 | Nadia Hassan | demo08@demo.test | demo123 | consultant |
| demo-u09 | Khalid Al-Zahrani | demo09@demo.test | demo123 | consultant |
| demo-u10 | Rania Mahmoud | demo10@demo.test | demo123 | professional |
| demo-u11 | Tariq Al-Harbi | demo11@demo.test | demo123 | professional |
| demo-u12 | Hala Al-Dosari | demo12@demo.test | demo123 | consultant |
| demo-u13 | Faisal Al-Otaibi | demo13@demo.test | demo123 | professional |
| demo-u14 | Mariam Al-Ghamdi | demo14@demo.test | demo123 | consultant |
| demo-u15 | Abdullah Al-Shammari | demo15@demo.test | demo123 | professional |
| demo-u16 | Dina Al-Mansour | demo16@demo.test | demo123 | consultant |
| demo-u17 | Hassan Al-Juhani | demo17@demo.test | demo123 | professional |
| demo-u18 | Noura Al-Subai | demo18@demo.test | demo123 | consultant |
| demo-u19 | Ibrahim Al-Tamimi | demo19@demo.test | demo123 | professional |
| demo-u20 | Lina Al-Harbi | demo20@demo.test | demo123 | consultant |
| demo-u21 | Salem Al-Qarni | demo21@demo.test | demo123 | professional |
| demo-u22 | Reem Al-Dossary | demo22@demo.test | demo123 | professional |
| demo-u23 | Waleed Al-Shahrani | demo23@demo.test | demo123 | consultant |
| demo-u24 | Huda Al-Omari | demo24@demo.test | demo123 | professional |
| demo-u25 | Rashid Al-Balawi | demo25@demo.test | demo123 | professional |
| demo-u26 | Amira Al-Harthy | demo26@demo.test | demo123 | consultant |
| demo-u27 | Turki Al-Anazi | demo27@demo.test | demo123 | professional |
| demo-u28 | Rasha Al-Ghamdi | demo28@demo.test | demo123 | consultant |
| demo-u29 | Bandar Al-Rashidi | demo29@demo.test | demo123 | professional |
| demo-u30 | Dana Al-Salem | demo30@demo.test | demo123 | professional |
| demo-u31 | Fahad Al-Malki | demo31@demo.test | demo123 | professional |
| demo-u32 | Rania Al-Otaibi | demo32@demo.test | demo123 | consultant |
| demo-u33 | Sultan Al-Dosari | demo33@demo.test | demo123 | consultant |
| demo-u34 | Nora Al-Harbi | demo34@demo.test | demo123 | professional |
| demo-u35 | Majid Al-Qahtani | demo35@demo.test | demo123 | consultant |

---

## Workflow companies (canonical 40-opportunity dataset)

All use password **`Pmtwin@2026`**. Log in with account type **Company**.

| ID | Name | Email | Role | Owned opportunities |
|----|------|--------|------|---------------------|
| seed-co-corp-001 | Al-Riyadh Construction | contact@alriyadh-construction.test | company_owner | `seed-opp-007`, `023` |
| seed-co-corp-002 | Gulf Development Co | contact@gulf-development.test | company_owner | `seed-opp-005`, `024` |
| seed-co-corp-003 | Eastern Equipment & Supply | contact@eastern-equipment.test | company_owner | `seed-opp-025` |
| seed-co-corp-004 | Najd Investment Group | contact@najd-investment.test | company_owner | `seed-opp-028`, `037` |
| seed-co-corp-005 | Saudi Infrastructure Partners | contact@sa-infra-partners.test | company_owner | `seed-opp-014`, `039` |
| seed-co-corp-006 | Red Sea Building Co | contact@redsea-building.test | company_owner | `seed-opp-029`, `034` |

## Legacy demo companies (cleared)

| ID | Name | Email | Password | Role | Notes |
|----|------|--------|----------|------|--------|
| demo-c01 | Al-Riyadh Construction | company01@demo.test | demo123 | company_owner | Legacy Demo40; no longer in browser seed |
| demo-c02 | Gulf Development Co | company02@demo.test | demo123 | company_owner | Legacy Demo40 |
| demo-c03 | Eastern Equipment & Supply | company03@demo.test | demo123 | company_owner | Legacy Demo40 |
| demo-c04 | Najd Investment Group | company04@demo.test | demo123 | company_owner | Legacy Demo40 |
| demo-c05 | Saudi Infrastructure Partners | company05@demo.test | demo123 | company_owner | Legacy Demo40 |
| demo-c06 | Red Sea Building Co | company06@demo.test | demo123 | company_owner | Legacy Demo40 |

---

## Data files

- **Users:** [POC/data/demo-users.json](../data/demo-users.json)
- **Pending users (vetting):** [POC/data/demo-pending-users.json](../data/demo-pending-users.json)
- **Companies:** [POC/data/demo-companies.json](../data/demo-companies.json)
- **Opportunities:** [POC/data/demo-40-opportunities.json](../data/demo-40-opportunities.json)
- **Applications:** [POC/data/demo-applications.json](../data/demo-applications.json)
- **Contracts:** [POC/data/demo-contracts.json](../data/demo-contracts.json)
- **Post matches (canonical):** [POC/data/demo-post-matches.json](../data/demo-post-matches.json)
- **Matches (deprecated):** [POC/data/demo-matches.json](../data/demo-matches.json) — not loaded when legacy matching is off
- **Notifications:** [POC/data/demo-notifications.json](../data/demo-notifications.json)
- **Connections (pre-accepted demo pairs):** [POC/data/demo-connections.json](../data/demo-connections.json)

---

## Full workflow

To see the platform workflow (Register → Vetting → Dashboard → Opportunity → Matching → Application → Negotiation → Contract → Execution), open **How it works** from the public navigation, or go to `/workflow`.

**Demo data for dashboard counts:** After `npm run seed:e2e`, workflow companies and professionals have applications, **post matches**, and notifications aligned with opportunities. Log in as **contact@alriyadh-construction.test** (Company) or **khalid.alharbi@pmtwin.test** (Individual) to see non-zero dashboard counts. Demo **`post_matches`** merge from `demo-post-matches.json`; notifications from `demo-notifications.json`. Pre-accepted **connections** merge from `demo-connections.json` so **Find / People** and **Messages** have partners without creating requests first.
