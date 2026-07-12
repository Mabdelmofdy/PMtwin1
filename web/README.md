# PMTwin Web — Active Runtime

This directory is the **active product runtime** for PMTwin (Phase 10.3).

## Quick start

```bash
npm install
npm run dev
```

## Checks

```bash
npm run type-check
npm run test
npm run build
npm run validate:domain
```

## Architecture

- **Commands:** `src/commands/` — gateway and entity handlers
- **Repositories:** `src/repositories/` — seed read + `pmtwin_web_overrides` writes
- **Seed:** `@seed-data` alias → `../POC/data/` (physical source until extraction)
- **Packages:** `@pm-twin/lifecycle`, `@pm-twin/commands`, `@pm-twin/matching`

Ownership rules: [../docs/runtime-ownership.md](../docs/runtime-ownership.md)

## Guards

`src/infrastructure/seed/runtime-ownership.guard.test.ts` fails if `web/src` imports POC runtime paths or legacy `@poc-data`.

---

Stack: React 19, TypeScript, Vite, Tailwind CSS 4.

## Vercel deployment readiness sprint

This runtime is ready to deploy to Vercel as a React SPA without changing business logic, workflows, or matching behavior.

### Build configuration checks

Run from `web/`:

```bash
npm run type-check
npm run test
npm run build
```

Notes:
- `build` runs `tsc -b && vite build`.
- Vite output is generated in `web/dist`.
- `web` depends on workspace packages (`@pm-twin/*`), so package build health must also be checked.

### SPA routing on Vercel

`web/vercel.json` provides React Router fallback:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Required environment variable

Set this per Vercel environment/project:

- Demo: `VITE_RUNTIME_MODE=demo`
- UAT: `VITE_RUNTIME_MODE=uat`
- Production: `VITE_RUNTIME_MODE=production`

### Deployment profiles

- Demo: `demo.pmtwin.com` with `VITE_RUNTIME_MODE=demo`
- UAT: `uat.pmtwin.com` with `VITE_RUNTIME_MODE=uat`
- Production: `app.pmtwin.com` with `VITE_RUNTIME_MODE=production`

### Runtime data and LocalStorage

- Demo and UAT use browser-local storage namespaces (`PMTWIN_DEMO_` and `PMTWIN_UAT_`).
- UAT banner warning: data is stored in browser LocalStorage and must be exported before clearing storage.
- Production does not use a namespaced LocalStorage prefix for runtime mode.

### Demo/UAT reset and backup instructions

- Reset/restore/import/export controls are available only in Demo/UAT runtime modes.
- Before browser cleanup, export environment JSON from the admin environment controls.
- Keep exported JSON backups in a secure project archive for UAT traceability.
- After cleanup or switching devices, import the last known-good JSON backup.

### Manual QA checklist — import/export roundtrip (UAT)

- [ ] Open UAT deployment (`uat.pmtwin.com`).
- [ ] Create one opportunity.
- [ ] Create one negotiation message.
- [ ] Export environment JSON.
- [ ] Reset environment.
- [ ] Import the exported JSON.
- [ ] Verify opportunity and negotiation message are restored.

### Manual QA checklist — scenario restore (Demo/UAT)

- [ ] Restore `Cash Subcontracting`.
- [ ] Restore `Joint Venture`.
- [ ] Restore `Hiring`.
- [ ] Restore `Circular Resource Sharing`.
- [ ] Restore `Marketplace`.

### Production safety checklist

- [ ] Demo reset controls are not visible in production.
- [ ] Import/export controls are not visible in production.
- [ ] Scenario restore controls are not visible in production.
- [ ] Demo/UAT environment banner is not visible to customers (admin Environment panel only).
- [ ] Demo/UAT environment banner is not visible in production.
- [ ] Production runtime does not allocate a `PMTWIN_PRODUCTION` LocalStorage namespace.
