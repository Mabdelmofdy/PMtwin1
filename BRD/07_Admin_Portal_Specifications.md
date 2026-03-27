# Admin portal specifications

### What this page is

BRD for the **admin portal**: governance, moderation, analytics, and access rules.

### Why it matters

Admin UX and permissions should match business intent before build.

### What you can do here

- Read **Overview** then each functional area.
- Pair with [docs/admin-user-journey.md](../docs/admin-user-journey.md).

### What happens next

Route-level detail: [docs/admin-portal.md](../docs/admin-portal.md).

---

## Overview

The admin portal provides governance, moderation, and analytics tools for platform administrators, moderators, and auditors.

## Access Control

### Roles
- **Platform Admin**: Full system access
- **Moderator**: User management, content moderation, limited settings
- **Auditor**: Read-only access to audit trails and reports

### Authentication
- Same authentication system as user portal
- Role-based feature access
- Session management

---

## Admin Dashboard

### Purpose
Central hub for platform overview and quick actions.

### Key Metrics Display
- **Total Users**: Count of all registered users
- **Pending Approval**: Users awaiting admin approval
- **Total Opportunities**: Count of all opportunities
- **Total Applications**: Count of all applications

### Recent Activity Feed
- Last 10 system activities
- User actions
- System events
- Timestamps
- Quick links to related entities

### Pending Approvals Widget
- List of users pending approval
- Quick approve/reject actions
- User details preview
- Link to full user management

### Quick Actions
- Navigate to user management
- Navigate to opportunity moderation
- View audit trail
- Access system settings

---

## User Management

### User List View
- Display all users
- Pagination (future)
- Sorting options
- Filter options:
  - Status (pending, active, suspended, rejected)
  - Role (all roles)
  - Search by email/name

### User Actions
- **Approve**: Change status from pending to active
- **Reject**: Change status to rejected, send notification
- **Suspend**: Temporarily disable account
- **Activate**: Reactivate suspended account
- **View Details**: Full user profile view
- **Edit**: Modify user information (future)

### User Detail View
- Full profile information
- Registration date
- Last login (future)
- Activity history
- Opportunities created
- Applications submitted
- Related audit logs

### Bulk Actions (Future)
- Bulk approve/reject
- Bulk suspend/activate
- Export user list

---

## Opportunity Moderation

### Opportunity List View
- Display all opportunities
- Filter options:
  - Status (draft, published, closed)
  - Model type
  - Search by title/description
- Sort by date, status, model type

### Moderation Actions
- **View**: Full opportunity details
- **Close**: Change status to closed
- **Delete**: Permanently remove opportunity
- **Edit**: Modify opportunity (future)
- **Flag**: Mark for review (future)

### Moderation Workflow
1. Review opportunity content
2. Check for inappropriate content
3. Verify compliance with platform rules
4. Take appropriate action
5. Log moderation action

### Reporting (Future)
- Flagged opportunities
- User reports
- Automated content detection

---

## Content Moderation

### Features (Future)
- Review flagged content
- User-generated content review
- Image/video moderation
- Text content filtering
- Automated moderation rules

### Moderation Queue
- Prioritized list of items to review
- Filter by type, severity
- Assign to moderators
- Track resolution status

---

## Audit Trail

### Audit Log View
- Chronological list of all system activities
- Detailed information for each action
- User information
- Entity details
- Timestamps

### Filtering Options
- **User**: Filter by specific user
- **Action**: Filter by action type
- **Entity Type**: Filter by entity (user, opportunity, application)
- **Date Range**: Filter by time period
- **Search**: Search in details

### Audit Log Details
- Action performed
- User who performed action
- Entity affected
- Timestamp
- Additional details (JSON)
- IP address (future)

### Export (Future)
- Export to CSV
- Export to PDF
- Scheduled reports
- Custom date ranges

---

## Reports & Analytics

### User Analytics
- User growth over time
- Registration trends
- User activity metrics
- Role distribution
- Status distribution

### Opportunity Analytics
- Opportunities created over time
- Model type distribution
- Status distribution
- Average applications per opportunity
- Popular collaboration models

### Application Analytics
- Application submission trends
- Acceptance rates
- Average time to decision
- Status distribution

### Matching Analytics
- Match success rates
- Average match scores
- Model-specific match rates
- Conversion rates (match → application)

### Engagement Metrics
- Daily/monthly active users
- Session duration
- Page views
- Feature usage

### Visualizations (Future)
- Charts and graphs
- Trend analysis
- Comparative reports
- Custom dashboards

---

## System Settings

### Matching Configuration
- **Minimum Threshold**: Minimum match score (0-100%)
- **Auto-Notify Threshold**: Auto-notification threshold (0-100%)
- Save and apply immediately

### Session Management
- **Session Duration**: Hours before session expires
- **Max Sessions**: Maximum concurrent sessions per user (future)

### Notification Settings
- Enable/disable notification types
- Notification templates
- Email settings (future)

### Platform Configuration
- Platform name and branding
- Maintenance mode toggle
- Feature flags
- System announcements

### Security Settings (Future)
- Password policies
- Two-factor authentication
- IP whitelisting
- Rate limiting

---

## User Vetting Workflow

### Registration Review
1. New user registers
2. Account status: Pending
3. Admin receives notification
4. Admin reviews:
   - Email verification
   - Profile completeness
   - Document uploads (future)
   - Compliance check
5. Decision:
   - **Approve**: Status → Active, notification sent
   - **Reject**: Status → Rejected, notification with reason
   - **Request Info**: Status → Pending, notification requesting additional info

### Verification Levels (Future)
- Basic: Email verified
- Standard: Profile complete
- Verified: Documents verified
- Premium: Background check

---

## Moderation Workflow

### Content Review
1. Content flagged (automated or user report)
2. Added to moderation queue
3. Moderator reviews
4. Decision:
   - **Approve**: Content remains
   - **Remove**: Content deleted, user notified
   - **Warn**: Warning sent to user
   - **Suspend**: User account suspended

### Escalation
- Complex cases escalated to admin
- Appeal process (future)
- Dispute resolution (future)

---

## Audit & Compliance

### Audit Logging
- All admin actions logged
- User actions logged
- System events logged
- Immutable logs (future)

### Compliance Features
- Data retention policies
- Privacy compliance
- GDPR compliance (future)
- Data export (future)

### Reporting
- Compliance reports
- Activity summaries
- Security audits
- Performance reports

---

## Performance Monitoring

### System Health
- Storage usage
- Performance metrics
- Error rates
- Uptime monitoring

### User Activity
- Active users
- Peak usage times
- Feature usage
- Error tracking

---

## Future Enhancements

### Advanced Features
- AI-powered content moderation
- Automated user verification
- Advanced analytics dashboard
- Custom report builder
- Bulk operations
- API for admin operations
- Mobile admin app
- Real-time notifications
- Workflow automation
- Integration with third-party tools

### Security Enhancements
- Two-factor authentication for admins
- IP-based access control
- Role-based permissions matrix
- Audit log retention policies
- Data encryption
- Secure file uploads

---

## Admin Portal Navigation

### Main Menu
- Dashboard
- Users
- Opportunities
- Content Moderation (future)
- Audit Trail
- Reports & Analytics
- Settings
- Help & Support

### Quick Actions
- Pending Approvals
- Recent Activity
- System Alerts
- Quick Search

---

## Responsive Design

- Desktop: Full feature set
- Tablet: Optimized layout
- Mobile: Essential features, simplified navigation

---

## Access Logging

All admin portal access is logged:
- Login/logout events
- Page views
- Actions performed
- Time spent
- IP address (future)
