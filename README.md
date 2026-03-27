# PMTwin MVP — proof of concept

### What this page is

Short **project hub**: what PMTwin is, how the repo is laid out, and how to open the POC app.

### Why it matters

New contributors use this file first before reading `/docs` or `BRD/`.

### What you can do here

- Understand collaboration models at a glance.
- Find the POC entry point and documentation links.

### Step-by-step actions

1. Read **Project overview** below.
2. Open `POC/index.html` in a modern browser (see Getting started).
3. Open `docs/overview.md` for platform detail.

### What happens next

Deep dives live in [docs/full-user-journey.md](docs/full-user-journey.md) and [BRD/](BRD/).

### Tips

- Data in the POC stays in the browser unless you connect a real API.

---

A collaboration platform for construction: partnerships, resource sharing, and professional connections across Saudi Arabia and the GCC.

## Project overview

PMTwin supports several ways to work together:

- **Project-based collaboration** — tasks, consortiums, joint ventures, SPVs  
- **Strategic partnerships** — long-term JVs, alliances, mentorship  
- **Resource pooling** — bulk buying, equipment sharing, exchange  
- **Hiring** — professionals and consultants  
- **Competitions** — RFPs, RFQs, design contests  

## Architecture (POC)

- **Type:** Feature-based multi-page application  
- **Stack:** HTML5, CSS3, vanilla JavaScript (ES6+)  
- **Storage:** `localStorage` in the POC phase  
- **Frameworks:** None on purpose for the POC  

## Project structure

```
PMTwin-MVP/
├── BRD/                    # Business requirements
├── docs/                   # Technical and user documentation
├── POC/                    # Proof of concept application
│   ├── index.html          # Entry point
│   ├── pages/              # Feature pages
│   ├── features/           # Feature components
│   ├── src/                # Source code
│   ├── assets/             # Static assets
│   ├── data/               # Seed data
│   └── templates/          # HTML templates
└── README.md
```

## Getting started

1. Open `POC/index.html` in a modern browser.  
2. No build step is required for basic static run (see POC `package.json` for tooling).  
3. Data persists in browser `localStorage` in the POC.  

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

- **`docs/`** — Journeys, workflows, data model, implementation status  
- **`BRD/`** — Business requirements and specifications  

## License

Proprietary — PMTwin Platform
