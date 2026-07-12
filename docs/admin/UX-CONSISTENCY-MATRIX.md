# Admin UX Consistency Matrix (Demo/UAT)

Evidence-based matrix for implemented Admin surfaces.  
**Legend:** Y = present, — = intentionally omitted, P = planned shell, Q = filter queue only

| Page | Header | KPI | Actions | Filters/Search | Primary | Related | Timeline | Empty/Error |
|------|--------|-----|---------|----------------|---------|---------|----------|-------------|
| Executive Command Center | Y | Y | — | — | Y | — | Y (audit strip) | Y |
| Operations | Y | Y | Y (drill) | — | Y | — | — | Y |
| Risk | Y | Y | — | — | Y | — | — | Y |
| Inbox / My Queue | Y | — | Y | Y | Y | — | — | Y |
| Users list | Y | — | — | Y | Table | — | — | Y |
| User detail | Y | — | Y | — | Form | Y | Y | Y |
| Parties / detail | Y | — | — | Y | Y | Y* | Y* | Y |
| Memberships | Y | — | Y (gated) | Y | Table | — | — | Y |
| Vetting | Y | Y | Y (gated) | Y | Table | — | — | Y |
| Opportunities / Matching / PostMatches | Y | — | Y* | Y | Table | — | — | Y |
| Negotiation detail | Y | — | — | — | Y | — | Y* | Y |
| Commercial Agreements | Y | — | — | Y | Table | — | — | Y |
| Approvals / Legal Review | Y | — | — | Y | Table (Q) | — | — | Y |
| Awards | Y | — | Y (gated) | Y | Table | — | — | Y |
| Contracts | Y | — | — | Y | Table | — | — | Y |
| Reports / Health / Data Quality | Y | Y | — | — | Y | — | — | Y |
| Environments | Y | Y (meta) | Y (gated) | — | Panel | — | — | Y |
| Feature Flags | Y | — | — | — | Read-only | — | — | Y |
| Search / Explorer | Y | — | — | Y | Y | — | — | Y |
| Workspaces | Y | Y | Y (links) | — | Y | — | — | Y |
| Settings | Y | — | Y (gated) | Section tabs | Functional forms | — | Audit link | Y |
| Feature Flags | Y | — | Y (editable) | — | Editable + Locked | — | — | Y |
| Skills / Site / Disputes / Subscriptions | Y | — | — | — | P | — | — | Y |

\* Where detail adapters expose related objects / timeline.

Shared shells: `PmPage` + `PmPageHeader`, `AdminListPage`, `AdminPlannedShell`.
