/**
 * Add 40 new opportunities: 10 NEEDS, 10 OFFERS, 10 BARTER, 10 CONSORTIUM.
 * Run from repo root: node POC/scripts/add-40-opportunities.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = 'demo-40-opportunities.json';
const NOW = new Date().toISOString().replace(/\.\d{3}Z$/, '.000Z');

function load() {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, FILE), 'utf8'));
}

function save(obj) {
  fs.writeFileSync(path.join(DATA_DIR, FILE), JSON.stringify(obj, null, 2), 'utf8');
}

function base(id, title, description, creatorId, intent, exchangeMode, location, region, scope, exchangeData, attributes, industry) {
  const isBarter = exchangeMode === 'barter';
  const o = {
    id,
    title,
    description,
    creatorId,
    intent,
    status: 'published',
    modelType: 'project_based',
    subModelType: scope.memberRoles ? 'consortium' : (attributes.availability ? 'project' : 'task_based'),
    location,
    locationCountry: 'sa',
    locationRegion: region,
    exchangeMode,
    scope,
    exchangeData,
    attributes,
    createdAt: NOW,
    updatedAt: NOW,
    paymentModes: [exchangeMode],
    industry
  };
  if (isBarter) o.value_exchange = { mode: 'barter', estimated_value: exchangeData.barterValue };
  if (scope.memberRoles) o.modelType = 'project_based';
  return o;
}

const newOpportunities = [
  // ---- 10 NEEDS (intent: request) ----
  base(
    'demo-need-41',
    'Need: Site supervision for residential compound',
    'Seeking site supervision and quality control for 120-unit residential compound in Riyadh. Cash payment.',
    'demo-c02',
    'request',
    'cash',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      requiredSkills: ['Construction Site Management', 'Quality Control', 'Stakeholder Management'],
      sectors: ['Construction'],
      scopeOfWork: 'Site supervision and quality control for residential compound; daily reporting and handover.',
      milestones: ['Mobilization', 'Supervision period', 'Snagging and handover']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 120000, max: 150000, currency: 'SAR' } },
    { startDate: '2026-06-01', endDate: '2027-03-31', locationRequirement: 'On-Site' },
    'Construction'
  ),
  base(
    'demo-need-42',
    'Need: BIM coordination for mixed-use tower',
    'BIM coordination and clash detection for 25-storey mixed-use. Budget 80K SAR.',
    'demo-c06',
    'request',
    'cash',
    'Jeddah, Saudi Arabia',
    'makkah',
    {
      requiredSkills: ['BIM', 'Clash Detection', 'Navisworks', '3D Modeling'],
      sectors: ['Construction'],
      scopeOfWork: 'BIM coordination and clash detection; federated model and resolution reports.',
      milestones: ['Model setup', 'Coordination phase', 'Sign-off and as-built']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 70000, max: 90000, currency: 'SAR' } },
    { startDate: '2026-07-01', endDate: '2026-12-31', locationRequirement: 'Hybrid' },
    'Construction'
  ),
  base(
    'demo-need-43',
    'Need: Cost estimation for hospital project',
    'Cost estimation and BOQ for 200-bed hospital. Cash.',
    'demo-c01',
    'request',
    'cash',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      requiredSkills: ['Cost Estimation', 'Bill of Quantities', 'Value Engineering'],
      sectors: ['Construction'],
      scopeOfWork: 'Cost estimation and BOQ for hospital project; value engineering input.',
      milestones: ['Scope and data', 'Estimation phase', 'Report and BOQ delivery']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 45000, max: 60000, currency: 'SAR' } },
    { startDate: '2026-05-01', endDate: '2026-08-31', locationRequirement: 'Hybrid' },
    'Construction'
  ),
  base(
    'demo-need-44',
    'Need: Sustainability and LEED advisory',
    'LEED and sustainability advisory for Grade A office building. Budget 35K SAR.',
    'demo-c02',
    'request',
    'cash',
    'Jeddah, Saudi Arabia',
    'makkah',
    {
      requiredSkills: ['LEED Certification', 'Energy Modeling', 'Sustainable Design'],
      sectors: ['Construction'],
      scopeOfWork: 'LEED certification and sustainability advisory; energy modeling and documentation.',
      milestones: ['Assessment', 'Design support', 'Submission and certification']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 30000, max: 40000, currency: 'SAR' } },
    { startDate: '2026-06-01', endDate: '2026-11-30', locationRequirement: 'Remote' },
    'Construction'
  ),
  base(
    'demo-need-45',
    'Need: Claims and dispute support',
    'Claims analysis and dispute resolution support for ongoing project. Cash.',
    'demo-c01',
    'request',
    'cash',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      requiredSkills: ['Claims Management', 'Claims Analysis', 'Dispute Resolution', 'FIDIC Contracts'],
      sectors: ['Construction'],
      scopeOfWork: 'Claims analysis and dispute resolution; FIDIC-based support.',
      milestones: ['Review and strategy', 'Analysis and documentation', 'Settlement support']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 55000, max: 75000, currency: 'SAR' } },
    { startDate: '2026-04-01', endDate: '2026-09-30', locationRequirement: 'Hybrid' },
    'Construction'
  ),
  base(
    'demo-need-46',
    'Need: Geotechnical investigation',
    'Geotechnical investigation and report for infrastructure project. Budget 90K SAR.',
    'demo-c05',
    'request',
    'cash',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      requiredSkills: ['Structural Engineering', 'Technical Consulting', 'Documentation'],
      sectors: ['Infrastructure'],
      scopeOfWork: 'Geotechnical investigation and report; recommendations for foundation design.',
      milestones: ['Site investigation', 'Lab and analysis', 'Report delivery']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 80000, max: 100000, currency: 'SAR' } },
    { startDate: '2026-05-15', endDate: '2026-08-15', locationRequirement: 'On-Site' },
    'Infrastructure'
  ),
  base(
    'demo-need-47',
    'Need: Interior design and FF&E',
    'Interior design and FF&E specification for hotel. Cash.',
    'demo-c06',
    'request',
    'cash',
    'Jeddah, Saudi Arabia',
    'makkah',
    {
      requiredSkills: ['Interior Design', 'FF&E Specification', 'Space Planning', 'Material Selection'],
      sectors: ['Construction'],
      scopeOfWork: 'Interior design and FF&E specification for hotel; coordination with MEP.',
      milestones: ['Concept and schematic', 'Design development', 'FF&E spec and tender support']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 110000, max: 140000, currency: 'SAR' } },
    { startDate: '2026-07-01', endDate: '2027-02-28', locationRequirement: 'Hybrid' },
    'Construction'
  ),
  base(
    'demo-need-48',
    'Need: Primavera P6 scheduling',
    'Scheduling and progress control using Primavera P6 for highway package. Budget 65K SAR.',
    'demo-c05',
    'request',
    'cash',
    'Eastern Province, Saudi Arabia',
    'eastern',
    {
      requiredSkills: ['Primavera P6', 'Scheduling', 'Planning', 'Stakeholder Management'],
      sectors: ['Infrastructure'],
      scopeOfWork: 'Schedule development and progress control; Primavera P6 and reporting.',
      milestones: ['Baseline schedule', 'Progress updates', 'Forecast and close-out']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 55000, max: 75000, currency: 'SAR' } },
    { startDate: '2026-06-01', endDate: '2026-12-31', locationRequirement: 'Hybrid' },
    'Infrastructure'
  ),
  base(
    'demo-need-49',
    'Need: Fire protection design',
    'Fire protection and life-safety design for commercial building. Cash.',
    'demo-u03',
    'request',
    'cash',
    'Dammam, Saudi Arabia',
    'eastern',
    {
      requiredSkills: ['Fire Protection', 'MEP Design', 'BIM'],
      sectors: ['Construction'],
      scopeOfWork: 'Fire protection and life-safety design; coordination with MEP and authority submissions.',
      milestones: ['Design development', 'Coordination', 'Submission and approval']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 38000, max: 50000, currency: 'SAR' } },
    { startDate: '2026-05-01', endDate: '2026-09-30', locationRequirement: 'Remote' },
    'Construction'
  ),
  base(
    'demo-need-50',
    'Need: Urban planning and masterplan review',
    'Urban planning and masterplan review for mixed-use district. Budget 95K SAR.',
    'demo-c04',
    'request',
    'cash',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      requiredSkills: ['Urban Planning', 'Architectural Design', 'Sustainable Design'],
      sectors: ['Real Estate'],
      scopeOfWork: 'Urban planning and masterplan review; zoning and phasing recommendations.',
      milestones: ['Data and baseline', 'Review and options', 'Report and recommendations']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 85000, max: 110000, currency: 'SAR' } },
    { startDate: '2026-06-01', endDate: '2026-11-30', locationRequirement: 'Hybrid' },
    'Real Estate'
  ),
  // ---- 10 OFFERS (intent: offer) ----
  base(
    'demo-offer-41',
    'Offer: Site supervision and quality control',
    'Experienced site supervision and QC for building projects. Rate 12K–15K SAR/month.',
    'demo-u21',
    'offer',
    'cash',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      offeredSkills: ['Construction Site Management', 'Quality Control', 'Stakeholder Management', 'Documentation'],
      sectors: ['Construction'],
      scopeOfWork: 'Site supervision and quality control; daily reports and handover.',
      milestones: ['Mobilization', 'Supervision period', 'Snagging and handover']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 12000, max: 15000, currency: 'SAR' } },
    { availability: { start: '2026-04-01', end: '2027-06-30' }, locationRequirement: 'On-Site' },
    'Construction'
  ),
  base(
    'demo-offer-42',
    'Offer: BIM coordination and clash detection',
    'BIM coordination and clash detection using Navisworks. Rate 75K–95K SAR per project.',
    'demo-u08',
    'offer',
    'cash',
    'Dammam, Saudi Arabia',
    'eastern',
    {
      offeredSkills: ['BIM', 'Clash Detection', 'Navisworks', '3D Modeling', 'Revit MEP'],
      sectors: ['Construction'],
      scopeOfWork: 'BIM coordination and clash detection; federated model and resolution.',
      milestones: ['Model setup', 'Coordination phase', 'Sign-off and as-built']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 75000, max: 95000, currency: 'SAR' } },
    { availability: { start: '2026-05-01', end: '2027-03-31' }, locationRequirement: 'Hybrid' },
    'Construction'
  ),
  base(
    'demo-offer-43',
    'Offer: Cost estimation and BOQ',
    'Cost estimation and BOQ for building and infrastructure. Rate 40K–65K SAR.',
    'demo-u09',
    'offer',
    'cash',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      offeredSkills: ['Cost Estimation', 'Bill of Quantities', 'Value Engineering', 'Tendering'],
      sectors: ['Construction'],
      scopeOfWork: 'Cost estimation and BOQ; value engineering and tender support.',
      milestones: ['Scope and data', 'Estimation phase', 'Report and BOQ delivery']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 40000, max: 65000, currency: 'SAR' } },
    { availability: { start: '2026-04-01', end: '2026-12-31' }, locationRequirement: 'Hybrid' },
    'Construction'
  ),
  base(
    'demo-offer-44',
    'Offer: LEED and sustainability advisory',
    'LEED certification and sustainability advisory. Rate 30K–45K SAR.',
    'demo-u32',
    'offer',
    'cash',
    'Jeddah, Saudi Arabia',
    'makkah',
    {
      offeredSkills: ['LEED Certification', 'Energy Modeling', 'Sustainable Design', 'Environmental Assessment'],
      sectors: ['Construction'],
      scopeOfWork: 'LEED and sustainability advisory; energy modeling and certification support.',
      milestones: ['Assessment', 'Design support', 'Submission and certification']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 30000, max: 45000, currency: 'SAR' } },
    { availability: { start: '2026-05-01', end: '2027-01-31' }, locationRequirement: 'Remote' },
    'Construction'
  ),
  base(
    'demo-offer-45',
    'Offer: Claims and dispute resolution',
    'Claims analysis and dispute resolution; FIDIC experience. Rate 50K–80K SAR.',
    'demo-u16',
    'offer',
    'cash',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      offeredSkills: ['Claims Management', 'Claims Analysis', 'Dispute Resolution', 'FIDIC Contracts', 'Contract Administration'],
      sectors: ['Construction'],
      scopeOfWork: 'Claims analysis and dispute resolution; FIDIC-based support.',
      milestones: ['Review and strategy', 'Analysis and documentation', 'Settlement support']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 50000, max: 80000, currency: 'SAR' } },
    { availability: { start: '2026-04-01', end: '2026-12-31' }, locationRequirement: 'Hybrid' },
    'Construction'
  ),
  base(
    'demo-offer-46',
    'Offer: Geotechnical and foundation advisory',
    'Geotechnical investigation and foundation advisory. Rate 85K–110K SAR.',
    'demo-u17',
    'offer',
    'cash',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      offeredSkills: ['Structural Engineering', 'Technical Consulting', 'Documentation'],
      sectors: ['Infrastructure'],
      scopeOfWork: 'Geotechnical investigation and foundation advisory; report and recommendations.',
      milestones: ['Site investigation', 'Lab and analysis', 'Report delivery']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 85000, max: 110000, currency: 'SAR' } },
    { availability: { start: '2026-05-01', end: '2026-12-31' }, locationRequirement: 'On-Site' },
    'Infrastructure'
  ),
  base(
    'demo-offer-47',
    'Offer: Interior design and FF&E',
    'Interior design and FF&E specification for hospitality and commercial. Rate 100K–130K SAR.',
    'demo-u24',
    'offer',
    'cash',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      offeredSkills: ['Interior Design', 'FF&E Specification', 'Space Planning', 'Material Selection', '3D Visualization'],
      sectors: ['Construction'],
      scopeOfWork: 'Interior design and FF&E; concept through tender support.',
      milestones: ['Concept and schematic', 'Design development', 'FF&E spec and tender support']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 100000, max: 130000, currency: 'SAR' } },
    { availability: { start: '2026-06-01', end: '2027-06-30' }, locationRequirement: 'Hybrid' },
    'Construction'
  ),
  base(
    'demo-offer-48',
    'Offer: Primavera P6 and scheduling',
    'Scheduling and progress control with Primavera P6. Rate 60K–80K SAR per project.',
    'demo-u28',
    'offer',
    'cash',
    'Jeddah, Saudi Arabia',
    'makkah',
    {
      offeredSkills: ['Primavera P6', 'Scheduling', 'Planning', 'MS Project', 'Stakeholder Management'],
      sectors: ['Infrastructure'],
      scopeOfWork: 'Schedule development and progress control; P6 and reporting.',
      milestones: ['Baseline schedule', 'Progress updates', 'Forecast and close-out']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 60000, max: 80000, currency: 'SAR' } },
    { availability: { start: '2026-05-01', end: '2027-06-30' }, locationRequirement: 'Hybrid' },
    'Infrastructure'
  ),
  base(
    'demo-offer-49',
    'Offer: Fire protection and life-safety design',
    'Fire protection and life-safety design for buildings. Rate 35K–52K SAR.',
    'demo-u31',
    'offer',
    'cash',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      offeredSkills: ['Fire Protection', 'MEP Design', 'BIM', 'Electrical Systems'],
      sectors: ['Construction'],
      scopeOfWork: 'Fire protection and life-safety design; authority submissions.',
      milestones: ['Design development', 'Coordination', 'Submission and approval']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 35000, max: 52000, currency: 'SAR' } },
    { availability: { start: '2026-05-01', end: '2026-12-31' }, locationRequirement: 'Remote' },
    'Construction'
  ),
  base(
    'demo-offer-50',
    'Offer: Urban planning and masterplan review',
    'Urban planning and masterplan review for developments. Rate 90K–120K SAR.',
    'demo-u20',
    'offer',
    'cash',
    'Eastern Province, Saudi Arabia',
    'eastern',
    {
      offeredSkills: ['Urban Planning', 'Architectural Design', 'Sustainable Design', 'Technical Consulting'],
      sectors: ['Real Estate'],
      scopeOfWork: 'Urban planning and masterplan review; zoning and phasing.',
      milestones: ['Data and baseline', 'Review and options', 'Report and recommendations']
    },
    { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 90000, max: 120000, currency: 'SAR' } },
    { availability: { start: '2026-06-01', end: '2027-03-31' }, locationRequirement: 'Hybrid' },
    'Real Estate'
  ),
  // ---- 10 BARTER (exchangeMode: barter) ----
  base(
    'demo-barter-41',
    'Need: Training space for 2-day workshop',
    'Need training/meeting space for 2-day workshop. Barter with consulting or design services.',
    'demo-u14',
    'request',
    'barter',
    'Jeddah, Saudi Arabia',
    'makkah',
    {
      requiredSkills: ['Facility Management', 'Space Planning'],
      sectors: ['Real Estate'],
      scopeOfWork: 'Training or meeting space for 2 days; capacity 20–30; AV and catering optional.',
      milestones: ['Booking confirmed', 'Event days', 'Close-out']
    },
    { exchangeMode: 'barter', currency: 'SAR', barterValue: 8000 },
    { startDate: '2026-06-01', endDate: '2026-08-31' },
    'Real Estate'
  ),
  base(
    'demo-barter-42',
    'Offer: 2-day workshop facilitation',
    'Offer 2-day project management or technical workshop. Barter for space or services.',
    'demo-u33',
    'offer',
    'barter',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      offeredSkills: ['Project Management', 'Technical Training', 'Stakeholder Management'],
      sectors: ['Construction'],
      scopeOfWork: '2-day workshop facilitation; materials and certificates included.',
      milestones: ['Agenda and materials', 'Workshop delivery', 'Feedback and certificates']
    },
    { exchangeMode: 'barter', currency: 'SAR', barterValue: 12000 },
    { availability: { start: '2026-05-01', end: '2026-12-31' } },
    'Construction'
  ),
  base(
    'demo-barter-43',
    'Need: Translation and documentation review',
    'Need Arabic–English translation and documentation review for tender. Barter with design or PM support.',
    'demo-u04',
    'request',
    'barter',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      requiredSkills: ['Technical Writing', 'Documentation'],
      sectors: ['Construction'],
      scopeOfWork: 'Translation and documentation review for tender package.',
      milestones: ['Scope agreed', 'Draft and review', 'Final delivery']
    },
    { exchangeMode: 'barter', currency: 'SAR', barterValue: 9000 },
    { startDate: '2026-05-15', endDate: '2026-07-15' },
    'Construction'
  ),
  base(
    'demo-barter-44',
    'Offer: Marketing and branding for consultancy',
    'Offer marketing and branding support for consultancy. Barter for technical or office services.',
    'demo-u18',
    'offer',
    'barter',
    'Jeddah, Saudi Arabia',
    'makkah',
    {
      offeredSkills: ['Technical Consulting', 'Communication'],
      sectors: ['Construction'],
      scopeOfWork: 'Marketing and branding support; website or collateral.',
      milestones: ['Brief and concept', 'Production', 'Delivery']
    },
    { exchangeMode: 'barter', currency: 'SAR', barterValue: 15000 },
    { availability: { start: '2026-04-01', end: '2026-12-31' } },
    'Construction'
  ),
  base(
    'demo-barter-45',
    'Need: Legal review of JV agreement',
    'Need legal review of JV/consortium agreement. Barter with engineering or cost services.',
    'demo-u25',
    'request',
    'barter',
    'Dammam, Saudi Arabia',
    'eastern',
    {
      requiredSkills: ['Construction Law', 'Contract Drafting', 'Negotiation'],
      sectors: ['Construction'],
      scopeOfWork: 'Legal review of JV or consortium agreement; mark-up and negotiation support.',
      milestones: ['Document review', 'Mark-up and advice', 'Negotiation support']
    },
    { exchangeMode: 'barter', currency: 'SAR', barterValue: 18000 },
    { startDate: '2026-05-01', endDate: '2026-07-31' },
    'Construction'
  ),
  base(
    'demo-barter-46',
    'Offer: Value engineering study',
    'Value engineering study for building or infrastructure. Barter for office space or legal.',
    'demo-u09',
    'offer',
    'barter',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      offeredSkills: ['Value Engineering', 'Cost Estimation', 'Technical Consulting'],
      sectors: ['Construction'],
      scopeOfWork: 'Value engineering study; options and cost impact.',
      milestones: ['Data and baseline', 'Options development', 'Report and presentation']
    },
    { exchangeMode: 'barter', currency: 'SAR', barterValue: 16000 },
    { availability: { start: '2026-04-01', end: '2026-11-30' } },
    'Construction'
  ),
  base(
    'demo-barter-47',
    'Need: CAD and drawing production support',
    'Need CAD and drawing production for 2–3 weeks. Barter with quantity surveying or site support.',
    'demo-u22',
    'request',
    'barter',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      requiredSkills: ['AutoCAD', '3D Modeling', 'Documentation'],
      sectors: ['Construction'],
      scopeOfWork: 'CAD and drawing production; as per scope list.',
      milestones: ['Scope and templates', 'Production', 'Issue and archive']
    },
    { exchangeMode: 'barter', currency: 'SAR', barterValue: 11000 },
    { startDate: '2026-06-01', endDate: '2026-07-15' },
    'Construction'
  ),
  base(
    'demo-barter-48',
    'Offer: Health and safety audit',
    'Health and safety audit and report for site. Barter for materials or equipment access.',
    'demo-u26',
    'offer',
    'barter',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      offeredSkills: ['Technical Consulting', 'Risk Assessment', 'Documentation'],
      sectors: ['Construction'],
      scopeOfWork: 'Health and safety audit; report and recommendations.',
      milestones: ['Site visit', 'Report draft', 'Final and presentation']
    },
    { exchangeMode: 'barter', currency: 'SAR', barterValue: 10000 },
    { availability: { start: '2026-05-01', end: '2026-12-31' } },
    'Construction'
  ),
  base(
    'demo-barter-49',
    'Need: Mentoring for junior PM',
    'Need 4-session mentoring for junior project manager. Barter with design or admin support.',
    'demo-u15',
    'request',
    'barter',
    'Riyadh, Saudi Arabia',
    'riyadh',
    {
      requiredSkills: ['Mentoring', 'Project Management', 'Professional Development'],
      sectors: ['Construction'],
      scopeOfWork: '4 mentoring sessions; PM and delivery focus.',
      milestones: ['Kick-off', 'Sessions 2–4', 'Summary and follow-up']
    },
    { exchangeMode: 'barter', currency: 'SAR', barterValue: 7000 },
    { startDate: '2026-05-01', endDate: '2026-06-30' },
    'Construction'
  ),
  base(
    'demo-barter-50',
    'Offer: Mentoring and PM coaching',
    'Offer mentoring and PM coaching (4 sessions). Barter for workspace or consulting.',
    'demo-u07',
    'offer',
    'barter',
    'Jeddah, Saudi Arabia',
    'makkah',
    {
      offeredSkills: ['Mentoring', 'Project Management', 'PMP', 'Professional Development'],
      sectors: ['Construction'],
      scopeOfWork: 'Mentoring and PM coaching; 4 sessions.',
      milestones: ['Kick-off', 'Sessions 2–4', 'Summary and follow-up']
    },
    { exchangeMode: 'barter', currency: 'SAR', barterValue: 8000 },
    { availability: { start: '2026-04-01', end: '2026-12-31' } },
    'Construction'
  ),
  // ---- 10 CONSORTIUM (subModelType: consortium) ----
  (() => {
    const o = base(
      'demo-consortium-41',
      'Need: Solar plant EPC — equity, EPC, and O&M partners',
      'Large solar plant project seeking equity partner, EPC contractor, and O&M provider for consortium.',
      'demo-c05',
      'request',
      'cash',
      'Riyadh, Saudi Arabia',
      'riyadh',
      {
        requiredSkills: ['Infrastructure Development', 'Project Management', 'MEP Services', 'Energy Efficiency'],
        sectors: ['Energy'],
        scopeOfWork: 'Solar plant EPC; consortium of equity, EPC, and O&M partners.',
        milestones: ['Consortium formation', 'Design and permits', 'Construction', 'Commissioning', 'O&M handover'],
        memberRoles: [
          { role: 'Equity partner', scope: 'Equity or debt financing' },
          { role: 'EPC contractor', scope: 'Design, procurement, construction' },
          { role: 'O&M provider', scope: 'Long-term operation and maintenance' }
        ]
      },
      { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 8000000, max: 25000000, currency: 'SAR' } },
      { startDate: '2026-09-01', endDate: '2028-12-31', memberRoles: [{ role: 'Equity partner', scope: 'Financing' }, { role: 'EPC contractor', scope: 'EPC' }, { role: 'O&M provider', scope: 'O&M' }] },
      'Energy'
    );
    o.subModelType = 'consortium';
    o.attributes.locationRequirement = 'On-Site';
    return o;
  })(),
  (() => {
    const o = base(
      'demo-consortium-42',
      'Need: Airport expansion — design, construction, and systems partners',
      'Airport expansion package seeking design lead, construction partner, and systems integrator.',
      'demo-c04',
      'request',
      'cash',
      'Jeddah, Saudi Arabia',
      'makkah',
      {
        requiredSkills: ['Architectural Design', 'General Contracting', 'Systems Integration', 'Project Management'],
        sectors: ['Infrastructure'],
        scopeOfWork: 'Airport expansion; design, construction, and systems consortium.',
        milestones: ['Consortium formation', 'Design and authority', 'Construction', 'Systems and commissioning', 'Handover'],
        memberRoles: [
          { role: 'Design lead', scope: 'Architecture and engineering' },
          { role: 'Construction partner', scope: 'Civil and building works' },
          { role: 'Systems integrator', scope: 'BMS, IT, and MEP systems' }
        ]
      },
      { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 15000000, max: 40000000, currency: 'SAR' } },
      { startDate: '2026-10-01', endDate: '2029-06-30', memberRoles: [{ role: 'Design lead', scope: 'Design' }, { role: 'Construction partner', scope: 'Construction' }, { role: 'Systems integrator', scope: 'Systems' }] },
      'Infrastructure'
    );
    o.subModelType = 'consortium';
    o.attributes.locationRequirement = 'On-Site';
    return o;
  })(),
  (() => {
    const o = base(
      'demo-consortium-43',
      'Need: Desalination plant — financial, EPC, and technology partners',
      'Desalination plant project seeking financial partner, EPC lead, and technology provider.',
      'demo-c05',
      'request',
      'cash',
      'Eastern Province, Saudi Arabia',
      'eastern',
      {
        requiredSkills: ['Infrastructure Development', 'MEP Services', 'Project Management', 'Utilities Engineering'],
        sectors: ['Energy'],
        scopeOfWork: 'Desalination plant; financial, EPC, and technology consortium.',
        milestones: ['Consortium formation', 'FEED and permits', 'Construction', 'Commissioning', 'Handover'],
        memberRoles: [
          { role: 'Financial partner', scope: 'Equity or project finance' },
          { role: 'EPC lead', scope: 'EPC delivery' },
          { role: 'Technology provider', scope: 'Process and technology' }
        ]
      },
      { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 20000000, max: 60000000, currency: 'SAR' } },
      { startDate: '2026-11-01', endDate: '2029-12-31', memberRoles: [{ role: 'Financial partner', scope: 'Finance' }, { role: 'EPC lead', scope: 'EPC' }, { role: 'Technology provider', scope: 'Technology' }] },
      'Energy'
    );
    o.subModelType = 'consortium';
    o.attributes.locationRequirement = 'On-Site';
    return o;
  })(),
  (() => {
    const o = base(
      'demo-consortium-44',
      'Need: District cooling — developer, EPC, and operator partners',
      'District cooling scheme seeking developer lead, EPC contractor, and long-term operator.',
      'demo-c06',
      'request',
      'cash',
      'Jeddah, Saudi Arabia',
      'makkah',
      {
        requiredSkills: ['MEP Design', 'HVAC Design', 'Project Management', 'Facility Management'],
        sectors: ['Energy'],
        scopeOfWork: 'District cooling; developer, EPC, and operator consortium.',
        milestones: ['Consortium formation', 'Design and permits', 'Construction', 'Commissioning', 'Operation'],
        memberRoles: [
          { role: 'Developer lead', scope: 'Development and offtake' },
          { role: 'EPC contractor', scope: 'Plant and network EPC' },
          { role: 'Operator', scope: 'Long-term operation' }
        ]
      },
      { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 12000000, max: 35000000, currency: 'SAR' } },
      { startDate: '2026-09-01', endDate: '2028-06-30', memberRoles: [{ role: 'Developer lead', scope: 'Development' }, { role: 'EPC contractor', scope: 'EPC' }, { role: 'Operator', scope: 'O&M' }] },
      'Energy'
    );
    o.subModelType = 'consortium';
    o.attributes.locationRequirement = 'On-Site';
    return o;
  })(),
  (() => {
    const o = base(
      'demo-consortium-45',
      'Need: Rail depot — civil, MEP, and rolling stock partners',
      'Rail depot project seeking civil works partner, MEP partner, and rolling stock/maintenance provider.',
      'demo-c05',
      'request',
      'cash',
      'Riyadh, Saudi Arabia',
      'riyadh',
      {
        requiredSkills: ['Infrastructure Development', 'General Contracting', 'MEP Services', 'Project Management'],
        sectors: ['Infrastructure'],
        scopeOfWork: 'Rail depot; civil, MEP, and rolling stock consortium.',
        milestones: ['Consortium formation', 'Design', 'Civil and MEP construction', 'Systems and commissioning', 'Handover'],
        memberRoles: [
          { role: 'Civil partner', scope: 'Civil and structures' },
          { role: 'MEP partner', scope: 'MEP and systems' },
          { role: 'Rolling stock / maintenance', scope: 'Rolling stock and depot O&M' }
        ]
      },
      { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 25000000, max: 70000000, currency: 'SAR' } },
      { startDate: '2026-12-01', endDate: '2029-12-31', memberRoles: [{ role: 'Civil partner', scope: 'Civil' }, { role: 'MEP partner', scope: 'MEP' }, { role: 'Rolling stock', scope: 'Rolling stock' }] },
      'Infrastructure'
    );
    o.subModelType = 'consortium';
    o.attributes.locationRequirement = 'On-Site';
    return o;
  })(),
  (() => {
    const o = base(
      'demo-consortium-46',
      'Need: Healthcare campus — design, construction, and medical equipment partners',
      'Healthcare campus seeking design lead, construction partner, and medical equipment/systems provider.',
      'demo-c02',
      'request',
      'cash',
      'Riyadh, Saudi Arabia',
      'riyadh',
      {
        requiredSkills: ['Architectural Design', 'General Contracting', 'MEP Design', 'Project Management'],
        sectors: ['Construction'],
        scopeOfWork: 'Healthcare campus; design, construction, and medical equipment consortium.',
        milestones: ['Consortium formation', 'Design and authority', 'Construction', 'Fit-out and equipment', 'Handover'],
        memberRoles: [
          { role: 'Design lead', scope: 'Architecture and MEP design' },
          { role: 'Construction partner', scope: 'Building and fit-out' },
          { role: 'Medical equipment provider', scope: 'Equipment and systems' }
        ]
      },
      { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 18000000, max: 50000000, currency: 'SAR' } },
      { startDate: '2026-10-01', endDate: '2029-03-31', memberRoles: [{ role: 'Design lead', scope: 'Design' }, { role: 'Construction partner', scope: 'Construction' }, { role: 'Medical equipment', scope: 'Equipment' }] },
      'Construction'
    );
    o.subModelType = 'consortium';
    o.attributes.locationRequirement = 'On-Site';
    return o;
  })(),
  (() => {
    const o = base(
      'demo-consortium-47',
      'Need: Data center — developer, MEP, and IT partners',
      'Data center project seeking developer, MEP/cooling contractor, and IT/security partner.',
      'demo-c04',
      'request',
      'cash',
      'Riyadh, Saudi Arabia',
      'riyadh',
      {
        requiredSkills: ['Data Center Design', 'MEP Design', 'Project Management', 'BIM'],
        sectors: ['Construction'],
        scopeOfWork: 'Data center; developer, MEP, and IT consortium.',
        milestones: ['Consortium formation', 'Design and permits', 'Construction', 'MEP and IT fit-out', 'Commissioning'],
        memberRoles: [
          { role: 'Developer', scope: 'Development and offtake' },
          { role: 'MEP contractor', scope: 'Cooling and power' },
          { role: 'IT / security partner', scope: 'IT and security systems' }
        ]
      },
      { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 22000000, max: 55000000, currency: 'SAR' } },
      { startDate: '2026-11-01', endDate: '2029-06-30', memberRoles: [{ role: 'Developer', scope: 'Development' }, { role: 'MEP contractor', scope: 'MEP' }, { role: 'IT partner', scope: 'IT' }] },
      'Construction'
    );
    o.subModelType = 'consortium';
    o.attributes.locationRequirement = 'On-Site';
    return o;
  })(),
  (() => {
    const o = base(
      'demo-consortium-48',
      'Need: Logistics hub — land, construction, and operator partners',
      'Logistics hub seeking land/developer partner, construction partner, and operator.',
      'demo-c02',
      'request',
      'cash',
      'Eastern Province, Saudi Arabia',
      'eastern',
      {
        requiredSkills: ['Infrastructure Development', 'General Contracting', 'Logistics', 'Project Management'],
        sectors: ['Infrastructure'],
        scopeOfWork: 'Logistics hub; land, construction, and operator consortium.',
        milestones: ['Consortium formation', 'Design and permits', 'Construction', 'Fit-out', 'Operation'],
        memberRoles: [
          { role: 'Land / developer', scope: 'Land and development' },
          { role: 'Construction partner', scope: 'Buildings and yard' },
          { role: 'Operator', scope: 'Logistics operation' }
        ]
      },
      { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 14000000, max: 38000000, currency: 'SAR' } },
      { startDate: '2026-09-01', endDate: '2028-12-31', memberRoles: [{ role: 'Land/developer', scope: 'Land' }, { role: 'Construction partner', scope: 'Construction' }, { role: 'Operator', scope: 'Operation' }] },
      'Infrastructure'
    );
    o.subModelType = 'consortium';
    o.attributes.locationRequirement = 'On-Site';
    return o;
  })(),
  (() => {
    const o = base(
      'demo-consortium-49',
      'Need: University campus — design, construction, and FM partners',
      'University campus expansion seeking design lead, construction partner, and FM provider.',
      'demo-c06',
      'request',
      'cash',
      'Jeddah, Saudi Arabia',
      'makkah',
      {
        requiredSkills: ['Architectural Design', 'General Contracting', 'Facility Management', 'Project Management'],
        sectors: ['Construction'],
        scopeOfWork: 'University campus; design, construction, and FM consortium.',
        milestones: ['Consortium formation', 'Design and authority', 'Construction', 'Commissioning', 'FM handover'],
        memberRoles: [
          { role: 'Design lead', scope: 'Architecture and engineering' },
          { role: 'Construction partner', scope: 'Construction delivery' },
          { role: 'FM provider', scope: 'Long-term facility management' }
        ]
      },
      { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 30000000, max: 80000000, currency: 'SAR' } },
      { startDate: '2026-10-01', endDate: '2030-06-30', memberRoles: [{ role: 'Design lead', scope: 'Design' }, { role: 'Construction partner', scope: 'Construction' }, { role: 'FM provider', scope: 'FM' }] },
      'Construction'
    );
    o.subModelType = 'consortium';
    o.attributes.locationRequirement = 'On-Site';
    return o;
  })(),
  (() => {
    const o = base(
      'demo-consortium-50',
      'Need: Industrial park — master developer, utilities, and construction partners',
      'Industrial park seeking master developer, utilities partner, and construction partners.',
      'demo-c04',
      'request',
      'cash',
      'Riyadh, Saudi Arabia',
      'riyadh',
      {
        requiredSkills: ['Urban Planning', 'Infrastructure Development', 'Utilities Engineering', 'Project Management'],
        sectors: ['Infrastructure'],
        scopeOfWork: 'Industrial park; master developer, utilities, and construction consortium.',
        milestones: ['Consortium formation', 'Masterplan and permits', 'Infrastructure', 'Plot development', 'Handover'],
        memberRoles: [
          { role: 'Master developer', scope: 'Masterplan and development' },
          { role: 'Utilities partner', scope: 'Power, water, telecom' },
          { role: 'Construction partners', scope: 'Plot and building construction' }
        ]
      },
      { exchangeMode: 'cash', currency: 'SAR', budgetRange: { min: 35000000, max: 90000000, currency: 'SAR' } },
      { startDate: '2026-12-01', endDate: '2030-12-31', memberRoles: [{ role: 'Master developer', scope: 'Development' }, { role: 'Utilities partner', scope: 'Utilities' }, { role: 'Construction partners', scope: 'Construction' }] },
      'Infrastructure'
    );
    o.subModelType = 'consortium';
    o.attributes.locationRequirement = 'On-Site';
    return o;
  })()
];

// Fix subModelType for consortium (base() may set task_based when attributes has memberRoles but scope.memberRoles is used)
newOpportunities.forEach(o => {
  if (o.scope && o.scope.memberRoles) o.subModelType = 'consortium';
});

const file = load();
file.data = (file.data || []).concat(newOpportunities);
file.description = 'Demo dataset of 80 opportunities: original 40 plus 10 NEEDs, 10 OFFERs, 10 BARTER, 10 CONSORTIUM; full scope and milestones.';
save(file);
console.log('Added', newOpportunities.length, 'opportunities. Total:', file.data.length);
