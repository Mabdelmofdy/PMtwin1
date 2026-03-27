# Portal specifications

### What this page is

BRD-level description of **portal** behavior and requirements (public, user, admin).

### Why it matters

UX and engineering align on scope before component design.

### What you can do here

- Trace each portal’s responsibilities.
- Link features back to business goals.

### What happens next

Use [04_User_Flows.md](04_User_Flows.md) for journey detail.

---

## Portal 1: Public Portal

### Purpose
Marketing, discovery, and onboarding for unregistered visitors and potential users.

### Target Audience
- Unregistered visitors
- Potential users exploring the platform
- Companies and professionals considering registration

### Key Features

#### 1. Landing Page
- Platform overview and value proposition
- Collaboration model highlights
- Success stories/testimonials (future)
- Call-to-action buttons (Register/Login)
- Navigation to key sections

#### 2. Opportunity Discovery (Limited)
- Browse published opportunities (limited details)
- Filter by model type
- View opportunity count
- Requires login to see full details and apply

#### 3. AI Collaboration Wizard
- Guided questionnaire
- Helps users identify suitable collaboration model
- Recommendations based on answers
- Educational content about each model

#### 4. Knowledge Base
- Collaboration model guides
- SPV guides and resources
- Best practices
- FAQ section
- How-to articles

#### 5. Registration Flow
- Account type selection (Company/Professional)
- Basic information collection
- Email verification (future)
- Profile completion prompt
- Admin approval notification

#### 6. Login Functionality
- Email/password authentication
- Password reset (future)
- Remember me option
- Redirect to dashboard after login

### Access Control
- Public access (no authentication required)
- Limited functionality
- Full features require registration and approval

---

## Portal 2: User Portal

### Purpose
Core functionality, operations, and collaboration for registered users.

### Target Audience
- Registered companies
- Registered professionals
- Active platform users

### Key Features

#### 1. Role-Adaptive Dashboard
**Company View:**
- Opportunities created
- Applications received
- Pipeline status
- Team activity (future)

**Professional View:**
- Applications submitted
- Matches received
- Recommendations
- Profile completeness

#### 2. Opportunity Management
- Create opportunities (all 5 models + 13 sub-models)
- Dynamic form generation based on model selection
- Edit and delete own opportunities
- Status management (draft → published → closed)
- View applications received

#### 3. Opportunity Browsing
- Advanced filters (model, status, search)
- Grid/list view
- Sort options
- Match score display
- Quick apply option

#### 4. Opportunity Detail View
- Full opportunity information
- Model-specific attributes
- Creator information
- Application form (if applicable)
- Application list (for creators)

#### 5. Application Workflow
- Submit applications/proposals
- Track application status
- Receive notifications
- View application history

#### 6. Matching & Recommendations
- View match scores
- Receive match notifications
- Browse recommended opportunities
- Match criteria breakdown

#### 7. Pipeline Management (Kanban)
- Visual status tracking
- Drag-and-drop (future)
- Filter by status
- Quick actions

#### 8. Profile Management
- Company profile (CR number, classifications, capacity)
- Professional profile (skills, certifications, experience)
- Profile completeness indicator
- Edit and update

#### 9. Company Team Management (Future)
- Add team members
- Assign roles
- Manage permissions

#### 10. Notifications Center
- Real-time notifications
- Mark as read
- Filter by type
- Notification preferences

#### 11. Messaging/Communication (Future)
- Direct messaging
- Opportunity-related chat
- File sharing

### Access Control
- Requires authentication
- Role-based feature access
- Company members have limited permissions

---

## Portal 3: Admin Portal

### Purpose
Platform governance, moderation, analytics, and system management.

### Target Audience
- Platform administrators
- Moderators
- Auditors

### Key Features

#### 1. Admin Dashboard
- Key metrics (users, opportunities, applications)
- Recent activity feed
- Pending approvals
- Quick actions

#### 2. User Management
- View all users
- Filter by status, role, search
- Approve/reject registrations
- Suspend/activate accounts
- View user details
- Edit user information

#### 3. Opportunity Moderation
- View all opportunities
- Filter and search
- Close inappropriate opportunities
- Delete opportunities
- View opportunity details

#### 4. Content Moderation
- Review flagged content (future)
- Moderate user-generated content
- Handle reports

#### 5. Audit Trail
- View all system activities
- Filter by user, action, date range
- Export logs (future)
- Search functionality

#### 6. Reports & Analytics
- User growth metrics
- Opportunity statistics
- Application rates
- Match success rates
- Platform engagement metrics

#### 7. System Settings
- Matching thresholds
- Session duration
- Notification settings
- Platform configuration

### Access Control
- Admin role required
- Granular permissions:
  - Admin: Full access
  - Moderator: User management, moderation
  - Auditor: Read-only audit access

---

## Portal 4: Mobile/Field Portal (Future)

### Purpose
Mobile access and field operations support.

### Target Audience
- Field workers
- Mobile users
- On-the-go professionals

### Key Features (Planned)
- Responsive design (already implemented)
- Mobile-optimized workflows
- Offline capability (future)
- Push notifications
- Quick actions
- Camera integration for document upload

### Access Control
- Same authentication as web portal
- Responsive design for all portals

---

## Navigation Structure

### Public Navigation
- Home
- Browse Opportunities
- Collaboration Models
- Knowledge Base
- Login
- Register

### User Navigation
- Dashboard
- Opportunities (Browse/Create)
- Pipeline
- Profile
- Notifications
- Logout

### Admin Navigation
- Admin Dashboard
- Users
- Opportunities
- Audit Trail
- Settings
- Logout

---

## Responsive Design

All portals are designed to be responsive:
- Desktop: Full feature set
- Tablet: Optimized layout
- Mobile: Simplified navigation, touch-friendly

---

## Future Enhancements

- Advanced search with AI
- Real-time notifications
- Video calls integration
- Document management
- Payment processing
- Escrow services
- Rating and review system
- Advanced analytics dashboard
- API for third-party integrations
