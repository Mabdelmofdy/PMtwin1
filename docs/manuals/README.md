# PMTwin training manuals (A4 PDF)

### What this page is

How to find the **HTML** and **PDF** training manuals and how to **regenerate** them after edits.

### Why it matters

Trainers and client success need print-ready assets without hunting through the repo.

### What you can do here

- Open the user or admin HTML in a browser.
- Export fresh A4 PDFs after you change content or screenshots.

### Step-by-step actions

1. Edit `pmtwin-user-training-manual.html` or `pmtwin-admin-training-manual.html` in this folder.
2. From the `POC` folder, run the PDF scripts (see below).
3. Open the new PDFs in `docs/manuals/` and spot-check diagrams and page breaks.

### What happens next

Share the PDFs with clients or print them; capture new screenshots only when the UI changes.

### Tips

- First-time setup needs Node and Playwright for **screenshot capture**; PDF-only runs need fewer steps.

---

## Outputs

| File | Description |
|------|-------------|
| [pmtwin-user-training-manual.html](pmtwin-user-training-manual.html) | Client user guide — print-ready HTML |
| [PMTwin-User-Training-Manual-A4.pdf](PMTwin-User-Training-Manual-A4.pdf) | Client user guide — A4 PDF |
| [pmtwin-admin-training-manual.html](pmtwin-admin-training-manual.html) | Administrator manual — print-ready HTML |
| [PMTwin-Admin-Training-Manual-A4.pdf](PMTwin-Admin-Training-Manual-A4.pdf) | Administrator A4 PDF |
| [assets/](assets/) | UI screenshots (user and admin) |

---

## Regenerate

```bash
cd POC
npm install
npx playwright install chromium
npm run manual:capture
npm run manual:pdf:all
```

PDFs only (after HTML edits):

```bash
cd POC
npm run manual:pdf
npm run manual:pdf:admin
```

- **manual:capture** — Serves the POC, captures user screenshots (demo account) and admin screenshots (admin account), saves PNGs under `docs/manuals/assets/`.
- **manual:pdf** / **manual:pdf:admin** — Renders Mermaid and exports A4 PDFs (default ports avoid collisions).

### What happens next

Commit updated HTML, assets, and PDFs when you are happy with the result.

---

## Source alignment

Manuals align with:

- [full-user-journey.md](../full-user-journey.md)
- [workflow/](../workflow/) (user and opportunity flows)
- [admin-user-journey.md](../admin-user-journey.md)
- [implementation-status.md](../implementation-status.md)
- [gaps-and-missing.md](../gaps-and-missing.md)

---

## Technical note (developers)

The app expects `/core/workflow/workflow-engine.js` for the data module graph. A minimal stub lives at `POC/core/workflow/workflow-engine.js` so static serving of the POC works during capture.
