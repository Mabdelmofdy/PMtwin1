# Opportunity Coverage Matrices

Companion to [`opportunity-field-catalog.md`](./opportunity-field-catalog.md).  
Presentation contract for Opportunity Module Enterprise Reference Specification (O0).

---

## 1. Field Coverage Matrix (summary)

Classification key: D = Displayed · F = Displayed With Formatting · R = Displayed With Redaction · H = Intentionally Hidden · U = Unsupported

| Field group | Create | Persisted | Detail | Marketplace | Export | Search | Strategy |
|-------------|--------|-----------|--------|-------------|--------|--------|----------|
| Title / description / intent | Yes | Yes | D/F | D/F | D | Partial | Displayed |
| Lifecycle / visibility | System | Yes | F | F | F | Yes | Displayed With Formatting |
| Collaboration taxonomy | Yes | Yes | D | D | D | Filter | Displayed |
| Matching topology | Derived | Optional | D | D | D | Filter | Displayed |
| Location / service area / delivery / languages | Yes | Yes | D | Partial | D | Partial | Displayed |
| Skills / services (required & preferred) | Yes | Yes | D/F | Counts | D | Partial | Displayed With Formatting |
| Resources / offer capacity | Yes | Yes | D | H | D | No | Displayed |
| Qualifications | Yes | Yes | D | H | D | No | Displayed |
| Work packages / tasks / deliverables / milestones | Yes | Yes | D | Counts | D | No | Displayed |
| Rich timeline windows | Yes | Yes | D | H | D | No | Displayed |
| Attachments / portfolio / compliance | Yes | Yes | D | H | D | No | Displayed |
| Commercial structure & payment | Yes | Yes | R | R | R | Mode | Displayed With Redaction |
| Constraints | Yes | Yes | R | H | R | No | Displayed With Redaction |
| Repository IDs | N/A | Yes | H | H | H | No | Intentionally Hidden |
| Views / bookmarks / shares | No | No | U | U | U | No | Unsupported |
| Map geo | No | No | U | U | U | No | Unsupported |

**Acceptance:** Every persisted business field has a strategy above or in the field catalog.

---

## 2. Workspace Coverage Matrix

| Workspace | Data Source | Owner | Participant | Public | Admin | Auditor |
|-----------|-------------|-------|-------------|--------|-------|---------|
| overview | Read model collaboration + opportunity facts | Ready | Ready (limited) | Ready (limited) | Ready | Ready (read-only) |
| scope | Read model scope (WP/tasks/skills/resources/timeline) | Ready | Ready if full description | Restricted / limited | Ready | Ready (read-only) |
| commercial | Commercial structure + Payment section | Ready + amounts | Stage-appropriate amounts | Redacted types/mode | Ready + amounts | Ready + amounts (read-only) |
| marketplace | OpportunityCard public representation | Ready | Ready | Ready | Ready | Ready |
| matching | PostMatch read model | Ready when published+ | Restricted (own chip elsewhere) | Restricted | Restricted (existing flags) | Restricted |
| documents | Attachments / portfolio / WP docs | Ready | Restricted or limited | Restricted | Ready | Ready (read-only) |
| related | Matches / negotiations / agreements / contracts | Ready | Own participation only | Restricted (no private existence) | Ready | Ready (read-only) |
| history | Metadata + audit + related events | Ready | Limited metadata | Limited | Ready + richer audit | Ready + auditor metadata |

States: Ready · Empty · Restricted · Unavailable (per `workspaceVisibility`).

---

## 3. Commercial Coverage Matrix

| Component | Create | Details | Marketplace | Negotiation | Agreement | Export |
|-----------|--------|---------|-------------|-------------|-----------|--------|
| Cash | Full builder | Full + Payment section | Types / hybrid only | Existing negotiation adapter | Existing agreement adapter | Owner+ amounts |
| Barter | Full builder | Full fields when present | Types only | Existing adapter | Existing adapter | Owner+ |
| Profit Sharing | Full builder | Full fields when present | Types only | Existing adapter | Existing adapter | Owner+ |
| Revenue Sharing | Full builder | Full fields when present | Types only | Existing adapter | Existing adapter | Owner+ |
| Equity | Full builder | Supported equity fields | Types only | Existing adapter | Existing adapter | Owner+ |
| Custom | Full builder | Supported custom fields | Types only | Existing adapter | Existing adapter | Owner+ |
| Hybrid | Multi-component | Structure summary + components | Hybrid label + types | Existing adapter | Existing adapter | Owner+ |
| Allocation | percentage/fixed/mixed/n/a | Textual / segmented summary | Hidden amounts | Via structure | Via structure | Owner+ |
| Constraints | Yes | Listed with blocking/negotiable when present | Hidden | Existing | Existing | Owner+ |

Negotiation / Agreement columns mean **handoff consistency via existing adapters** — modules are not redesigned.
