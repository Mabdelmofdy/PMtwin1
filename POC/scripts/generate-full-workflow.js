/**
 * Generate full platform workflow: matches, applications, deals, contracts, notifications.
 * Run from repo root: node POC/scripts/generate-full-workflow.js
 * Reads existing demo-* files and appends new records; writes back.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const NOW = '2026-03-10T14:00:00.000Z';

function load(name) {
  const p = path.join(DATA_DIR, name);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function save(name, obj) {
  const p = path.join(DATA_DIR, name);
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
}

const opportunities = load('demo-40-opportunities.json').data || [];
const oppById = new Map(opportunities.map(o => [o.id, o]));

const userIds = [];
for (let i = 1; i <= 35; i++) userIds.push('demo-u' + String(i).padStart(2, '0'));
const companyIds = ['demo-c01', 'demo-c02', 'demo-c03', 'demo-c04', 'demo-c05', 'demo-c06'];
const allCandidateIds = [...userIds, ...companyIds];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function score() { return 0.72 + Math.random() * 0.24; }

// --- 1. NEW MATCHES (for new opportunities demo-need-41..50, demo-offer-41..50, demo-barter-41..50, demo-consortium-41..50) ---
const newOppIds = [];
opportunities.forEach(o => {
  if (/^demo-(need|offer|barter|consortium)-(4[1-9]|50)$/.test(o.id)) newOppIds.push(o.id);
});

const existingMatches = load('demo-matches.json').data || [];
let matchId = existingMatches.length + 1;
const newMatches = [];
newOppIds.forEach(oppId => {
  const n = 2;
  const used = new Set();
  for (let i = 0; i < n; i++) {
    let cid = rand(allCandidateIds);
    while (used.has(cid)) cid = rand(allCandidateIds);
    used.add(cid);
    const s = score();
    newMatches.push({
      id: 'demo-match-' + (matchId++),
      opportunityId: oppId,
      candidateId: cid,
      matchScore: Math.round(s * 100) / 100,
      criteria: { details: `budgetFit ${(s * 0.95).toFixed(2)}, exchangeModeFit 1, scopeFit ${(s * 0.9).toFixed(2)}` },
      notified: Math.random() > 0.3,
      createdAt: NOW
    });
  }
});

// --- 2. NEW APPLICATIONS (mix statuses; some accepted for new deals) ---
const existingApps = load('demo-applications.json').data || [];
let appId = existingApps.length + 1;

const acceptedForDeal = [
  { oppId: 'demo-need-41', applicantId: 'demo-u21', title: 'Need: Site supervision for residential compound' },
  { oppId: 'demo-need-42', applicantId: 'demo-u08', title: 'Need: BIM coordination for mixed-use tower' },
  { oppId: 'demo-need-43', applicantId: 'demo-u09', title: 'Need: Cost estimation for hospital project' },
  { oppId: 'demo-need-44', applicantId: 'demo-u32', title: 'Need: Sustainability and LEED advisory' },
  { oppId: 'demo-need-45', applicantId: 'demo-u16', title: 'Need: Claims and dispute support' },
  { oppId: 'demo-barter-41', applicantId: 'demo-u33', title: 'Need: Training space for 2-day workshop' },
  { oppId: 'demo-consortium-41', applicantId: 'demo-c04', title: 'Need: Solar plant EPC — equity, EPC, and O&M partners' },
  { oppId: 'demo-need-46', applicantId: 'demo-u17', title: 'Need: Geotechnical investigation' },
  { oppId: 'demo-need-47', applicantId: 'demo-u24', title: 'Need: Interior design and FF&E' }
];

const statuses = ['pending', 'pending', 'shortlisted', 'in_negotiation', 'rejected', 'reviewing'];
const newApplications = [];
const applicationIdByOpp = {}; // oppId -> application id (for accepted ones we create deals from)

acceptedForDeal.forEach(({ oppId, applicantId, title }, idx) => {
  const id = 'demo-app-' + (appId++);
  newApplications.push({
    id,
    opportunityId: oppId,
    applicantId,
    status: 'accepted',
    matchType: oppId.startsWith('demo-consortium') ? 'consortium' : (oppId.startsWith('demo-barter') ? 'two_way' : 'one_way'),
    proposal: `Proposal for ${title}. Ready to proceed.`,
    application_value: {
      paymentPreference: oppId.startsWith('demo-barter') ? 'barter' : 'cash',
      requestedValue: 120000,
      requestedCurrency: 'SAR',
      value_score: 0.88,
      value_breakdown: { budgetFit: 0.9, exchangeModeFit: 1, scopeFit: 0.85 },
      lowValueMatch: false
    },
    responses: {},
    createdAt: NOW,
    updatedAt: NOW
  });
  applicationIdByOpp[oppId] = id;
});

// More applications for new opportunities (mixed statuses)
['demo-need-41', 'demo-need-42', 'demo-need-43', 'demo-need-44', 'demo-need-48', 'demo-need-49', 'demo-offer-41', 'demo-offer-42', 'demo-barter-42', 'demo-barter-43', 'demo-consortium-42', 'demo-consortium-43'].forEach(oppId => {
  const opp = oppById.get(oppId);
  const creatorId = opp && opp.creatorId;
  const usedApplicants = new Set(newApplications.filter(a => a.opportunityId === oppId).map(a => a.applicantId));
  const candidates = allCandidateIds.filter(c => c !== creatorId && !usedApplicants.has(c));
  if (candidates.length === 0) return;
  const n = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < n; i++) {
    const available = candidates.filter(c => !usedApplicants.has(c));
    if (available.length === 0) break;
    const applicantId = rand(available);
    usedApplicants.add(applicantId);
    const status = rand(statuses);
    const id = 'demo-app-' + (appId++);
    newApplications.push({
      id,
      opportunityId: oppId,
      applicantId,
      status,
      matchType: oppId.startsWith('demo-consortium') ? 'consortium' : (oppId.startsWith('demo-barter') ? 'two_way' : 'one_way'),
      proposal: `Application for ${opp && opp.title ? opp.title : oppId}.`,
      application_value: {
        paymentPreference: oppId.startsWith('demo-barter') ? 'barter' : 'cash',
        requestedValue: 50000 + Math.floor(Math.random() * 80000),
        requestedCurrency: 'SAR',
        value_score: 0.72 + Math.random() * 0.2,
        value_breakdown: { budgetFit: 0.85, exchangeModeFit: 1, scopeFit: 0.8 },
        lowValueMatch: false
      },
      responses: status === 'in_negotiation' ? { taskBidAmount: 55000, paymentComments: 'Counter-offer sent.' } : {},
      createdAt: NOW,
      updatedAt: NOW
    });
  }
});

// --- 3. NEW DEALS ---
const existingDeals = load('demo-deals.json').data || [];
const existingContracts = load('demo-contracts.json').data || [];
let dealIdNum = existingDeals.length + 1;
let contractIdNum = existingContracts.length + 1;

const newDeals = [];
const newContracts = [];

function addDeal(applicationId, opportunityId, matchType, title, creatorId, contractorId, status, exchangeMode, agreedValue, paymentSchedule, signed, milestones, extraParticipants) {
  const dealId = 'demo-deal-' + String(dealIdNum++).padStart(2, '0');
  const contractId = 'demo-contract-' + String(contractIdNum++).padStart(2, '0');
  const signedAt = signed ? NOW : null;
  const participants = [
    { userId: creatorId, role: 'creator', approvalStatus: signed ? 'approved' : 'pending', signedAt },
    { userId: contractorId, role: 'contractor', approvalStatus: signed ? 'approved' : 'pending', signedAt }
  ];
  if (extraParticipants && extraParticipants.length) extraParticipants.forEach(p => participants.push(p));

  newDeals.push({
    id: dealId,
    matchId: null,
    applicationId,
    opportunityId,
    matchType,
    status,
    title,
    participants,
    opportunityIds: [opportunityId],
    scope: title,
    timeline: { start: signed ? '2026-04-01' : null, end: signed ? '2026-09-30' : null },
    exchangeMode,
    valueTerms: exchangeMode === 'barter'
      ? { barterDescription: 'Workshop facilitation in exchange for training space', paymentSchedule }
      : { agreedValue: { cash: agreedValue, currency: 'SAR' }, paymentSchedule },
    deliverables: '',
    milestones: milestones || [],
    negotiationId: null,
    contractId,
    createdAt: NOW,
    updatedAt: NOW,
    completedAt: status === 'completed' ? NOW : null,
    closedAt: status === 'closed' ? NOW : null
  });

  newContracts.push({
    id: contractId,
    dealId,
    opportunityId,
    applicationId,
    parties: participants.map(p => ({ userId: p.userId, role: p.role, signedAt: p.signedAt })),
    scope: title,
    paymentMode: exchangeMode,
    duration: '3 months',
    status: status === 'draft' ? 'pending' : (status === 'completed' || status === 'closed' ? 'completed' : 'active'),
    paymentSchedule,
    agreedValue: exchangeMode === 'barter' ? { barter: 'Workshop for space' } : { cash: agreedValue, currency: 'SAR' },
    equityVesting: null,
    profitShare: null,
    signedAt,
    createdAt: NOW,
    updatedAt: NOW
  });
}

// Deal 03: execution (site supervision) - partial milestones
const ms3 = [
  { id: 'm1', title: 'Mobilization', 'description': '', dueDate: '2026-06-15', status: 'approved', deliverables: 'Signed scope', createdAt: NOW, updatedAt: NOW, submittedAt: NOW, approvedAt: NOW, approvedBy: 'demo-c02' },
  { id: 'm2', title: 'Supervision period', 'description': '', dueDate: '2026-09-30', status: 'pending', deliverables: 'Reports', createdAt: NOW, updatedAt: NOW, submittedAt: null, approvedAt: null, approvedBy: null }
];
addDeal(applicationIdByOpp['demo-need-41'], 'demo-need-41', 'one_way', 'Need: Site supervision for residential compound', 'demo-c02', 'demo-u21', 'execution', 'cash', 130000, '50% on start, 50% on completion', true, ms3);

// Deal 04: draft (cost estimation)
addDeal(applicationIdByOpp['demo-need-43'], 'demo-need-43', 'one_way', 'Need: Cost estimation for hospital project', 'demo-c01', 'demo-u09', 'draft', 'cash', 50000, 'Milestone-based', false, []);

// Deal 05: barter execution
const ms5 = [
  { id: 'm1', title: 'Agreement and access', 'description': '', dueDate: '2026-06-01', status: 'approved', deliverables: 'Access', createdAt: NOW, updatedAt: NOW, submittedAt: NOW, approvedAt: NOW, approvedBy: 'demo-u14' },
  { id: 'm2', title: 'Period of use', 'description': '', dueDate: '2026-07-15', status: 'pending', deliverables: 'Workshop delivered', createdAt: NOW, updatedAt: NOW, submittedAt: null, approvedAt: null, approvedBy: null }
];
addDeal(applicationIdByOpp['demo-barter-41'], 'demo-barter-41', 'two_way', 'Need: Training space for 2-day workshop', 'demo-u14', 'demo-u33', 'execution', 'barter', 0, 'Barter: workshop for space', true, ms5);

// Deal 06: consortium execution (solar) - 3 participants
addDeal(applicationIdByOpp['demo-consortium-41'], 'demo-consortium-41', 'consortium', 'Need: Solar plant EPC — equity, EPC, and O&M partners', 'demo-c05', 'demo-c04', 'execution', 'cash', 12000000, 'Milestone-based', true, [
  { id: 'm1', title: 'Consortium formation', 'description': '', dueDate: '2026-09-01', status: 'approved', deliverables: 'JVA signed', createdAt: NOW, updatedAt: NOW, submittedAt: NOW, approvedAt: NOW, approvedBy: 'demo-c05' },
  { id: 'm2', title: 'Design and permits', 'description': '', dueDate: '2027-03-31', status: 'pending', deliverables: 'Permits', createdAt: NOW, updatedAt: NOW, submittedAt: null, approvedAt: null, approvedBy: null },
  { id: 'm3', title: 'Construction', 'description': '', dueDate: '2028-06-30', status: 'pending', deliverables: 'Construction', createdAt: NOW, updatedAt: NOW, submittedAt: null, approvedAt: null, approvedBy: null }
], [
  { userId: 'demo-u24', role: 'contractor', approvalStatus: 'approved', signedAt: NOW },
  { userId: 'demo-c03', role: 'contractor', approvalStatus: 'approved', signedAt: NOW }
]);

// Deal 07: completed (LEED)
const ms7 = [
  { id: 'm1', title: 'Assessment', 'description': '', dueDate: '2026-07-01', status: 'approved', deliverables: 'Report', createdAt: NOW, updatedAt: NOW, submittedAt: NOW, approvedAt: NOW, approvedBy: 'demo-c02' },
  { id: 'm2', title: 'Design support', 'description': '', dueDate: '2026-09-01', status: 'approved', deliverables: 'Design', createdAt: NOW, updatedAt: NOW, submittedAt: NOW, approvedAt: NOW, approvedBy: 'demo-c02' },
  { id: 'm3', title: 'Submission and certification', 'description': '', dueDate: '2026-11-30', status: 'approved', deliverables: 'LEED', createdAt: NOW, updatedAt: NOW, submittedAt: NOW, approvedAt: NOW, approvedBy: 'demo-c02' }
];
addDeal(applicationIdByOpp['demo-need-44'], 'demo-need-44', 'one_way', 'Need: Sustainability and LEED advisory', 'demo-c02', 'demo-u32', 'completed', 'cash', 38000, 'Milestone-based', true, ms7);

// Deal 08: closed
addDeal(applicationIdByOpp['demo-need-45'], 'demo-need-45', 'one_way', 'Need: Claims and dispute support', 'demo-c01', 'demo-u16', 'closed', 'cash', 60000, 'Upon completion', true, []);

// Deal 09: execution with all milestones approved (ready for completed in UI)
const ms9 = [
  { id: 'm1', title: 'Model setup', 'description': '', dueDate: '2026-07-15', status: 'approved', deliverables: 'Federated model', createdAt: NOW, updatedAt: NOW, submittedAt: NOW, approvedAt: NOW, approvedBy: 'demo-c06' },
  { id: 'm2', title: 'Coordination phase', 'description': '', dueDate: '2026-10-31', status: 'approved', deliverables: 'Clash report', createdAt: NOW, updatedAt: NOW, submittedAt: NOW, approvedAt: NOW, approvedBy: 'demo-c06' },
  { id: 'm3', title: 'Sign-off and as-built', 'description': '', dueDate: '2026-12-31', status: 'approved', deliverables: 'As-built', createdAt: NOW, updatedAt: NOW, submittedAt: NOW, approvedAt: NOW, approvedBy: 'demo-c06' }
];
addDeal(applicationIdByOpp['demo-need-42'], 'demo-need-42', 'one_way', 'Need: BIM coordination for mixed-use tower', 'demo-c06', 'demo-u08', 'execution', 'cash', 85000, '33% per milestone', true, ms9);

// Deal 10: draft (geotechnical)
addDeal(applicationIdByOpp['demo-need-46'], 'demo-need-46', 'one_way', 'Need: Geotechnical investigation', 'demo-c05', 'demo-u17', 'draft', 'cash', 90000, '50% on report', false, []);

// Deal 11: draft (interior design)
addDeal(applicationIdByOpp['demo-need-47'], 'demo-need-47', 'one_way', 'Need: Interior design and FF&E', 'demo-c06', 'demo-u24', 'draft', 'cash', 120000, 'Milestone-based', false, []);

// Fix contract status for completed/closed deals
newContracts.forEach(c => {
  const deal = newDeals.find(d => d.contractId === c.id);
  if (deal && (deal.status === 'completed' || deal.status === 'closed')) c.status = 'completed';
});

// --- 4. NOTIFICATIONS ---
const existingNotifs = load('demo-notifications.json').data || [];
let notifId = existingNotifs.length + 1;
const newNotifications = [];

newMatches.slice(0, 15).forEach(m => {
  newNotifications.push({
    id: 'demo-notif-' + (notifId++),
    userId: m.candidateId,
    title: 'New match',
    message: `You have a new match for this opportunity (${(m.matchScore * 100).toFixed(0)}% fit).`,
    read: false,
    type: 'match',
    link: '/opportunities/' + m.opportunityId,
    createdAt: NOW
  });
});

newApplications.filter(a => a.status === 'accepted').forEach(a => {
  newNotifications.push({
    id: 'demo-notif-' + (notifId++),
    userId: a.applicantId,
    title: 'Application accepted',
    message: `Your application was accepted.`,
    read: false,
    type: 'application',
    link: '/opportunities/' + a.opportunityId,
    createdAt: NOW
  });
});

newDeals.filter(d => d.status === 'execution' || d.status === 'completed').forEach(d => {
  d.participants.forEach(p => {
    newNotifications.push({
      id: 'demo-notif-' + (notifId++),
      userId: p.userId,
      title: 'Deal in execution',
      message: `Deal "${d.title}" is now in execution.`,
      read: Math.random() > 0.5,
      type: 'deal',
      link: '/deals/' + d.id,
      createdAt: NOW
    });
  });
});

newDeals.filter(d => d.status === 'completed').forEach(d => {
  d.participants.forEach(p => {
    newNotifications.push({
      id: 'demo-notif-' + (notifId++),
      userId: p.userId,
      title: 'Deal completed',
      message: `Deal "${d.title}" has been completed.`,
      read: false,
      type: 'deal',
      link: '/deals/' + d.id,
      createdAt: NOW
    });
  });
});

// --- WRITE ---
const matchesFile = load('demo-matches.json');
matchesFile.data = [...existingMatches, ...newMatches];
matchesFile.description = 'Demo match records including new opportunities; supports dashboard and matching.';
save('demo-matches.json', matchesFile);

const applicationsFile = load('demo-applications.json');
applicationsFile.data = [...existingApps, ...newApplications];
applicationsFile.description = 'Demo applications with full workflow statuses including new opportunities.';
save('demo-applications.json', applicationsFile);

const dealsFile = load('demo-deals.json');
dealsFile.data = [...existingDeals, ...newDeals];
dealsFile.description = 'Demo deals: draft, execution, completed, closed; barter and consortium.';
save('demo-deals.json', dealsFile);

const contractsFile = load('demo-contracts.json');
contractsFile.data = [...existingContracts, ...newContracts];
contractsFile.description = 'Demo contracts (one per deal); legal only, execution on Deal.';
save('demo-contracts.json', contractsFile);

const notifsFile = load('demo-notifications.json');
notifsFile.data = [...existingNotifs, ...newNotifications];
notifsFile.description = 'Demo notifications for matches, applications, deals, milestones.';
save('demo-notifications.json', notifsFile);

console.log('Workflow generated:');
console.log('  Matches:', newMatches.length, '(total', matchesFile.data.length + ')');
console.log('  Applications:', newApplications.length, '(total', applicationsFile.data.length + ')');
console.log('  Deals:', newDeals.length, '(total', dealsFile.data.length + ')');
console.log('  Contracts:', newContracts.length, '(total', contractsFile.data.length + ')');
console.log('  Notifications:', newNotifications.length, '(total', notifsFile.data.length + ')');
