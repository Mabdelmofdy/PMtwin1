const fs = require('fs')

const APPROVED = {
  caseStatus: 'approved',
  reviewProgress: 'approved',
  reviewedAt: '2026-06-20T10:00:00.000Z',
  reviewedBy: 'admin@pmtwin.com',
  emailVerified: true,
  submittedAt: '2026-06-18T09:00:00.000Z',
}

function ensureApproved(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let changed = 0
  for (const row of raw.data || []) {
    if (row.status !== 'active') continue
    if (row.role === 'admin') continue
    row.profile = row.profile || {}
    const v = row.profile.vetting || {}
    if (v.caseStatus === 'approved' || v.reviewProgress === 'approved') continue
    row.profile.vetting = {
      ...APPROVED,
      ...v,
      caseStatus: 'approved',
      reviewProgress: 'approved',
    }
    changed++
  }
  fs.writeFileSync(filePath, JSON.stringify(raw, null, 2) + '\n')
  return changed
}

const files = [
  'POC/data/seed-controlled-users.json',
  'POC/data/demo-employees.json',
  'POC/data/demo-companies.json',
  'POC/data/users.json',
]
for (const f of files) {
  console.log(f, 'updated', ensureApproved(f))
}

const pending = {
  domain: 'users',
  version: '3.0',
  dataset: 'enterprise-uat-pending',
  description:
    'Pending vetting demo accounts for Onboarding Center / Demo Credentials Pending tab. Shared password: Pmtwin@2026.',
  data: [
    {
      id: 'seed-pending-001',
      email: 'noura.pending@pmtwin.test',
      passwordHash: 'UG10d2luQDIwMjY=',
      role: 'professional',
      status: 'pending_vetting',
      isPublic: false,
      connectionCount: 0,
      profile: {
        name: 'Noura Al-Qahtani',
        type: 'professional',
        headline: 'Civil Engineer — Pending Review',
        title: 'Civil Engineer',
        phone: '+966 55 901 1001',
        location: 'Dammam, Saudi Arabia',
        locationCity: 'Dammam',
        bio: 'Newly registered civil engineer awaiting enterprise onboarding approval.',
        photoUrl: 'https://i.pravatar.cc/150?img=32',
        skills: ['Structural Design', 'AutoCAD', 'Site Supervision'],
        sectors: ['Construction'],
        yearsExperience: 4,
        certifications: ['Saudi Council of Engineers'],
        profileCompletionUnlocked: true,
        vetting: {
          caseStatus: 'pending_review',
          reviewProgress: 'in_review',
          emailVerified: true,
          submittedAt: '2026-07-10T08:00:00.000Z',
          slaStatus: 'on_track',
        },
      },
      createdAt: '2026-07-10T08:00:00.000Z',
      updatedAt: '2026-07-10T08:00:00.000Z',
    },
    {
      id: 'seed-pending-002',
      email: 'omar.clarify@pmtwin.test',
      passwordHash: 'UG10d2luQDIwMjY=',
      role: 'professional',
      status: 'clarification_requested',
      isPublic: false,
      connectionCount: 0,
      profile: {
        name: 'Omar Al-Shammari',
        type: 'professional',
        headline: 'MEP Engineer — Clarification Requested',
        title: 'MEP Engineer',
        phone: '+966 55 901 1002',
        location: 'Riyadh, Saudi Arabia',
        locationCity: 'Riyadh',
        bio: 'MEP engineer asked to re-upload identity and license documents.',
        photoUrl: 'https://i.pravatar.cc/150?img=33',
        skills: ['HVAC', 'Electrical Design', 'Revit MEP'],
        sectors: ['Construction', 'MEP'],
        yearsExperience: 6,
        profileCompletionUnlocked: true,
        vetting: {
          caseStatus: 'clarification_requested',
          reviewProgress: 'changes_requested',
          emailVerified: true,
          submittedAt: '2026-07-08T09:00:00.000Z',
          reason: 'Identity document expired — please upload a valid National ID.',
          reviewNotes: 'Identity document expired — please upload a valid National ID.',
          requestedItems: ['National ID', 'SCE license'],
          requestedChanges: ['National ID', 'SCE license'],
          dueDate: '2026-07-20',
          reviewedBy: 'admin@pmtwin.com',
          reviewerId: 'user-admin-001',
          reviewedAt: '2026-07-11T11:00:00.000Z',
          slaStatus: 'at_risk',
        },
      },
      createdAt: '2026-07-08T09:00:00.000Z',
      updatedAt: '2026-07-11T11:00:00.000Z',
    },
    {
      id: 'seed-pending-co-001',
      email: 'onboarding@najd-steelworks.test',
      passwordHash: 'UG10d2luQDIwMjY=',
      role: 'user',
      status: 'pending_vetting',
      isPublic: false,
      connectionCount: 0,
      profile: {
        name: 'Layla Al-Harbi',
        type: 'professional',
        headline: 'Company registrant — Najd Steelworks (Pending)',
        title: 'Authorized Representative',
        phone: '+966 11 901 2001',
        location: 'Riyadh, Saudi Arabia',
        locationCity: 'Riyadh',
        bio: 'Authorized representative for Najd Steelworks company registration awaiting CR/VAT verification.',
        photoUrl: 'https://i.pravatar.cc/150?img=47',
        skills: ['Procurement', 'Commercial Registration'],
        sectors: ['Construction', 'Industrial'],
        profileCompletionUnlocked: true,
        vetting: {
          caseStatus: 'submitted',
          reviewProgress: 'in_review',
          emailVerified: true,
          submittedAt: '2026-07-12T07:30:00.000Z',
          slaStatus: 'on_track',
        },
      },
      createdAt: '2026-07-12T07:30:00.000Z',
      updatedAt: '2026-07-12T07:30:00.000Z',
    },
  ],
}

fs.writeFileSync('POC/data/demo-pending-users.json', JSON.stringify(pending, null, 2) + '\n')
console.log('wrote pending', pending.data.length)
