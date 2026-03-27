# Company workflow

### What this page is

How **company accounts** register, sign in, create opportunities, and show up on dashboards—compared side by side with individual users.

### Why it matters

Companies and people share most screens, but the stored **creator** id and session context differ.

### What you can do here

- Walk company registration and login.
- See how **creator id** scopes opportunities and matches.
- Preview future company-role ideas from the BRD.

### Step-by-step actions

1. Register as a company and wait for approval.
2. Log in with the company email.
3. Create opportunities the same way as individuals.

### What happens next

Published opportunities follow [opportunity-workflow.md](opportunity-workflow.md) and matching behaves the same, with company ids in participant lists.

### Tips

- Member invite flows may be limited in the POC—check [implementation-status.md](../implementation-status.md).

---

## 1. Company registration

Same high-level flow as user registration, with company-specific fields:

1. User selects **Company** account type on register page.
2. Form includes: email, password, company name, CR number, classifications, financial capacity, etc. (see BRD/Data Models company profile).
3. Submit → `data-service` creates company record (or equivalent company creation path) with `status: 'pending'`.
4. Admin approves/rejects in **Admin → Users** or **Vetting** (companies may appear in same list or a company-specific list depending on implementation).
5. On approval, company status → `active`; notification sent.

**Inputs:** Company email, password, profile (name, crNumber, classifications, financialCapacity, etc.).  
**Outputs:** Company record; notifications.

**Note:** In the POC, both users and companies may be created and merged from seed/demo JSON; demo companies (e.g. `company01@demo.test`) allow testing company login and company-owned opportunities.

---

## 2. Company Login

- Company uses **same login page** as individuals: email + password.
- `auth-service` (or login flow) uses `getUserOrCompanyByEmail(email)` so that both `pmtwin_users` and `pmtwin_companies` are checked.
- Session stores identity (e.g. company id and type) so layout and data (e.g. “My opportunities”) are scoped to that company.

**Inputs:** Company email, password.  
**Outputs:** Session (company context).

---

## 3. Company as Opportunity Creator

- Companies can create opportunities the same way as users: **Create opportunity** → select model/sub-model → fill attributes → save as draft or publish.
- `creatorId` on the opportunity is the **company id** (from `pmtwin_companies`).
- Pipeline, matches, deals, and contracts are then tied to that company (e.g. `getOpportunities()` filtered by creatorId when showing “My opportunities”).

**No separate company-only workflow document is needed for opportunity creation** — it reuses the same opportunity workflow; only the actor (company vs user) and creatorId differ.

---

## 4. Company Dashboard

- **Dashboard** (`/dashboard`) can show company-specific metrics: e.g. opportunities created by this company, applications received, matches where the company is a participant.
- If the app supports both “user dashboard” and “company dashboard”, routing may expose `/company-dashboard` (CONFIG.ROUTES.COMPANY_DASHBOARD); layout may switch content based on current actor type.

**Inputs:** Session (company id).  
**Outputs:** Dashboard data (opportunities, applications, matches, deals) for that company.

---

## 5. Company Roles (Future)

BRD defines company roles: **Company Owner**, **Company Admin**, **Company Member**. In the POC:

- A **user** may have role `company_owner` and be linked to a company (e.g. same email).
- Full company-member management (invite members, assign roles) is **not fully implemented**; it is specified in BRD for future implementation.

**State changes:** When company roles are implemented, inviting a member would create a user or link with a company role; revoking would update or remove that link.

---

## Company vs User: Same Flows

| Flow | User | Company |
|------|------|---------|
| Register | createUser, status pending | create company, status pending |
| Login | getUserByEmail → session | getCompanyByEmail → session |
| Create opportunity | creatorId = user id | creatorId = company id |
| View matches | getPostMatchesForUser(userId) | getPostMatchesForUser(companyId) |
| Deals / contracts | getDealsByUserId(userId) | getDealsByUserId(companyId) |

Matching and data-service treat companies like users where needed: e.g. `getUserOrCompanyById`, `normalizeCompaniesForMatching`, so that companies can be candidates for opportunities and participants in post_matches and deals.

---

## Related Documentation

- [Actors](../actors.md) — Company actor description.
- [Data Model](../data-model.md) — Company entity.
- [Opportunity Workflow](opportunity-workflow.md) — Creation and publish (same for company).
- [User Workflow](user-workflow.md) — Registration/login pattern.
