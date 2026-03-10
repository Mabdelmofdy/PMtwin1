# Profile Page Redesign – Structure & Data Model

## Design principles
- **No duplicated data**: Each field appears in exactly one section.
- **Per-section edit**: Each section has an "Edit [Section]" button.
- **User-type aware**: Company, Professional, and Consultant/SME see relevant sections only.

---

## 1. Account Settings (all users)
| Field | Source | Notes |
|-------|--------|--------|
| Email | `user.email` | Read-only |
| Role | `user.role` | Display label |
| Account Status | `user.status` | Active, Pending, etc. |
| Verification Status | `user.profile.verificationStatus` | Badge |
| **Actions** | | |
| Change Password | — | Link/button (Settings or modal) |
| Delete Account | — | Link/button (confirmation) |

---

## 2. Basic Profile (all users with profile)
| Field | Source | Notes |
|-------|--------|--------|
| Full Name | `profile.name` | |
| Headline | `profile.headline` | |
| Title | `profile.title` | |
| Location | `profile.location` | |
| Bio | `profile.bio` | |
| Languages | `profile.languages` | |
| Profile Photo | `profile.photoUrl` or placeholder | |

**Edit**: Edit Basic Profile → opens Basic Profile form block.

---

## 3a. Skills (Professional / Consultant only)
| Field | Source |
|-------|--------|
| Skills | `profile.skills` — **only here** (tags) |

**Empty state**: "No skills added yet" + Add Skills button. **Edit**: Edit → opens professional form (skills block).

---

## 3b. Certifications (Professional / Consultant only)
| Field | Source |
|-------|--------|
| Certifications | `profile.certifications` — **only here** |

**Empty state**: "No certifications added" + Add Certification button. **Edit**: Edit → opens professional form (certifications block).

---

## 3c. Experience (Professional / Consultant only)
| Field | Source |
|-------|--------|
| Experience entries | `profile.experienceEntries` — array of `{ role, company, startDate, endDate }` (endDate may be `"Present"`) |

**Empty state**: "No experience entries yet" + Add Experience button. **Edit**: Edit → opens professional form (experience block).

---

## 3d. Professional details (Professional / Consultant only)
**Single place for**: Years of experience, Primary domain, Specialization, Education, Availability, Work mode, Rate, Collaboration & Payment preferences, Expertise areas, Professional fields.

| Field | Source |
|-------|--------|
| Years of Experience | `profile.yearsExperience` |
| Primary Domain | `profile.primaryDomain` |
| Specialization | `profile.specializations` |
| Education | `profile.education` |
| Availability | `profile.availability` |
| Preferred Work Mode | `profile.preferredWorkMode` |
| Hourly Rate | `profile.hourlyRate` |
| Preferred Collaboration Models | `profile.preferredCollaborationModels` |
| Preferred Payment Modes | `profile.preferredPaymentModes` |
| Expertise areas | `profile.expertiseAreas` |
| Professional fields | `profile.professionalFields` |

**Edit**: Edit → opens professional form (preferences block).

---

## 4. Company Profile (Company users only)
| Field | Source |
|-------|--------|
| Company Name | `profile.name` |
| Company Size | `profile.employeeCount` |
| Industry | `profile.sectors` / `profile.industry` |
| Services Offered | `profile.services` |
| Office Locations | `profile.location` / `profile.address` |
| Major Projects | `profile.caseStudies` (company) |
| Capabilities / Equipment | `profile.classifications`, capabilities |
| Company Certifications | `profile.certifications` |

**Edit**: Edit Company Profile → opens Company Profile form.

---

## 5. Portfolio (single place for projects/case studies)
| Field | Source |
|-------|--------|
| Projects | `profile.portfolio` |
| Case Studies | `profile.caseStudies` |
| Attachments / Images | `profile.portfolio[].mediaAttachments` |

**No skills or certifications here.**

**Edit**: Edit Portfolio → opens Portfolio/Case studies form block.

---

## 6. References & Reviews
| Field | Source |
|-------|--------|
| Testimonials | `profile.references` |
| References | `profile.references` |
| Ratings | Reputation score (sidebar or here) |
| Completed Collaborations | Stats / contract history |

**Edit**: Edit References → opens References form block.

---

## 7. Matching Preferences
| Field | Source |
|-------|--------|
| Minimum Match Score | `profile.matchingPreferences.minScore` |
| Preferred Industries | Future / `profile.sectors` |
| Preferred Collaboration Models | In Professional or here for matching only |
| Preferred Payment Methods | In Professional or here |
| Preferred Locations | Future |

**Edit**: Edit Preferences → focuses Matching preferences card / form.

---

## 8. Security
| Field | Notes |
|-------|--------|
| Change Password | Link to settings or modal |
| Two Factor Authentication | Placeholder / settings |
| Login Sessions | Placeholder / list of sessions |

**Edit**: Edit Security → opens Security settings (or link to Settings page).

---

## UX: Edit buttons
- **Account Settings**: Change Password, Delete Account (no "Edit" for read-only account info).
- **Basic Profile**: "Edit Basic Profile"
- **Professional Information**: "Edit Professional Information"
- **Company Profile**: "Edit Company Profile"
- **Portfolio**: "Edit Portfolio"
- **References & Reviews**: "Edit References"
- **Matching Preferences**: "Edit Preferences" (or "Review preferences")
- **Security**: "Edit Security" or "Change Password" / "Manage sessions"
