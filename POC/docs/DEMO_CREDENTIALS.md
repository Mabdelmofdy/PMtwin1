# Demo User Credentials List

This document lists all demo users and demo companies for testing the PMTwin POC with the demo-40-opportunities dataset. **For demo/testing only** — do not use in production.

**Passwords:**
- **Admin:** `admin123`
- **All other accounts (Demo40 and Pending):** `demo123`

Data is loaded automatically on first launch: the app merges demo users, demo companies, demo opportunities, demo applications, demo contracts, demo matches, demo notifications, and pending users from the JSON files under `POC/data/`.

**Profile page data source:** Profile data (skills, certificates, experience, etc.) does not come from the JSON files directly. The data service (`POC/src/core/data/data-service.js`) loads `users.json` and `companies.json`, then merges `demo-users.json`, `demo-companies.json`, and other demo files via `mergeDemoData()` into localStorage. The profile page reads the current user via `dataService.getUserOrCompanyById(user.id)` (with fallback to `getUsers()` / `getCompanies()` when needed) after login.

**On the login page:** Click "Demo user credentials" (or the equivalent link) to open a modal that lists these accounts; click a row to fill the login form.

---

## Quick reference (suggested logins)

**Full profile (skills, certifications, experience entries):** Use **demo06@demo.test** or **demo07@demo.test** to verify that the profile page shows skills, certificates, and experience (job history). Other demo accounts (e.g. demo01, demo02) have minimal profile data by design and will show mostly empty sections.

| Type | Email | Password | Note |
|------|--------|----------|------|
| Admin | admin@pmtwin.com | admin123 | Platform admin; access vetting, matching, reports |
| Pending (vetting) | pending01@demo.test | demo123 | Professional awaiting approval; use to test vetting flow |
| Pending (clarification) | pending02@demo.test | demo123 | Company in clarification_requested; use to test vetting flow |
| Professional | demo01@demo.test | demo123 | Individual creator; has applications and matches for full workflow |
| Professional | demo04@demo.test | demo123 | **Full workflow demo:** applications, matches, notifications (dashboard counts > 0) |
| Consultant | demo06@demo.test | demo123 | Structural engineer; **full profile** (skills, certs, experience entries); has accepted application / contract |
| Consultant | demo07@demo.test | demo123 | **Full profile** (skills, certifications, experience entries); project management / PMO |
| Company (construction) | company01@demo.test | demo123 | Owns Need: Structural engineer; has applications and contract |

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

## Demo companies

| ID | Name | Email | Password | Role | Notes |
|----|------|--------|----------|------|--------|
| demo-c01 | Al-Riyadh Construction | company01@demo.test | demo123 | company_owner | Construction; owns Need: Structural engineer |
| demo-c02 | Gulf Development Co | company02@demo.test | demo123 | company_owner | Developer; owns Need: Project management |
| demo-c03 | Eastern Equipment & Supply | company03@demo.test | demo123 | company_owner | Equipment supplier; owns Offer: Heavy equipment |
| demo-c04 | Najd Investment Group | company04@demo.test | demo123 | company_owner | Investor |
| demo-c05 | Saudi Infrastructure Partners | company05@demo.test | demo123 | company_owner | Infrastructure; consortium lead (Highway project) |
| demo-c06 | Red Sea Building Co | company06@demo.test | demo123 | company_owner | Building developer; consortium lead (Mixed-use) |

---

## Data files

- **Users:** [POC/data/demo-users.json](../data/demo-users.json)
- **Pending users (vetting):** [POC/data/demo-pending-users.json](../data/demo-pending-users.json)
- **Companies:** [POC/data/demo-companies.json](../data/demo-companies.json)
- **Opportunities:** [POC/data/demo-40-opportunities.json](../data/demo-40-opportunities.json)
- **Applications:** [POC/data/demo-applications.json](../data/demo-applications.json)
- **Contracts:** [POC/data/demo-contracts.json](../data/demo-contracts.json)
- **Matches:** [POC/data/demo-matches.json](../data/demo-matches.json)
- **Notifications:** [POC/data/demo-notifications.json](../data/demo-notifications.json)

---

## Full workflow

To see the platform workflow (Register → Vetting → Dashboard → Opportunity → Matching → Application → Negotiation → Contract → Execution), open **How it works** from the public navigation, or go to `/workflow`.

**Demo data for dashboard counts:** Every demo user and demo company has at least one application, one match, and one notification aligned with opportunities. Log in as any demo user (e.g. **demo04@demo.test**, **demo01@demo.test**, **company01@demo.test**) to see Applications, Matches, and Notifications non-zero. Demo matches and notifications are merged from `demo-matches.json` and `demo-notifications.json` on each load.
