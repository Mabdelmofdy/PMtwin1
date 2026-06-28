# PMTwin MVP

### What this page is

Short **project hub**: what PMTwin is, how the repo is laid out, and how to run the active application.

### Why it matters

New contributors use this file first before reading `/docs` or `BRD/`.

### What you can do here

- Understand collaboration models at a glance.
- Find the **web** entry point (active runtime) and documentation links.

### Step-by-step actions

1. Read **Project overview** and **Runtime ownership** below.
2. Run the web app: `cd web && npm install && npm run dev`.
3. Open `docs/overview.md` and `docs/runtime-ownership.md` for platform detail.

### What happens next

Deep dives live in [docs/full-user-journey.md](docs/full-user-journey.md) and [BRD/](BRD/).

### Tips

- Product data in web persists in browser `localStorage` (`pmtwin_web_overrides`) until a backend is connected.
- `POC/` is a legacy reference app and seed source — not the active runtime.

---

A collaboration platform for construction: partnerships, resource sharing, and professional connections across Saudi Arabia and the GCC.

## Runtime ownership (Phase 10.3)

| Path | Role |
|------|------|
| **`web/`** | **Active runtime** — React SPA, command gateway, repositories |
| **`packages/`** | Shared business logic (`lifecycle`, `commands`, `matching`) |
| **`POC/data/`** | Physical seed JSON (imported by web via `@seed-data`) |
| **`POC/`** (elsewhere) | Legacy reference, scripts, regression harness — **frozen** |

See [docs/runtime-ownership.md](docs/runtime-ownership.md).

## Project overview

PMTwin supports several ways to work together:

- **Project-based collaboration** — tasks, consortiums, joint ventures, SPVs  
- **Strategic partnerships** — long-term JVs, alliances, mentorship  
- **Resource pooling** — bulk buying, equipment sharing, exchange  
- **Hiring** — professionals and consultants  
- **Competitions** — RFPs, RFQs, design contests  

## Architecture

- **Active runtime:** `web/` — React 19, TypeScript, Vite, repository + command layers
- **Shared logic:** `packages/` — lifecycle FSM, command contracts, matching engine
- **Seed data:** `POC/data/` (physical) → `@seed-data` alias → web seed-loader
- **Legacy reference:** `POC/` MPA (vanilla JS) — frozen; use for regression and seed scripts only

## Project structure

```
PMTwin-MVP/
├── web/                    # Active runtime (React SPA)
├── packages/               # @pm-twin/lifecycle, commands, matching
├── docs/                   # Technical and user documentation
├── BRD/                    # Business requirements
├── POC/                    # Legacy reference + seed + harness
│   ├── data/               # Seed JSON (shared with web)
│   ├── scripts/            # Seed/simulation scripts
│   ├── tests/              # Legacy regression tests
│   └── src/                # Frozen legacy runtime
└── README.md
```

## Getting started (web — active runtime)

1. `cd web && npm install`
2. `npm run dev` — open the URL Vite prints (typically http://localhost:5173)
3. Run checks: `npm run type-check && npm run test && npm run build`

### Legacy POC (reference only)

Open `POC/index.html` in a browser for the historical MPA. No build required for basic static run. Do not add new product features here.

### What happens next

Explore `docs/manuals/` for printable user/admin guides, or `docs/workflow/` for flows.

## User roles (summary)

- **Company:** owner, admin, member  
- **Professional:** professional, consultant  
- **Admin:** platform admin, moderator, auditor  

## Features (summary)

- Many features across user and admin areas  
- Multiple business models and sub-models  
- Collaboration wizard, matching, applications with pipeline  
- Admin portal for governance  

## Documentation

- **`docs/runtime-ownership.md`** — Active runtime, POC freeze rules, seed ownership
- **`docs/`** — Journeys, workflows, data model, implementation status  
- **`BRD/`** — Business requirements and specifications  

## License

Proprietary — PMTwin Platform
