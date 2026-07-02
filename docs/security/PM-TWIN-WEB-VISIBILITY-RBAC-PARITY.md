# PM-Twin Web Visibility / RBAC Parity

**Sprint:** Presentation-layer read visibility aligned with legacy POC behavior.  
**Scope:** `web/` only. POC used as read-only reference.  
**Status:** Implemented (frontend guards).

---

## Important security note

These guards are **frontend visibility parity only**. They do not replace backend authorization.

Repositories and client APIs (`opportunitiesApi.get`, `matchesApi.list`, etc.) still return full records from seed/overrides. Real enforcement must happen **server-side** during backend integration (authenticated APIs, row-level security, field-level redaction).

---

## POC behavior reviewed

| Surface | POC rule | Reference |
|---------|----------|-----------|
| Opportunity — matching section | Owner only when `published` / `in_negotiation` | `POC/features/opportunity-detail/opportunity-detail.js` |
| Opportunity — applications | Owner or admin with `admin.opportunities.read` | `POC/src/utils/opportunity-applications.js` |
| Opportunity — participant chip | Non-owner with `one_way` post_match for this opp | `opportunity-detail.js` L467–478 |
| Opportunity — teaser | Rejected/suspended; unverified prof/consultant | `opportunity-detail.js` L218–230 |
| Opportunity edit | Owner or platform `admin` (not auditor) | `POC/features/opportunity-edit/opportunity-edit.js` |
| Match detail | Hard block if not participant | `POC/features/match-detail/match-detail.js` |
| Negotiation detail | Hard block if not party (no admin on user route) | `POC/features/negotiation-detail/negotiation-detail.js` |
| Deal detail | Participant or `canAccessAdmin()` | `POC/features/deal-detail/deal-detail.js` |
| Contract detail | Party or `canAccessAdmin()` | `POC/features/contract-detail/contract-detail.js` |
| Deals/contracts lists | Scoped to user participation | `getDealsByUserId`, `getContractsByUserId` |
| Contract section on opp | Visible to all when contracted+ | `opportunity-detail.js` L643–666 |

---

## Web gaps found (pre-sprint)

1. Opportunity detail showed full matching panel, readiness, and match scores to any authenticated user.
2. Match detail allowed outsiders read-only access to scores, participants, and linked records.
3. Negotiation/deal/contract detail pages had no entity-level auth.
4. Global matches/deals/contracts lists returned all records.
5. Opportunity edit wizard had no owner/admin guard.
6. Opportunity cards exposed readiness breakdown and match counts to all list viewers.
7. RBAC policies existed but were advisory and unused on read paths.

---

## Visibility rules implemented

Central module: [`web/src/lib/entity-view-visibility.ts`](../web/src/lib/entity-view-visibility.ts)

### Opportunity detail access tiers

| Tier | Who | Visible |
|------|-----|---------|
| `denied` | Non-owner on **draft** (web hardening) | Access denied page |
| `teaser` | Suspended/rejected; unverified individuals | Title, sector, location only |
| `public` | Unrelated signed-in user on published opp | Marketplace fields (summary, description, skills, budget) — no matching/readiness |
| `participant` | Match participant (non-owner) | Public fields + own match chip |
| `owner` | Creator | Full detail including matching section, readiness, owner actions |
| `admin` | `canAccessAdmin` staff | Staff read (no owner matching section); legacy apps still behind `productFlags` |

### Collaboration entity pages

| Entity | View gate | Mutation gate |
|--------|-----------|---------------|
| Match | Participant only | Existing action helpers + page gate |
| Negotiation | Party only | Participant only |
| Deal | Participant or admin staff | Participant only (admins read-only) |
| Contract | Party or admin staff | Party only for sign/complete/terminate |

### Lists

- **Matches:** filtered to participant matches + matches on owned opportunities (+ all for admin). Pipeline `/pipeline/matches` tab and `/matches` list both use `filterPostMatchesForViewer`.
- **Deals / contracts:** filtered to participation (+ all for admin).
- **Opportunities (`scope=all`):** other users' drafts hidden.

### Applications UI

`productFlags.showLegacyApplications` remains **`false`**. No change.

---

## Intentional web hardening

**Draft opportunities:** Non-owners (except platform staff with `canAccessAdmin`) receive access denied. POC allowed any authed user to load drafts by URL; web blocks this to protect owner-only content.

---

## Files changed

| File | Change |
|------|--------|
| `web/src/lib/entity-view-visibility.ts` | **New** — visibility policy |
| `web/src/lib/entity-view-visibility.test.ts` | **New** — unit tests |
| `web/src/components/auth/entity-access-state.tsx` | **New** — denied/limited UI |
| `web/src/pages/workspace/opportunity-detail-page.tsx` | Tiered visibility |
| `web/src/pages/workspace/pipeline-pages.tsx` | Match/negotiation gates + list filter |
| `web/src/pages/workspace/deals-pages.tsx` | Deal gates + list filter |
| `web/src/pages/workspace/contracts-pages.tsx` | Contract gates + list filter |
| `web/src/pages/workspace/opportunities-pages.tsx` | List draft filter + edit guard |
| `web/src/components/opportunity/opportunity-card.tsx` | Owner-only insights |
| `web/src/components/layout/workspace-dashboard-composition.tsx` | Owner-only card insights |
| `web/src/domain/rbac/policies/match.policy.ts` | `match.view` policy |
| `web/src/domain/rbac/policies/negotiation.policy.ts` | `negotiation.view` policy |
| `web/src/domain/rbac/types.ts` | Action types |
| `web/src/domain/rbac/registry.ts` | Action registry |

**Not modified:** `POC/`, `packages/`

---

## Tests

- `web/src/lib/entity-view-visibility.test.ts` — owner, public, participant, admin, draft deny, entity gates, list filters, applications flag regression
- Existing `product-flags.test.ts` unchanged (applications still disabled)

---

## Validation

Run from `web/`:

```bash
npm run type-check
npm test
npm run validate:design:strict
```

---

## Remaining work (backend)

1. Server-side authorization on all read/write APIs.
2. Field-level redaction in API responses (not only UI).
3. Granular admin capabilities (`admin.opportunities.read`, etc.) when backend supports them.
4. Audit logging for denied access attempts.
