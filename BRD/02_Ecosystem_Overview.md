# PMTwin ecosystem overview

### What this page is

High-level **portals**, actors, and how they connect in the PMTwin ecosystem.

### Why it matters

Readers see where public, user, and admin experiences sit before reading detailed specs.

### What you can do here

- Map **portal structure** to your role.
- Cross-check with [docs/overview.md](../docs/overview.md).

### What happens next

Open [03_Portal_Specifications.md](03_Portal_Specifications.md) for screen-level detail.

---

## Platform architecture

PMTwin operates as a multi-portal platform serving different user segments:

### Portal Structure

1. **Public Portal**
   - Marketing and discovery
   - Guest browsing (limited)
   - Registration and login
   - Knowledge base

2. **User Portal**
   - Core functionality
   - Opportunity management
   - Application workflow
   - Profile management
   - Pipeline tracking

3. **Admin Portal**
   - Governance
   - User management
   - Content moderation
   - Analytics
   - System settings

4. **Mobile/Field Portal** (Future)
   - Mobile access
   - Field operations
   - On-the-go management

## User Roles & Permissions

### Company Roles
- **Company Owner**: Full account control
- **Company Admin**: Team and opportunity management
- **Company Member**: View and apply to opportunities

### Professional Roles
- **Independent Professional**: Full individual access
- **Consultant**: Expert advisory services

### Admin Roles
- **Platform Admin**: Full system access
- **Moderator**: Content review and user support
- **Auditor**: Read-only audit access

## Collaboration Models

### Model 1: Project-Based Collaboration
Temporary partnerships for specific projects:
- **Task-Based Engagement**: Short-term tasks and deliverables
- **Consortium**: Temporary alliance for large tenders
- **Project-Specific JV**: Formal joint venture for single project
- **SPV**: Mega-project financing structure (50M+ SAR)

### Model 2: Strategic Partnerships
Long-term business relationships:
- **Strategic JV**: Multi-project joint venture
- **Strategic Alliance**: Preferred supplier, tech licensing
- **Mentorship**: Knowledge transfer relationships

### Model 3: Resource Pooling & Sharing
Resource optimization:
- **Bulk Purchasing**: Group buying for discounts
- **Equipment Sharing**: Co-ownership or rental
- **Resource Exchange**: Barter and sharing

### Model 4: Hiring a Resource
Talent acquisition:
- **Professional Hiring**: Employment opportunities
- **Consultant Hiring**: Advisory services

### Model 5: Call for Competition
Open competitions:
- **Competition/RFP**: Design competitions, RFPs, RFQs

## Key Workflows

### User Onboarding
1. Registration (Company/Professional)
2. Profile completion
3. Document upload (optional)
4. Admin review
5. Approval/Rejection
6. Full access granted

### Opportunity Flow
1. Create opportunity (select model/sub-model)
2. Fill model-specific attributes
3. Publish or save as draft
4. Matching engine runs automatically
5. Candidates notified (if above threshold)
6. Applications received
7. Review and decision
8. Award/Reject

### Application Flow
1. Browse opportunities
2. View match score
3. Submit application/proposal
4. Status tracking (pending → reviewing → shortlisted → accepted/rejected)
5. Notification updates

## Matching Algorithm

### Scoring Factors
- Skills and qualifications match
- Experience level alignment
- Financial capacity (for relevant models)
- Geographic proximity
- Past performance
- Availability

### Thresholds
- **Minimum Match**: 70% (shown in recommendations)
- **Auto-Notify**: 80% (automatic notification)

### Model-Specific Weights
Each collaboration model has customized scoring weights:
- Task-Based: Skills (40%), Experience (20%), Budget (20%), Location (10%), Availability (10%)
- Consortium/JV: Scope match (30%), Financial capacity (30%), Experience (20%), Geography (20%)
- SPV: Financial capacity (50%), Sector expertise (30%), Experience (20%)
- Hiring: Qualifications (30%), Experience (30%), Skills (30%), Location (10%)
- And more...

## Data Flow

```
User Action → Service Layer → Data Service → Storage (localStorage/DB)
                ↓
         Matching Engine (if applicable)
                ↓
         Notification Service
                ↓
         Audit Logging
```

## Integration Points (Future)

- Payment gateways
- Document management systems
- Email/SMS services
- Government registries (CR verification)
- Certification databases
- Project management tools

## Security & Compliance

### POC Phase
- Basic authentication
- Role-based access control
- Session management
- Audit logging

### Production Phase
- Enhanced encryption
- Two-factor authentication
- GDPR compliance
- Data protection measures
- Regular security audits
