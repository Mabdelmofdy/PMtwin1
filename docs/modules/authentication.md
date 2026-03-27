# Authentication

### What this page is

Module guide: **login**, **logout**, **sessions**, and **role checks** for portal and admin.

### Why it matters

Every protected page depends on the same auth layer.

### What you can do here

- Trace session lifecycle.
- List roles and guards.

### Step-by-step actions

1. Read **Overview** then flows for login/logout.
2. Pair with [workflow/user-workflow.md](../workflow/user-workflow.md).

### What happens next

After login, routing sends users to dashboard or requested deep links.

### Tips

- POC password handling is not production-safe—see [gaps-and-missing.md](../gaps-and-missing.md).

---

## Overview

The Authentication module manages user identity verification, session lifecycle, and access control across the PMTwin platform. It supports login and logout flows for both individual users (professionals, consultants) and company accounts, enforces role-based access control (RBAC) for portal and admin features, and maintains session state across page refreshes. Authentication is a prerequisite for all protected routes in the system.

## Actors

| Actor   | Description |
|---------|-------------|
| User    | Any registered individual (professional or consultant) or company account holder who authenticates to access the platform. |
| System  | The PMTwin application itself, responsible for session creation, token management, route protection, and audit logging. |
| Admin   | Indirectly involved -- admin roles (admin, moderator, auditor) are enforced by the authentication guard when accessing admin routes. |

## Table of Contents

- [Step 1.1 – Login](#step-1-1-login)
- [Step 1.2 – Logout](#step-1-2-logout)
- [Step 1.3 – Session Validation (checkAuth)](#step-1-3-session-validation-checkauth)
- [Step 1.4 – Route Protection (Auth Guard)](#step-1-4-route-protection-auth-guard)
- [Role-Based Access Control](#role-based-access-control)
- [Session Data Model](#session-data-model)
- [State Changes](#state-changes)
- [Error and Edge Cases](#error-and-edge-cases)
- [Audit Log Entries](#audit-log-entries)
- [Output Data](#output-data)

---

## Step-by-Step Flow

<a id="step-1-1-login"></a>
### Step 1.1 -- Login

**Primary Question**
"What are your login credentials?"

**Why This Question Exists**
The system must verify the identity of the user before granting access to protected resources.

**User Inputs**

| Field    | Type     | Required | Placeholder           |
|----------|----------|----------|-----------------------|
| email    | email    | Yes      | "your@email.com"      |
| password | password | Yes      | "Enter your password"  |

**Dropdown Values**
None.

**Conditional Logic**
- If user status is `clarification_requested`, login is allowed so the user can complete registration updates.
- If user status is `pending`, `rejected`, or `suspended`, login is blocked with a status-specific error message.

**Validation Rules**
- `email` -- Required. Must be a valid email format.
- `password` -- Required.
- Credential check: System looks up the user or company by email, then compares the Base64-encoded password hash. If either fails, a generic "Invalid email or password" error is returned (no disclosure of which field failed).

**System Actions**
1. Look up user or company by email via `dataService.getUserOrCompanyByEmail(email)`.
2. Encode the provided password with Base64 (`btoa(password)`) and compare against stored `passwordHash`.
3. Check `user.status`:
   - `pending` -- Throw error: "Account pending approval. Please wait for admin verification."
   - `rejected` -- Throw error: "Account registration was rejected. Please contact support."
   - `suspended` -- Throw error: "Account suspended. Please contact support."
   - `active` -- Proceed.
   - `clarification_requested` -- Proceed (user may complete registration).
4. Generate session token: `${Date.now()}-${random9chars}-${random9chars}`.
5. Create session record in localStorage via `dataService.createSession(userId, token)`. Session expires after 24 hours (`CONFIG.SESSION_DURATION = 86400000 ms`).
6. Store token in `sessionStorage` under key `pmtwin_token`.
7. Store serialized user object in `sessionStorage` under key `pmtwin_user`.
8. Set `authService.currentUser` and `authService.currentSession`.
9. Create audit log entry:
   - `action`: `user_logged_in`
   - `entityType`: `session`
   - `entityId`: token
   - `details`: `{ email }`
10. Update navigation layout (show authenticated sidebar).
11. Redirect to dashboard (`/dashboard`).

---

<a id="step-1-2-logout"></a>
### Step 1.2 -- Logout

**Primary Question**
N/A -- triggered by user clicking "Logout" in the sidebar or profile dropdown.

**Why This Question Exists**
The user must be able to terminate their session and securely clear their credentials from the browser.

**User Inputs**
None.

**Dropdown Values**
None.

**Conditional Logic**
None.

**Validation Rules**
None.

**System Actions**
1. Delete session record from localStorage via `dataService.deleteSession(token)`.
2. Create audit log entry:
   - `action`: `user_logged_out`
   - `entityType`: `session`
   - `details`: `{}`
3. Set `authService.currentUser = null` and `authService.currentSession = null`.
4. Remove `pmtwin_token` from `sessionStorage`.
5. Remove `pmtwin_user` from `sessionStorage`.
6. Re-render layout to show public navigation.
7. Redirect to home page (`/`).

---

<a id="step-1-3-session-validation-checkauth"></a>
### Step 1.3 -- Session Validation (checkAuth)

**Primary Question**
N/A -- executed automatically on every protected route navigation.

**Why This Question Exists**
The system must verify that a valid, non-expired session exists before allowing access to any protected resource.

**User Inputs**
None.

**Dropdown Values**
None.

**Conditional Logic**
- If no `pmtwin_token` exists in `sessionStorage`, authentication fails immediately.
- If the session record is not found (expired sessions are filtered out), token and user are cleared from `sessionStorage`.
- If the user's status is neither `active` nor `clarification_requested`, authentication fails.

**Validation Rules**
- Token must exist in `sessionStorage`.
- Session record must be found in localStorage (not expired).
- User record must exist for the session's `userId`.
- User status must be `active` or `clarification_requested`.

**System Actions**
1. Retrieve `pmtwin_token` from `sessionStorage`.
2. Look up session by token via `dataService.getSessionByToken(token)`.
3. If session not found: remove `pmtwin_token` and `pmtwin_user` from `sessionStorage`, return `false`.
4. Look up user or company by `session.userId` via `dataService.getUserOrCompanyById(userId)`.
5. If user not found or status is not `active`/`clarification_requested`: return `false`.
6. Set `authService.currentUser` and `authService.currentSession`.
7. Return `true`.

---

<a id="step-1-4-route-protection-auth-guard"></a>
### Step 1.4 -- Route Protection (Auth Guard)

**Primary Question**
N/A -- transparent middleware layer.

**Why This Question Exists**
Different routes require different levels of access. Public routes must remain accessible without login; portal routes require authentication; admin routes require specific roles.

**User Inputs**
None.

**Dropdown Values**
None.

**Conditional Logic**

Public routes (no authentication required):
- `/` (Home)
- `/login`
- `/register`
- `/find`

Admin routes (require `admin` or `moderator` role):
- `/admin`
- `/admin/users`
- `/admin/opportunities`
- `/admin/audit`
- `/admin/settings`

All other routes require authentication (any active or clarification_requested user).

**Validation Rules**
- `requiresAuth(route)` -- returns `true` if route is not in the public routes list.
- `requiresRole(route, roles)` -- for admin routes, checks that user has `admin` or `moderator` role.
- `canActivate(route)` -- combines auth check and role check; returns `{ allowed: true }` or `{ allowed: false, redirect, reason }`.

**System Actions**
1. If route requires auth and user is not authenticated: redirect to `/login` with reason "Authentication required".
2. If route requires a role the user does not have: redirect to `/dashboard` with reason "Insufficient permissions", and show alert "You do not have permission to access this page."
3. If all checks pass: execute the route handler.

---

<a id="role-based-access-control"></a>
## Role-Based Access Control

The system defines 8 roles organized in 3 categories:

### Company Roles
| Role Key         | Value            | Description                    |
|------------------|------------------|--------------------------------|
| COMPANY_OWNER    | `company_owner`  | Company account primary owner  |
| COMPANY_ADMIN    | `company_admin`  | Company administrator          |
| COMPANY_MEMBER   | `company_member` | Company team member            |

### Professional Roles
| Role Key      | Value          | Description                    |
|---------------|----------------|--------------------------------|
| PROFESSIONAL  | `professional` | Individual professional        |
| CONSULTANT    | `consultant`   | Individual consultant          |

### Admin Roles
| Role Key   | Value       | Description                                              |
|------------|-------------|----------------------------------------------------------|
| ADMIN      | `admin`     | Full access to all admin features                        |
| MODERATOR  | `moderator` | Admin portal access except Settings and Collaboration Models |
| AUDITOR    | `auditor`   | Audit Trail and Reports only                             |

### Role-Checking Methods

| Method             | Logic                                                           |
|--------------------|-----------------------------------------------------------------|
| `hasRole(role)`    | Exact match: `currentUser.role === role`                        |
| `hasAnyRole(roles)` | Any match: `roles.includes(currentUser.role)`                 |
| `isAdmin()`        | User has `admin` or `moderator` role                            |
| `canAccessAdmin()` | User has `admin`, `moderator`, or `auditor` role                |
| `isCompanyUser()`  | User has `company_owner`, `company_admin`, or `company_member` role |
| `isProfessional()` | User has `professional` or `consultant` role                    |

---

<a id="session-data-model"></a>
## Session Data Model

```
{
  userId:    string,       // ID of the authenticated user or company
  token:     string,       // Session token (timestamp + random)
  createdAt: ISO string,   // When the session was created
  expiresAt: ISO string    // createdAt + 24 hours
}
```

**Storage Locations:**
- Session records: `localStorage` under key `pmtwin_sessions`
- Active token: `sessionStorage` under key `pmtwin_token`
- Active user object: `sessionStorage` under key `pmtwin_user`

---

<a id="state-changes"></a>
## State Changes

| Trigger          | State Change                                                   |
|------------------|----------------------------------------------------------------|
| Successful login | Session record created; `currentUser` and `currentSession` set; `sessionStorage` populated |
| Logout           | Session record deleted; `currentUser` and `currentSession` cleared; `sessionStorage` cleared |
| Session expiry   | Session record filtered out on next `checkAuth`; user redirected to login |
| Route navigation | `checkAuth` validates session; auth guard enforces role requirements |

---

<a id="error-and-edge-cases"></a>
## Error and Edge Cases

| Scenario                                  | Behavior                                                                 |
|-------------------------------------------|--------------------------------------------------------------------------|
| Invalid email                             | "Invalid email or password" (generic, no email/password disclosure)      |
| Invalid password                          | "Invalid email or password" (generic)                                    |
| Account status `pending`                  | "Account pending approval. Please wait for admin verification."          |
| Account status `rejected`                 | "Account registration was rejected. Please contact support."             |
| Account status `suspended`                | "Account suspended. Please contact support."                             |
| Token missing from sessionStorage         | `checkAuth` returns false; user redirected to login                      |
| Session not found in localStorage         | `checkAuth` returns false; sessionStorage cleared; user redirected       |
| Session expired (>24 hours)               | Session filtered out during lookup; treated as not found                 |
| User record deleted after session created | `checkAuth` returns false                                                |
| Accessing admin route without admin role  | Redirect to `/dashboard`; alert shown                                    |
| Accessing protected route while logged out| Redirect to `/login`                                                     |
| Password reset                            | **SCHEMA GAP DETECTED** -- Not implemented. Referenced as "future" in BRD. |

---

<a id="audit-log-entries"></a>
## Audit Log Entries

| Action            | Entity Type | Trigger   |
|-------------------|-------------|-----------|
| `user_logged_in`  | `session`   | Login     |
| `user_logged_out` | `session`   | Logout    |

---

<a id="output-data"></a>
## Output Data

### Login Response
```
{
  user:  { id, email, passwordHash, role, status, profile, createdAt, updatedAt },
  token: string
}
```

### Session Storage State
```
sessionStorage['pmtwin_token'] = "<token string>"
sessionStorage['pmtwin_user']  = "<JSON-serialized user object>"
```

### Password Encoding (POC)
Passwords are encoded using Base64 (`btoa(password)`). This is not secure for production and should be replaced with bcrypt or similar hashing. Minimum password length enforced at registration is 6 characters.
