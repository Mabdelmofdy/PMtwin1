# Data models

### What this page is

BRD **entity shapes** (user, company, opportunity, and more) at the specification level.

### Why it matters

Aligns business language with `/docs/data-model.md` implementation reference.

### What you can do here

- Copy field names into API or UI tickets.
- Diff against live `data-model` when requirements change.

### What happens next

Engineers map BRD fields to storage or SQL tables.

---

## User model

### Base User
```javascript
{
  id: string,                    // Unique identifier
  email: string,                  // Email address (unique)
  passwordHash: string,           // Encoded password
  role: string,                   // Role ID (see CONFIG.ROLES)
  status: string,                 // 'pending' | 'active' | 'suspended' | 'rejected'
  profile: object,                // Profile data (varies by role)
  createdAt: string,              // ISO timestamp
  updatedAt: string               // ISO timestamp
}
```

### Company Profile
```javascript
profile: {
  type: 'company',
  name: string,                   // Company name
  crNumber: string,               // Commercial Registration Number
  classifications: string[],      // Industry classifications
  financialCapacity: number,      // Financial capacity in SAR
  experience: object             // Experience details (optional)
}
```

### Professional Profile
```javascript
profile: {
  type: 'professional',
  name: string,                   // Full name
  specializations: string[],      // Areas of specialization
  certifications: string[],       // Certifications
  yearsExperience: number         // Years of experience
}
```

---

## Opportunity Model

```javascript
{
  id: string,                     // Unique identifier
  title: string,                  // Opportunity title
  description: string,           // Brief description
  modelType: string,             // Model key (see CONFIG.MODELS)
  subModelType: string,          // Sub-model key (see CONFIG.SUB_MODELS)
  creatorId: string,             // User ID of creator
  status: string,                // 'draft' | 'published' | 'closed' | 'cancelled'
  attributes: object,             // Model-specific attributes
  createdAt: string,             // ISO timestamp
  updatedAt: string              // ISO timestamp
}
```

### Model-Specific Attributes

Each sub-model has its own attribute structure. See `opportunity-models.js` for complete definitions.

**Example - Task-Based Engagement:**
```javascript
attributes: {
  taskTitle: string,
  taskType: string,
  detailedScope: string,
  duration: number,
  budgetRange: { min: number, max: number },
  requiredSkills: string[],
  experienceLevel: string,
  locationRequirement: string,
  startDate: string,
  deliverableFormat: string,
  paymentTerms: string,
  exchangeType: string,
  barterOffer: string (optional)
}
```

---

## Application Model

```javascript
{
  id: string,                     // Unique identifier
  opportunityId: string,         // Opportunity ID
  applicantId: string,           // User ID of applicant
  proposal: string,              // Application proposal/statement
  status: string,                // 'pending' | 'reviewing' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn'
  createdAt: string,             // ISO timestamp
  updatedAt: string              // ISO timestamp
}
```

---

## Match Model

```javascript
{
  id: string,                     // Unique identifier
  opportunityId: string,         // Opportunity ID
  candidateId: string,           // User ID of candidate
  matchScore: number,            // Score between 0 and 1
  criteria: object,               // Match criteria breakdown
  notified: boolean,             // Whether user was notified
  createdAt: string              // ISO timestamp
}
```

### Match Criteria
```javascript
criteria: {
  modelType: string,
  subModelType: string,
  matchedAt: string
}
```

---

## Notification Model

```javascript
{
  id: string,                     // Unique identifier
  userId: string,                 // User ID
  type: string,                   // Notification type
  title: string,                  // Notification title
  message: string,                // Notification message
  read: boolean,                  // Read status
  createdAt: string              // ISO timestamp
}
```

### Notification Types
- `match_found`: New match found
- `application_received`: New application received
- `application_status_changed`: Application status updated
- `account_approved`: Account approved
- `account_rejected`: Account rejected
- `account_suspended`: Account suspended
- `account_activated`: Account activated

---

## AuditLog Model

```javascript
{
  id: string,                     // Unique identifier
  userId: string,                 // User ID who performed action
  action: string,                 // Action performed
  entityType: string,             // Entity type ('user', 'opportunity', 'application', etc.)
  entityId: string,               // Entity ID (optional)
  timestamp: string,              // ISO timestamp
  details: object                  // Additional details
}
```

### Common Actions
- `user_registered`
- `user_logged_in`
- `user_logged_out`
- `user_approved`
- `user_rejected`
- `user_suspended`
- `user_activated`
- `opportunity_created`
- `opportunity_updated`
- `opportunity_deleted`
- `opportunity_closed`
- `application_submitted`
- `application_status_changed`

---

## Session Model

```javascript
{
  userId: string,                 // User ID
  token: string,                  // Session token
  createdAt: string,              // ISO timestamp
  expiresAt: string               // ISO timestamp
}
```

---

## SystemSettings Model

```javascript
{
  key: string,                    // Setting key
  value: any,                     // Setting value
  category: string                // Setting category
}
```

### Settings Keys
- `matchingThreshold`: Minimum match score (0-1)
- `autoNotifyThreshold`: Auto-notify threshold (0-1)
- `sessionDuration`: Session duration in milliseconds

---

## Storage Schema (localStorage)

### Keys
- `pmtwin_users`: Array of User objects
- `pmtwin_sessions`: Array of Session objects
- `pmtwin_opportunities`: Array of Opportunity objects
- `pmtwin_applications`: Array of Application objects
- `pmtwin_matches`: Array of Match objects
- `pmtwin_audit`: Array of AuditLog objects
- `pmtwin_notifications`: Array of Notification objects
- `pmtwin_system_settings`: Object with system settings

---

## Relationships

### User → Opportunities
- One-to-Many: One user can create many opportunities
- Foreign Key: `opportunity.creatorId` → `user.id`

### User → Applications
- One-to-Many: One user can submit many applications
- Foreign Key: `application.applicantId` → `user.id`

### Opportunity → Applications
- One-to-Many: One opportunity can have many applications
- Foreign Key: `application.opportunityId` → `opportunity.id`

### Opportunity → Matches
- One-to-Many: One opportunity can have many matches
- Foreign Key: `match.opportunityId` → `opportunity.id`

### User → Matches
- One-to-Many: One user can have many matches
- Foreign Key: `match.candidateId` → `user.id`

### User → Notifications
- One-to-Many: One user can have many notifications
- Foreign Key: `notification.userId` → `user.id`

### User → AuditLogs
- One-to-Many: One user can generate many audit logs
- Foreign Key: `auditLog.userId` → `user.id`

---

## Data Validation Rules

### User
- Email: Required, valid email format, unique
- Password: Required, minimum 6 characters
- Role: Required, must be valid role ID
- Status: Required, must be valid status

### Opportunity
- Title: Required, max 150 characters
- ModelType: Required, must be valid model key
- SubModelType: Required, must be valid sub-model key
- CreatorId: Required, must exist in users
- Status: Required, must be valid status
- Attributes: Required, must match model requirements

### Application
- OpportunityId: Required, must exist in opportunities
- ApplicantId: Required, must exist in users
- Proposal: Required, min 10 characters
- Status: Required, must be valid status

### Match
- OpportunityId: Required, must exist in opportunities
- CandidateId: Required, must exist in users
- MatchScore: Required, between 0 and 1
- Notified: Required, boolean

---

## Indexes (Future Database)

### Users
- Primary: `id`
- Unique: `email`
- Index: `status`, `role`

### Opportunities
- Primary: `id`
- Index: `creatorId`, `status`, `modelType`, `subModelType`, `createdAt`

### Applications
- Primary: `id`
- Index: `opportunityId`, `applicantId`, `status`, `createdAt`
- Unique: `(opportunityId, applicantId)` - prevent duplicate applications

### Matches
- Primary: `id`
- Index: `opportunityId`, `candidateId`, `matchScore`, `notified`

### Notifications
- Primary: `id`
- Index: `userId`, `read`, `createdAt`

### AuditLogs
- Primary: `id`
- Index: `userId`, `action`, `entityType`, `timestamp`

---

## Data Migration (Future)

When migrating from localStorage to database:
1. Export all localStorage data
2. Transform to database schema
3. Import into database
4. Verify data integrity
5. Update application to use API
