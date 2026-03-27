---
name: Client-facing manuals refresh
overview: "Revise journey markdown into client-facing guides AND upgrade HTML training manuals (user + admin) for scanability, PDF quality, and UX—without rewriting from scratch or breaking layout."
todos:
  - id: user-full-journey
    content: "Revise docs/full-user-journey.md: template, strip technical/POC blocks, relabel diagrams, expand Create Opportunity (7 steps + examples), add Pipeline, simplify matches/deals/contract/deal stages"
    status: pending
  - id: user-journey-md
    content: Align docs/journeys/user-journey.md with same tone and structure; remove implementation columns/legends
    status: pending
  - id: admin-full-journey
    content: "Revise docs/admin-user-journey.md: admin template, remove limitation/QA sections, rewrite matching + notification rows, simplify diagrams, add matches monitoring narrative"
    status: pending
  - id: admin-journey-md
    content: Align docs/journeys/admin-journey.md with admin-user-journey terminology and client tone
    status: pending
  - id: optional-user-guide
    content: "Optional: align POC/docs/user-guide.md opening sections and matching wording to new plain-language standard"
    status: pending
  - id: html-user-manual
    content: "Update docs/manuals/pmtwin-user-training-manual.html: What happens next blocks, action-box pattern, Common mistakes, opportunity example, CSS (sections, h4, note-box, mermaid spacing, PDF avoid-break, footer, cover), note-box for publish/accept"
    status: pending
  - id: html-admin-manual
    content: "Mirror same HTML/CSS/UX patterns in docs/manuals/pmtwin-admin-training-manual.html (admin footer title); regenerate PDFs via README when ready"
    status: pending
isProject: false
---

# Client-facing PMTwin manuals (markdown + HTML)

## Scope: which files

### Markdown (journey sources)

| Audience | Primary (long-form) | Secondary (journey tables) |
| -------- | ------------------- | -------------------------- |
| Users | [docs/full-user-journey.md](docs/full-user-journey.md) | [docs/journeys/user-journey.md](docs/journeys/user-journey.md) |
| Admins | [docs/admin-user-journey.md](docs/admin-user-journey.md) | [docs/journeys/admin-journey.md](docs/journeys/admin-journey.md) |

### HTML (PDF source — **in scope per latest iteration**)

- [docs/manuals/pmtwin-user-training-manual.html](docs/manuals/pmtwin-user-training-manual.html) — primary implementation target
- [docs/manuals/pmtwin-admin-training-manual.html](docs/manuals/pmtwin-admin-training-manual.html) — **same structure, patterns, and CSS**; adjust footer copy to “PMTwin — Admin Guide” (or equivalent)

Regenerate PDFs after HTML/CSS changes: [docs/manuals/README.md](docs/manuals/README.md) (`npm run manual:pdf`, `npm run manual:pdf:admin` from `POC`).

---

## HTML training manuals: global UX and PDF rules

**Constraints:** Do not rewrite from scratch; do not break existing layout/styling patterns; do not remove sections, images, or Mermaid diagrams.

### 1. “What happens next”

After each **Step-by-step actions** (or equivalent) block, add where missing:

```html
<h4>What happens next</h4>
<p>…</p>
```

### 2. Action boxes

Replace generic `action-box` content with a clearer pattern:

- Lead line: **👉 What to do** (`<strong>👉 What to do</strong>`)
- Numbered `<ol>` with one action per `<li>`

Apply without changing the outer `class="action-box"` wrapper so existing styles still apply; extend CSS if needed for inner `ol` spacing.

### 3. “Common mistakes”

After **Tips** (where Tips exist), add in key areas — **Profile**, **Opportunities**, **Matches** (and mirror sensible sections in admin HTML):

```html
<h4>Common mistakes</h4>
<ul>
  <li>…</li>
</ul>
```

Example bullets (tune to copy): short vague titles; missing skills; wrong intent (need vs offer).

### 4. Opportunities section (user HTML) — **critical**

In **§5 Opportunities** (or the section titled for opportunities / create flow), add:

- `<h4>Example (good opportunity)</h4>`
- `action-box` containing example fields: Title, Skills, Budget, Timeline (use provided example text: structural engineer / shop drawing review, etc.)

### 5. Visual separation

Add or extend CSS:

```css
section { margin-bottom: 24px; }
```

(Use the document’s existing sectioning elements — if the manual uses `<section>` apply directly; if it uses `.section` or article blocks, apply the same spacing to the equivalent class **without** breaking print.)

### 6. Title wording (minor)

- Rename **“What this page is”** → **“What this page is about”** (keep parallel structure for other headings).
- **“What you can do here”** — keep as-is per spec.

### 7. Light icon style on `h4`

```css
h4::before {
  content: "• ";
  color: #0d9488;
  font-weight: bold;
}
```

Ensure this does not clash with Mermaid or headings inside diagrams (scope with a wrapper class like `.manual-body h4` if needed).

### 8. Highlight box for important notes

New class:

```css
.note-box {
  border-left: 4px solid #f59e0b;
  background: #fffbeb;
  padding: 8px 12px;
  margin: 10px 0;
}
```

Use for at least: **after you publish**; **when everyone accepts** (and admin equivalents if applicable).

### 9. PDF body readability

```css
p { margin: 0.6em 0; }
ul { margin: 0.6em 0; }
```

### 10. Mermaid

- Keep all diagrams.
- Center diagram containers in CSS; add margin above/below (e.g. `.mermaid { margin: 1em auto; }` or wrapper class already in file).

### PDF-specific

1. **Avoid awkward splits:** `.avoid-break { page-break-inside: avoid; }` on `action-box`, `table`, `figure`, and diagram wrappers.
2. **Footer:** `<footer class="footer">PMTwin — User Guide</footer>` (admin: “PMTwin — Admin Guide”) with fixed bottom styling as specified (`font-size: 9pt`, centered, gray). **Note:** `position: fixed` footers behave differently in print/Puppeteer — verify during PDF run; fallback may be `@page` margin + running footer if fixed fails in export.
3. **Cover page:** Logo placeholder, increased spacing, clean centered alignment (HTML/CSS only).

---

## Editorial rules (markdown — unchanged)

1. Replace internal/dev terms with plain language.
2. Remove POC legends, Implementation blocks, limitation lists; preserve chapter structure.
3. Relabel Mermaid nodes to non-technical wording.
4. Section template: What this page is about → What you can do here → Step-by-step / Admin Actions → What happens next → Tips / Common mistakes as needed.
5. Friendly tone; do not delete top-level journey chapters.

---

## User manual: markdown content work

(Same as prior plan: Profile, Create opportunity aligned to 7-step wizard, Matches, Match→Deal, Deals, Contract, Pipeline, Registration.)

---

## Admin manual: markdown content work

(Same as prior plan: dashboard through contracts, matching rewrite, remove §14/§17 style content from md, diagram relabels.)

---

## Consistency: markdown vs HTML

- Markdown journey files remain the long-form **reference** for wording.
- HTML manuals should **not** diverge into technical/POC language; any new “What happens next” / examples / common mistakes in HTML should match the client-facing tone from the markdown refresh when both are edited in the same effort.

---

## Verification checklist

**Markdown:** Grep for POC/threshold/scoring/backend/preview-only language; major `##` have What happens next.

**HTML:** No removed sections/images/diagrams; action-boxes use “What to do” + `<ol>`; new CSS classes present; Opportunities example added; `note-box` used for publish/accept; print CSS classes on fragile blocks; PDF export spot-check (pagination, footer visibility).
