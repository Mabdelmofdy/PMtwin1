# Runtime Boundaries

**Parent:** [runtime-ownership.md](../runtime-ownership.md)  
**Status:** Active (Phase 10.3)

This document specifies import boundaries, storage keys, and write paths between `web/`, `packages/`, and `POC/`.

---

## Import matrix

| From → To | `packages/*` | `web/src` | `POC/data` | `POC/src` |
|-----------|:------------:|:---------:|:----------:|:---------:|
| **`web/src`** | ✅ | ✅ internal | ✅ via `@seed-data` only (build-time JSON) | ❌ **Forbidden** |
| **`packages/*`** | ✅ internal | ❌ | ❌ | ❌ |
| **`POC/src`** | ✅ static vendor copy (`lifecycle` only) | ❌ | ✅ local fetch/merge | ✅ internal |
| **`POC/scripts`** | optional | ❌ | ✅ read/write JSON | ❌ |

### Web seed imports

Only these modules may import `@seed-data`:

| Module | Purpose |
|--------|---------|
| `web/src/infrastructure/seed/seed-loader.ts` | Entity seed loading |
| `web/src/infrastructure/matching/matching-engine-context.ts` | `skill-canonical.json` for matching |

All other code consumes seed data through repositories or loader functions — never direct JSON imports.

---

## Storage boundaries

### Web runtime keys

| Key | Owner | Contents |
|-----|-------|----------|
| `pmtwin_web_overrides` | web repositories | Patches, new records, audit append |
| `pmtwin_web_session` | `auth-service` | Auth session token + userId |

### POC runtime keys (legacy — web must not use)

| Key pattern | Owner |
|-------------|-------|
| `pmtwin_users`, `pmtwin_opportunities`, … | POC `data-service.js` |
| POC session keys | POC `auth-service.js` |

Web and POC storage namespaces are **fully isolated**. Same browser may hold both if both apps were run historically; web does not read POC keys.

---

## Write path reference

### Preferred: command path

```
Component / page action
  → *-command-service or getApplicationCommandGateway()
  → DefaultCommandGateway.execute(command)
  → *CommandHandler.handle(command)
  → *Repository.create | update | append
  → BaseRepository.writeOverrides()
  → localStorageAdapter.set('pmtwin_web_overrides', …)
  → notifyDataStore() → UI re-render
```

### Service orchestration

| Service | Writes via |
|---------|------------|
| `matching-service` | PostMatch discover commands; `auditRepository.append` |
| `lifecycle-orchestrator` | `dealRepository.update`, `opportunityRepository.update` |
| `negotiation-service` | Application command gateway |
| `deal-service` | Deal command gateway |
| `notification-service` | `notificationRepository` CRUD |

### Read path

```
Repository.getAll()
  → loadSeed() from seed-loader (bundled @seed-data JSON)
  → merge with readOverrides().{entity}
  → return to API module / read model / UI
```

User and Company repositories are **read-only** (seed only; no override merge in current implementation).

---

## POC directory contract

```
POC/
├── data/           ← physical seed JSON (shared with web via @seed-data)
├── scripts/        ← seed generation, simulation, validation (allowed)
├── tests/          ← legacy regression suite (allowed)
├── docs/           ← reference documentation (allowed)
└── src/            ← FROZEN legacy runtime (no new product logic)
```

### POC scripts — allowed purposes

- Generate or normalize `POC/data/*.json`
- Run matching simulations under `POC/data/simulation/`
- Validate seed relationship integrity
- Support E2E/regression harness data setup

### POC scripts — not allowed

- Becoming a dependency of `web/` build or runtime
- Replacing web command gateway for new features

---

## Normalized domain layer

`web/src/domain/normalized/` adapts legacy seed field names to canonical models on **read**. This is web-owned compatibility logic — not a POC runtime dependency.

Legacy status aliases (`pending` → `discovered`, etc.) are applied via:

- `@pm-twin/lifecycle` `toCanonical` / `toStored`
- `web/src/domain/workflow/legacy-map.ts`
- `web/src/domain/normalized/adapters.ts`

New code must use **canonical names only** in writes; aliases are for reading seed data.

---

## Verification checklist

Before merging web changes:

1. No imports from `POC/src` or `@poc-data` in `web/src`
2. Lifecycle status changes go through command gateway (not direct repository patch of `status`)
3. New shared logic lives in `packages/`, not `POC/src`
4. `npm run test` passes (includes `runtime-ownership.guard.test.ts`)
5. `npm run type-check && npm run build` pass

Before merging POC changes:

1. Confirm change is seed, script, test, or docs — not new runtime product logic
2. If seed JSON changed, run `web` `validate:domain` and `scripts/validate-relationships.mjs`
