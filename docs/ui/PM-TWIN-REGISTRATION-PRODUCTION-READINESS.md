# PM-TWIN Registration Production Readiness (P5A)

## POC Flow Inspected

### Step Structure Ported

The original POC register wizard (`POC/pages/register/index.html` + `POC/features/register/register.js`) uses 6 visible steps:

1. `Account Type`
2. `Role`
3. `Profile Info`
4. `Documents & Terms`
5. `Review & Submit`
6. `Vetting / Verification`

### Account Type Branches

- **Company path**
  - Role + optional sub-type
  - Company details (company name, business email, contact person, address, optional legal/company metadata)
  - Password + confirm password
  - Documents and terms
  - Review
  - Vetting choice
- **Individual path**
  - Role (Professional or Consultant) + sub-type
  - Personal details (full name, email, mobile, address, optional profile metadata)
  - Specialty/expertise based on role
  - Password + confirm password
  - Documents and terms
  - Review
  - Verification choice

### POC Validation + UX Behavior

- Step-by-step navigation with back/next gating.
- Required field checks before moving to next step.
- Email/mobile OTP simulation in POC (demo-only).
- Terms required before review.
- Final submit path showed account-created flow in POC runtime.

### Unsafe / Demo-Only POC Behavior Not Ported

- OTP code display and client-only OTP verification.
- POC runtime direct auth registration logic.
- Any behavior that implies secure account creation without production API.
- Any fake creation success in web runtime.

## Native Web Implementation Summary

- `/register` now uses **native React wizard** in `web/src/pages/public/legacy-register-page.tsx`.
- `/register` no longer uses iframe and no longer depends on `127.0.0.1:5500`.
- Step model mirrors the POC 6-step structure with branch-specific form sections.
- Final submit is wired to `web/src/lib/registration-service.ts` through a typed mapping helper in `web/src/lib/registration-wizard.ts`.
- Backend unavailable message remains explicit and honest:
  - "Registration details are ready, but the production registration API is not active yet. No account has been created."

## Field Mapping Table

| UI Area | Captured In Wizard | Sent To Registration Service |
|---|---|---|
| Account type | company / individual | `accountType` |
| Individual name | `fullName`/`name` | `name` |
| Individual email | `email` | `email` |
| Company name | `companyName` | `companyName` |
| Company email | `businessEmail` | `businessEmail` |
| Company contact | `contactPerson` | `contactPerson` |
| Password | `password` | `password` |
| Confirm password | `confirmPassword` | `confirmPassword` |
| Intent | publish/partner/explore | `intent` |
| Terms accepted | checkbox | `termsAccepted` |
| Extended role/profile fields | role/subtype/mobile/address/metadata | UI-only for now (not yet in service contract) |

## Validation Implemented

- Account type required.
- Role step required fields:
  - Company role required on company path.
  - Individual type + sub-type required on individual path.
- Profile step required fields:
  - Required branch-specific identity/email/contact fields.
  - Email format validation.
  - Password minimum length and confirm-password match.
  - Specialty/expertise requirement by individual role.
- Terms acceptance required at documents step.
- Registration service validation still enforced at submit time (including duplicate email best-effort check).

## Backend Blockers Remaining

- No production registration endpoint in active runtime.
- No server-side password hashing/persistence pipeline.
- No authoritative backend uniqueness/abuse controls for registration.

## Security Notes

- No iframe dependency.
- No plaintext password logging/display.
- No Base64 "security" behavior.
- No fake "account created" messaging when API is unavailable.

## Tests Added / Updated

- `web/src/lib/registration-wizard.test.ts`
  - Step progression guards via step validation checks.
  - Individual and company branch required-field validation.
  - Password mismatch validation.
  - Terms-required validation.
  - Submit wiring to registration service adapter.
  - Backend-unavailable result handling contract.
  - Route guard that `/register` no longer references iframe-based `PocRegisterPage`.
- Existing `web/src/lib/registration-service.test.ts` remains active for service-level validation and backend-unavailable behavior.

## Go / No-Go Recommendation

- **No-go for production public registration** until real backend registration API and secure password lifecycle are implemented.
- **Go for UX readiness/demo** for the native multi-step registration flow in web runtime.
