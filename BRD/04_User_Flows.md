# User flows

### What this page is

BRD **flow diagrams** for registration, opportunities, matching, deals, and admin—at business level.

### Why it matters

QA and product use the same diagrams for test plans and demos.

### What you can do here

- Walk flows top to bottom.
- Compare with [docs/journeys/user-journey.md](../docs/journeys/user-journey.md).

### What happens next

Implement against [docs/implementation-status.md](../docs/implementation-status.md).

---

## Flow 1: User registration and onboarding

```
Start
  ↓
Landing Page
  ↓
Click "Register"
  ↓
Select Account Type (Company/Professional)
  ↓
Fill Registration Form
  ├─ Email
  ├─ Password
  ├─ Account-specific fields
  └─ Terms acceptance
  ↓
Submit Registration
  ↓
Account Created (Status: Pending)
  ↓
Admin Notification Sent
  ↓
Admin Reviews Account
  ├─ Approve → Status: Active
  │   ↓
  │   User Notification: "Account Approved"
  │   ↓
  │   Full Access Granted
  │
  └─ Reject → Status: Rejected
      ↓
      User Notification: "Account Rejected"
      ↓
      End (User can re-register)
```

## Flow 2: Opportunity Creation

```
Start (Logged-in User)
  ↓
Navigate to "Create Opportunity"
  ↓
Select Collaboration Model
  ├─ Project-Based
  ├─ Strategic Partnership
  ├─ Resource Pooling
  ├─ Hiring
  └─ Competition
  ↓
Select Sub-Model
  ↓
Dynamic Form Loads (Model-Specific Fields)
  ↓
Fill Basic Information
  ├─ Title
  ├─ Description
  └─ Status (Draft/Published)
  ↓
Fill Model-Specific Attributes
  ↓
Validate Form
  ├─ Valid → Submit
  │   ↓
  │   Opportunity Created
  │   ↓
  │   If Published:
  │   ├─ Matching Engine Runs
  │   ├─ Matches Found
  │   ├─ Notifications Sent (if above threshold)
  │   └─ Opportunity Visible in Browse
  │
  └─ Invalid → Show Errors
      ↓
      User Corrects Errors
      ↓
      Resubmit
```

## Flow 3: Application Submission

```
Start (Logged-in User)
  ↓
Browse Opportunities
  ↓
View Opportunity Details
  ├─ See Match Score (if applicable)
  ├─ Read Full Description
  └─ Review Requirements
  ↓
Click "Apply"
  ↓
Fill Application Form
  ├─ Proposal/Statement
  └─ Additional Information (if required)
  ↓
Submit Application
  ↓
Application Created (Status: Pending)
  ↓
Notifications Sent:
  ├─ Applicant: "Application Submitted"
  └─ Opportunity Creator: "New Application Received"
  ↓
Creator Reviews Application
  ├─ Accept → Status: Accepted
  │   ↓
  │   Notifications Sent
  │   ↓
  │   Further Communication (Future)
  │
  ├─ Reject → Status: Rejected
  │   ↓
  │   Notification Sent to Applicant
  │
  └─ Shortlist → Status: Shortlisted
      ↓
      Notification Sent
      ↓
      Further Review
```

## Flow 4: Matching Process

```
Opportunity Published
  ↓
Matching Engine Triggered
  ↓
For Each Active User:
  ├─ Calculate Match Score
  │   ├─ Skills Match
  │   ├─ Experience Match
  │   ├─ Financial Capacity
  │   ├─ Geographic Proximity
  │   └─ Past Performance
  │
  └─ If Score >= Threshold:
      ├─ Create Match Record
      ├─ If Score >= Auto-Notify Threshold:
      │   └─ Send Notification
      └─ Add to Recommendations
  ↓
Matches Stored
  ↓
User Views Recommendations
  ↓
User Applies (if interested)
```

## Flow 5: Pipeline Management

```
User Opens Pipeline
  ↓
Select Tab:
  ├─ My Opportunities
  │   ├─ Draft
  │   ├─ Published
  │   ├─ In Progress (has applications)
  │   └─ Closed
  │
  ├─ My Applications
  │   ├─ Pending
  │   ├─ Reviewing
  │   ├─ Shortlisted
  │   ├─ Accepted
  │   └─ Rejected
  │
  └─ Matches
      └─ Recommended Opportunities
  ↓
View Items in Each Column
  ↓
Click Item → View Details
  ↓
Take Action (if applicable)
```

## Flow 6: Admin User Approval

```
New User Registers
  ↓
Account Status: Pending
  ↓
Admin Dashboard Shows Pending User
  ↓
Admin Reviews User:
  ├─ View Registration Details
  ├─ Check Profile Information
  └─ Verify Documents (if uploaded)
  ↓
Admin Decision:
  ├─ Approve
  │   ↓
  │   Update Status: Active
  │   ↓
  │   Notification Sent to User
  │   ↓
  │   User Can Login
  │
  └─ Reject
      ↓
      Update Status: Rejected
      ↓
      Notification Sent (with reason)
      ↓
      User Cannot Login
```

## Flow 7: Profile Management

```
User Navigates to Profile
  ↓
View Current Profile Information
  ↓
Edit Profile:
  ├─ Company Profile:
  │   ├─ Company Name
  │   ├─ CR Number
  │   ├─ Classifications
  │   └─ Financial Capacity
  │
  └─ Professional Profile:
      ├─ Full Name
      ├─ Specializations
      ├─ Certifications
      └─ Years of Experience
  ↓
Save Changes
  ↓
Profile Updated
  ↓
Matching Scores Recalculated (if applicable)
```

## Flow 8: Opportunity Search & Filter

```
User Navigates to Opportunities
  ↓
View All Opportunities (or filtered)
  ↓
Apply Filters:
  ├─ Model Type
  ├─ Status
  ├─ Search Text
  └─ Date Range (future)
  ↓
Results Filtered
  ↓
User Views Opportunity Card:
  ├─ Title
  ├─ Model Type
  ├─ Status Badge
  ├─ Description Preview
  └─ Action Button (View/Apply)
  ↓
Click Card → View Details
```

## Flow 9: Notification Management

```
User Receives Notification
  ├─ Match Found
  ├─ Application Status Changed
  ├─ New Application (for creators)
  ├─ Account Approved
  └─ System Announcement
  ↓
Notification Appears in:
  ├─ Notification Center
  ├─ Dashboard Badge
  └─ Email (future)
  ↓
User Views Notification
  ↓
Click Notification:
  ├─ Navigate to Related Page
  └─ Mark as Read
  ↓
Notification Marked as Read
```

## Flow 10: Admin Audit Review

```
Admin Navigates to Audit Trail
  ↓
View All Audit Logs
  ↓
Apply Filters:
  ├─ User
  ├─ Action Type
  ├─ Date Range
  └─ Entity Type
  ↓
Filtered Results Displayed
  ↓
Review Log Details:
  ├─ User Information
  ├─ Action Performed
  ├─ Timestamp
  └─ Additional Details
  ↓
Export Logs (future)
```

---

## Error Handling Flows

### Invalid Login
```
User Enters Credentials
  ↓
Validation Fails
  ↓
Error Message Displayed
  ↓
User Retries or Resets Password
```

### Form Validation Error
```
User Submits Form
  ↓
Validation Checks:
  ├─ Required Fields
  ├─ Format Validation
  └─ Business Rules
  ↓
If Invalid:
  ├─ Show Field Errors
  └─ Prevent Submission
  ↓
User Corrects Errors
  ↓
Resubmit
```

### Session Expired
```
User Action Requires Auth
  ↓
Session Check
  ↓
If Expired:
  ├─ Redirect to Login
  └─ Show Message: "Session Expired"
  ↓
User Logs In Again
  ↓
Redirect to Original Page
```

---

## Edge Cases

1. **User tries to apply to own opportunity**: Prevented, show message
2. **User applies twice**: Prevented or show existing application
3. **Opportunity closed while viewing**: Show message, disable apply
4. **No matches found**: Show message, suggest profile update
5. **Admin tries to approve own account**: Prevented
6. **Network error**: Show error message, allow retry
