# Signup / onboarding UI — gap analysis

### What this page is

UX **gap analysis** for registration and onboarding flows.

### What happens next

Prioritize fixes against [docs/gaps-and-missing.md](../../docs/gaps-and-missing.md).

---

This document lists **UI/UX issues** in the current register page (`POC/pages/register/index.html`) and related logic (`POC/features/register/register.js`). Use it to prioritize improvements before applying changes.

---

## 1. Layout & hierarchy

| Issue | Location | Description |
|-------|----------|-------------|
| **Single long form on A2/B2** | Company A2, Individual B2 | One step contains many fields (company name, website, email+OTP, mobile+OTP, address, industry, size, description, CR, Tax ID, auth rep, password, confirm, specialty/expertise, role, years, skills, languages, LinkedIn). Creates long scrolling and weak section hierarchy. |
| **No sub-sections on details steps** | A2, B2 | Fields are not grouped under clear sub-headings (e.g. “Contact”, “Address”, “Company info”, “Account security”), so the page feels flat. |
| **Step 0 has no card treatment** | reg-step-0 | Account type selection uses cards, but the step itself is not wrapped in the same `reg-step-card` visual as path steps, so step 0 feels different from the rest. |
| **B1 inconsistent with Step 0** | reg-step-b1 | Individual type (B1) uses old-style radio rows with `bg-blue-50` and no icons, while Step 0 uses selectable cards with icons. Inconsistent pattern for “choose one” flows. |
| **B1 missing step card class** | reg-step-b1 | B1 does not have `reg-step-card` or `reg-step-title`, unlike A1, A2, B2, etc. |

---

## 2. Progress & navigation

| Issue | Location | Description |
|-------|----------|-------------|
| **Step count vs. actual steps (Individual)** | `updateRegProgress()` | Progress shows “Step 1 of 6” … “Step 6 of 6”. For Individual, the first content step after type is B2 (details); B1 is not shown in the current flow. So “Step 2 of 6” appears on the first form, which can be confusing. |
| **No step names in progress** | reg-step-label | Only “Step X of 6” is shown. Users cannot see step names (e.g. “Account type”, “Company details”, “Documents”) without scrolling. |
| **Back button placement** | All steps | Back is on the left, Next on the right (good). No explicit “Save and continue later” or escape path. |

---

## 3. Form density & spacing

| Issue | Location | Description |
|-------|----------|-------------|
| **Uniform block spacing** | A2, B2 | Every field uses `mb-4`. No visual grouping; required vs. optional blocks are not distinguished by spacing or grouping. |
| **Two-column use is partial** | A2, B2 | Address (Country/Region/City) and some company fields use `md:grid-cols-2` or `md:grid-cols-3`. Many other logical pairs (e.g. password + confirm, CR + Tax ID) are already in 2-col; others (e.g. name + website) could be grouped for consistency. |
| **Optional fields not grouped** | B2 | Optional fields (role, years, skills, languages, LinkedIn) are interspersed with required ones. No “Optional details” subsection. |

---

## 4. Labels & clarity

| Issue | Location | Description |
|-------|----------|-------------|
| **Helper text only on some fields** | A2, B2 | Email and mobile have “Used for account verification”; LinkedIn has “Optional but recommended”. Password, confirm password, and other critical fields have no helper or requirements text (e.g. min length, format). |
| **Long labels** | A2 | “Commercial Registration (CR) number (optional)” and “Authorized representative name/role” are verbose; could be shortened or given a tooltip. |
| **Placeholder vs. label** | Various | Some placeholders repeat the label (e.g. “Your company name”); others add value (e.g. “+966 5x xxx xxxx”). Inconsistent. |
| **Terms link is non-functional** | reg-terms-company, reg-terms-individual | “Terms & Conditions” uses `href="#"` and has no `data-route` or modal; clicking does not show terms. |

---

## 5. Error handling & validation

| Issue | Location | Description |
|-------|----------|-------------|
| **Single global error message** | #register-error | All validation errors go to one div at the top. Users must map messages like “Email is required” or “Please verify your mobile with OTP” to the field, especially on long steps (A2/B2). |
| **No inline / per-field errors** | All steps | No `aria-describedby`, no error text under the specific input, and no visual state (e.g. red border) on the field that failed. |
| **Errors not cleared on field change** | register.js | When the user corrects a field, the global error is not cleared until they move to the next step or trigger another validation. |
| **File type not in message** | renderCompanyDocuments, renderIndividualDocuments | “File size must be under 5MB” is shown; “File type not supported” is not surfaced for invalid types (accept is set but no explicit message). |

---

## 6. Document upload

| Issue | Location | Description |
|-------|----------|-------------|
| **Upload zone height** | .reg-upload-zone | Min-height 120px is set in CSS; on small screens it can feel large. No compact “file selected” state that reduces height. |
| **No upload progress** | register.js | File is read with FileReader; there is no progress indicator for large files. |
| **Replace/Remove semantics** | Upload preview | Replace and Remove are text links; no icon or button style. On mobile, tap targets are small. |
| **Required vs optional docs** | Documents step | Required documents are marked with * in the label; optional ones are not clearly grouped or de-emphasized. |

---

## 7. Profile completion (review step)

| Issue | Location | Description |
|-------|----------|-------------|
| **Completion items not aligned with steps** | updateRegProfileCompletionCompany/Individual | “Terms” is in the completion list but is accepted on the previous (documents) step; when viewing review, terms are already accepted. “Documents” is a single item; multiple required docs are not listed individually in Missing. |
| **No percentage number** | reg-profile-completion-* | Only a bar is shown; the “Profile completion: 60%” text is not displayed next to the bar. |
| **Completed/Missing layout on small screens** | reg-completion-done-*, reg-completion-missing-* | Two-column grid can squeeze content on very narrow viewports; single column might be clearer. |

---

## 8. Buttons & actions

| Issue | Location | Description |
|-------|----------|-------------|
| **Mixed button radii** | Various | Some buttons use `rounded-md`, others get `rounded-lg` via CSS. Inline classes mix `rounded-md` and `rounded-lg` across steps. |
| **Primary vs secondary** | Back buttons | Back uses border style; Next uses `bg-primary`. Consistent, but “Finish registration” and “Next” both look the same; no stronger emphasis for final submit. |
| **Continue disabled with no hint** | reg-btn-continue | When no account type is selected, Continue is disabled. No tooltip or hint explaining “Select an option above”. |

---

## 9. Mobile & responsiveness

| Issue | Location | Description |
|-------|----------|-------------|
| **OTP row on small screens** | A2, B2 | Email/Mobile rows: input + “Send OTP” + (when visible) code input + “Verify”. On narrow screens this can wrap awkwardly; stacked layout or full-width buttons might work better. |
| **Account type cards** | reg-step-0 | `sm:grid-cols-3` shows three columns on small breakpoint; on very small phones cards can be narrow. Single column is used only below `sm`. |
| **Fixed min-heights** | main.css | Buttons use min-height 44px/48px; upload zone has min-height. Generally good; ensure no overflow or clipping on small viewports. |
| **Login link at bottom** | End of form | “Already have an account? Login here” is at the bottom of the card; on long steps it’s far below the fold. Consider a persistent link in header or above the card. |

---

## 10. Visual style & consistency

| Issue | Location | Description |
|-------|----------|-------------|
| **Input radius mix** | A2, B2, B1, etc. | Some inputs use `rounded-lg` (email, mobile, LinkedIn), most use `rounded-md`. Inconsistent. |
| **Select styling** | All selects | Same border/ring as inputs; no chevron or custom dropdown styling. Acceptable but could be aligned with a design system. |
| **Vetting step** | A5, B5 | Radio options are plain list; no card treatment like Step 0 or document upload zones. |
| **Preferred collaboration models** | A4, B4 | Checkboxes are inline/flex; no clear grouping or description of what “preferred collaboration models” means. |

---

## 11. Accessibility & semantics

| Issue | Location | Description |
|-------|----------|-------------|
| **Error region** | #register-error | Has `role="alert"`; good. No `aria-live` or association to the first invalid field. |
| **Step regions** | .reg-step-content | No `aria-labelledby` pointing to step title; no `role="region"` or `aria-current="step"` for the active step. |
| **Required fields** | Inputs | Required inputs are not consistently marked with `aria-required="true"` (rely on visual * only). |
| **Terms checkbox** | reg-terms-company, reg-terms-individual | Label wraps checkbox and text; the “Terms & Conditions” link is inside the label, so clicking it might toggle the checkbox (browser-dependent). |

---

## 12. Flow & logic (UX impact)

| Issue | Location | Description |
|-------|----------|-------------|
| **B1 not shown** | getRegStepId() | For Professional/Consultant, after Step 0 the flow goes to B2 (details). B1 (Individual type: Professional vs Consultant) is never displayed, so users who chose “Professional” at Step 0 never see a confirmation step for that choice. |
| **Review before documents** | A4, B4 | Profile completion and review are on the step after documents; users cannot “preview” required items before reaching the documents step. |
| **No draft / save progress** | Entire flow | If the user leaves mid-flow, progress is lost; no “Save and continue later” or draft. |

---

## Summary table (priority)

| Priority | Category | Count | Examples |
|----------|----------|--------|----------|
| High | Layout/hierarchy, Errors, Labels | 8 | Long A2/B2 form, single global error, no per-field errors, Terms link dead |
| Medium | Progress, Buttons, Documents, Completion | 7 | Step names missing, mixed radii, completion % text, Replace/Remove tap targets |
| Low | Mobile, Accessibility, Style consistency | 9 | OTP row wrap, aria for steps, input radius mix |

Use this list to decide which issues to fix first before applying broader signup UI improvements.
