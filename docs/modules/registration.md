# Registration

### What this page is

Module guide: **sign-up** for individuals and companies—wizards, vetting, and status changes.

### Why it matters

Everything downstream assumes a trusted, **active** account.

### What you can do here

- Follow each wizard path.
- Map admin vetting outcomes.

### Step-by-step actions

1. Pick company vs individual path.
2. Align fields with [workflow/user-workflow.md](../workflow/user-workflow.md).

### What happens next

Pending accounts wait for **Admin vetting** ([admin-user-journey.md](../admin-user-journey.md)).

### Tips

- OTP depth may vary by environment—treat POC as demonstrative.

---

## Overview

The Registration module handles the onboarding of new users and companies onto the PMTwin platform. It supports two distinct registration paths -- Company/Entity and Individual (Professional or Consultant) -- each implemented as a multi-step wizard. The module collects identity information, verifies email and mobile via OTP, collects role-specific documents, and submits the account for admin approval. Post-registration, the Admin Vetting sub-flow handles approval, rejection, or clarification requests.

## Actors

| Actor   | Description |
|---------|-------------|
| User    | A new visitor registering as a Company/Entity or as an Individual (Professional or Consultant). |
| System  | Creates the account record, sends OTP codes, validates inputs, creates audit logs, and manages status transitions. |
| Admin   | Reviews pending registrations via the Admin Vetting interface. Can approve, reject, or request clarification. |

## Table of Contents

- [Step 0 – Account Type Selection](#step-0-account-type-selection)
- [Company Registration Path (Steps A1 – A4)](#company-registration-path-steps-a1-a4)
  - [Step A1 – Company Role Selection](#step-a1-company-role-selection)
  - [Step A2 – Company Details and Verification](#step-a2-company-details-and-verification)
  - [Step A3 – Documents and Terms](#step-a3-documents-and-terms)
  - [Step A4 – Review and Submit](#step-a4-review-and-submit)
- [Individual Registration Path (Steps B1 – B4)](#individual-registration-path-steps-b1-b4)
  - [Step B1 – Individual Type Selection](#step-b1-individual-type-selection)
  - [Step B2 – Personal Details and Verification](#step-b2-personal-details-and-verification)
  - [Step B3 – Documents and Terms](#step-b3-documents-and-terms)
  - [Step B4 – Review and Submit](#step-b4-review-and-submit)
- [Admin Vetting Flow (Post-Registration)](#admin-vetting-flow-post-registration)
- [State Changes](#state-changes)
- [Error and Edge Cases](#error-and-edge-cases)
- [Output Data](#output-data)

---

## Step-by-Step Flow

<a id="step-0-account-type-selection"></a>
### Step 0 -- Account Type Selection

**Primary Question**
"How would you like to register?"

**Why This Question Exists**
PMTwin serves two fundamentally different user types -- organizations and individuals -- each with different data requirements, document needs, and role structures. The selection determines the entire subsequent registration path.

**User Inputs**

| Field       | Type  | Required | Values                               |
|-------------|-------|----------|--------------------------------------|
| accountType | radio | Yes      | `company` (Company/Entity), `individual` (Individual) |

**Dropdown Values**
N/A -- radio buttons with static values.

**Conditional Logic**
- Selecting `company` routes the user to Steps A1 through A4.
- Selecting `individual` routes the user to Steps B1 through B4.
- The "Continue" button is disabled until a selection is made.

**Validation Rules**
- One option must be selected before proceeding.

**System Actions**
- Set `regState.accountType` to the selected value.
- Show the wizard progress bar (hidden on Step 0).
- Navigate to Step A1 or B1 depending on selection.

---

<a id="company-registration-path-steps-a1-a4"></a>
## Company Registration Path (Steps A1 -- A4)

<a id="step-a1-company-role-selection"></a>
### Step A1 -- Company Role Selection

**Primary Question**
"What is your company's role in the construction ecosystem?"

**Why This Question Exists**
The company role determines the sub-type options, the required verification documents, and future matching criteria. Different roles have different regulatory and documentation requirements.

**User Inputs**

| Field              | Type   | Required                        | Source                            |
|--------------------|--------|---------------------------------|-----------------------------------|
| reg-company-role   | select | Yes                             | `lookups.json > companyRoles`     |
| reg-company-subtype| select | Yes (if role has sub-types)     | `lookups.json > companyRoleSubTypes[role]` |

**Dropdown Values**

Company Roles (`companyRoles`):

| ID                      | Label                    | Has Sub-Types |
|-------------------------|--------------------------|---------------|
| `beneficiary`           | Beneficiary              | No            |
| `vendor`                | Vendor                   | Yes           |
| `skill_service_provider`| Skill Service Provider   | No            |
| `sub_contractor`        | Sub-Contractor           | Yes           |
| `consultant_company`    | Consultant (company)     | No            |

Company Role Sub-Types (`companyRoleSubTypes`):

For `vendor`:

| ID          | Label      |
|-------------|------------|
| `supplies`  | Supplies   |
| `equipment` | Equipment  |
| `materials` | Materials  |

For `sub_contractor`:

| ID               | Label           |
|------------------|-----------------|
| `specialty_trade`| Specialty Trade |
| `labor`          | Labor           |
| `technical`      | Technical       |

**Conditional Logic**
- The sub-type dropdown is hidden by default.
- When a role with `hasSubTypes: true` is selected (`vendor` or `sub_contractor`), the sub-type dropdown is shown and populated with the corresponding options.
- When a role without sub-types is selected, the sub-type dropdown is hidden and its value is cleared.

**Validation Rules**
- `reg-company-role` -- Required. Must select a value.
- `reg-company-subtype` -- Required only if the sub-type dropdown is visible (role has sub-types).

**System Actions**
- Store selected role in `regState.companyRole`.
- Store selected sub-type in `regState.companySubType` (or `null`).
- Trigger document list rendering for Step A3 based on the selected role.
- Navigate to Step A2.

---

<a id="step-a2-company-details-and-verification"></a>
### Step A2 -- Company Details and Verification

**Primary Question**
"Tell us about your company and verify your contact information."

**Why This Question Exists**
The platform needs company identity details for profile creation, search/matching, and compliance. Email and mobile verification via OTP ensures the contact information is authentic.

**User Inputs**

| Field                | Type     | Required | Notes                            |
|----------------------|----------|----------|----------------------------------|
| reg-company-name     | text     | Yes      |                                  |
| reg-company-website  | url      | No       |                                  |
| reg-email            | email    | Yes      | Must be verified via OTP         |
| reg-mobile           | tel      | Yes      | Must be verified via OTP         |
| reg-address-country  | select   | Yes      | Source: `locations.json > countries` |
| reg-address-region   | select   | No       | Cascading: populated based on country |
| reg-address-city     | select   | No       | Cascading: populated based on region |
| reg-password         | password | Yes      | Minimum 6 characters             |
| reg-confirm-password | password | Yes      | Must match reg-password          |

**Dropdown Values**

Location data is loaded from `locations.json`:
- Countries: Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman, Remote
- Regions: Populated dynamically based on selected country (e.g., Saudi Arabia has 13 regions: Riyadh, Makkah, Eastern Province, Qassim, Tabuk, Asir, Hail, Northern Borders, Jazan, Najran, Al Bahah, Al Jouf, Madinah)
- Cities: Populated dynamically based on selected region (e.g., Riyadh region has Riyadh City, Kharj, Dawadmi, Wadi ad-Dawasir)

**OTP Verification Flow**

For both email and mobile:
1. User enters their email/mobile number.
2. User clicks "Send OTP".
3. System generates a 6-digit OTP code: `Math.floor(100000 + Math.random() * 900000)`.
4. In the POC, the code is displayed on-screen (production would send via email/SMS).
5. User enters the code in the verification input field.
6. User clicks "Verify".
7. System compares the entered code with the stored code.
8. On match: A green "Verified" badge is shown; `regState.emailVerified` or `regState.mobileVerified` is set to `true`.
9. On mismatch: Error message "Invalid code" is shown.

**Conditional Logic**
- Region dropdown is empty until a country is selected.
- City dropdown is empty until a region is selected.

**Validation Rules**
- `reg-company-name` -- Required. Non-empty after trim.
- `reg-email` -- Required. Must be verified via OTP (`regState.emailVerified === true`).
- `reg-mobile` -- Required. Must be verified via OTP (`regState.mobileVerified === true`).
- `reg-address-country` -- Required.
- `reg-password` -- Required. Minimum 6 characters.
- `reg-confirm-password` -- Required. Must exactly match `reg-password`.

**System Actions**
- Store all field values in `regState`.
- OTP codes stored in-memory in `otpCodes` object (separate keys for company email/mobile).
- On successful step validation, navigate to Step A3.

---

<a id="step-a3-documents-and-terms"></a>
### Step A3 -- Documents and Terms

**Primary Question**
"Upload your company's verification documents and accept the terms."

**Why This Question Exists**
Document verification is essential for compliance and trust. Different company roles require different documents. The Terms and Conditions acceptance creates a legal agreement.

**User Inputs**

| Field               | Type     | Required | Notes                                    |
|---------------------|----------|----------|------------------------------------------|
| Document uploads    | file     | Varies   | Dynamic list based on company role       |
| reg-terms-company   | checkbox | Yes      | Must accept Terms and Conditions         |

**Document Requirements by Company Role**

Documents are defined in `lookups.json > companyRoleDocuments`:

**Beneficiary:**

| Document ID       | Label                       | Required |
|-------------------|-----------------------------|----------|
| `cr`              | Commercial Registration (CR) | Yes      |
| `vat`             | VAT Certificate              | Yes      |
| `company_profile` | Company Profile              | Yes      |

**Vendor:**

| Document ID       | Label                       | Required |
|-------------------|-----------------------------|----------|
| `cr`              | Commercial Registration (CR) | Yes      |
| `vat`             | VAT Certificate              | Yes      |
| `trade_license`   | Trade License                | Yes      |

**Skill Service Provider:**

| Document ID       | Label                       | Required |
|-------------------|-----------------------------|----------|
| `cr`              | Commercial Registration (CR) | Yes      |
| `vat`             | VAT Certificate              | Yes      |
| `certifications`  | Certifications               | Yes      |

**Sub-Contractor:**

| Document ID       | Label                       | Required |
|-------------------|-----------------------------|----------|
| `cr`              | Commercial Registration (CR) | Yes      |
| `vat`             | VAT Certificate              | Yes      |
| `trade_license`   | Trade License                | Yes      |

**Consultant (company):**

| Document ID       | Label                       | Required |
|-------------------|-----------------------------|----------|
| `cr`              | Commercial Registration (CR) | Yes      |
| `vat`             | VAT Certificate              | Yes      |
| `company_profile` | Company Profile              | Yes      |

**File Upload Constraints:**
- Accepted formats: `.pdf`, `.doc`, `.docx`, `.jpg`, `.jpeg`, `.png`
- Maximum file size: 5 MB per file
- Files are stored as Base64 data URLs in `regState.documents[]`
- Each document entry: `{ type, label, fileName, data }`

**Conditional Logic**
- The document list is rendered dynamically based on `regState.companyRole`.
- Required documents must all be uploaded before proceeding.

**Validation Rules**
- Every document marked `required: true` for the selected role must be uploaded.
- Error shown per missing document: "Please upload: [document label]".
- `reg-terms-company` -- Must be checked. Error: "You must accept the Terms & Conditions".
- File size validated on selection. Error: "File size must be under 5MB".

**System Actions**
- Store uploaded documents in `regState.documents`.
- Store terms acceptance in `regState.termsAccepted`.
- Render review summary for Step A4.
- Navigate to Step A4.

---

<a id="step-a4-review-and-submit"></a>
### Step A4 -- Review and Submit

**Primary Question**
"Please review your information before submitting."

**Why This Question Exists**
A review step allows the user to verify all entered data before final submission, reducing errors and support requests.

**User Inputs**
None (read-only review).

**Displayed Information**
- Role (and sub-type if applicable)
- Company name
- Email (with "verified" label)
- Mobile (with "verified" label)
- Address (country, region, city)
- Uploaded documents (label: filename)

**Conditional Logic**
None.

**Validation Rules**
- Before submission, Step A2 and Step A3 validations are re-run to prevent bypass.

**System Actions**
1. Call `authService.registerCompany()` with payload:
   - `companyName`, `website`, `email`, `mobile`, `address`, `password`
   - `companyRole`, `companySubType`
   - `documents[]`
   - `emailVerified: true`, `mobileVerified: true`
2. System checks for existing company with same email. If found: error "A company with this email already exists".
3. Password encoded with Base64 (`btoa(password)`).
4. Company record created with:
   - `role`: `company_owner`
   - `status`: `pending`
   - `profile`: `{ name, type: 'company', website, phone, address, companyRole, companySubType, documents, emailVerified, mobileVerified, location }`
5. Audit log created:
   - `action`: `company_registered`
   - `entityType`: `company`
   - `details`: `{ email, companyRole }`
6. Success message displayed: "Account created successfully. Your account is pending admin approval. You will receive an email once approved. Redirecting to login..."
7. Redirect to `/login` after 3 seconds.

---

<a id="individual-registration-path-steps-b1-b4"></a>
## Individual Registration Path (Steps B1 -- B4)

<a id="step-b1-individual-type-selection"></a>
### Step B1 -- Individual Type Selection

**Primary Question**
"Are you a Professional or a Consultant?"

**Why This Question Exists**
Professionals and consultants have different document requirements, profile fields, and matching criteria. This distinction also determines the user's role in the system.

**User Inputs**

| Field          | Type  | Required | Values                                    |
|----------------|-------|----------|-------------------------------------------|
| individualType | radio | Yes      | `professional` (Professional), `consultant` (Consultant) |

**Dropdown Values**
N/A -- radio buttons.

**Conditional Logic**
- Selecting `professional` will show the "Discipline / Specialty" field and render professional-specific documents in Step B3.
- Selecting `consultant` will show the "Expertise Area" field and render consultant-specific documents in Step B3.

**Validation Rules**
- One option must be selected. Error: "Please select Professional or Consultant".

**System Actions**
- Store selection in `regState.individualType`.
- Toggle visibility of specialty/expertise fields for Step B2.
- Render individual-type-specific documents for Step B3.
- Navigate to Step B2.

---

<a id="step-b2-personal-details-and-verification"></a>
### Step B2 -- Personal Details and Verification

**Primary Question**
"Tell us about yourself and verify your contact information."

**Why This Question Exists**
The platform needs personal identity information for profile creation, matching, and communication. OTP verification ensures authentic contact details.

**User Inputs**

| Field                    | Type     | Required                     | Notes                                   |
|--------------------------|----------|------------------------------|-----------------------------------------|
| reg-full-name            | text     | Yes                          |                                         |
| reg-ind-email            | email    | Yes                          | Must be verified via OTP                |
| reg-ind-mobile           | tel      | Yes                          | Must be verified via OTP                |
| reg-ind-address-country  | select   | Yes                          | Source: `locations.json > countries`     |
| reg-ind-address-region   | select   | No                           | Cascading: populated based on country   |
| reg-ind-address-city     | select   | No                           | Cascading: populated based on region    |
| reg-ind-password         | password | Yes                          | Minimum 6 characters                    |
| reg-ind-confirm-password | password | Yes                          | Must match reg-ind-password             |
| reg-specialty            | text     | Yes (if Professional)        | Shown only for Professional type        |
| reg-expertise            | text     | Yes (if Consultant)          | Shown only for Consultant type          |

**Dropdown Values**
Same cascading location dropdowns as Company Step A2 (countries, regions, cities from `locations.json`).

**OTP Verification Flow**
Same flow as Company Step A2, but uses separate OTP code keys (`indEmail`, `indMobile`) to avoid conflicts.

**Conditional Logic**
- `reg-specialty` (Discipline / Specialty) is shown only when `individualType === 'professional'`.
- `reg-expertise` (Expertise Area) is shown only when `individualType === 'consultant'`.

**Validation Rules**
- `reg-full-name` -- Required. Non-empty after trim.
- `reg-ind-email` -- Required. Must be verified via OTP.
- `reg-ind-mobile` -- Required. Must be verified via OTP.
- `reg-ind-address-country` -- Required.
- `reg-ind-password` -- Required. Minimum 6 characters.
- `reg-ind-confirm-password` -- Required. Must match password.
- `reg-specialty` -- Required if `individualType === 'professional'`. Error: "Discipline / Specialty is required".
- `reg-expertise` -- Required if `individualType === 'consultant'`. Error: "Expertise area is required".

**System Actions**
- Store all field values in `regState`.
- OTP codes stored in-memory (separate keys for individual email/mobile).
- Navigate to Step B3.

---

<a id="step-b3-documents-and-terms"></a>
### Step B3 -- Documents and Terms

**Primary Question**
"Upload your verification documents and accept the terms."

**Why This Question Exists**
Individual users must provide identity and qualification documents to establish trust and enable admin verification.

**User Inputs**

| Field                | Type     | Required | Notes                                      |
|----------------------|----------|----------|--------------------------------------------|
| Document uploads     | file     | Varies   | Dynamic list based on individual type      |
| reg-terms-individual | checkbox | Yes      | Must accept Terms and Conditions           |

**Document Requirements by Individual Type**

Documents are defined in `lookups.json > individualTypeDocuments`:

**Professional:**

| Document ID              | Label                    | Required |
|--------------------------|--------------------------|----------|
| `national_id_passport`   | National ID / Passport   | Yes      |
| `cv_resume`              | CV / Resume              | Yes      |
| `certificates`           | Certificates (optional)  | No       |

**Consultant:**

| Document ID              | Label                              | Required |
|--------------------------|------------------------------------|----------|
| `professional_license`   | Professional License / Certification | Yes    |
| `cv_resume`              | CV / Resume                        | Yes      |
| `portfolio`              | Portfolio (optional)               | No       |

**File Upload Constraints:**
Same as Company Step A3:
- Accepted formats: `.pdf`, `.doc`, `.docx`, `.jpg`, `.jpeg`, `.png`
- Maximum file size: 5 MB per file
- Stored as Base64 data URLs

**Conditional Logic**
- Document list rendered dynamically based on `regState.individualType`.

**Validation Rules**
- All required documents for the selected type must be uploaded.
- `reg-terms-individual` -- Must be checked.

**System Actions**
- Store documents in `regState.documents`.
- Render review summary for Step B4.
- Navigate to Step B4.

---

<a id="step-b4-review-and-submit"></a>
### Step B4 -- Review and Submit

**Primary Question**
"Please review your information before submitting."

**Why This Question Exists**
Same as Company Step A4 -- allows the user to verify all data before final submission.

**Displayed Information**
- Type (Professional or Consultant)
- Full name
- Specialty or Expertise
- Email (with "verified" label)
- Mobile (with "verified" label)
- Address (country, region, city)
- Uploaded documents (label: filename)

**Conditional Logic**
None.

**Validation Rules**
- Step B2 and Step B3 validations are re-run before submission.

**System Actions**
1. Call `authService.register()` with payload:
   - `email`, `password`
   - `role`: `professional` or `consultant` (based on `individualType`)
   - `profile`: `{ type: individualType, name, phone, location, specialty, individualType }`
   - `address`, `individualType`, `specialty` (or expertise)
   - `documents[]`
   - `emailVerified: true`, `mobileVerified: true`
2. System checks for existing user with same email. If found: error "User with this email already exists".
3. Password encoded with Base64.
4. User record created with:
   - `role`: `professional` or `consultant`
   - `status`: `pending`
   - `profile` includes `address`, `documents`, `emailVerified`, `mobileVerified`
5. Audit log created:
   - `action`: `user_registered`
   - `entityType`: `user`
   - `details`: `{ email, role }`
6. Success message displayed: "Account created successfully. Your account is pending admin approval. You will receive an email once approved. Redirecting to login..."
7. Redirect to `/login` after 3 seconds.

---

<a id="admin-vetting-flow-post-registration"></a>
## Admin Vetting Flow (Post-Registration)

### Overview
After registration, accounts have `status: pending`. Admin users (with `admin` or `moderator` role) review pending accounts via the Admin Vetting interface at `/admin/vetting`.

### Vetting List
- Displays all users and companies with `status: pending` or `status: clarification_requested`.
- Sorted by creation date (newest first).
- Filterable by status and searchable by email or name.

### Action: Approve

**System Actions:**
1. Update user/company status to `active`.
2. Send notification to user:
   - `type`: `account_approved`
   - `title`: "Account Approved"
   - `message`: "Your account has been approved. You can now access all features."
3. Create audit log:
   - `action`: `user_approved` or `company_approved`
   - `entityType`: `user` or `company`
   - `entityId`: user/company ID

### Action: Reject

**System Actions:**
1. Admin prompted for rejection reason (optional).
2. Update user/company status to `rejected`.
3. Send notification to user:
   - `type`: `account_rejected`
   - `title`: "Account Rejected"
   - `message`: "Your account was rejected: [reason]" (or generic message if no reason).
4. Create audit log:
   - `action`: `user_rejected` or `company_rejected`
   - `details`: `{ reason }`

### Action: Request Clarification

**System Actions:**
1. Admin prompted for reason/missing items (optional).
2. Update user/company status to `clarification_requested`.
3. Send notification to user:
   - `type`: `account_clarification_requested`
   - `title`: "Registration needs clarification"
   - `message`: "Your registration needs clarification: [reason]. Please update your profile or documents and submit for review again."
4. Create audit log:
   - `action`: `user_clarification_requested` or `company_clarification_requested`
   - `details`: `{ reason }`

### Clarification Resubmission
- Users with `clarification_requested` status can log in (authentication module allows this status).
- On their profile page, a banner is displayed informing them that clarification is needed.
- A "Submit for review again" button is available.
- On resubmission, the status is changed back to `pending` for admin review.

---

<a id="state-changes"></a>
## State Changes

| Trigger                       | From Status                | To Status                  |
|-------------------------------|----------------------------|----------------------------|
| User submits registration     | (new record)               | `pending`                  |
| Admin approves                | `pending` / `clarification_requested` | `active`          |
| Admin rejects                 | `pending` / `clarification_requested` | `rejected`        |
| Admin requests clarification  | `pending`                  | `clarification_requested`  |
| User resubmits from profile   | `clarification_requested`  | `pending`                  |

---

<a id="error-and-edge-cases"></a>
## Error and Edge Cases

| Scenario                                       | Behavior                                                     |
|------------------------------------------------|--------------------------------------------------------------|
| Duplicate company email                        | "A company with this email already exists"                   |
| Duplicate individual email                     | "User with this email already exists"                        |
| OTP code mismatch                              | "Invalid code"                                               |
| File exceeds 5 MB                              | "File size must be under 5MB" (file input cleared)           |
| Required document not uploaded                 | "Please upload: [document label]"                            |
| Terms not accepted                             | "You must accept the Terms & Conditions"                     |
| Password too short                             | "Password must be at least 6 characters"                     |
| Passwords do not match                         | "Passwords do not match"                                     |
| Company role missing                           | "Please select a company role"                               |
| Sub-type missing (when required)               | "Please select a sub-type"                                   |
| Individual type not selected                   | "Please select Professional or Consultant"                   |
| Full name / company name empty                 | "Full name is required" / "Company name is required"         |
| Email not verified                             | "Please verify your email with OTP"                          |
| Mobile not verified                            | "Please verify your mobile with OTP"                         |
| Country not selected                           | "Country is required"                                        |
| Specialty missing (Professional)               | "Discipline / Specialty is required"                         |
| Expertise missing (Consultant)                 | "Expertise area is required"                                 |
| Generic registration failure                   | "Registration failed. Please try again."                     |

---

<a id="output-data"></a>
## Output Data

### Company Registration Payload (stored)
```
{
  id:           string (generated),
  email:        string,
  passwordHash: string (Base64),
  role:         "company_owner",
  status:       "pending",
  profile: {
    name:           string,
    type:           "company",
    website:        string | null,
    phone:          string | null,
    address:        { country, region, city },
    location:       string (comma-joined),
    companyRole:    string,
    companySubType: string | null,
    documents:      [{ type, label, fileName, data }],
    emailVerified:  boolean,
    mobileVerified: boolean
  },
  createdAt:    ISO string,
  updatedAt:    ISO string
}
```

### Individual Registration Payload (stored)
```
{
  id:           string (generated),
  email:        string,
  passwordHash: string (Base64),
  role:         "professional" | "consultant",
  status:       "pending",
  profile: {
    type:            "professional" | "consultant",
    name:            string,
    phone:           string,
    location:        string (comma-joined),
    specialty:       string,
    individualType:  "professional" | "consultant",
    address:         { country, region, city },
    documents:       [{ type, label, fileName, data }],
    emailVerified:   boolean,
    mobileVerified:  boolean
  },
  createdAt:    ISO string,
  updatedAt:    ISO string
}
```
