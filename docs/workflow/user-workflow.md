# User workflow

### What this page is

Step-by-step flows for **individual** users (professionals and consultants): register, log in, profile, discovery, and password reset.

### Why it matters

These screens are the first touchpoints before opportunities and matches.

### What you can do here

- Follow the registration diagram end to end.
- See how login checks both **users** and **companies** by email.
- Trace profile and Find flows for QA.

### Step-by-step actions

1. Read **Registration** if you test onboarding.
2. Read **Login** and **Profile** for everyday use.
3. Use **Discovery** when testing Apply vs Match entry points.

### What happens next

After login, users typically open **Dashboard**, then **Opportunities** or **Matches** ([opportunity-workflow.md](opportunity-workflow.md), [matching-workflow.md](matching-workflow.md)).

### Tips

- Password handling in the POC is for demonstration; use real security patterns in production.

---

## 1. Registration flow

```mermaid
flowchart TD
  Start([Start]) --> SelectType[Select account type: Individual / Company]
  SelectType --> FillForm[Fill form: email, password, fields, terms]
  FillForm --> Submit[Submit]
  Submit --> Created[Account created — status pending]
  Created --> NotifyAdmin[Admin notified]
  NotifyAdmin --> Wait[Wait for approval]
  Wait --> AdminDecision{Admin decision}
  AdminDecision -->|Approve| Active[Status active]
  AdminDecision -->|Reject| Rejected[Status rejected — notification sent]
  Active --> FullAccess[Full access]
  Rejected --> End([End — may register again])
  FullAccess --> End2([End])
```

**Steps (implemented):**

1. Open **Register** (register route).
2. Choose individual or company; fields follow the type.
3. Submit through auth and data services to create the record.
4. Account is stored with status **`pending`**.
5. Admin sees the account under **Admin → Users** or **Vetting** and approves or rejects.
6. On approve: status becomes **`active`**; approval notification is created.
7. On reject: status **`rejected`**; rejection notification is created.

**Inputs:** Email, password, profile fields.  
**Outputs:** New account row; notifications on decision.

**Edge cases:**

- Duplicate email: blocked when an account already exists.
- Clarification: status may become **`clarification_requested`**; resubmit per product rules.

### What happens next

When **active**, the user can use the full portal (subject to role).

---

## 2. Login flow

```mermaid
sequenceDiagram
  User->>Page: Select Individual or Company + email/password
  Page->>Auth: login(email, password, { accountType })
  alt accountType individual
    Auth->>Data: getUserByEmail(email)
  else accountType company
    Auth->>Data: getCompanies → match email
  else accountType auto (legacy)
    Auth->>Data: getUserOrCompanyByEmail(email)
  end
  Data-->>Auth: user or company
  Auth->>Auth: Verify password (POC encode)
  Auth->>Session: Store session (sessionStorage or localStorage)
  Auth-->>Page: success
  Page->>Router: Go to dashboard or return URL
```

**Steps:**

1. Open **Login**; choose **Individual** or **Company** account type.
2. Enter email and password (optional **Remember me** → localStorage).
3. `authService.login(email, password, { accountType: 'individual' | 'company' })` looks up the correct store — avoids ambiguity when the same email exists on both user and company records.
4. Password is checked (POC encoding—not production hashing).
5. **Rejected** and **suspended** accounts cannot log in; **pending** and **clarification_requested** can log in (pending is read-only — see section 2b).
6. Session is stored; redirect to dashboard or return URL.

**Edge cases:**

- Wrong password: error, no session.
- Wrong account type for email: “Invalid email or password” (no cross-store fallback when type is explicit).

### What happens next

You land on the **Dashboard** (or deep link) with a live session until logout.

---

## 2b. Pending approval (read-only mode)

Accounts with `status === 'pending'` can explore the portal but **cannot mutate** platform data:

- **UI:** Layout shows a pending-approval banner; mutating buttons are disabled where wired.
- **Service guard:** `authService.assertCanMutate()` throws for pending users.
- **Data layer:** `data-service._assertPortalCanMutate()` on portal writes — opportunities, applications, matches, deals, negotiations, connections, messages, contract sign.

Blocked actions include publish, apply, accept/decline matches, create deals, send connection requests, and pipeline drag-and-drop. Read-only browsing (dashboard, find, matches list, notifications) remains available.

---

## 3. Profile view and edit

**Steps:**

1. Open **Profile** or **Settings**.
2. Load the current user from session and storage.
3. Edit fields (name, specializations, certifications, sectors, skills, and so on).
4. Save → profile updates persist.

**Edge cases:**

- Company vs individual: different sections.
- Verification badges: usually admin-controlled.

### What happens next

Matching and discovery use updated profile data on the next load or merge.

---

## 4. Discovery (Find) flow

**Steps:**

1. Open **Find**.
2. Load **published** opportunities.
3. Filter or search; open **Opportunity detail**.
4. From detail: **Apply** (applications) or jump to **Matches** if a match already exists.

### What happens next

Applications follow the pipeline workflow; matches follow [matching-workflow.md](matching-workflow.md).

---

## 4b. People and connections

**Steps:**

1. Open **People** (`/people`) or a **Person profile** (`/people/:id`).
2. **Connect** → `data-service.createConnection(fromUserId, toUserId)`; status `pending`.
3. Recipient gets a **connection_request** notification (link to sender profile).
4. Recipient **Accept** or **Ignore** → `acceptConnection` / reject path; sender notified on accept.
5. After **accepted**, users can open **Messages** (`/messages/:userId`) for that connection.

**Guards:** Pending accounts cannot send connection requests (`assertCanMutate`). Connection accept/reject also requires an active account.

### What happens next

Accepted connections enable messaging; opportunities and matches remain separate entry paths to deals.

---

## 5. Password reset (forgot / reset)

**Forgot password**

1. Open **Forgot password**; enter email.
2. Look up account; create a reset token (stored locally in POC).
3. Email send is simulated; demo may show a link with token.
4. Open **Reset password** with token; set a new password.
5. Invalidate token; redirect to login.

### What happens next

You sign in with the new password.

---

## State changes summary

| Action | Entity | State change |
|--------|--------|--------------|
| Register | User/company | Created **`pending`** |
| Admin approve | User/company | → **`active`** |
| Admin reject | User/company | → **`rejected`** |
| Login | Session | Created in sessionStorage or localStorage (Remember me) |
| Pending user mutate attempt | — | Error from assertCanMutate / _assertPortalCanMutate |
| Connection request | Connection | pending; notification to recipient |
| Connection accept | Connection | accepted; notification to sender |
| Logout | Session | Cleared |
| Update profile | User/company | Profile and **`updatedAt`** |

---

## Related documentation

- [Actors](../actors.md)
- [Opportunity workflow](opportunity-workflow.md)
- [Matching workflow](matching-workflow.md)
- [Deal workflow](deal-workflow.md)
