# Design Governance Baseline Report

| Field | Value |
|-------|-------|
| Phase | 3 — Token Governance & Enforcement |
| Date | 29 June 2026 |
| Guard | `scripts/design/validate-design-governance.mjs` |
| Authority | [DDS-003-TOKEN-GOVERNANCE.md](./DDS-003-TOKEN-GOVERNANCE.md) |
| Status | **Clean baseline** — 0 non-baseline violations |

---

## 1. Scan summary

| Metric | Value |
|--------|-------|
| Files scanned | **422** |
| Total violations detected | **8** |
| Baseline exceptions | **8** |
| Non-baseline (actionable) | **0** |
| Baseline registry keys | **30** |
| Strict mode (`--strict`) | **PASS** |

### Commands run

```bash
node scripts/design/validate-design-governance.mjs          # exit 0
cd web && npm run validate:design                           # exit 0
cd web && npm run validate:design:strict                    # exit 0
cd web && npm run type-check                                # pass
cd web && npm test                                          # 631 tests, 0 failures
```

---

## 2. Violations by category

| Category | Count | Baseline | Notes |
|----------|-------|----------|-------|
| `TAILWIND_PALETTE` | 5 | 5 | Readiness + public marketing |
| `PAGE_SHADCN_BUTTON` | 2 | 2 | Public auth + marketing |
| `PAGE_SHADCN_CARD` | 1 | 1 | Public auth |
| `PAGE_SHADCN_BADGE` | 0 | — | No page violations |
| `PAGE_BRAND_TOKENS` | 0 | — | No page violations |
| `DEPRECATED_PAGE_PRIMITIVES` | 0 | — | Zero active imports |
| `HEX_COLOR` | 0 | — | Clean |
| `RGB_COLOR` | 0 | — | Clean |
| `SHADOW_ARBITRARY` | 0 | — | Token-var shadows allowlisted |
| `ROUNDED_ARBITRARY` | 0 | — | Confined to `components/ui/` |

---

## 3. Accepted baseline exceptions

### 3.1 Public routes (UI freeze out-of-scope)

| File | Line | Type | Rationale |
|------|------|------|-----------|
| `pages/public/auth-pages.tsx` | 6 | `PAGE_SHADCN_BUTTON` | Public auth not migrated to PM primitives |
| `pages/public/auth-pages.tsx` | 9 | `PAGE_SHADCN_CARD` | Same |
| `pages/public/marketing-pages.tsx` | 4 | `PAGE_SHADCN_BUTTON` | Marketing pages deferred |

### 3.2 Public marketing palette

| File | Line | Type | Rationale |
|------|------|------|-----------|
| `pages/public/marketing-pages.tsx` | 72 | `TAILWIND_PALETTE` | `bg-emerald-500` status dot — marketing polish deferred |

### 3.3 Readiness components (semantic migration pending)

| File | Line | Type | Rationale |
|------|------|------|-----------|
| `components/readiness/readiness-list.tsx` | 17 | `TAILWIND_PALETTE` | `text-emerald-700` — migrate to `text-success` |
| `components/readiness/readiness-score-ring.tsx` | 6 | `TAILWIND_PALETTE` | `text-amber-600` — migrate to `text-warning` |
| `components/readiness/readiness-score-ring.tsx` | 7 | `TAILWIND_PALETTE` | `text-sky-600` — migrate to `text-info` |
| `components/readiness/readiness-score-ring.tsx` | 8 | `TAILWIND_PALETTE` | `text-emerald-600` — migrate to `text-success` |

### 3.4 Deprecated file (scheduled removal)

| File | Type | Rationale |
|------|------|-----------|
| `components/shared/page-primitives.tsx` | Style allowlist | Deprecated; zero imports; duplicate tone map |

### 3.5 Token-referenced shadows (pre-registered)

| File | Line | Type | Rationale |
|------|------|------|-----------|
| `components/data/pm-data-table.tsx` | 285 | `SHADOW_ARBITRARY` | Uses `var(--border)` — allowed pattern |
| `components/layout/app-sidebar.tsx` | 30 | `SHADOW_ARBITRARY` | Uses `var(--primary)` — allowed pattern |

---

## 4. Known non-violations (not flagged)

| Pattern | Location | Why allowed |
|---------|----------|-------------|
| shadcn imports | `components/ui/*` | Implementation layer |
| `shadow-[...var(--*)]` | `pm-data-table`, `app-sidebar`, `sidebar.tsx` | Token-referenced arbitrary values |
| `rounded-[...]` | `components/ui/tooltip.tsx`, `scroll-area.tsx` | shadcn allowlist |
| shadcn `Input`/`Select` in pages | `opportunities-pages.tsx` | Not in Phase 3 rule set; wizard baseline |
| shadcn `Tabs` in pages | `pipeline-pages.tsx` | Acceptable per UI freeze |
| `page-primitives` tone map | deprecated file | File allowlisted; no imports |

---

## 5. Recommended cleanup order

| Priority | Item | Effort | Phase |
|----------|------|--------|-------|
| 1 | Delete `page-primitives.tsx` | Low | Phase 4 cleanup |
| 2 | Readiness → semantic tokens | Low | Phase 4 token adoption |
| 3 | Public auth → `PmButton`/`PmCard` | Medium | Post-backend marketing DDS |
| 4 | Public marketing palette | Low | With marketing migration |
| 5 | Wizard page shadcn `Input`/`Select` | Medium | Form primitive pass |
| 6 | Enable CI `--strict` on PRs | Low | After cleanup 1–2 |

---

## 6. False positive controls

| Risk | Mitigation |
|------|------------|
| Test files triggering import rules | `*.test.ts` excluded from `DEPRECATED_PAGE_PRIMITIVES` |
| Token-var shadows flagged | `SHADOW_ARBITRARY` allows `var(--` in value |
| shadcn ui internals | Full `components/ui/` style allowlist |
| Comment lines | Lines starting with `//` or `*` skipped |

---

## 7. Registry maintenance

When fixing a baseline violation:

1. Apply the fix in code
2. Remove the corresponding key from `BASELINE_EXCEPTION_KEYS` in `scripts/design/design-governance-rules.mjs`
3. Re-run `npm run validate:design:strict`
4. Update this document

When adding a **new** accepted exception (discouraged):

1. Document rationale in DDS-003 §8
2. Add key to `BASELINE_EXCEPTION_KEYS`
3. Update this report

---

*Baseline captured 29 June 2026. Strict mode clean — safe to enable CI strict after Phase 4 cleanup of readiness + page-primitives.*
