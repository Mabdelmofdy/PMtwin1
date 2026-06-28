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
