/**
 * Phase 1–2 seed prep:
 * - Enrich seed-opp-demo-* with matching readiness (role, skills, normalized)
 * - Append cast-coverage opportunities + post-matches for every unused demo account
 *
 * Run: node POC/scripts/enrich-demo-matching-cast.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'))
}

function writeJson(name, value) {
  fs.writeFileSync(path.join(dataDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function buildNormalized({ role, skills, services, intent, location, start, end, modelType, subModelType, sectors, budget }) {
  return {
    skills,
    requiredServices: intent === 'offer' ? [] : services,
    offeredServices: intent === 'offer' ? services : [],
    role,
    coreSkills: skills,
    categories: [modelType, subModelType, ...(sectors ?? ['Construction'])].filter(Boolean),
    budget: budget ?? { min: 50000, max: 300000, currency: 'SAR' },
    timeline: { start, end },
    deadline: end,
    availability: { start, end },
    location: location ?? 'Riyadh, Saudi Arabia',
    reputation: 0.5,
    intent: intent === 'need' ? 'request' : intent,
    modelType,
    subModelType,
  }
}

function enrichDemoOpp(opp, meta) {
  const skills = meta.skills
  const services = meta.services ?? skills
  const intent = meta.intent ?? opp.intent
  const role = meta.role
  const start = meta.start ?? '2026-07-01'
  const end = meta.end ?? '2026-12-31'
  const modelType = opp.modelType ?? 'project_based'
  const subModelType = opp.subModelType ?? 'project'
  const sectors = opp.scope?.sectors ?? ['Construction']

  const attributes = {
    ...(opp.attributes ?? {}),
    startDate: start,
    tenderDeadline: end,
    locationRequirement: opp.location ?? 'Riyadh, Saudi Arabia',
    targetRole: role,
    coreSkills: skills,
    ...(meta.memberRoles ? { memberRoles: meta.memberRoles } : {}),
  }

  const scope = {
    ...(opp.scope ?? {}),
    sectors,
    coreSkills: skills,
    requiredSkills: intent === 'offer' ? [] : skills,
    offeredSkills: intent === 'offer' ? skills : [],
    certifications: opp.scope?.certifications ?? [],
    targetRole: role,
  }

  return {
    ...opp,
    intent,
    preferredMatchingTopology: meta.topology ?? opp.preferredMatchingTopology,
    mainCollaborationModel: meta.model ?? opp.mainCollaborationModel,
    skills,
    attributes,
    scope,
    normalized: buildNormalized({
      role,
      skills,
      services,
      intent,
      location: opp.location,
      start,
      end,
      modelType,
      subModelType,
      sectors,
      budget: opp.exchangeData?.budgetRange,
    }),
  }
}

const DEMO_META = {
  'seed-opp-demo-task-need': {
    role: 'Construction Manager',
    intent: 'need',
    skills: ['Project Management', 'Coordination', 'Subcontracting'],
    topology: 'one_way',
  },
  'seed-opp-demo-task-offer': {
    role: 'Construction Manager',
    intent: 'offer',
    skills: ['Project Management', 'Coordination', 'Subcontracting'],
    topology: 'one_way',
  },
  'seed-opp-demo-alliance-a': {
    role: 'Civil Engineer',
    intent: 'need',
    skills: ['Civil Engineering', 'Site Supervision', 'Barter Coordination'],
    topology: 'two_way',
  },
  'seed-opp-demo-alliance-b': {
    role: 'MEP Engineer',
    intent: 'offer',
    skills: ['MEP Design', 'HVAC', 'Barter Coordination'],
    topology: 'two_way',
  },
  'seed-opp-demo-mentor': {
    role: 'Project Manager',
    intent: 'need',
    skills: ['PMO Governance', 'Mentoring', 'Project Controls'],
    topology: 'one_way',
  },
  'seed-opp-demo-consortium-lead': {
    role: 'Consortium Lead',
    intent: 'need',
    skills: ['Consortium Management', 'Airport Works', 'Joint Venture'],
    topology: 'consortium',
    memberRoles: ['Civil Engineer', 'MEP Engineer', 'Architect'],
  },
  'seed-opp-demo-project-jv': {
    role: 'EPC Partner',
    intent: 'offer',
    skills: ['EPC Delivery', 'Joint Venture', 'Construction Management'],
    topology: 'consortium',
  },
  'seed-opp-demo-spv': {
    role: 'SPV Sponsor',
    intent: 'need',
    skills: ['SPV Structuring', 'Infrastructure Finance', 'Joint Venture'],
    topology: 'consortium',
    memberRoles: ['Investor', 'Technical Partner'],
  },
  'seed-opp-demo-strategic-jv': {
    role: 'Strategic Partner',
    intent: 'need',
    skills: ['Strategic Partnership', 'Market Expansion', 'Joint Venture'],
    topology: 'consortium',
    memberRoles: ['Regional Partner', 'Delivery Partner'],
  },
  'seed-opp-demo-bulk': {
    role: 'Steel Supplier',
    intent: 'need',
    skills: ['Bulk Procurement', 'Steel Supply', 'Resource Sharing'],
    topology: 'circular',
    model: 'resource_sharing',
  },
  'seed-opp-demo-equip': {
    role: 'Equipment Partner',
    intent: 'offer',
    skills: ['Crane Operations', 'Heavy Equipment', 'Resource Sharing'],
    topology: 'circular',
  },
  'seed-opp-demo-resource': {
    role: 'Crew Supervisor',
    intent: 'offer',
    skills: ['Temporary Crews', 'Labour Coordination', 'Resource Sharing'],
    topology: 'circular',
  },
  'seed-opp-demo-prof-hiring': {
    role: 'Planning Engineer',
    intent: 'need',
    skills: ['Scheduling', 'Primavera', 'Hiring'],
    topology: 'one_way',
  },
  'seed-opp-demo-consultant': {
    role: 'Claims Specialist',
    intent: 'need',
    skills: ['Claims Management', 'Contract Administration', 'Consulting'],
    topology: 'one_way',
  },
  'seed-opp-demo-rfp': {
    role: 'Facade Designer',
    intent: 'need',
    skills: ['Facade Design', 'Architectural Design', 'RFP Response'],
    topology: 'one_way',
  },
}

function makeOpp({
  id,
  title,
  description,
  creatorId,
  ownerKind, // 'user' | 'company' | 'pending_user' | 'pending_company'
  intent,
  status,
  role,
  skills,
  topology,
  model,
  modelType = 'project_based',
  subModelType = 'project',
  exchangeMode = 'cash',
  memberRoles,
  createdByUserId,
}) {
  const isCompany = ownerKind === 'company' || ownerKind === 'pending_company'
  const workspaceId = isCompany ? `ws-company-${creatorId}` : `ws-personal-${creatorId}`
  const ownerPartyId = isCompany ? `party-company-${creatorId}` : `party-individual-${creatorId}`
  const start = '2026-08-01'
  const end = '2027-02-28'
  const services = skills
  return {
    id,
    title,
    description,
    creatorId,
    intent,
    status,
    mainCollaborationModel: model,
    modelType,
    subModelType,
    preferredMatchingTopology: topology,
    exchangeMode,
    acceptedExchangeModes: exchangeMode === 'barter' ? ['barter', 'hybrid'] : ['cash', 'hybrid'],
    paymentModes: exchangeMode === 'barter' ? ['barter'] : ['cash'],
    location: 'Riyadh, Saudi Arabia',
    locationCountry: 'sa',
    locationRegion: 'riyadh',
    skills,
    scope: {
      sectors: ['Construction'],
      coreSkills: skills,
      requiredSkills: intent === 'offer' ? [] : skills,
      offeredSkills: intent === 'offer' ? skills : [],
      certifications: [],
      targetRole: role,
    },
    attributes: {
      startDate: start,
      tenderDeadline: end,
      locationRequirement: 'Riyadh, Saudi Arabia',
      targetRole: role,
      coreSkills: skills,
      ...(memberRoles ? { memberRoles } : {}),
    },
    exchangeData: {
      exchangeMode,
      currency: 'SAR',
      budgetRange: { min: 80000, max: 420000, currency: 'SAR' },
    },
    value_exchange: {
      mode: exchangeMode,
      accepted_modes: exchangeMode === 'barter' ? ['barter', 'hybrid'] : ['cash', 'hybrid'],
      estimated_value: 200000,
    },
    normalized: buildNormalized({
      role,
      skills,
      services,
      intent,
      location: 'Riyadh, Saudi Arabia',
      start,
      end,
      modelType,
      subModelType,
      sectors: ['Construction'],
      budget: { min: 80000, max: 420000, currency: 'SAR' },
    }),
    createdAt: '2026-07-13T12:00:00.000Z',
    updatedAt: '2026-07-13T12:00:00.000Z',
    workspaceId,
    ownerPartyId,
    createdByUserId: createdByUserId ?? (isCompany ? 'system-migration-actor' : creatorId),
    createdByActorType: isCompany ? 'system' : 'marketplace_user',
    collaborationAttributes: { scenario: 'demo-cast-coverage' },
  }
}

function makeMatch({
  id,
  matchType,
  status = 'pending',
  score = 0.88,
  participants,
  needOpportunityId,
  offerOpportunityId,
}) {
  return {
    id,
    matchType,
    status,
    matchScore: score,
    runId: 'seed-run-cast-coverage',
    participants,
    payload: {
      needOpportunityId,
      offerOpportunityId,
      breakdown: {
        skillMatch: 0.9,
        attributeOverlap: 0.85,
        serviceOverlapPct: 0.88,
        exchangeCompatibility: 1,
        valueCompatibility: 0.7,
        budgetFit: 0.9,
        timelineFit: 0.9,
        locationFit: 1,
        reputation: 0.5,
      },
      valueAnalysis: null,
      castCoverage: true,
    },
    createdAt: '2026-07-13T12:00:00.000Z',
    updatedAt: '2026-07-13T12:00:00.000Z',
    expiresAt: '2026-08-13T12:00:00.000Z',
    isReplacement: false,
  }
}

// --- Phase 1: enrich demo opps in opportunities.json ---
const opportunities = readJson('opportunities.json')
opportunities.data = opportunities.data.map((opp) => {
  const meta = DEMO_META[opp.id]
  return meta ? enrichDemoOpp(opp, meta) : opp
})
writeJson('opportunities.json', opportunities)

// --- Phase 2: cast coverage opportunities + matches ---
const castOpps = []
const castMatches = []

// Unused pros: 003, 016, 018-030
const unusedPros = [
  { id: 'seed-user-003', role: 'Architect', skills: ['Architectural Design', 'BIM', 'Revit'] },
  { id: 'seed-user-016', role: 'Structural Engineer', skills: ['Structural Analysis', 'ETABS', 'Steel Design'] },
  { id: 'seed-user-018', role: 'MEP Engineer', skills: ['MEP Design', 'HVAC', 'Electrical Systems'] },
  { id: 'seed-user-019', role: 'Project Manager', skills: ['Project Management', 'Stakeholder Management', 'Planning'] },
  { id: 'seed-user-020', role: 'Civil Engineer', skills: ['Civil Engineering', 'Site Supervision', 'Earthworks'] },
  { id: 'seed-user-021', role: 'Mechanical Engineer', skills: ['Mechanical Design', 'HVAC', 'Piping'] },
  { id: 'seed-user-022', role: 'Electrical Engineer', skills: ['Electrical Design', 'Power Distribution', 'Lighting'] },
  { id: 'seed-user-023', role: 'Architect', skills: ['Facade Design', 'Concept Design', 'BIM'] },
  { id: 'seed-user-024', role: 'Quantity Surveyor', skills: ['Quantity Surveying', 'Cost Planning', 'BOQ'] },
  { id: 'seed-user-025', role: 'Procurement Lead', skills: ['Procurement', 'Vendor Management', 'Contracts'] },
  { id: 'seed-user-026', role: 'Structural Engineer', skills: ['Concrete Design', 'Steel Design', 'Structural Analysis'] },
  { id: 'seed-user-027', role: 'HSE Manager', skills: ['HSE Management', 'Risk Assessment', 'Compliance'] },
  { id: 'seed-user-028', role: 'BIM Manager', skills: ['BIM Coordination', 'Revit', 'Clash Detection'] },
  { id: 'seed-user-029', role: 'Planning Engineer', skills: ['Scheduling', 'Primavera', 'Progress Tracking'] },
  { id: 'seed-user-030', role: 'Cost Engineer', skills: ['Cost Engineering', 'Estimating', 'Value Engineering'] },
]

// Pair unused pros into one_way matches (need/offer)
for (let i = 0; i < unusedPros.length; i += 2) {
  const needPro = unusedPros[i]
  const offerPro = unusedPros[i + 1] ?? unusedPros[0]
  const needOppId = `seed-opp-cast-${needPro.id}-need`
  const offerOppId = `seed-opp-cast-${offerPro.id}-offer`
  const topology = i % 6 === 4 ? 'two_way' : 'one_way'
  const model = topology === 'two_way' ? 'service_exchange' : 'cash_subcontracting'
  const exchangeMode = topology === 'two_way' ? 'barter' : 'cash'

  castOpps.push(
    makeOpp({
      id: needOppId,
      title: `Cast coverage need — ${needPro.role}`,
      description: `Matching-ready need owned by ${needPro.id} for demo cast coverage.`,
      creatorId: needPro.id,
      ownerKind: 'user',
      intent: 'need',
      status: 'published',
      role: needPro.role,
      skills: needPro.skills,
      topology,
      model,
      exchangeMode,
      modelType: topology === 'two_way' ? 'strategic_partnership' : 'project_based',
      subModelType: topology === 'two_way' ? 'strategic_alliance' : 'task_based',
    }),
  )
  if (offerPro.id !== needPro.id || unusedPros.length % 2 === 0 || i + 1 < unusedPros.length) {
    castOpps.push(
      makeOpp({
        id: offerOppId,
        title: `Cast coverage offer — ${offerPro.role}`,
        description: `Matching-ready offer owned by ${offerPro.id} for demo cast coverage.`,
        creatorId: offerPro.id,
        ownerKind: 'user',
        intent: 'offer',
        status: 'published',
        role: offerPro.role,
        skills: offerPro.skills,
        topology,
        model,
        exchangeMode,
        modelType: topology === 'two_way' ? 'strategic_partnership' : 'project_based',
        subModelType: topology === 'two_way' ? 'strategic_alliance' : 'task_based',
      }),
    )
  }

  castMatches.push(
    makeMatch({
      id: `demo-pm-cast-${needPro.id}`,
      matchType: topology,
      participants: [
        {
          userId: needPro.id,
          opportunityId: needOppId,
          role: 'need_owner',
          participantStatus: 'pending',
          respondedAt: null,
        },
        {
          userId: offerPro.id,
          opportunityId: offerOppId,
          role: 'offer_provider',
          participantStatus: 'pending',
          respondedAt: null,
        },
      ],
      needOpportunityId: needOppId,
      offerOpportunityId: offerOppId,
    }),
  )
}

// Companies 007–015: company needs + one_way matches with cast pros / each other
const unusedCompanies = [
  { id: 'seed-co-corp-007', role: 'Main Contractor', skills: ['Main Contracting', 'Site Management', 'Coordination'] },
  { id: 'seed-co-corp-008', role: 'Main Contractor', skills: ['Residential Construction', 'Site Management'] },
  { id: 'seed-co-corp-009', role: 'MEP Contractor', skills: ['MEP Installation', 'Commissioning'] },
  { id: 'seed-co-corp-010', role: 'Steel Fabricator', skills: ['Steel Fabrication', 'Structural Steel'] },
  { id: 'seed-co-corp-011', role: 'Engineering Consultant', skills: ['Structural Consulting', 'Civil Design'] },
  { id: 'seed-co-corp-012', role: 'Design Consultant', skills: ['Architectural Design', 'Interior Design'] },
  { id: 'seed-co-corp-013', role: 'Materials Supplier', skills: ['Building Materials', 'Logistics'] },
  { id: 'seed-co-corp-014', role: 'Industrial Supplier', skills: ['Industrial Supply', 'Procurement'] },
  { id: 'seed-co-corp-015', role: 'Equipment Partner', skills: ['Crane Hire', 'Plant Hire'] },
]

const companyCounterparts = [
  'seed-user-019',
  'seed-user-020',
  'seed-user-021',
  'seed-user-022',
  'seed-user-023',
  'seed-user-024',
  'seed-user-025',
  'seed-user-026',
  'seed-user-027',
]

unusedCompanies.forEach((co, idx) => {
  const needOppId = `seed-opp-cast-${co.id}-need`
  const offerOppId = `seed-opp-cast-${companyCounterparts[idx]}-co-offer`
  const isConsortium = idx % 3 === 0
  const topology = isConsortium ? 'consortium' : 'one_way'
  const model = isConsortium ? 'joint_venture' : 'cash_subcontracting'

  castOpps.push(
    makeOpp({
      id: needOppId,
      title: `Cast coverage company need — ${co.role}`,
      description: `Company-owned matching-ready need for ${co.id}.`,
      creatorId: co.id,
      ownerKind: 'company',
      intent: 'need',
      status: 'published',
      role: co.role,
      skills: co.skills,
      topology,
      model,
      memberRoles: isConsortium ? ['Civil Engineer', 'MEP Engineer', 'Architect'] : undefined,
      modelType: 'project_based',
      subModelType: isConsortium ? 'consortium' : 'task_based',
    }),
  )

  // Offer side: reuse / create personal offer if not already created
  if (!castOpps.some((o) => o.id === offerOppId)) {
    const counterpart = unusedPros.find((p) => p.id === companyCounterparts[idx]) ?? unusedPros[0]
    castOpps.push(
      makeOpp({
        id: offerOppId,
        title: `Cast coverage partner offer — ${counterpart.role}`,
        description: `Partner offer for company cast match with ${co.id}.`,
        creatorId: counterpart.id,
        ownerKind: 'user',
        intent: 'offer',
        status: 'published',
        role: counterpart.role,
        skills: counterpart.skills,
        topology,
        model,
        modelType: 'project_based',
        subModelType: isConsortium ? 'consortium' : 'task_based',
      }),
    )
  }

  castMatches.push(
    makeMatch({
      id: `demo-pm-cast-${co.id}`,
      matchType: topology,
      status: isConsortium ? 'discovered' : 'pending',
      participants: isConsortium
        ? [
            {
              userId: co.id,
              opportunityId: needOppId,
              role: 'consortium_lead',
              participantStatus: 'accepted',
              respondedAt: '2026-07-13T12:00:00.000Z',
            },
            {
              userId: companyCounterparts[idx],
              opportunityId: offerOppId,
              role: 'consortium_member',
              participantStatus: 'pending',
              respondedAt: null,
            },
          ]
        : [
            {
              userId: co.id,
              opportunityId: needOppId,
              role: 'need_owner',
              participantStatus: 'pending',
              respondedAt: null,
            },
            {
              userId: companyCounterparts[idx],
              opportunityId: offerOppId,
              role: 'offer_provider',
              participantStatus: 'pending',
              respondedAt: null,
            },
          ],
      needOpportunityId: needOppId,
      offerOpportunityId: offerOppId,
    }),
  )
})

// Circular ring using company 015 + pros 028/029/030
const circularIds = [
  { owner: 'seed-co-corp-015', oppId: 'seed-opp-cast-circular-015', role: 'Equipment Partner', skills: ['Crane Hire', 'Plant Hire'] },
  { owner: 'seed-user-028', oppId: 'seed-opp-cast-circular-028', role: 'BIM Manager', skills: ['BIM Coordination', 'Model Sharing'] },
  { owner: 'seed-user-029', oppId: 'seed-opp-cast-circular-029', role: 'Planning Engineer', skills: ['Scheduling', 'Resource Planning'] },
]
for (const row of circularIds) {
  if (!castOpps.some((o) => o.id === row.oppId)) {
    castOpps.push(
      makeOpp({
        id: row.oppId,
        title: `Cast circular share — ${row.role}`,
        description: `Circular resource sharing node for ${row.owner}.`,
        creatorId: row.owner,
        ownerKind: row.owner.startsWith('seed-co') ? 'company' : 'user',
        intent: 'need',
        status: 'published',
        role: row.role,
        skills: row.skills,
        topology: 'circular',
        model: 'resource_sharing',
        exchangeMode: 'hybrid',
        modelType: 'resource_pooling',
        subModelType: 'resource_sharing',
      }),
    )
  }
}
castMatches.push({
  id: 'demo-pm-cast-circular-enterprise',
  matchType: 'circular',
  status: 'discovered',
  matchScore: 0.86,
  runId: 'seed-run-cast-coverage',
  participants: circularIds.map((row, i) => ({
    userId: row.owner,
    opportunityId: row.oppId,
    role: i === 0 ? 'need_owner' : 'offer_provider',
    participantStatus: 'pending',
    respondedAt: null,
  })),
  payload: {
    needOpportunityId: circularIds[0].oppId,
    offerOpportunityId: circularIds[1].oppId,
    ring: circularIds.map((r) => r.oppId),
    castCoverage: true,
    breakdown: {
      skillMatch: 0.85,
      attributeOverlap: 0.8,
      serviceOverlapPct: 0.82,
      exchangeCompatibility: 1,
      valueCompatibility: 0.7,
      budgetFit: 0.85,
      timelineFit: 0.9,
      locationFit: 1,
      reputation: 0.5,
    },
  },
  createdAt: '2026-07-13T12:00:00.000Z',
  updatedAt: '2026-07-13T12:00:00.000Z',
  expiresAt: '2026-08-13T12:00:00.000Z',
  isReplacement: false,
})

// Employees: participate on employer-owned cast matches (participant userId = employee)
const employees = [
  { id: 'seed-emp-001', employer: 'seed-co-corp-001' },
  { id: 'seed-emp-002', employer: 'seed-co-corp-001' },
  { id: 'seed-emp-003', employer: 'seed-co-corp-001' },
  { id: 'seed-emp-004', employer: 'seed-co-corp-002' },
  { id: 'seed-emp-005', employer: 'seed-co-corp-002' },
  { id: 'seed-emp-006', employer: 'seed-co-corp-003' },
  { id: 'seed-emp-007', employer: 'seed-co-corp-003' },
  { id: 'seed-emp-008', employer: 'seed-co-corp-007' },
  { id: 'seed-emp-009', employer: 'seed-co-corp-007' },
  { id: 'seed-emp-010', employer: 'seed-co-corp-011' },
  { id: 'seed-emp-011', employer: 'seed-co-corp-011' },
  { id: 'seed-emp-012', employer: 'seed-co-corp-013' },
  { id: 'seed-emp-013', employer: 'seed-co-corp-008' },
  { id: 'seed-emp-014', employer: 'seed-co-corp-015' },
]

// Ensure each employer has a company-owned opp for employee participation
const employersNeedingOpp = [...new Set(employees.map((e) => e.employer))]
for (const employerId of employersNeedingOpp) {
  const oppId = `seed-opp-cast-emp-host-${employerId}`
  if (!castOpps.some((o) => o.id === oppId) && !opportunities.data.some((o) => o.id === oppId)) {
    const coMeta = unusedCompanies.find((c) => c.id === employerId)
    castOpps.push(
      makeOpp({
        id: oppId,
        title: `Employee-hosted company need — ${employerId}`,
        description: `Employer opportunity used for employee cast participation under ${employerId}.`,
        creatorId: employerId,
        ownerKind: 'company',
        intent: 'need',
        status: 'published',
        role: coMeta?.role ?? 'Project Manager',
        skills: coMeta?.skills ?? ['Project Management', 'Coordination'],
        topology: 'one_way',
        model: 'cash_subcontracting',
        subModelType: 'task_based',
      }),
    )
  }
}

employees.forEach((emp, idx) => {
  const hostOppId = `seed-opp-cast-emp-host-${emp.employer}`
  const partnerPro = unusedPros[idx % unusedPros.length]
  const partnerOppId = `seed-opp-cast-emp-partner-${emp.id}`
  castOpps.push(
    makeOpp({
      id: partnerOppId,
      title: `Employee cast partner offer — ${emp.id}`,
      description: `Partner offer matched to employee actor ${emp.id} on employer ${emp.employer}.`,
      creatorId: partnerPro.id,
      ownerKind: 'user',
      intent: 'offer',
      status: 'published',
      role: partnerPro.role,
      skills: partnerPro.skills,
      topology: 'one_way',
      model: 'cash_subcontracting',
    }),
  )
  castMatches.push(
    makeMatch({
      id: `demo-pm-cast-emp-${emp.id}`,
      matchType: 'one_way',
      participants: [
        {
          // Employee acts as company-side participant; opportunity remains employer-owned
          userId: emp.id,
          opportunityId: hostOppId,
          role: 'need_owner',
          participantStatus: 'accepted',
          respondedAt: '2026-07-13T12:30:00.000Z',
          actingForPartyId: `party-company-${emp.employer}`,
          actingForWorkspaceId: `ws-company-${emp.employer}`,
        },
        {
          userId: partnerPro.id,
          opportunityId: partnerOppId,
          role: 'offer_provider',
          participantStatus: 'pending',
          respondedAt: null,
        },
      ],
      needOpportunityId: hostOppId,
      offerOpportunityId: partnerOppId,
    }),
  )
})

// Pending drafts (no published match required)
castOpps.push(
  makeOpp({
    id: 'seed-opp-cast-pending-001-draft',
    title: 'Pending review draft — civil support package',
    description: 'Draft opportunity owned by pending professional (not publishable until approved).',
    creatorId: 'seed-pending-001',
    ownerKind: 'pending_user',
    intent: 'need',
    status: 'draft',
    role: 'Civil Engineer',
    skills: ['Civil Engineering', 'Site Support'],
    topology: 'one_way',
    model: 'cash_subcontracting',
  }),
  makeOpp({
    id: 'seed-opp-cast-pending-002-draft',
    title: 'Clarification draft — MEP coordination',
    description: 'Draft opportunity owned while clarification is requested.',
    creatorId: 'seed-pending-002',
    ownerKind: 'pending_user',
    intent: 'offer',
    status: 'draft',
    role: 'MEP Engineer',
    skills: ['MEP Coordination', 'Shop Drawings'],
    topology: 'one_way',
    model: 'hiring',
  }),
  makeOpp({
    id: 'seed-opp-cast-pending-co-001-draft',
    title: 'Company onboarding draft — steel supply capability',
    description: 'Draft opportunity during company registrant onboarding/vetting.',
    creatorId: 'seed-pending-co-001',
    ownerKind: 'pending_user',
    intent: 'offer',
    status: 'draft',
    role: 'Steel Supplier',
    skills: ['Steel Supply', 'Fabrication'],
    topology: 'one_way',
    model: 'cash_subcontracting',
  }),
)

writeJson('demo-cast-coverage-opportunities.json', {
  domain: 'opportunities',
  version: '1.0',
  description: 'Cast-coverage opportunities so every demo account owns or participates in a scenario',
  data: castOpps,
})

writeJson('demo-cast-coverage-matches.json', {
  domain: 'post_matches',
  version: '1.0',
  description: 'Cast-coverage post-matches linking unused demo accounts into realistic scenarios',
  data: castMatches,
})

// Admin cast: notification + audit host rows
const notifications = readJson('demo-notifications.json')
const adminNotifId = 'seed-notif-cast-admin-walkthrough'
if (!notifications.data.some((n) => n.id === adminNotifId)) {
  notifications.data.push({
    id: adminNotifId,
    userId: 'user-admin-001',
    type: 'system',
    title: 'Demo Walkthrough host',
    message:
      'You are the Demo Walkthrough host. Open Admin → Environments to guide trainers through all four matching topologies.',
    read: false,
    createdAt: '2026-07-13T12:00:00.000Z',
    link: '/admin/environments',
    entityType: 'environment',
    entityId: 'demo-walkthrough',
  })
  writeJson('demo-notifications.json', notifications)
}

const audit = readJson('demo-audit.json')
const adminAuditId = 'seed-audit-cast-admin-walkthrough'
if (!audit.data.some((a) => a.id === adminAuditId)) {
  audit.data.push({
    id: adminAuditId,
    userId: 'user-admin-001',
    action: 'demo_walkthrough_host_assigned',
    entityType: 'environment',
    entityId: 'demo-walkthrough',
    details: {
      summary: 'Admin assigned as Demo Walkthrough host',
      castCoverage: true,
      role: 'walkthrough_host',
    },
    ipAddress: '127.0.0.1',
    timestamp: '2026-07-13T12:00:00.000Z',
  })
  writeJson('demo-audit.json', audit)
}

console.log(
  JSON.stringify(
    {
      enrichedDemos: Object.keys(DEMO_META).length,
      castOpps: castOpps.length,
      castMatches: castMatches.length,
      sampleDemo: opportunities.data.find((o) => o.id === 'seed-opp-demo-bulk')?.preferredMatchingTopology,
      bulkRole: opportunities.data.find((o) => o.id === 'seed-opp-demo-bulk')?.attributes?.targetRole,
    },
    null,
    2,
  ),
)
