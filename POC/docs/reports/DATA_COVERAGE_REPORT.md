# Data coverage report

### What this page is

Internal report: **coverage** of entities and fields in demo/seed data.

### What happens next

Close gaps or document as accepted limitations.

---

Generated: 2026-03-06T12:50:46.835Z

## Domain counts

| Domain | Count | Notes |
|--------|-------|-------|
| Users | 29 | 28 professionals/consultants, 1 admin/moderator/auditor, 15 companies (separate store) |
| Companies | 15 | Company profiles (company_owner) |
| Opportunities | 50 | 22 needs, 16 offers (published) |
| Applications | 32 | Applications to opportunities |
| Matches | 219 | opportunity–candidate matches |
| Notifications | 11 | User notifications |
| Connections | 16 | User connections |
| Messages | 0 | Direct messages |
| Audit | 12 | Audit log entries |
| Sessions | 0 | Active sessions |
| Contracts | 3 | Contracts |

## Sufficiency for platform workflows

- **Individual users:** Sufficient. Users can register, create profiles (professionals have full profiles), create opportunities, receive matches (matches use candidateId), and collaborate (applications, connections, messages present).
- **Companies:** Sufficient. 15 companies with full profiles; companies can post opportunities (including consortium opp-001).
- **Admin:** Sufficient. Admin/moderator/auditor roles present; 2 pending users, 0 pending companies for vetting; opportunities and matching can be managed; audit trail has 12 entries.
