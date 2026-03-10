/**
 * Enrich demo-40-opportunities: add industry, scopeOfWork, milestones;
 * normalize skills/sectors; redistribute some sectors; align paymentModes.
 * Run from repo root: node POC/scripts/enrich-demo-40-opportunities.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OPPORTUNITIES_FILE = 'demo-40-opportunities.json';

function loadJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function saveJson(filename, obj) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf8');
}

// Canonical sectors for distribution (Construction, Infrastructure, Real Estate, Energy, Architecture, Engineering Consulting)
const SECTOR_ALIAS = {
  'Engineering': 'Engineering Consulting',
  'Equipment Supply': 'Construction'
};

function normalizeSkill(s, skillSynonyms) {
  if (!s || typeof s !== 'string') return s;
  const key = s.trim().toLowerCase();
  return skillSynonyms[key] != null ? skillSynonyms[key] : s.trim();
}

function normalizeSkills(arr, skillSynonyms) {
  if (!Array.isArray(arr)) return arr;
  return arr.map(s => normalizeSkill(s, skillSynonyms)).filter(Boolean);
}

// scopeOfWork text by intent and title/description
function scopeOfWorkFor(o) {
  const title = (o.title || '').toLowerCase();
  const desc = o.description || '';
  if (o.intent === 'request') {
    if (title.includes('structural') && title.includes('shop')) return 'Shop drawing review for structural package; sign-off and as-built documentation.';
    if (title.includes('project management')) return 'Full project management and PMO for construction phase; planning, risk, stakeholder and handover.';
    if (title.includes('mep design')) return 'MEP design for commercial building; HVAC, electrical, and BIM coordination.';
    if (title.includes('quantity surveyor') || title.includes('tender')) return 'BOQ preparation and tender documentation; cost estimation and contract support.';
    if (title.includes('heavy equipment') || title.includes('excavator')) return 'Heavy equipment supply and operation for earthworks; excavators, bulldozers, and site logistics.';
    if (title.includes('engineering consulting') || title.includes('design review')) return 'Engineering consulting and design review; technical sign-off and recommendations.';
    if (title.includes('office space') || title.includes('co-working')) return 'Office or co-working space for agreed period; utilities and basic amenities included.';
    if (title.includes('accounting')) return 'Accounting, bookkeeping, and financial reporting for agreed period.';
    if (title.includes('construction materials')) return 'Supply of construction materials (rebar, formwork, cement) per specification.';
    if (title.includes('legal') || title.includes('contract review')) return 'Legal review of construction contract; contract drafting and negotiation support.';
    if (title.includes('highway') || title.includes('financial, construction')) return 'Highway project delivery: financial partner, construction partner, and equipment provider.';
    if (title.includes('mixed-use') && title.includes('design, mep')) return 'Mixed-use development: design lead, MEP contractor, and project manager.';
    if (title.includes('design review') && title.includes('structural')) return 'Structural design review and technical sign-off.';
    return desc.slice(0, 200) || 'Scope as per description.';
  }
  // offer
  if (title.includes('structural')) return 'Structural engineering and shop drawing review; design and as-built support.';
  if (title.includes('project management') || title.includes('pmo')) return 'Project management and PMO; planning, risk, and delivery coordination.';
  if (title.includes('mep')) return 'MEP design and BIM; HVAC, electrical, and coordination.';
  if (title.includes('quantity') || title.includes('boq')) return 'Quantity surveying, BOQ, cost estimation, and tendering.';
  if (title.includes('heavy equipment') || title.includes('excavator') || title.includes('crane')) return 'Heavy equipment rental and operation; excavators, cranes, bulldozers as required.';
  if (title.includes('office space') || title.includes('co-working')) return 'Office or co-working space; flexible terms.';
  if (title.includes('engineering consulting') || title.includes('design review')) return 'Engineering consulting and design review across disciplines.';
  if (title.includes('accounting')) return 'Accounting, bookkeeping, and financial reporting.';
  if (title.includes('construction materials')) return 'Supply of construction materials; rebar, formwork, procurement.';
  if (title.includes('architectural')) return 'Architectural design, 3D visualization, and BIM.';
  if (title.includes('financial investment')) return 'Equity and debt financing for infrastructure projects.';
  if (title.includes('general contracting') || title.includes('civil works')) return 'Civil works and construction execution for infrastructure.';
  if (title.includes('road construction') || title.includes('earthworks')) return 'Road construction, earthworks, and civil package.';
  if (title.includes('tower crane') || title.includes('lifting')) return 'Tower cranes and lifting equipment for construction.';
  if (title.includes('structural design review') || title.includes('structural review')) return 'Structural design review and technical consulting.';
  return desc.slice(0, 200) || 'Scope as per description.';
}

// Milestones: consistent array of strings (phase names)
function milestonesFor(o) {
  const sub = o.subModelType || '';
  const title = (o.title || '').toLowerCase();
  if (sub === 'consortium' || (title.includes('highway') && title.includes('partners')) || (title.includes('mixed-use') && title.includes('design, mep'))) {
    return ['Mobilization and contract', 'Design and permits', 'Construction phase', 'Testing and commissioning', 'Final delivery and handover'];
  }
  if (sub === 'project' && (title.includes('project management') || title.includes('heavy equipment') || title.includes('excavator') || title.includes('road'))) {
    return ['Kick-off and planning', 'Execution phase', 'Final delivery'];
  }
  if (title.includes('structural') || title.includes('mep design') || title.includes('design review') || title.includes('quantity') || title.includes('tender')) {
    return ['Scope and deliverables agreed', 'Design/review or BOQ phase', 'Sign-off and handover'];
  }
  if (title.includes('office space') || title.includes('co-working')) return ['Agreement and access', 'Period of use', 'Exit and handback'];
  if (title.includes('accounting') || title.includes('legal')) return ['Engagement start', 'Service period', 'Deliverables and close-out'];
  if (title.includes('construction materials')) return ['Order and specification', 'Supply and delivery', 'Acceptance'];
  return ['Planning phase', 'Execution phase', 'Final delivery'];
}

// Sector redistribution: assign to Energy, Architecture, Engineering Consulting
const ID_TO_SECTOR_OVERRIDE = {
  'demo-group-lead-02': ['Construction'],
  'demo-group-offer-04': ['Architecture'],
  'demo-barter-oe-15': ['Architecture'],
  'demo-barter-na-11': ['Engineering Consulting'],
  'demo-barter-ob-12': ['Engineering Consulting'],
  'demo-circ-o35': ['Engineering Consulting'],
  'demo-group-offer-01': ['Infrastructure'],
  'demo-oneway-need-03': ['Energy'],   // MEP for building/plant
  'demo-oneway-offer-03': ['Energy'],  // MEP design and BIM (energy projects)
  'demo-group-offer-05': ['Energy'],   // MEP design and installation (e.g. plants)
};

// Industry label from sector
function industryFromSector(sectors) {
  const s = (Array.isArray(sectors) && sectors[0]) ? sectors[0] : 'Construction';
  if (s === 'Engineering Consulting') return 'Engineering Consulting';
  if (s === 'Architecture') return 'Architecture';
  if (s === 'Infrastructure') return 'Infrastructure';
  if (s === 'Real Estate') return 'Real Estate';
  if (s === 'Financial') return 'Financial';
  if (s === 'Energy') return 'Energy';
  return 'Construction';
}

function run() {
  const skillCanonical = loadJson('skill-canonical.json') || {};
  const skillSynonyms = Object.fromEntries(
    Object.entries(skillCanonical.skillSynonyms || {}).map(([k, v]) => [k.toLowerCase().trim(), v])
  );
  // Add mappings for skills used in opportunities (canonical names for matching)
  skillSynonyms['highway'] = 'Road Construction';
  skillSynonyms['excavator'] = 'Heavy Equipment';
  skillSynonyms['legal'] = 'Construction Law';
  skillSynonyms['financial investment'] = 'Project Management';
  skillSynonyms['co-working'] = 'Facility Management';
  skillSynonyms['office space'] = 'Facility Management';
  skillSynonyms['tax advisory'] = 'Contract Negotiation';
  skillSynonyms['civil works'] = 'General Contracting';

  const file = loadJson(OPPORTUNITIES_FILE);
  const data = file.data || [];
  const updatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, '.000Z');

  data.forEach((o, idx) => {
    const scope = o.scope || {};
    const sectors = scope.sectors || ['Construction'];
    const sectorOverride = ID_TO_SECTOR_OVERRIDE[o.id];
    const finalSectors = sectorOverride || sectors;
    const industry = industryFromSector(finalSectors);

    // Root-level industry
    o.industry = industry;

    // scope.sectors (possibly redistributed)
    scope.sectors = Array.isArray(finalSectors) ? finalSectors : [finalSectors];

    // scope.scopeOfWork
    scope.scopeOfWork = scopeOfWorkFor(o);

    // scope.milestones
    scope.milestones = milestonesFor(o);

    // Normalize skills
    if (Array.isArray(scope.requiredSkills) && scope.requiredSkills.length) {
      scope.requiredSkills = normalizeSkills(scope.requiredSkills, skillSynonyms);
    }
    if (Array.isArray(scope.offeredSkills) && scope.offeredSkills.length) {
      scope.offeredSkills = normalizeSkills(scope.offeredSkills, skillSynonyms);
    }

    // paymentModes aligned with exchangeMode
    const mode = o.exchangeMode === 'barter' ? 'barter' : 'cash';
    o.paymentModes = Array.isArray(o.paymentModes) ? o.paymentModes : [mode];
    if (o.paymentModes[0] !== mode) o.paymentModes = [mode];

    o.updatedAt = updatedAt;
    o.scope = scope;
  });

  file.version = '1.1';
  file.description = 'Demo dataset of 40 opportunities with full scope, industry, and milestones; suitable for matching.';
  saveJson(OPPORTUNITIES_FILE, file);
  console.log('Enriched', data.length, 'opportunities. Updated', OPPORTUNITIES_FILE);
}

run();
