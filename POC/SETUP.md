# PMTwin MVP — setup guide

### What this page is

How to **run the POC** locally: open the app, demo accounts, optional tooling.

### What happens next

Use [docs/overview.md](../docs/overview.md) for architecture and [POC/docs/DEMO_CREDENTIALS.md](docs/DEMO_CREDENTIALS.md) for full credential list.

---

## Quick start

1. **Open the Application**
   - Open `POC/index.html` in your browser (via Live Server or directly)
   - The app uses hash-based routing for compatibility with static servers
   - Base URL: `http://127.0.0.1:5500/PM-Twin-MVP/POC/` (your path may vary)
   - Routes are appended as hash: `#/login`, `#/register`, `#/dashboard`
   - Full example: `http://127.0.0.1:5500/PM-Twin-MVP/POC/index.html#/login`
   - The app auto-detects its base path, so it works from any directory

2. **Preloaded Demo Accounts**
   
   The app comes with preloaded sample data. Use any of these accounts:
   
   | Account Type | Email | Password |
   |--------------|-------|----------|
   | **Admin** | admin@pmtwin.com | admin123 |
   | **Company** | info@alkhorayef.com | password123 |
   | **Company** | contact@saudibinladin.com | password123 |
   | **Company** | info@almabani.com | password123 |
   | **Company** | projects@nesma.com | password123 |
   | **Professional** | ahmed.hassan@email.com | password123 |
   | **Professional** | fatima.almutairi@email.com | password123 |
   | **Professional** | mohammed.alqahtani@email.com | password123 |
   | **Consultant** | sara.alzahrani@email.com | password123 |
   | **Professional** | khalid.alharbi@email.com | password123 |

3. **Explore the Demo Data**
   - 10 sample opportunities across all business models
   - Pre-existing applications and matches
   - Notifications and audit logs
   - Ready-to-use profiles for testing

## File Structure

```
POC/
├── index.html                    # Entry point - open this in browser
├── pages/                        # Page HTML files
├── features/                     # Page JavaScript components
├── src/                          # Core application code
│   ├── core/                    # Core services (auth, storage, router)
│   ├── services/                # Business services (matching, opportunities)
│   └── business-logic/          # Business models and rules
└── assets/                       # CSS and images
    └── css/
        └── main.css             # Main stylesheet
```

## Browser Requirements

- Modern browser with ES6+ support
- localStorage API support
- No plugins or extensions required

## Features Implemented

### Public Portal
- ✅ Landing page
- ✅ Login/Registration
- ✅ Opportunity discovery (limited)

### User Portal
- ✅ Dashboard (role-adaptive)
- ✅ Opportunity creation (all 13 sub-models)
- ✅ Opportunity browsing and filtering
- ✅ Opportunity detail view
- ✅ Application submission
- ✅ Profile management
- ✅ Pipeline management (Kanban view)
- ✅ Matches and recommendations

### Admin Portal
- ✅ Admin dashboard
- ✅ User management and vetting
- ✅ Opportunity moderation
- ✅ Audit trail
- ✅ System settings

## Data Storage

All data is stored in browser localStorage:
- Data persists between sessions
- Data is browser-specific
- Preloaded seed data is loaded on first launch from `data/*.json` files

### Seed Data Files
Located in `POC/data/`:
- `users.json` - User accounts (companies, professionals, admin)
- `opportunities.json` - Sample opportunities across all business models
- `applications.json` - Applications to opportunities
- `matches.json` - AI-generated matches between users and opportunities
- `notifications.json` - User notifications
- `audit.json` - System audit logs
- `sessions.json` - Active sessions (starts empty)

### Reset Data
To reset all data to the original seed data:
1. Open browser console (F12)
2. Run: `window.resetAppData()`
3. Confirm the reset when prompted

Or manually clear localStorage:
1. Open DevTools → Application → Local Storage
2. Delete all `pmtwin_*` entries

## Known Limitations (POC)

1. **No Backend**: All data stored in localStorage
2. **No Real Authentication**: Password encoding is Base64 (not secure)
3. **No Email**: Notifications are in-app only
4. **No File Uploads**: Document uploads not implemented
5. **No Real-time**: No WebSocket or real-time updates
6. **Single Browser**: Data doesn't sync across browsers/devices

## Testing Scenarios

### Scenario 1: Company Registration
1. Register as Company
2. Login as admin
3. Approve the company
4. Login as company
5. Create an opportunity
6. View applications

### Scenario 2: Professional Registration
1. Register as Professional
2. Login as admin
3. Approve the professional
4. Login as professional
5. Browse opportunities
6. Submit application
7. View matches

### Scenario 3: Matching
1. Create opportunity (as company)
2. Matching engine runs automatically
3. View matches in admin or user portal
4. Professional receives notification (if above threshold)

## Troubleshooting

### 404 Error on Routes (e.g., /login)
- The app uses hash-based routing: URLs must include `#` before the route
- Correct: `http://localhost:5500/path/to/index.html#/login`
- Wrong: `http://localhost:5500/path/to/login`
- Navigate using the app's links or manually add `#/login` to the URL

### Page Not Loading
- Check browser console for errors
- Ensure all files are in correct locations
- Check that paths are relative to `POC/index.html`

### Data Not Persisting
- Check browser localStorage support
- Clear browser cache and reload
- Check browser console for storage errors

### Data Seems Corrupted or Missing
- Run `window.resetAppData()` in browser console to re-seed from JSON files
- This will restore all demo data to original state

### Debug Information
- Run `window.appDebug()` in browser console to see:
  - Current base path
  - Current route
  - Authentication status
  - App configuration

### Scripts Not Loading
- Check browser console for 404 errors
- Verify file paths are correct
- Ensure scripts are loaded in correct order

## Next Steps (Production)

1. Backend API development
2. Database migration
3. Real authentication (JWT, bcrypt)
4. Email service integration
5. File upload service
6. Real-time notifications
7. Enhanced security
8. Performance optimization
9. Mobile app development
10. Advanced analytics

## Support

For issues or questions:
- Check browser console for errors
- Review BRD documentation
- Check data models documentation
