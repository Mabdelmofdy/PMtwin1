# Admin UX Consistency Matrix (Demo/UAT) — EOX

Evidence-based matrix for implemented Admin surfaces.  
**Legend:** Y = present, — = intentionally omitted, P = planned shell, Q = filter queue only, E = enterprise grid

| Page | Header | KPI | Actions | Filters/Search | Primary | Related | Timeline | Empty/Error |
|------|--------|-----|---------|----------------|---------|---------|----------|-------------|
| Executive Command Center | Y | Y (secondary) | Y | — | Requires Action / Health / Pipeline / Risk / Ops | — | Y (recent ops) | Y |
| Operations | Y | Y | Y (drill) | — | Y | — | — | Y |
| Risk | Y | Y | — | — | Y | — | — | Y |
| Inbox / My Queue | Y | — | Y | Y | Y | — | — | Y |
| Workspace homes | Y + risk | Y | Y (queue) | — | Tiles + analytics | Y | Y (audit) | Y |
| Users list | Y | — | Y (row) | Y (E) | Table (E) | — | — | Y |
| User detail | Y | Status | Y | — | Shell overview | Y | Y | Y |
| Parties / detail | Y | Status | — | Y (E) | Shell | Y | Y | Y |
| Memberships | Y | — | Y (gated) | Y (E) | Table (E) | — | — | Y |
| Vetting | Y | Y | Y (gated) | Y | Table | — | — | Y |
| Opportunities list | Y | — | Y | Y (E) | Table (E) | — | — | Y |
| Opportunity detail | Y | Status | Y | — | Shell | Y | Y | Y |
| Matching / PostMatches | Y | — | Y | Y (E) | Table (E) | — | — | Y |
| Negotiation detail | Y | — | Y (catalogue) | — | Y | Y | Y | Y |
| Commercial Agreements | Y | — | — | Y (E) | Table (E) | — | — | Y |
| Approvals / Legal Review | Y | — | — | Y (E) | Table (Q/E) | — | — | Y |
| Awards | Y | — | Y (gated) | Y (E) | Table (E) | — | — | Y |
| Contracts | Y | — | — | Y (E) | Table (E) | — | — | Y |
| Reports / Analytics | Y | Y | Drill | — | Charts + funnel | — | — | Y |
| Health / Data Quality | Y | Y | — | — | Y | — | — | Y |
| Environments | Y | Y (meta) | Y (gated) | — | Panel | — | — | Y |
| Feature Flags | Y | — | Y | — | Editable + Locked | — | — | Y |
| Search / Explorer | Y | — | — | Y | Y | — | — | Y |
| Settings | Y | — | Y (gated) | Section tabs | Functional forms | — | Audit link | Y |
| Skills / Site / Disputes / Subscriptions | Y | — | — | — | P | — | — | Y |

Shared shells: `PmPage` + `PmPageHeader`, `AdminListPage` (enterprise), `AdminWorkspaceShell`, `AdminEntityDetailShell`, `AdminPlannedShell`.
