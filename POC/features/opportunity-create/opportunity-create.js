/**
 * Opportunity Create Component - Wizard Flow
 */

let currentStep = 1;
const TOTAL_STEPS = 7;
let allLocations = [];
/** Index of last used demo scenario so each fill prefers a different one when possible. */
let lastDemoDatasetIndex = -1;

/**
 * Picks a random demo scenario (never the same as the previous fill when multiple exist).
 */
function pickRandomDemoDataset() {
    const n = DEMO_DATASETS.length;
    if (n <= 1) return DEMO_DATASETS[0];
    let idx;
    do {
        idx = Math.floor(Math.random() * n);
    } while (idx === lastDemoDatasetIndex);
    lastDemoDatasetIndex = idx;
    return DEMO_DATASETS[idx];
}

/**
 * Demo datasets for "Fill Demo Data" – each use loads a random scenario from this list.
 * step1: title, description, locationKey ('riyadh' | 'jeddah' | 'remote').
 * step2: intent ('request' | 'offer').
 * step3: skills, sectors, interests (arrays).
 * step4: category, subModel, modelFields (object key -> value for dynamic Step 4 fields).
 * step5: budgetMin, budgetMax, exchangeMode, currency, modeFields, agreement.
 * step6: status.
 */
const DEMO_DATASETS = [
    {
        projectType: 'single',
        step1: {
            title: 'Structural Engineering Services for Commercial Building Project',
            description: 'We are seeking an experienced structural engineer to provide design and consultation services for a new 5-story commercial building in Riyadh. The project involves reinforced concrete design, foundation analysis, and construction supervision.',
            locationKey: 'riyadh'
        },
        step2: { intent: 'request' },
        step3: {
            skills: ['Structural Engineering', 'Reinforced Concrete', 'Foundation Design', 'Construction Supervision'],
            sectors: ['Construction', 'Real Estate'],
            interests: ['Sustainability', 'BIM'],
            certifications: ['PMP', 'PE']
        },
        step4: {
            category: 'project_based',
            subModel: 'task_based',
            modelFields: {
                taskTitle: 'Structural Design and Analysis for Commercial Building',
                taskType: 'Engineering',
                detailedScope: 'Provide complete structural engineering services including:\n- Structural analysis and design for 5-story reinforced concrete building\n- Foundation design and soil analysis\n- Construction drawings and specifications\n- Site visits and construction supervision',
                duration: '90',
                requiredSkills: 'Structural Engineering, Reinforced Concrete Design, Foundation Design, AutoCAD, ETABS',
                experienceLevel: 'Senior',
                locationRequirement: 'Hybrid',
                startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                deliverableFormat: 'PDF drawings, CAD files, calculation reports'
            }
        },
        step5: {
            budgetMin: '50000',
            budgetMax: '75000',
            exchangeMode: 'cash',
            currency: 'SAR',
            modeFields: {
                cashAmount: '60000',
                cashPaymentTerms: 'milestone_based',
                cashMilestones: '30% upon contract signing, 40% at design completion, 30% upon final delivery.',
                exchangeTermsSummary: 'Payment in SAR. Invoicing monthly. 5% retention released 30 days after project completion.'
            },
            agreement: true
        },
        step6: { status: 'draft' }
    },
    {
        projectType: 'multi',
        step1: {
            title: 'Regional Rollout — Multi-Site Deployment Program',
            description: 'Program-wide engagement covering multiple sites under one umbrella contract. Work packages may be staffed independently while sharing governance and reporting.',
            locationKey: 'riyadh'
        },
        step2: { intent: 'request' },
        step3: {
            skills: ['Program Management', 'Construction Supervision', 'Quality Assurance'],
            sectors: ['Construction', 'Infrastructure'],
            interests: ['Multi-site', 'Rollout'],
            certifications: ['PMP']
        },
        step4: {
            category: 'project_based',
            subModel: 'task_based',
            modelFields: {
                taskTitle: 'Phase A — Design integration & permits',
                taskType: 'Program',
                detailedScope: 'Overall program scope spans multiple work packages listed separately. Each package has clear deliverables under the same opportunity record.',
                duration: '180',
                requiredSkills: 'Program Management, Construction Supervision',
                experienceLevel: 'Senior',
                locationRequirement: 'Hybrid',
                startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                deliverableFormat: 'Reports, site logs, sign-off packs per package'
            }
        },
        step4MultiTasks: [
            { title: 'Phase A — Design integration & permits', duration: '60', notes: 'Consolidated design alignment across sites; permit submissions.' },
            { title: 'Phase B — Field execution & handover', duration: '120', notes: 'Construction oversight, commissioning, and close-out.' }
        ],
        step5: {
            budgetMin: '800000',
            budgetMax: '1200000',
            exchangeMode: 'cash',
            currency: 'SAR',
            modeFields: {
                cashAmount: '1000000',
                cashPaymentTerms: 'milestone_based',
                cashMilestones: 'Per work package milestones aligned to program gates.',
                exchangeTermsSummary: 'SAR. Milestones tied to each work package completion.'
            },
            agreement: true
        },
        step6: { status: 'draft' }
    },
    {
        projectType: 'multi',
        step1: {
            title: 'Strategic JV Partnership – Construction & Engineering',
            description: 'We offer a long-term strategic joint venture in construction and engineering. Seeking a partner for equity participation, shared governance, and expansion across the GCC.',
            locationKey: 'jeddah'
        },
        step2: { intent: 'offer' },
        step3: {
            skills: ['Strategic Partnerships', 'JV Management', 'Construction', 'Engineering'],
            sectors: ['Construction', 'Real Estate', 'Infrastructure'],
            interests: ['GCC Expansion', 'Equity Partnerships'],
            certifications: ['ISO 9001', 'JV Governance']
        },
        step4: {
            category: 'strategic_partnership',
            subModel: 'strategic_jv',
            modelFields: {
                jvName: 'GCC Construction Partners JV',
                strategicObjective: 'Establish a leading construction and engineering JV for GCC projects.',
                businessScope: 'Design, build, and operate infrastructure and building projects across Saudi Arabia and GCC.',
                targetSectors: ['Construction', 'Energy', 'Real Estate'],
                geographicScope: ['Saudi Arabia', 'GCC'],
                duration: '10-15 years',
                jvStructure: 'Incorporated LLC',
                equitySplit: '50, 50',
                initialCapital: '5000000',
                ongoingFunding: 'Partner Contributions',
                partnerContributions: [
                    { label: 'Partner A', value: 'Capital 2.5M SAR, technical lead' },
                    { label: 'Partner B', value: 'Capital 2.5M SAR, regional operations' }
                ],
                managementStructure: 'Lead Partner',
                governance: 'Board of 4 directors (2 per partner). Quarterly meetings. Major decisions require 75% approval.',
                profitDistribution: 'Proportional to Equity',
                exitOptions: ['Buyout', 'Sale to Third Party', 'Dissolution'],
                nonCompete: true,
                technologyTransfer: false,
                partnerRequirements: [
                    { label: 'Minimum turnover', value: '50M SAR annually' },
                    { label: 'Experience', value: '5+ years in GCC construction' }
                ],
                requiredSkills: 'JV Management, Construction, Project Finance'
            }
        },
        step5: {
            budgetMin: '100000',
            budgetMax: '500000',
            exchangeMode: 'equity',
            currency: null,
            modeFields: {
                equityPercentage: '40',
                equityVesting: '2_years',
                equityContribution: 'Join our JV: 40% equity for expertise and regional presence. Vesting over 2 years.',
                exchangeTermsSummary: 'Equity subject to shareholder agreement. Board seat optional.'
            },
            agreement: true
        },
        step6: { status: 'draft' }
    },
    {
        projectType: 'multi',
        step1: {
            title: 'Consortium – Large-Scale Infrastructure Tender',
            description: 'Request for consortium members for a major infrastructure tender. Profit-sharing and scope division by trade. Lead member role available.',
            locationKey: 'riyadh'
        },
        step2: { intent: 'request' },
        step3: {
            skills: ['Infrastructure', 'Consortium Management', 'Tendering', 'Civil Engineering'],
            sectors: ['Infrastructure', 'Government', 'Construction'],
            interests: ['PPP', 'Large Projects'],
            certifications: ['Prequalified MoT', 'CIDB']
        },
        step4: {
            category: 'project_based',
            subModel: 'consortium',
            modelFields: {
                projectTitle: 'Regional Highway and Bridge Package',
                projectType: 'Infrastructure',
                projectValue: '150000000',
                projectDuration: '36',
                projectLocation: 'Riyadh Region',
                leadMember: true,
                requiredMembers: '4',
                memberRoles: [
                    { label: 'Lead', value: 'Structural and civil design' },
                    { label: 'Member 2', value: 'MEP and utilities' },
                    { label: 'Member 3', value: 'Earthworks and roads' },
                    { label: 'Member 4', value: 'Bridge specialist' }
                ],
                scopeDivision: 'By Trade',
                liabilityStructure: 'Joint & Several',
                clientType: 'Government',
                tenderDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                prequalificationRequired: true,
                minimumRequirements: [
                    { label: 'Turnover', value: 'Min 30M SAR' },
                    { label: 'Similar projects', value: 'At least 2 in 5 years' }
                ],
                consortiumAgreement: true,
                paymentDistribution: 'Per Scope',
                requiredSkills: 'Infrastructure, Tendering, Consortium'
            }
        },
        step5: {
            budgetMin: '100000',
            budgetMax: '200000',
            exchangeMode: 'profit_sharing',
            currency: null,
            modeFields: {
                'profit-share-percentage': '15',
                'profit-basis': 'profit',
                'profit-duration': 'project',
                'profit-split': '60-40',
                'expected-profit': '500000',
                'profit-distribution': '60-40 profit split after costs, distributed quarterly.',
                exchangeTermsSummary: 'Profit share calculated after project costs. Quarterly distributions.'
            },
            agreement: true
        },
        step6: { status: 'draft' }
    },
    {
        projectType: 'single',
        step1: {
            title: 'Consulting Services Offer – Barter or Hybrid',
            description: 'We offer project management and sustainability consulting. Open to barter (office space, software licenses) or hybrid compensation.',
            locationKey: 'remote'
        },
        step2: { intent: 'offer' },
        step3: {
            skills: ['Project Management', 'Sustainability Consulting', 'Training'],
            sectors: ['Consulting', 'Construction', 'Technology'],
            interests: ['Barter', 'Flexible Engagement'],
            certifications: ['PMP', 'LEED AP']
        },
        step4: {
            category: 'hiring',
            subModel: 'consultant_hiring',
            modelFields: {
                consultationTitle: 'PM and Sustainability Consulting Package',
                consultationType: 'Project Management',
                scopeOfWork: 'Project management support and sustainability assessments for construction projects. Deliverables: reports, workshops, and recommendations.',
                deliverables: 'Reports, Workshops, Recommendations',
                duration: '90',
                requiredExpertise: 'PMP, LEED, Construction',
                requiredCertifications: 'PMP, LEED AP, or equivalent',
                experienceLevel: 'Senior',
                locationRequirement: 'Remote',
                budget: { min: '25000', max: '45000' },
                startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                requiredSkills: 'Project Management, Sustainability'
            }
        },
        step5: {
            budgetMin: '20000',
            budgetMax: '50000',
            exchangeMode: 'barter',
            currency: null,
            modeFields: {
                barterOffer: 'We offer project management and sustainability consulting (reports, workshops).',
                barterNeed: 'Office space or software licenses (e.g. BIM, PM tools) in exchange.',
                barterValue: 'Equivalent to 35K SAR',
                exchangeTermsSummary: 'Barter value approximate. Open to partial cash top-up if needed.'
            },
            agreement: true
        },
        step6: { status: 'draft' }
    },
    {
        projectType: 'multi',
        step1: {
            title: 'Bulk Steel Purchase – Consortium for Riyadh Projects',
            description: 'Organizing a bulk purchase of structural steel for multiple construction projects in Riyadh. Seeking 4–6 participants to achieve volume discount. Lead organizer; delivery to central depot.',
            locationKey: 'riyadh'
        },
        step2: { intent: 'request' },
        step3: {
            skills: ['Procurement', 'Construction Materials', 'Supply Chain'],
            sectors: ['Construction', 'Industrial', 'Infrastructure'],
            interests: ['Bulk Purchasing', 'Cost Savings'],
            certifications: []
        },
        step4: {
            category: 'resource_pooling',
            subModel: 'bulk_purchasing',
            modelFields: {
                productService: 'Structural Steel (I-beams, H-beams)',
                category: 'Materials',
                quantityNeeded: '2000',
                unitOfMeasure: 'tons',
                targetPrice: '3200',
                currentMarketPrice: '3500',
                expectedSavings: '8',
                deliveryTimeline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                deliveryLocation: 'Riyadh Industrial Area – Central Depot',
                paymentStructure: 'Escrow',
                participantsNeeded: '5',
                minimumOrder: '200',
                leadOrganizer: true,
                distributionMethod: 'Centralized Pickup',
                requiredSkills: 'Construction, Procurement'
            }
        },
        step5: {
            budgetMin: '6000000',
            budgetMax: '7000000',
            exchangeMode: 'cash',
            currency: 'SAR',
            modeFields: {
                cashAmount: '6400000',
                cashPaymentTerms: '30% deposit, 70% on delivery',
                cashMilestones: '30% upon order placement, 70% on delivery to depot.',
                exchangeTermsSummary: 'Payment in SAR. Escrow through platform. Centralized pickup within 14 days of delivery.'
            },
            agreement: true
        },
        step6: { status: 'draft' }
    },
    {
        projectType: 'single',
        step1: {
            title: 'Innovation Contest – Sustainable Construction Solutions',
            description: 'Open innovation contest for sustainable construction solutions. Winner receives 500K SAR and pilot opportunity. Open to companies and professionals. Submission deadline 60 days.',
            locationKey: 'riyadh'
        },
        step2: { intent: 'request' },
        step3: {
            skills: ['Sustainability', 'Innovation', 'Construction Technology', 'Green Building'],
            sectors: ['Construction', 'Real Estate', 'Technology'],
            interests: ['Sustainability', 'Innovation', 'Pilot Projects'],
            certifications: ['LEED', 'BREEAM']
        },
        step4: {
            category: 'competition',
            subModel: 'competition_rfp',
            modelFields: {
                competitionTitle: 'Sustainable Construction Solutions – Innovation Contest',
                competitionType: 'Innovation Contest',
                competitionScope: 'Submit innovative solutions for reducing carbon footprint in construction: materials, processes, or digital tools. Solutions must be pilot-ready within 12 months.',
                participantType: 'Both',
                competitionFormat: 'Open to All',
                eligibilityCriteria: [
                    { criteria: 'Registered company or licensed professional' },
                    { criteria: 'Relevant experience in construction or sustainability' }
                ],
                submissionRequirements: 'Concept Note, Technical Proposal, Cost Estimate, Team CVs',
                evaluationCriteria: [
                    { criteria: 'Innovation', weight: 35 },
                    { criteria: 'Feasibility', weight: 30 },
                    { criteria: 'Sustainability Impact', weight: 25 },
                    { criteria: 'Cost', weight: 10 }
                ],
                evaluationWeights: [35, 30, 25, 10],
                prizeContractValue: '500000',
                numberOfWinners: '3',
                submissionDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                announcementDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                competitionRules: 'Original work only. Shortlisted teams may be invited to pitch. Winner receives pilot contract.',
                intellectualProperty: 'Winner Transfers',
                submissionFee: '0',
                requiredSkills: 'Sustainability, Innovation, Construction'
            }
        },
        step5: {
            budgetMin: '400000',
            budgetMax: '600000',
            exchangeMode: 'cash',
            currency: 'SAR',
            modeFields: {
                cashAmount: '500000',
                cashPaymentTerms: 'Upon Completion',
                cashMilestones: 'Prize: 1st 300K, 2nd 150K, 3rd 50K SAR.',
                exchangeTermsSummary: 'Winners receive cash prizes. First place also receives pilot contract opportunity.'
            },
            agreement: true
        },
        step6: { status: 'draft' }
    }
];

// Initialize shared data object if it doesn't exist
if (!window.opportunityFormData) {
    window.opportunityFormData = {
        lookupsData: null,
        locationsData: null
    };
}

// Helper functions to get/set shared data
function getLookupsData() {
    return window.opportunityFormData.lookupsData;
}

function setLookupsData(data) {
    window.opportunityFormData.lookupsData = data;
}

function getLocationsData() {
    return window.opportunityFormData.locationsData;
}

function setLocationsData(data) {
    window.opportunityFormData.locationsData = data;
}

/** Get { lat, lng } for a city id from loaded locations (so new opportunities appear on map). */
function getCityCoords(cityId) {
    const locations = getLocationsData();
    if (!locations || !cityId) return null;
    for (const c of locations.countries || []) {
        for (const r of c.regions || []) {
            const city = (r.cities || []).find(ct => ct.id === cityId);
            if (city && city.lat != null && city.lng != null) {
                return { lat: city.lat, lng: city.lng };
            }
        }
    }
    return null;
}

async function initOpportunityCreate() {
    // Read-only demo: pending users can view but not submit
    if (authService.isPendingApproval && authService.isPendingApproval()) {
        const form = document.getElementById('opportunity-form');
        if (form) {
            const banner = document.createElement('div');
            banner.setAttribute('role', 'alert');
            banner.className = 'mb-4 p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900';
            banner.textContent = 'Your account is pending admin approval. You can explore the form but cannot create opportunities until approved.';
            form.insertBefore(banner, form.firstChild);
        }
        const submitBtn = document.getElementById('submit-form');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.setAttribute('title', 'Action disabled until your account is approved.');
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
        }
    }

    // Load data files
    await loadDataFiles();
    
    // Load opportunity models script if not loaded
    if (!window.OPPORTUNITY_MODELS) {
        await loadScript('src/business-logic/models/opportunity-models.js');
    }
    
    // Load form service if not loaded
    if (!window.opportunityFormService) {
        await loadScript('src/services/opportunities/opportunity-form-service.js');
    }
    
    await initializeForm();
    setupWizardNavigation();
    setupFormHandlers();
    setupDemoDataFiller();
    
    // Load rich text editor utility
    await loadScript('src/utils/rich-text-editor.js');
    
    // Initialize rich text editors
    setTimeout(() => {
        if (window.RichTextEditor) {
            window.RichTextEditor.initAll();
        }
    }, 200);
}

async function loadDataFiles() {
    try {
        // Use shared data if already loaded
        if (getLookupsData() && getLocationsData()) {
            flattenLocations();
            return;
        }
        
        const [lookupsRes, locationsRes] = await Promise.all([
            fetch('data/lookups.json'),
            fetch('data/locations.json')
        ]);
        
        const loadedLookups = await lookupsRes.json();
        const loadedLocations = await locationsRes.json();
        
        // Store in shared data object
        setLookupsData(loadedLookups);
        setLocationsData(loadedLocations);
        
        // Flatten locations for search
        flattenLocations();
    } catch (error) {
        console.error('Error loading data files:', error);
    }
}

function flattenLocations() {
    // No longer needed - we'll use cascading dropdowns instead
    allLocations = getLocationsData();
}

async function initializeForm() {
    setupLocationSearch();
    setupIntentLabels();
    setupScopeTags();
    setupCategoryAndSubModel();
    setupInlineAdvisor();
    setupExchangeModeSelection();
    setupMultiProjectTasks();
    setupReviewSummary();
}

function setupIntentLabels() {
    document.querySelectorAll('input[name="intent"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateScopeLabels();
        });
    });
}

function updateScopeLabels() {
    const intent = document.querySelector('input[name="intent"]:checked')?.value;
    const intro = document.getElementById('scope-intro');
    const skillsLabel = document.getElementById('scope-skills-label');
    if (!intro || !skillsLabel) return;
    if (intent === 'offer') {
        intro.textContent = 'Add offered services/skills, sectors, and interests. Used for matching.';
        skillsLabel.innerHTML = 'Offered services / skills <span class="text-red-600">*</span>';
    } else {
        intro.textContent = 'Add required services/skills, sectors, and interests. Used for matching.';
        skillsLabel.innerHTML = 'Required services / skills <span class="text-red-600">*</span>';
    }
}

function setupScopeTags() {
    ['scope-skills', 'scope-sectors', 'scope-interests', 'scope-certifications'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        let tags = [];
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const v = (el.value || '').trim().replace(/,/g, '');
                if (v) {
                    tags.push(v);
                    el.value = '';
                    renderScopeTags(el, tags);
                    hideScopeSkillSuggestions();
                }
            }
        });
        el.dataset.tagsArray = JSON.stringify(tags);

        if (id === 'scope-skills') {
            setupScopeSkillAutocomplete(el, tags);
        }
    });
}

function setupScopeSkillAutocomplete(el, tags) {
    const wrapper = el.closest('.form-group');
    if (!wrapper) return;
    wrapper.style.position = 'relative';

    let sugBox = wrapper.querySelector('.opp-skill-suggestions');
    if (!sugBox) {
        sugBox = document.createElement('div');
        sugBox.className = 'opp-skill-suggestions';
        sugBox.style.cssText = 'display:none;position:absolute;left:0;right:0;background:#fff;border:1px solid #d1d5db;border-radius:0.375rem;max-height:200px;overflow-y:auto;z-index:50;box-shadow:0 4px 12px rgba(0,0,0,0.1);';
        el.after(sugBox);
    }

    el.addEventListener('input', async () => {
        const q = el.value.trim();
        if (q.length < 1) { sugBox.style.display = 'none'; return; }
        const svc = window.skillService || (typeof skillService !== 'undefined' ? skillService : null);
        if (!svc) return;
        const catalog = await svc.getCatalog();
        const lq = q.toLowerCase();
        let html = '';
        for (const [cat, skills] of Object.entries(catalog)) {
            const matching = skills.filter(s =>
                s.toLowerCase().includes(lq) && !tags.includes(s)
            );
            if (matching.length > 0) {
                html += `<div style="padding:0.25rem 0.75rem;font-size:0.7rem;text-transform:uppercase;font-weight:600;color:#6b7280;background:#f9fafb;letter-spacing:0.05em;">${escapeHtml(cat)}</div>`;
                matching.forEach(s => {
                    html += `<div class="opp-skill-item" data-skill="${escapeHtml(s)}" style="padding:0.5rem 0.75rem;cursor:pointer;font-size:0.875rem;">${escapeHtml(s)}</div>`;
                });
            }
        }
        if (!html) html = '<div style="padding:0.5rem 0.75rem;color:#9ca3af;font-size:0.875rem;">No matching skills</div>';
        sugBox.innerHTML = html;
        sugBox.style.display = 'block';

        sugBox.querySelectorAll('.opp-skill-item').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const skill = item.dataset.skill;
                if (skill && !tags.includes(skill)) {
                    tags.push(skill);
                    renderScopeTags(el, tags);
                }
                el.value = '';
                sugBox.style.display = 'none';
            });
            item.addEventListener('mouseenter', () => { item.style.background = '#2563eb'; item.style.color = '#fff'; });
            item.addEventListener('mouseleave', () => { item.style.background = ''; item.style.color = ''; });
        });
    });

    el.addEventListener('blur', () => {
        setTimeout(() => { sugBox.style.display = 'none'; }, 200);
    });
}

function hideScopeSkillSuggestions() {
    document.querySelectorAll('.opp-skill-suggestions').forEach(el => { el.style.display = 'none'; });
}

function renderScopeTags(containerInput, tags) {
    const wrapper = containerInput.closest('.form-group');
    if (!wrapper) return;
    let tagEl = wrapper.querySelector('.scope-tags-display');
    if (!tagEl) {
        tagEl = document.createElement('div');
        tagEl.className = 'scope-tags-display flex flex-wrap gap-2 mt-2';
        containerInput.after(tagEl);
    }
    tagEl.innerHTML = tags.map((t, i) => `<span class="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-sm" data-tag-index="${i}">${escapeHtml(t)} <button type="button" class="ml-1 text-blue-600 hover:text-blue-800 scope-tag-remove" data-index="${i}" aria-label="Remove">&times;</button></span>`).join('');
    tagEl.querySelectorAll('.scope-tag-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            tags.splice(parseInt(btn.dataset.index, 10), 1);
            renderScopeTags(containerInput, tags);
            containerInput.dataset.tagsArray = JSON.stringify(tags);
        });
    });
    containerInput.dataset.tagsArray = JSON.stringify(tags);
}

function getScopeTagsFromInput(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return [];
    try {
        return JSON.parse(el.dataset.tagsArray || '[]');
    } catch {
        const v = (el.value || '').trim();
        return v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];
    }
}

function collectValueExpectedFromForm() {
    const container = document.getElementById('value-expected-list');
    if (!container) return [];
    const items = container.querySelectorAll('[data-value-expected-item]');
    const out = [];
    items.forEach(node => {
        const label = (node.querySelector('[data-value-expected-label]')?.textContent || node.textContent || '').trim();
        if (label) out.push({ label });
    });
    const tagsInput = document.getElementById('value-expected-tags');
    if (tagsInput) {
        try {
            const arr = JSON.parse(tagsInput.dataset.tagsArray || '[]');
            arr.forEach(t => out.push(typeof t === 'string' ? { label: t } : { label: t.label || t.description || '' }));
        } catch {
            const v = (tagsInput.value || '').trim();
            if (v) v.split(',').map(s => s.trim()).filter(Boolean).forEach(s => out.push({ label: s }));
        }
    }
    return out;
}

function getOpportunityModels() {
    return window.OPPORTUNITY_MODELS || {};
}

function getCurrentUserEntityType() {
    try {
        if (typeof authService !== 'undefined') {
            const user = authService.getCurrentUser();
            if (user) return user.profile?.type === 'company' ? 'company' : 'user';
        }
    } catch (e) { /* ignore */ }
    return null;
}

function renderSubModelOptions(categoryKey, clearSubModel) {
    const models = getOpportunityModels();
    const modelTypeInput = document.getElementById('model-type');
    const subModelTypeInput = document.getElementById('submodel-type');
    const submodelGroup = document.getElementById('submodel-group');
    const submodelOptions = document.getElementById('submodel-options');
    const modelDetailsSection = document.getElementById('model-details-section');
    const dynamicFields = document.getElementById('dynamic-fields');
    if (!modelTypeInput || !subModelTypeInput || !submodelGroup || !submodelOptions) return;
    if (clearSubModel !== false) {
        subModelTypeInput.value = '';
        if (modelDetailsSection) modelDetailsSection.style.display = 'none';
        if (dynamicFields) dynamicFields.innerHTML = '';
    }
    submodelOptions.innerHTML = '';
    submodelGroup.style.display = 'none';
    const category = models[categoryKey];
    if (!category || !category.subModels) return;

    const userType = getCurrentUserEntityType();
    const eligibility = (window.CONFIG && window.CONFIG.MODEL_ELIGIBILITY) || {};
    const subModelNames = {
        equipment_sharing: 'Equipment Sharing (Co-Ownership Pooling)'
    };

    Object.keys(category.subModels).forEach(subKey => {
        const sub = category.subModels[subKey];
        const displayName = subModelNames[subKey] || sub.name;
        const rule = eligibility[subKey];
        const isEligible = !rule || !userType || rule.allowedEntityTypes.includes(userType);

        const label = document.createElement('label');
        if (isEligible) {
            label.className = 'submodel-option p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-all has-[:checked]:border-primary has-[:checked]:bg-blue-50';
            label.innerHTML = `
                <input type="radio" name="submodel" value="${escapeHtml(subKey)}" class="sr-only">
                <span class="font-semibold text-gray-900">${escapeHtml(displayName)}</span>
            `;
            label.querySelector('input').addEventListener('change', () => {
                subModelTypeInput.value = subKey;
                if (modelDetailsSection) modelDetailsSection.style.display = 'block';
                renderDynamicFields(categoryKey, subKey);
                updateMultiProjectTasksUI();
            });
        } else {
            label.className = 'submodel-option submodel-disabled p-4 border-2 border-gray-100 rounded-lg opacity-50 cursor-not-allowed relative';
            label.title = rule.reason || 'Not available for your account type';
            label.innerHTML = `
                <span class="font-semibold text-gray-400">${escapeHtml(displayName)}</span>
                <span class="submodel-lock-icon"><i class="ph-duotone ph-lock-simple" aria-hidden="true"></i></span>
                <span class="submodel-restriction-note">${escapeHtml(rule.reason || '')}</span>
            `;
        }
        submodelOptions.appendChild(label);
    });
    submodelGroup.style.display = 'block';
}

function setupCategoryAndSubModel() {
    const modelTypeInput = document.getElementById('model-type');
    const submodelGroup = document.getElementById('submodel-group');
    const submodelOptions = document.getElementById('submodel-options');
    if (!modelTypeInput || !submodelGroup || !submodelOptions) return;

    document.querySelectorAll('input[name="category"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const categoryKey = radio.value;
            modelTypeInput.value = categoryKey;
            renderSubModelOptions(categoryKey, true);
        });
    });
}

function setupInlineAdvisor() {
    const toggle = document.getElementById('inline-advisor-toggle');
    const panel = document.getElementById('inline-advisor-panel');
    const closeBtn = document.getElementById('inline-advisor-close');
    const resultDiv = document.getElementById('inline-advisor-result');
    const recSpan = document.getElementById('inline-advisor-rec');
    const applyBtn = document.getElementById('inline-advisor-apply');
    const resetBtn = document.getElementById('inline-advisor-reset');
    if (!toggle || !panel) return;

    const advisorState = { q: 0, cats: null, subs: [] };
    const SUB_TO_CAT = {
        task_based: 'project_based', consortium: 'project_based', project_jv: 'project_based', spv: 'project_based',
        strategic_jv: 'strategic_partnership', strategic_alliance: 'strategic_partnership', mentorship: 'strategic_partnership',
        bulk_purchasing: 'resource_pooling', equipment_sharing: 'resource_pooling', resource_sharing: 'resource_pooling',
        professional_hiring: 'hiring', consultant_hiring: 'hiring',
        competition_rfp: 'competition'
    };
    const SUB_NAMES = {
        task_based: 'Task-Based Engagement', consortium: 'Consortium', project_jv: 'Project-Specific JV',
        spv: 'Special Purpose Vehicle (SPV)', strategic_jv: 'Strategic JV', strategic_alliance: 'Strategic Alliance',
        mentorship: 'Mentorship', bulk_purchasing: 'Bulk Purchasing', equipment_sharing: 'Equipment Sharing',
        resource_sharing: 'Resource Sharing', professional_hiring: 'Professional Hiring',
        consultant_hiring: 'Consultant Hiring', competition_rfp: 'Competition / RFP'
    };

    toggle.addEventListener('click', () => { panel.classList.remove('hidden'); toggle.style.display = 'none'; });
    closeBtn.addEventListener('click', () => { panel.classList.add('hidden'); toggle.style.display = ''; });

    function advanceQuestion(btn) {
        btn.parentElement.querySelectorAll('.inline-advisor-opt').forEach(o => o.classList.remove('selected'));
        btn.classList.add('selected');

        if (advisorState.q === 0) {
            advisorState.cats = btn.dataset.cats;
        }
        if (btn.dataset.subs) {
            const picked = btn.dataset.subs.split(',');
            advisorState.subs = advisorState.subs.length === 0 ? picked : advisorState.subs.filter(s => picked.includes(s));
        }

        const questions = panel.querySelectorAll('.inline-advisor-question');
        const nextQ = advisorState.q + 1;
        if (nextQ < questions.length) {
            advisorState.q = nextQ;
            questions.forEach((q, i) => q.style.display = i === nextQ ? '' : 'none');
        } else {
            showAdvisorResult();
        }
    }

    function showAdvisorResult() {
        panel.querySelectorAll('.inline-advisor-question').forEach(q => q.style.display = 'none');
        const userType = getCurrentUserEntityType();
        const eligibility = (window.CONFIG && window.CONFIG.MODEL_ELIGIBILITY) || {};
        let candidates = advisorState.subs.length > 0 ? advisorState.subs : Object.keys(SUB_NAMES);
        if (advisorState.cats) {
            candidates = candidates.filter(s => SUB_TO_CAT[s] === advisorState.cats);
        }
        candidates = candidates.filter(s => {
            const rule = eligibility[s];
            return !rule || !userType || rule.allowedEntityTypes.includes(userType);
        });
        const best = candidates[0] || 'task_based';
        advisorState.recommended = { sub: best, cat: SUB_TO_CAT[best] };
        recSpan.textContent = SUB_NAMES[best] || best;
        resultDiv.style.display = '';
    }

    panel.querySelectorAll('.inline-advisor-opt').forEach(btn => {
        btn.addEventListener('click', () => advanceQuestion(btn));
    });

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const rec = advisorState.recommended;
            if (!rec) return;
            const catRadio = document.querySelector(`input[name="category"][value="${rec.cat}"]`);
            if (catRadio) {
                catRadio.checked = true;
                catRadio.dispatchEvent(new Event('change', { bubbles: true }));
                setTimeout(() => {
                    const subRadio = document.querySelector(`input[name="submodel"][value="${rec.sub}"]`);
                    if (subRadio) {
                        subRadio.checked = true;
                        subRadio.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }, 100);
            }
            panel.classList.add('hidden');
            toggle.style.display = '';
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            advisorState.q = 0;
            advisorState.cats = null;
            advisorState.subs = [];
            advisorState.recommended = null;
            resultDiv.style.display = 'none';
            const questions = panel.querySelectorAll('.inline-advisor-question');
            questions.forEach((q, i) => {
                q.style.display = i === 0 ? '' : 'none';
                q.querySelectorAll('.inline-advisor-opt').forEach(o => o.classList.remove('selected'));
            });
        });
    }
}

function setupPaymentModes() {
    // Step 5 now uses single-select exchange mode cards via setupExchangeModeSelection(); no-op for backward compatibility.
}

function setupReviewSummary() {
    // Populated when entering step 6 in goToStep
}

function setupWizardNavigation() {
    const nextBtn = document.getElementById('next-step');
    const prevBtn = document.getElementById('prev-step');
    const submitBtn = document.getElementById('submit-form');
    const saveDraftBtn = document.getElementById('save-draft-wizard');
    const cancelBtn = document.getElementById('wizard-cancel');
    const form = document.getElementById('opportunity-form');
    if (!nextBtn || !prevBtn) return;

    if (saveDraftBtn && form) {
        saveDraftBtn.addEventListener('click', () => {
            const statusField = document.getElementById('status');
            if (statusField) statusField.value = 'draft';
            if (!validateStepsRange(1, 7)) return;
            form.requestSubmit();
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (typeof router !== 'undefined' && router.navigate) {
                router.navigate('/opportunities');
            } else {
                window.location.hash = '#/opportunities';
            }
        });
    }

    nextBtn.addEventListener('click', () => {
        if (validateCurrentStep()) {
            if (currentStep === 4) persistScopeTags();
            if (currentStep === 7) fillReviewSummary();
            goToStep(currentStep + 1);
        }
    });
    
    prevBtn.addEventListener('click', () => {
        goToStep(currentStep - 1);
    });
    
    updateWizardUI();
}

function persistScopeTags() {
    ['scope-skills', 'scope-sectors', 'scope-interests', 'scope-certifications'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const v = (el.value || '').trim().replace(/,/g, '');
        if (v) {
            try {
                const tags = JSON.parse(el.dataset.tagsArray || '[]');
                if (!tags.includes(v)) tags.push(v);
                el.dataset.tagsArray = JSON.stringify(tags);
                el.value = '';
                renderScopeTags(el, tags);
            } catch (e) {}
        }
    });
}

function fillReviewSummary() {
    const summary = document.getElementById('review-summary');
    if (!summary) return;
    const models = getOpportunityModels();
    const projectTypeEl = document.querySelector('input[name="projectType"]:checked');
    const projectTypeLabel = projectTypeEl ? (projectTypeEl.value === 'single' ? 'Single Project' : 'Multi Project') : '—';
    const title = document.getElementById('title')?.value || '—';
    const descRaw = document.getElementById('description')?.value || '—';
    const descPlain = plainTextFromHtml(descRaw);
    const descPreview = descPlain.length > 280 ? descPlain.slice(0, 280) + '…' : descPlain;
    const intentEl = document.querySelector('input[name="intent"]:checked');
    const intentLabel = intentEl ? (intentEl.value === 'request' ? 'NEED' : intentEl.value === 'hybrid' ? 'NEED + OFFER' : 'OFFER') : '—';
    const intent = intentLabel;
    const location = document.getElementById('location')?.value || document.getElementById('location-country')?.value || '—';
    const modelType = document.getElementById('model-type')?.value;
    const subModelType = document.getElementById('submodel-type')?.value;
    let categoryLabel = '—';
    let subModelLabel = '—';
    if (modelType && models[modelType]) {
        categoryLabel = models[modelType].name || modelType;
        if (subModelType && models[modelType].subModels && models[modelType].subModels[subModelType]) {
            subModelLabel = models[modelType].subModels[subModelType].name || subModelType;
        }
    }
    const exchangeMode = document.getElementById('exchange-mode')?.value;
    const modeNames = { cash: 'Cash', equity: 'Equity', profit_sharing: 'Profit sharing', barter: 'Barter', hybrid: 'Hybrid' };
    const modeLabel = exchangeMode ? (modeNames[exchangeMode] || exchangeMode) : '—';
    const budgetMin = document.getElementById('budgetRange_min')?.value;
    const budgetMax = document.getElementById('budgetRange_max')?.value;
    const budgetLabel = (budgetMin != null && budgetMax != null && budgetMin !== '' && budgetMax !== '') ? `${Number(budgetMin).toLocaleString()} – ${Number(budgetMax).toLocaleString()} SAR` : '—';
    const locationReq = document.getElementById('location-requirement')?.value?.trim();
    const attrStart = document.getElementById('attr-startDate')?.value?.trim();
    const attrDeadline = document.getElementById('attr-applicationDeadline')?.value?.trim();
    const attrEnd = document.getElementById('attr-endDate')?.value?.trim();
    const alsoLabels = Array.from(document.querySelectorAll('.accepted-mode-cb:checked'))
        .map(c => modeNames[c.value] || c.value)
        .filter(label => label && label !== modeLabel);
    const alsoOpenLine = alsoLabels.length ? alsoLabels.join(', ') : '';
    const altRows = collectAlternateExchangeDetailsFromForm();
    let alternateDetailsBlock = '';
    if (altRows.length) {
        alternateDetailsBlock = altRows.map(r => {
            const lab = ALT_MODE_LABELS[r.mode] || r.mode;
            let txt = '';
            if (r.mode === 'barter') {
                txt = [plainTextFromHtml(r.offer || ''), plainTextFromHtml(r.terms || '')].filter(Boolean).join(' — ');
            } else {
                txt = plainTextFromHtml(r.summary || '');
            }
            const short = txt.length > 200 ? txt.slice(0, 200) + '…' : txt;
            return `<div class="occ-review-row"><span class="occ-review-key">${escapeHtml(lab)} (alternate)</span><span class="occ-review-val">${escapeHtml(short || '—')}</span></div>`;
        }).join('');
    }
    const skills = getScopeTagsFromInput('scope-skills');
    let projectTasksBlock = '';
    if (isMultiProjectSelected()) {
        const pt = collectProjectTasksFromUI().filter(t => t.title);
        if (pt.length) {
            const items = pt.map(t => `<li>${escapeHtml(t.title)}</li>`).join('');
            projectTasksBlock = `
                <div class="occ-review-row occ-review-row--tasks">
                    <span class="occ-review-key">Work packages</span>
                    <ul class="occ-review-tasklist">${items}</ul>
                </div>`;
        }
    }
    let modelDetailsLine = '—';
    if (modelType && subModelType && window.opportunityFormService) {
        const attrs = window.opportunityFormService.getAttributes(modelType, subModelType);
        const keyLabels = [];
        ['taskTitle', 'projectTitle', 'jvName', 'projectName'].forEach(k => {
            if (attrs.some(a => a.key === k)) {
                const el = document.getElementById(k);
                const v = el?.value?.trim();
                if (v) keyLabels.push(v.slice(0, 40) + (v.length > 40 ? '…' : ''));
            }
        });
        if (keyLabels.length) modelDetailsLine = keyLabels.join('; ');
    }
    summary.innerHTML = `
        <div class="occ-review-summary">
            <div class="occ-review-grid">
                <div class="occ-review-row"><span class="occ-review-key">Project type</span><span class="occ-review-val">${escapeHtml(projectTypeLabel)}</span></div>
                <div class="occ-review-row"><span class="occ-review-key">Title</span><span class="occ-review-val">${escapeHtml(title)}</span></div>
                <div class="occ-review-row"><span class="occ-review-key">Intent</span><span class="occ-review-val">${escapeHtml(intent)}</span></div>
                <div class="occ-review-row"><span class="occ-review-key">Location</span><span class="occ-review-val">${escapeHtml(location)}</span></div>
                ${locationReq ? `<div class="occ-review-row"><span class="occ-review-key">Location requirement</span><span class="occ-review-val">${escapeHtml(locationReq)}</span></div>` : ''}
                ${(attrStart || attrDeadline || attrEnd) ? `<div class="occ-review-row"><span class="occ-review-key">Key dates</span><span class="occ-review-val">Start ${escapeHtml(attrStart || '—')} · Deadline ${escapeHtml(attrDeadline || '—')} · End ${escapeHtml(attrEnd || '—')}</span></div>` : ''}
                <div class="occ-review-row"><span class="occ-review-key">Category</span><span class="occ-review-val">${escapeHtml(categoryLabel)}</span></div>
                <div class="occ-review-row"><span class="occ-review-key">Sub-model</span><span class="occ-review-val">${escapeHtml(subModelLabel)}</span></div>
                <div class="occ-review-row"><span class="occ-review-key">Exchange mode</span><span class="occ-review-val">${escapeHtml(modeLabel)}</span></div>
                ${alsoOpenLine ? `<div class="occ-review-row"><span class="occ-review-key">Also open to</span><span class="occ-review-val">${escapeHtml(alsoOpenLine)}</span></div>` : ''}
                ${alternateDetailsBlock}
                <div class="occ-review-row"><span class="occ-review-key">Budget range</span><span class="occ-review-val">${escapeHtml(budgetLabel)}</span></div>
                <div class="occ-review-row"><span class="occ-review-key">Skills</span><span class="occ-review-val">${skills.length ? escapeHtml(skills.join(', ')) : '—'}</span></div>
                ${projectTasksBlock}
                <div class="occ-review-row"><span class="occ-review-key">Model details</span><span class="occ-review-val">${escapeHtml(modelDetailsLine)}</span></div>
            </div>
            <div class="occ-review-desc">
                <span class="occ-review-desc-label">Description</span>
                <p class="occ-review-desc-text">${escapeHtml(descPreview || '—')}</p>
            </div>
        </div>
    `;
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/** Strip tags for review / summaries (e.g. rich-text description). */
function plainTextFromHtml(html) {
    if (html == null || html === '') return '';
    const d = document.createElement('div');
    d.innerHTML = String(html);
    return (d.textContent || d.innerText || '').replace(/\s+/g, ' ').trim();
}

function validateCurrentStep() {
    const errorDiv = document.getElementById('form-error');
    errorDiv.classList.add('hidden');
    
    switch (currentStep) {
        case 1: {
            const projectType = document.querySelector('input[name="projectType"]:checked');
            if (!projectType) {
                showError('Please select a project type (Single Project or Multi Project)');
                return false;
            }
            break;
        }
        case 2: {
            const title = document.getElementById('title').value.trim();
            const country = document.getElementById('location-country').value;
            const region = document.getElementById('location-region').value;
            const city = document.getElementById('location-city').value;
            if (!title) {
                showError('Title is required');
                return false;
            }
            if (!country) {
                showError('Country is required');
                return false;
            }
            if (!region) {
                showError('Region is required');
                return false;
            }
            if (country !== 'remote' && !city) {
                showError('City is required');
                return false;
            }
            break;
        }
        case 3: {
            const intent = document.querySelector('input[name="intent"]:checked');
            if (!intent) {
                showError('Please select an intent (NEED, OFFER, or NEED + OFFER)');
                return false;
            }
            break;
        }
        case 4: {
            const skills = getScopeTagsFromInput('scope-skills');
            const scopeInput = document.getElementById('scope-skills');
            const pending = (scopeInput?.value || '').trim().replace(/,/g, '');
            if (skills.length === 0 && !pending) {
                showError('At least one service/skill is required');
                scopeInput?.focus();
                return false;
            }
            break;
        }
        case 5: {
            syncMultiTaskTitleFromRows();
            const modelType = document.getElementById('model-type')?.value;
            const subModelType = document.getElementById('submodel-type')?.value;
            if (!modelType) {
                showError('Please select a category');
                return false;
            }
            if (!subModelType) {
                showError('Please select a sub-model');
                return false;
            }
            const formService = window.opportunityFormService;
            if (formService) {
                const paymentFieldKeys = ['paymentTerms', 'exchangeType', 'barterOffer'];
                const attrs = formService.getAttributes(modelType, subModelType).filter(a => !paymentFieldKeys.includes(a.key));
                const form = document.getElementById('opportunity-form');
                for (const attr of attrs) {
                    if (!attr.required) continue;
                    if (attr.conditional && form) {
                        const watchEl = form.querySelector(`[name="${attr.conditional.field}"]`);
                        const watchVal = watchEl ? (watchEl.type === 'checkbox' ? watchEl.checked : watchEl.value) : null;
                        const values = Array.isArray(attr.conditional.value) ? attr.conditional.value : [attr.conditional.value];
                        if (!values.some(v => String(watchVal) === String(v))) continue;
                    }
                    if (attr.type === 'currency-range') {
                        const minEl = document.getElementById(`${attr.key}_min`) || document.querySelector(`[name="${attr.key}_min"]`);
                        const maxEl = document.getElementById(`${attr.key}_max`) || document.querySelector(`[name="${attr.key}_max"]`);
                        const minVal = minEl?.value?.trim();
                        const maxVal = maxEl?.value?.trim();
                        if (!minVal || !maxVal) {
                            showError(`Model details: ${attr.label || attr.key} is required`);
                            return false;
                        }
                    } else if (attr.type === 'multi-select') {
                        const wrap = document.querySelector(`.occ-ms-field[data-field-key="${attr.key}"]`);
                        const n = wrap ? wrap.querySelectorAll('.occ-ms-option:checked').length : 0;
                        if (n === 0) {
                            showError(`Model details: select at least one option for ${attr.label || attr.key}`);
                            return false;
                        }
                    } else {
                        const el = document.getElementById(attr.key) || document.querySelector(`[name="${attr.key}"]`);
                        if (!el) continue;
                        let val;
                        if (el.type === 'checkbox') val = el.checked;
                        else val = (el.value || '').trim();
                        if (el.type === 'checkbox' ? !val : val === '') {
                            showError(`Model details: ${attr.label || attr.key} is required`);
                            return false;
                        }
                    }
                }
            }
            if (multiProjectWorkPackagesRequired()) {
                const pTasks = collectProjectTasksFromUI();
                if (pTasks.length < 2) {
                    showError('Multi-project task-based opportunities need at least two work packages. Add packages in Basic Information or use Single Project for one workstream.');
                    return false;
                }
                const missingTitle = pTasks.some(t => !t.title || !t.title.trim());
                if (missingTitle) {
                    showError('Each work package must have a task title.');
                    return false;
                }
            }
            break;
        }
        case 6: {
            const budgetMin = document.getElementById('budgetRange_min')?.value?.trim();
            const budgetMax = document.getElementById('budgetRange_max')?.value?.trim();
            if (!budgetMin || !budgetMax) {
                showError('Budget range: both minimum and maximum are required');
                return false;
            }
            const minVal = parseFloat(budgetMin);
            const maxVal = parseFloat(budgetMax);
            if (isNaN(minVal) || isNaN(maxVal) || minVal > maxVal) {
                showError('Budget range: minimum must be less than or equal to maximum');
                return false;
            }
            const exchangeMode = document.getElementById('exchange-mode')?.value;
            const validModes = ['cash', 'equity', 'profit_sharing', 'barter', 'hybrid'];
            if (!exchangeMode || !validModes.includes(exchangeMode)) {
                showError('Please select an exchange mode');
                return false;
            }
            if (exchangeMode === 'cash') {
                const cashAmount = document.getElementById('cash-amount')?.value?.trim();
                const cashPaymentTerms = document.getElementById('cash-payment-terms')?.value?.trim();
                if (!cashAmount) { showError('Cash amount is required'); return false; }
                if (!cashPaymentTerms) { showError('Payment terms are required for Cash mode'); return false; }
            } else if (exchangeMode === 'equity') {
                const equityPct = document.getElementById('equity-percentage')?.value?.trim();
                if (!equityPct || isNaN(parseFloat(equityPct))) { showError('Equity percentage is required'); return false; }
            } else if (exchangeMode === 'profit_sharing') {
                const profitPct = document.getElementById('profit-share-percentage')?.value?.trim();
                if (!profitPct || isNaN(parseFloat(profitPct))) {
                    showError('Profit share percentage is required');
                    return false;
                }
                const profitDur = document.getElementById('profit-duration')?.value?.trim();
                if (!profitDur) {
                    showError('Duration is required for profit sharing');
                    return false;
                }
            } else if (exchangeMode === 'barter') {
                const offerRaw = document.getElementById('barter-offer')?.value || '';
                const termsRaw = document.getElementById('barter-need')?.value || '';
                const barterOffer = plainTextFromHtml(offerRaw).trim();
                const barterTerms = plainTextFromHtml(termsRaw).trim();
                if (!barterOffer) { showError('Offered services or resources are required for barter'); return false; }
                if (!barterTerms) { showError('Barter terms are required'); return false; }
            } else if (exchangeMode === 'hybrid') {
                const hCash = parseFloat(document.getElementById('hybrid-cash')?.value || 0);
                const hEquity = parseFloat(document.getElementById('hybrid-equity')?.value || 0);
                const hBarter = parseFloat(document.getElementById('hybrid-barter')?.value || 0);
                const total = hCash + hEquity + hBarter;
                if (Math.abs(total - 100) > 0.01) {
                    showError('Hybrid: Cash, Equity, and Barter percentages must total 100%');
                    return false;
                }
            }
            if (exchangeMode === 'cash' || exchangeMode === 'hybrid') {
                const currency = document.getElementById('currency')?.value?.trim();
                if (!currency) {
                    showError('Currency is required for Cash and Hybrid modes');
                    return false;
                }
            }
            const agreement = document.getElementById('exchange-agreement')?.checked;
            if (!validateAlternateExchangePanels()) {
                return false;
            }
            if (!agreement) {
                showError('You must agree to the exchange terms to proceed');
                return false;
            }
            break;
        }
        case 7: {
            const status = document.getElementById('status')?.value;
            if (!status) {
                showError('Please choose Save as Draft or Publish');
                return false;
            }
            break;
        }
    }
    
    return true;
}

/** Validate steps fromStep through toStep (inclusive); on failure, navigates to first failing step. */
function validateStepsRange(fromStep, toStep) {
    const saved = currentStep;
    for (let s = fromStep; s <= toStep; s++) {
        currentStep = s;
        if (!validateCurrentStep()) {
            currentStep = saved;
            goToStep(s);
            return false;
        }
    }
    currentStep = saved;
    return true;
}

function goToStep(step) {
    if (step < 1 || step > TOTAL_STEPS) return;
    
    const prevStepEl = document.getElementById(`step-${currentStep}`);
    if (prevStepEl) prevStepEl.classList.add('hidden');
    
    currentStep = step;
    const nextStepEl = document.getElementById(`step-${currentStep}`);
    if (nextStepEl) nextStepEl.classList.remove('hidden');
    
    if (currentStep === 2) {
        updateMultiProjectTasksUI();
        requestAnimationFrame(() => {
            const inst = ensureMapPicker();
            if (inst) {
                inst.invalidateSize();
                setTimeout(() => {
                    inst.invalidateSize();
                    applyPendingMapCenter();
                }, 50);
            }
        });
    }
    
    updateWizardUI();
    
    if (currentStep === 3) updateScopeLabels();
    if (currentStep === 6 && typeof refreshEstimatedValueDisplay === 'function') refreshEstimatedValueDisplay();
    if (currentStep === 7) {
        fillReviewSummary();
        const statusField = document.getElementById('status');
        if (statusField && !statusField.value) statusField.value = 'draft';
    }
    
    setTimeout(() => {
        if (currentStep === 6 && typeof refreshEstimatedValueDisplay === 'function') refreshEstimatedValueDisplay();
        if (window.RichTextEditor && typeof Quill !== 'undefined') {
            const currentStepContainer = document.getElementById(`step-${currentStep}`);
            if (currentStepContainer) {
                const textareas = currentStepContainer.querySelectorAll('textarea[data-rich-text="true"]');
                textareas.forEach(textarea => {
                    if (!window.RichTextEditor.get(textarea.id)) {
                        window.RichTextEditor.init(textarea.id);
                        if (textarea.value) {
                            setTimeout(() => window.RichTextEditor.setContent(textarea.id, textarea.value), 100);
                        }
                    }
                });
            }
        }
    }, 200);
}

function updateWizardUI() {
    const steps = document.querySelectorAll('.wizard-step');
    const nextBtn = document.getElementById('next-step');
    const prevBtn = document.getElementById('prev-step');
    const submitBtn = document.getElementById('submit-form');
    
    steps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum < currentStep) {
            step.classList.add('completed');
        } else if (stepNum === currentStep) {
            step.classList.add('active');
        }
    });
    
    // Update buttons
    if (prevBtn) prevBtn.classList.toggle('hidden', currentStep === 1);
    if (nextBtn) nextBtn.classList.toggle('hidden', currentStep === TOTAL_STEPS);
    if (submitBtn) submitBtn.classList.toggle('hidden', currentStep !== TOTAL_STEPS);
    const saveDraftBtn = document.getElementById('save-draft-wizard');
    if (saveDraftBtn) {
        saveDraftBtn.classList.toggle('hidden', currentStep < 2);
    }
}

function setupSearchableModelSelector() {
    const searchInput = document.getElementById('model-search');
    const dropdown = document.getElementById('model-dropdown');
    const dropdownContent = dropdown.querySelector('.model-dropdown-content');
    const selectedDisplay = document.getElementById('selected-model-display');
    const clearButton = document.getElementById('clear-model-selection');
    const modelTypeInput = document.getElementById('model-type');
    const subModelTypeInput = document.getElementById('submodel-type');
    
    let selectedIndex = -1;
    
    function renderDropdown(searchTerm = '') {
        const term = searchTerm.toLowerCase();
        const filteredModels = term ? 
            allModels.filter(m => m.searchText.includes(term)) : 
            allModels;
        
        if (filteredModels.length === 0) {
            dropdownContent.innerHTML = '<div class="no-results">No matching collaboration models found</div>';
            return;
        }
        
        const grouped = {};
        filteredModels.forEach(model => {
            if (!grouped[model.modelName]) {
                grouped[model.modelName] = [];
            }
            grouped[model.modelName].push(model);
        });
        
        let html = '';
        Object.keys(grouped).forEach(modelName => {
            html += `<div class="model-group">`;
            html += `<div class="model-group-header">${modelName}</div>`;
            grouped[modelName].forEach(model => {
                html += `
                    <div class="model-option" data-model-key="${model.modelKey}" data-submodel-key="${model.subModelKey}">
                        <div class="model-option-name">${model.subModelName}</div>
                        <div class="model-option-description">${model.modelName}</div>
                    </div>
                `;
            });
            html += `</div>`;
        });
        
        dropdownContent.innerHTML = html;
        selectedIndex = -1;
        
        dropdownContent.querySelectorAll('.model-option').forEach(option => {
            option.addEventListener('click', () => {
                selectModel(option.dataset.modelKey, option.dataset.submodelKey);
            });
        });
    }
    
    function selectModel(modelKey, subModelKey) {
        const model = allModels.find(m => m.modelKey === modelKey && m.subModelKey === subModelKey);
        if (!model) return;
        
        currentModel = modelKey;
        currentSubModel = subModelKey;
        
        modelTypeInput.value = modelKey;
        subModelTypeInput.value = subModelKey;
        
        document.getElementById('selected-model-name').textContent = model.subModelName;
        document.getElementById('selected-model-category').textContent = `Category: ${model.modelName}`;
        
        dropdown.classList.add('hidden');
        selectedDisplay.classList.remove('hidden');
        searchInput.value = '';
        searchInput.disabled = true;
    }
    
    clearButton.addEventListener('click', () => {
        currentModel = null;
        currentSubModel = null;
        modelTypeInput.value = '';
        subModelTypeInput.value = '';
        selectedDisplay.classList.add('hidden');
        searchInput.disabled = false;
        searchInput.focus();
    });
    
    searchInput.addEventListener('focus', () => {
        if (!searchInput.disabled) {
            renderDropdown(searchInput.value);
            dropdown.classList.remove('hidden');
        }
    });
    
    searchInput.addEventListener('input', (e) => {
        renderDropdown(e.target.value);
        dropdown.classList.remove('hidden');
    });
    
    searchInput.addEventListener('keydown', (e) => {
        const options = dropdownContent.querySelectorAll('.model-option');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, options.length - 1);
            updateHighlight(options);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateHighlight(options);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            const selectedOption = options[selectedIndex];
            selectModel(selectedOption.dataset.modelKey, selectedOption.dataset.submodelKey);
        } else if (e.key === 'Escape') {
            dropdown.classList.add('hidden');
        }
    });
    
    function updateHighlight(options) {
        options.forEach((opt, idx) => {
            if (idx === selectedIndex) {
                opt.classList.add('highlighted');
                opt.scrollIntoView({ block: 'nearest' });
            } else {
                opt.classList.remove('highlighted');
            }
        });
    }
    
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

function normalizeLocStr(s) {
    if (s == null || s === '') return '';
    return String(s).toLowerCase().trim().replace(/\s+/g, ' ');
}

function nominatimCityTokens(addr) {
    if (!addr || typeof addr !== 'object') return [];
    const keys = ['city', 'town', 'village', 'municipality', 'city_district', 'suburb', 'neighbourhood', 'quarter', 'hamlet', 'county'];
    const out = [];
    keys.forEach(k => {
        const v = addr[k];
        if (v && typeof v === 'string') out.push(v);
    });
    return out;
}

function nominatimStateToken(addr) {
    if (!addr || typeof addr !== 'object') return '';
    return addr.state || addr.region || addr.province || addr.state_district || '';
}

/**
 * Match Nominatim address + coords to locations.json hierarchy.
 * @returns {{ countryId: string, regionId: string, cityId: string, districtName?: string } | null}
 */
function resolveLocationMatchFromAddress(lat, lng, addr, locations) {
    if (!locations || !locations.countries || !addr) return null;

    const ccRaw = (addr.country_code || '').toUpperCase();
    let country = locations.countries.find(c => (c.code || '').toUpperCase() === ccRaw);
    if (!country && addr.country) {
        const cn = normalizeLocStr(addr.country);
        country = locations.countries.find(c => normalizeLocStr(c.name) === cn || cn.includes(normalizeLocStr(c.name)) || normalizeLocStr(c.name).includes(cn));
    }
    if (!country) {
        return findNearestCityMatch(lat, lng, locations, null);
    }

    const stateTok = normalizeLocStr(nominatimStateToken(addr));
    const cityToks = nominatimCityTokens(addr).map(normalizeLocStr).filter(Boolean);

    let bestRegion = null;
    let bestCity = null;

    for (const region of country.regions || []) {
        const rn = normalizeLocStr(region.name);
        if (stateTok && (stateTok.includes(rn) || rn.includes(stateTok) || stateTok.includes(rn.replace(/\s+region$/, '').replace(/\s+province$/, '')))) {
            bestRegion = region;
            break;
        }
    }

    const regionsToSearch = bestRegion ? [bestRegion] : (country.regions || []);

    for (const region of regionsToSearch) {
        for (const city of region.cities || []) {
            const cn = normalizeLocStr(city.name);
            for (const ct of cityToks) {
                if (!ct || !cn) continue;
                if (cn === ct || ct.includes(cn) || cn.includes(ct)) {
                    return {
                        countryId: country.id,
                        regionId: region.id,
                        cityId: city.id,
                        districtName: matchDistrictFromAddress(city, addr)
                    };
                }
            }
        }
    }

    if (cityToks.length > 0) {
        for (const region of country.regions || []) {
            for (const city of region.cities || []) {
                const cn = normalizeLocStr(city.name);
                for (const ct of cityToks) {
                    const shortCity = cn.replace(/\s+city$/, '');
                    if (ct.startsWith(shortCity) || shortCity.startsWith(ct)) {
                        return {
                            countryId: country.id,
                            regionId: region.id,
                            cityId: city.id,
                            districtName: matchDistrictFromAddress(city, addr)
                        };
                    }
                }
            }
        }
    }

    let near = findNearestCityMatch(lat, lng, locations, country.id, 180);
    if (near) {
        const c = locations.countries.find(x => x.id === near.countryId);
        const r = c && (c.regions || []).find(x => x.id === near.regionId);
        const ci = r && (r.cities || []).find(x => x.id === near.cityId);
        return {
            countryId: near.countryId,
            regionId: near.regionId,
            cityId: near.cityId,
            districtName: ci ? matchDistrictFromAddress(ci, addr) : undefined
        };
    }
    return null;
}

function matchDistrictFromAddress(cityObj, addr) {
    const districts = cityObj.districts;
    if (!Array.isArray(districts) || districts.length === 0) return undefined;
    const candidates = [addr.suburb, addr.neighbourhood, addr.quarter, addr.city_district].filter(Boolean).map(normalizeLocStr);
    for (const d of districts) {
        const dn = normalizeLocStr(d);
        for (const c of candidates) {
            if (!c) continue;
            if (dn === c || c.includes(dn) || dn.includes(c)) return d;
        }
    }
    return undefined;
}

function findNearestCityMatch(lat, lng, locations, countryIdFilter, maxKm = 120) {
    if (typeof mapService === 'undefined' || !mapService.getDistanceKm) return null;
    let best = null;
    let bestKm = Infinity;
    for (const country of locations.countries) {
        if (countryIdFilter && country.id !== countryIdFilter) continue;
        if (country.id === 'remote') continue;
        for (const region of country.regions || []) {
            for (const city of region.cities || []) {
                if (city.lat == null || city.lng == null) continue;
                const d = mapService.getDistanceKm(lat, lng, city.lat, city.lng);
                if (d < bestKm) {
                    bestKm = d;
                    best = { countryId: country.id, regionId: region.id, cityId: city.id, km: d };
                }
            }
        }
    }
    if (best && best.km <= maxKm) {
        return { countryId: best.countryId, regionId: best.regionId, cityId: best.cityId };
    }
    return null;
}

function formatNominatimAddressLine(addr) {
    if (!addr || typeof addr !== 'object') return '';
    const parts = [];
    const order = ['road', 'suburb', 'neighbourhood', 'city_district', 'city', 'town', 'village', 'municipality', 'state', 'postcode', 'country'];
    order.forEach(k => {
        if (addr[k]) parts.push(addr[k]);
    });
    return parts.length ? parts.join(', ') : '';
}

function setupLocationSearch() {
    const countrySearch = document.getElementById('location-country-search');
    const countryInput = document.getElementById('location-country');
    const countryDropdown = document.getElementById('location-country-dropdown');
    const countryDisplay = document.getElementById('location-country-display');
    
    const regionSearch = document.getElementById('location-region-search');
    const regionInput = document.getElementById('location-region');
    const regionDropdown = document.getElementById('location-region-dropdown');
    const regionDisplay = document.getElementById('location-region-display');
    
    const citySearch = document.getElementById('location-city-search');
    const cityInput = document.getElementById('location-city');
    const cityDropdown = document.getElementById('location-city-dropdown');
    const cityDisplay = document.getElementById('location-city-display');
    
    const districtSearch = document.getElementById('location-district-search');
    const districtInput = document.getElementById('location-district');
    const districtDropdown = document.getElementById('location-district-dropdown');
    const districtDisplay = document.getElementById('location-district-display');
    
    const locationInput = document.getElementById('location');
    
    let selectedCountry = null;
    let selectedRegion = null;
    let selectedCity = null;
    let selectedDistrict = null;
    
    // Setup searchable dropdown helper
    function setupSearchableDropdown(searchInput, hiddenInput, dropdown, display, items, onSelect) {
        // Store items for later use
        searchInput.dataset.items = JSON.stringify(items);
        
        // Check if already initialized - if so, just update items
        if (searchInput.dataset.initialized === 'true') {
            return;
        }
        
        searchInput.dataset.initialized = 'true';
        
        let selectedIndex = -1;
        let filteredItems = [];
        
        function renderDropdown(searchTerm = '') {
            const currentItems = JSON.parse(searchInput.dataset.items || '[]');
            const term = searchTerm.toLowerCase();
            filteredItems = term ? 
                currentItems.filter(item => item.name.toLowerCase().includes(term)) : 
                currentItems;
            
            if (filteredItems.length === 0) {
                dropdown.querySelector('.searchable-dropdown-content').innerHTML = 
                    '<div class="p-4 text-center text-gray-500">No results found</div>';
                return;
            }
            
            const html = filteredItems.map((item, idx) => `
                <div class="searchable-dropdown-item" data-index="${idx}" data-value="${item.id || item.name}">
                    ${item.name}
                </div>
            `).join('');
            
            dropdown.querySelector('.searchable-dropdown-content').innerHTML = html;
            selectedIndex = -1;
            
            dropdown.querySelectorAll('.searchable-dropdown-item').forEach(item => {
                item.addEventListener('click', () => {
                    const selectedItem = filteredItems[parseInt(item.dataset.index)];
                    onSelect(selectedItem);
                });
            });
        }
        
        searchInput.addEventListener('focus', () => {
            if (!searchInput.disabled) {
                renderDropdown(searchInput.value);
                dropdown.classList.remove('hidden');
            }
        });
        
        searchInput.addEventListener('input', (e) => {
            renderDropdown(e.target.value);
            dropdown.classList.remove('hidden');
        });
        
        searchInput.addEventListener('keydown', (e) => {
            const options = dropdown.querySelectorAll('.searchable-dropdown-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, options.length - 1);
                updateHighlight(options);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                updateHighlight(options);
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                const selectedOption = options[selectedIndex];
                const selectedItem = filteredItems[parseInt(selectedOption.dataset.index)];
                onSelect(selectedItem);
            } else if (e.key === 'Escape') {
                dropdown.classList.add('hidden');
            }
        });
        
        function updateHighlight(options) {
            options.forEach((opt, idx) => {
                if (idx === selectedIndex) {
                    opt.classList.add('highlighted');
                    opt.scrollIntoView({ block: 'nearest' });
                } else {
                    opt.classList.remove('highlighted');
                }
            });
        }
        
        const clickHandler = (e) => {
            if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        };
        
        document.addEventListener('click', clickHandler);
    }
    
    // Country selection
        const locations = getLocationsData();
        if (!locations || !locations.countries) return;
        const countries = locations.countries.map(c => ({ id: c.id, name: c.name }));
    setupSearchableDropdown(
        countrySearch,
        countryInput,
        countryDropdown,
        countryDisplay,
        countries,
        (country) => {
            selectedCountry = country;
            countryInput.value = country.id;
            countrySearch.value = '';
            countrySearch.disabled = true;
            countryDisplay.querySelector('#location-country-name').textContent = country.name;
            countryDisplay.classList.remove('hidden');
            countryDropdown.classList.add('hidden');
            
            // Enable and populate regions
            enableRegionSearch();
            clearCitySelection();
            clearDistrictSelection();
            updateLocationString();
        }
    );
    
    // Clear functions
    function clearCitySelection() {
        selectedCity = null;
        cityInput.value = '';
        citySearch.value = '';
        citySearch.disabled = true;
        citySearch.classList.add('bg-gray-50');
        citySearch.placeholder = 'Select region first...';
        cityDisplay.classList.add('hidden');
        cityDropdown.classList.add('hidden');
        citySearch.dataset.initialized = 'false';
    }
    
    function clearDistrictSelection() {
        selectedDistrict = null;
        districtInput.value = '';
        districtSearch.value = '';
        districtSearch.disabled = true;
        districtSearch.classList.add('bg-gray-50');
        districtSearch.placeholder = 'Select city first...';
        districtDisplay.classList.add('hidden');
        districtDropdown.classList.add('hidden');
        districtSearch.dataset.initialized = 'false';
    }
    
    function clearRegionSelection() {
        selectedRegion = null;
        regionInput.value = '';
        regionSearch.value = '';
        regionSearch.disabled = true;
        regionSearch.classList.add('bg-gray-50');
        regionSearch.placeholder = 'Select country first...';
        regionDisplay.classList.add('hidden');
        regionDropdown.classList.add('hidden');
        regionSearch.dataset.initialized = 'false';
        clearCitySelection();
        clearDistrictSelection();
        updateLocationString();
    }
    
    // Region selection
    function enableRegionSearch() {
        if (!selectedCountry) return;
        
        const locations = getLocationsData();
        if (!locations || !locations.countries) return;
        const country = locations.countries.find(c => c.id === selectedCountry.id);
        if (!country) return;
        
        if (selectedCountry.id === 'remote') {
            // Handle remote
            selectedRegion = { id: 'remote', name: 'Remote' };
            regionInput.value = 'remote';
            regionSearch.value = 'Remote';
            regionSearch.disabled = true;
            regionDisplay.querySelector('#location-region-name').textContent = 'Remote';
            regionDisplay.classList.remove('hidden');
            updateLocationString();
            return;
        }
        
        const regions = (country.regions || []).map(r => ({ id: r.id, name: r.name }));
        
        regionSearch.disabled = false;
        regionSearch.classList.remove('bg-gray-50');
        regionSearch.placeholder = 'Search region...';
        regionSearch.value = '';
        
        setupSearchableDropdown(
            regionSearch,
            regionInput,
            regionDropdown,
            regionDisplay,
            regions,
            (region) => {
                selectedRegion = region;
                regionInput.value = region.id;
                regionSearch.value = '';
                regionSearch.disabled = true;
                regionDisplay.querySelector('#location-region-name').textContent = region.name;
                regionDisplay.classList.remove('hidden');
                regionDropdown.classList.add('hidden');
                
                // Enable and populate cities
                enableCitySearch();
                clearDistrictSelection();
                updateLocationString();
            }
        );
    }
    
    // City selection
    function enableCitySearch() {
        if (!selectedCountry || !selectedRegion) return;
        
        const locations = getLocationsData();
        if (!locations || !locations.countries) return;
        const country = locations.countries.find(c => c.id === selectedCountry.id);
        if (!country) return;
        
        const region = country.regions?.find(r => r.id === selectedRegion.id);
        if (!region || !region.cities || region.cities.length === 0) return;
        
        const cities = region.cities.map(c => ({ id: c.id, name: c.name }));
        
        citySearch.disabled = false;
        citySearch.classList.remove('bg-gray-50');
        citySearch.placeholder = 'Search city...';
        citySearch.value = '';
        
        setupSearchableDropdown(
            citySearch,
            cityInput,
            cityDropdown,
            cityDisplay,
            cities,
            (city) => {
                selectedCity = city;
                cityInput.value = city.id;
                citySearch.value = '';
                citySearch.disabled = true;
                cityDisplay.querySelector('#location-city-name').textContent = city.name;
                cityDisplay.classList.remove('hidden');
                cityDropdown.classList.add('hidden');
                
                // Enable and populate districts
                enableDistrictSearch();
                updateLocationString();
                centerMapOnCity(city.id);
            }
        );
    }
    
    // District selection
    function enableDistrictSearch() {
        if (!selectedCountry || !selectedRegion || !selectedCity) return;
        
        const locations = getLocationsData();
        if (!locations || !locations.countries) return;
        const country = locations.countries.find(c => c.id === selectedCountry.id);
        if (!country) return;
        
        const region = country.regions?.find(r => r.id === selectedRegion.id);
        if (!region) return;
        
        const city = region.cities?.find(c => c.id === selectedCity.id);
        if (!city || !city.districts || city.districts.length === 0) {
            districtSearch.disabled = true;
            districtSearch.classList.add('bg-gray-50');
            districtSearch.placeholder = 'No districts available';
            return;
        }
        
        const districts = city.districts.map(d => ({ name: d }));
        
        districtSearch.disabled = false;
        districtSearch.classList.remove('bg-gray-50');
        districtSearch.placeholder = 'Search district (optional)...';
        districtSearch.value = '';
        
        setupSearchableDropdown(
            districtSearch,
            districtInput,
            districtDropdown,
            districtDisplay,
            districts,
            (district) => {
                selectedDistrict = district;
                districtInput.value = district.name;
                districtSearch.value = '';
                districtSearch.disabled = true;
                districtDisplay.querySelector('#location-district-name').textContent = district.name;
                districtDisplay.classList.remove('hidden');
                districtDropdown.classList.add('hidden');
                updateLocationString();
            }
        );
    }
    
    // Global clear function
    window.clearLocationSelection = function(level) {
        if (level === 'country') {
            selectedCountry = null;
            countryInput.value = '';
            countrySearch.value = '';
            countrySearch.disabled = false;
            countryDisplay.classList.add('hidden');
            countryDropdown.classList.add('hidden');
            countrySearch.dataset.initialized = 'false';
            clearRegionSelection();
        } else if (level === 'region') {
            clearRegionSelection();
        } else if (level === 'city') {
            clearCitySelection();
            updateLocationString();
        } else if (level === 'district') {
            clearDistrictSelection();
            updateLocationString();
        }
    };
    
    // Update location string
    function updateLocationString() {
        const parts = [];
        
        if (selectedCountry) {
            parts.push(selectedCountry.name);
        }
        
        if (selectedRegion) {
            parts.push(selectedRegion.name);
        }
        
        if (selectedCity) {
            parts.push(selectedCity.name);
        }
        
        if (selectedDistrict) {
            parts.push(selectedDistrict.name);
        }
        
        locationInput.value = parts.join(' > ');
    }

    function applyResolvedLocation(match) {
        if (!match || !match.countryId || !match.regionId || !match.cityId) return;
        const locations = getLocationsData();
        if (!locations || !locations.countries) return;
        const countryObj = locations.countries.find(c => c.id === match.countryId);
        if (!countryObj) return;
        const regionObj = (countryObj.regions || []).find(r => r.id === match.regionId);
        if (!regionObj) return;
        const cityObj = (regionObj.cities || []).find(c => c.id === match.cityId);
        if (!cityObj) return;

        selectedCountry = { id: countryObj.id, name: countryObj.name };
        countryInput.value = countryObj.id;
        countrySearch.value = '';
        countrySearch.disabled = true;
        const countryNameEl = countryDisplay.querySelector('#location-country-name');
        if (countryNameEl) countryNameEl.textContent = countryObj.name;
        countryDisplay.classList.remove('hidden');

        if (countryObj.id === 'remote') {
            selectedRegion = { id: 'remote', name: 'Remote' };
            regionInput.value = 'remote';
            regionSearch.value = 'Remote';
            regionSearch.disabled = true;
            const rn = regionDisplay.querySelector('#location-region-name');
            if (rn) rn.textContent = 'Remote';
            regionDisplay.classList.remove('hidden');
            updateLocationString();
            return;
        }

        selectedRegion = { id: regionObj.id, name: regionObj.name };
        regionInput.value = regionObj.id;
        regionSearch.value = '';
        regionSearch.disabled = true;
        regionSearch.classList.remove('bg-gray-50');
        const regNameEl = regionDisplay.querySelector('#location-region-name');
        if (regNameEl) regNameEl.textContent = regionObj.name;
        regionDisplay.classList.remove('hidden');
        regionSearch.dataset.items = JSON.stringify((countryObj.regions || []).map(r => ({ id: r.id, name: r.name })));

        selectedCity = { id: cityObj.id, name: cityObj.name };
        cityInput.value = cityObj.id;
        citySearch.value = '';
        citySearch.disabled = true;
        citySearch.classList.remove('bg-gray-50');
        const cityNameEl = cityDisplay.querySelector('#location-city-name');
        if (cityNameEl) cityNameEl.textContent = cityObj.name;
        cityDisplay.classList.remove('hidden');
        citySearch.dataset.items = JSON.stringify((regionObj.cities || []).map(c => ({ id: c.id, name: c.name })));

        selectedDistrict = null;
        districtInput.value = '';
        districtSearch.value = '';
        districtDisplay.classList.add('hidden');
        districtSearch.dataset.initialized = 'false';

        const districts = cityObj.districts;
        let districtMatched = false;
        if (match.districtName && Array.isArray(districts) && districts.length > 0) {
            const want = normalizeLocStr(match.districtName);
            const hit = districts.find(d => want && (normalizeLocStr(d) === want || want.includes(normalizeLocStr(d)) || normalizeLocStr(d).includes(want)));
            if (hit) {
                selectedDistrict = { name: hit };
                districtInput.value = hit;
                districtSearch.disabled = true;
                districtSearch.classList.remove('bg-gray-50');
                const dn = districtDisplay.querySelector('#location-district-name');
                if (dn) dn.textContent = hit;
                districtDisplay.classList.remove('hidden');
                districtMatched = true;
            }
        }
        if (!districtMatched && Array.isArray(districts) && districts.length > 0) {
            enableDistrictSearch();
        } else if (!districts || districts.length === 0) {
            districtSearch.disabled = true;
            districtSearch.classList.add('bg-gray-50');
            districtSearch.placeholder = 'No districts available';
        }

        updateLocationString();
    }

    window.__applyResolvedOpportunityLocation = applyResolvedLocation;

    window.applyLocationFieldsFromAddress = function(lat, lng, addr) {
        if (!addr) return;
        const locations = getLocationsData();
        const m = resolveLocationMatchFromAddress(lat, lng, addr, locations);
        if (m) applyResolvedLocation(m);
        const line = formatNominatimAddressLine(addr);
        const addrEl = document.getElementById('address-search-input');
        if (addrEl && line) addrEl.value = line;
    };

    window.applyOpportunityPinLocation = async function(lat, lng) {
        if (typeof mapService === 'undefined' || !mapService.reverseGeocode) return;
        try {
            const res = await mapService.reverseGeocode(lat, lng);
            if (!res || !res.address) return;
            window.applyLocationFieldsFromAddress(lat, lng, res.address);
            const addrEl = document.getElementById('address-search-input');
            if (addrEl && res.displayName && !String(addrEl.value || '').trim()) {
                addrEl.value = res.displayName;
            }
        } catch (e) {
            console.warn('Pin location lookup:', e);
        }
    };
}

let createMapInstance = null;
/** City coords to apply when the map is first created (step 2 may load after location pick). */
let pendingMapCenter = null;

function setupMapPicker() {
    if (typeof mapService === 'undefined') return;
    if (createMapInstance) return;

    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    const coordsDisplay = document.getElementById('map-coordinates-display');
    const latDisplay = document.getElementById('map-lat-display');
    const lngDisplay = document.getElementById('map-lng-display');
    const addressInput = document.getElementById('address-search-input');
    const addressBtn = document.getElementById('address-search-btn');

    function updateCoords(lat, lng) {
        if (latInput) latInput.value = lat.toFixed(6);
        if (lngInput) lngInput.value = lng.toFixed(6);
        if (latDisplay) latDisplay.textContent = lat.toFixed(6);
        if (lngDisplay) lngDisplay.textContent = lng.toFixed(6);
        if (coordsDisplay) coordsDisplay.classList.remove('hidden');
    }

    let pinReverseTimer = null;
    function scheduleLocationFillFromPin(lat, lng) {
        clearTimeout(pinReverseTimer);
        pinReverseTimer = setTimeout(() => {
            if (typeof window.applyOpportunityPinLocation === 'function') {
                window.applyOpportunityPinLocation(lat, lng);
            }
        }, 450);
    }

    createMapInstance = mapService.initMapPicker('location-map', {
        center: mapService.DEFAULT_CENTER,
        zoom: mapService.DEFAULT_ZOOM,
        draggableMarker: true,
        onClick: (lat, lng) => {
            updateCoords(lat, lng);
            scheduleLocationFillFromPin(lat, lng);
        },
        onMarkerMove: (lat, lng) => {
            updateCoords(lat, lng);
            scheduleLocationFillFromPin(lat, lng);
        }
    });

    if (addressBtn && addressInput) {
        const doGeocode = async () => {
            ensureMapPicker();
            if (!createMapInstance) return;
            const query = addressInput.value.trim();
            if (!query) return;
            addressBtn.disabled = true;
            addressBtn.innerHTML = '<i class="ph-duotone ph-spinner ph-spin" style="font-size:16px;"></i> Searching...';
            const result = await mapService.geocodeAddress(query);
            addressBtn.disabled = false;
            addressBtn.innerHTML = '<i class="ph-duotone ph-magnifying-glass" style="font-size:16px;"></i> Locate';
            if (result) {
                createMapInstance.setMarker(result.lat, result.lng);
                updateCoords(result.lat, result.lng);
                if (result.address && Object.keys(result.address).length > 0 && typeof window.applyLocationFieldsFromAddress === 'function') {
                    window.applyLocationFieldsFromAddress(result.lat, result.lng, result.address);
                } else if (typeof window.applyOpportunityPinLocation === 'function') {
                    window.applyOpportunityPinLocation(result.lat, result.lng);
                }
            } else {
                alert('Address not found. Try a different search term.');
            }
        };
        addressBtn.addEventListener('click', doGeocode);
        addressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); doGeocode(); }
        });
    }
}

/**
 * Create the Leaflet map only after Step 2 is visible; avoids broken tiles when the container had display:none.
 */
function ensureMapPicker() {
    if (createMapInstance) return createMapInstance;
    setupMapPicker();
    return createMapInstance;
}

function isStep2Visible() {
    const el = document.getElementById('step-2');
    return el && !el.classList.contains('hidden');
}

function updateMapPinInputs(lat, lng) {
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    const coordsDisplay = document.getElementById('map-coordinates-display');
    const latDisplay = document.getElementById('map-lat-display');
    const lngDisplay = document.getElementById('map-lng-display');
    if (latInput) latInput.value = lat.toFixed(6);
    if (lngInput) lngInput.value = lng.toFixed(6);
    if (latDisplay) latDisplay.textContent = lat.toFixed(6);
    if (lngDisplay) lngDisplay.textContent = lng.toFixed(6);
    if (coordsDisplay) coordsDisplay.classList.remove('hidden');
}

function applyPendingMapCenter() {
    if (!pendingMapCenter || !createMapInstance) return;
    const { lat, lng } = pendingMapCenter;
    createMapInstance.setMarker(lat, lng);
    updateMapPinInputs(lat, lng);
    pendingMapCenter = null;
}

function centerMapOnCity(cityId) {
    const locations = getLocationsData();
    if (!locations || !locations.countries) return;

    for (const country of locations.countries) {
        for (const region of (country.regions || [])) {
            for (const city of (region.cities || [])) {
                if (city.id === cityId && city.lat && city.lng) {
                    pendingMapCenter = { lat: city.lat, lng: city.lng };
                    if (isStep2Visible()) {
                        ensureMapPicker();
                        applyPendingMapCenter();
                    }
                    return;
                }
            }
        }
    }
}

/** Multi project selected in step 1 — drives work-package UI in Basic Info. */
function isMultiProjectSelected() {
    return document.querySelector('input[name="projectType"]:checked')?.value === 'multi';
}

/** Task-based sub-model under multi project — enforces ≥2 work packages and payload sync. */
function multiProjectWorkPackagesRequired() {
    return isMultiProjectSelected() && document.getElementById('submodel-type')?.value === 'task_based';
}

function collectProjectTasksFromUI() {
    const list = document.getElementById('multi-project-tasks-list');
    if (!list) return [];
    const rows = list.querySelectorAll('[data-project-task-row]');
    const out = [];
    rows.forEach(row => {
        const title = row.querySelector('[data-task-title]')?.value?.trim() || '';
        const notes = row.querySelector('[data-task-notes]')?.value?.trim() || '';
        const duration = row.querySelector('[data-task-duration]')?.value?.trim() || '';
        out.push({ title, notes, duration });
    });
    return out;
}

function ensureMultiTaskRows(minRows) {
    const list = document.getElementById('multi-project-tasks-list');
    if (!list) return;
    while (list.querySelectorAll('[data-project-task-row]').length < minRows) {
        addMultiProjectTaskRow();
    }
}

function addMultiProjectTaskRow(prefill = {}) {
    const list = document.getElementById('multi-project-tasks-list');
    if (!list) return;
    const n = list.querySelectorAll('[data-project-task-row]').length + 1;
    const wrap = document.createElement('div');
    wrap.className = 'multi-task-row occ-wp-row rounded-xl border border-slate-200 bg-white p-4 mb-3 shadow-sm';
    wrap.setAttribute('data-project-task-row', '');
    wrap.innerHTML = `
        <div class="flex justify-between items-start gap-2 mb-3">
            <span class="text-sm font-semibold text-gray-800">Work package <span data-task-index>${n}</span></span>
            <button type="button" class="text-sm text-red-600 hover:text-red-800 font-medium multi-task-remove">Remove</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Task title <span class="text-red-600">*</span></label>
                <input type="text" data-task-title class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="e.g. Structural analysis package">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Duration (days)</label>
                <input type="number" data-task-duration min="1" step="1" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="Optional">
            </div>
            <div class="md:col-span-2">
                <label class="block text-xs font-medium text-gray-600 mb-1">Scope notes</label>
                <textarea data-task-notes rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="Brief scope for this package"></textarea>
            </div>
        </div>
    `;
    list.appendChild(wrap);
    const titleEl = wrap.querySelector('[data-task-title]');
    const durEl = wrap.querySelector('[data-task-duration]');
    const notesEl = wrap.querySelector('[data-task-notes]');
    if (titleEl && prefill.title) titleEl.value = prefill.title;
    if (durEl && prefill.duration) durEl.value = prefill.duration;
    if (notesEl && prefill.notes) notesEl.value = prefill.notes;
    const rm = wrap.querySelector('.multi-task-remove');
    if (rm) {
        rm.addEventListener('click', () => {
            const rows = list.querySelectorAll('[data-project-task-row]');
            if (multiProjectWorkPackagesRequired() && rows.length <= 2) return;
            wrap.remove();
            list.querySelectorAll('[data-project-task-row]').forEach((r, i) => {
                const idx = r.querySelector('[data-task-index]');
                if (idx) idx.textContent = String(i + 1);
            });
            updateMultiProjectTasksUI();
        });
    }
}

function updateMultiProjectTasksUI() {
    const wrap = document.getElementById('multi-project-tasks-wrap');
    if (!wrap) return;
    const show = isMultiProjectSelected();
    wrap.classList.toggle('hidden', !show);
    if (!show) return;
    const list = document.getElementById('multi-project-tasks-list');
    if (!list) return;
    if (multiProjectWorkPackagesRequired()) {
        if (list.querySelectorAll('[data-project-task-row]').length === 0) {
            addMultiProjectTaskRow({ title: 'Work package 1 — discovery & design' });
            addMultiProjectTaskRow({ title: 'Work package 2 — execution & handover' });
        }
        ensureMultiTaskRows(2);
    }
}

function syncMultiTaskTitleFromRows() {
    if (!multiProjectWorkPackagesRequired()) return;
    const tasks = collectProjectTasksFromUI();
    const tt = document.getElementById('taskTitle');
    if (tt && tasks[0]?.title) tt.value = tasks[0].title;
}

function setupMultiProjectTasks() {
    document.querySelectorAll('input[name="projectType"]').forEach(r => {
        r.addEventListener('change', () => updateMultiProjectTasksUI());
    });
    const addBtn = document.getElementById('add-project-task-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => addMultiProjectTaskRow());
    }
    updateMultiProjectTasksUI();
}

const ALT_MODE_LABELS = { cash: 'Cash', equity: 'Equity', profit_sharing: 'Profit sharing', barter: 'Barter', hybrid: 'Hybrid' };

function buildAlternateOpenPanelHtml(mode) {
    const label = ALT_MODE_LABELS[mode] || mode;
    const head = `<div class="occ-s6-alt-panel-head"><span class="occ-s6-alt-badge">Also open to</span><h4 class="occ-s6-alt-panel-title">${label}</h4></div>`;
    if (mode === 'cash') {
        return `<div class="occ-s6-alt-panel" data-alt-mode="cash">${head}
            <p class="occ-s6-help mb-3">Outline a cash structure you could accept if the partner prefers it (e.g. milestones, retainage).</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="form-group md:col-span-2">
                    <label for="alt-cash-summary" class="occ-s6-field-label">Summary <span class="text-red-600">*</span></label>
                    <textarea id="alt-cash-summary" name="altCashSummary" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" rows="3" placeholder="e.g. 40% on mobilization, 60% on milestones…" data-rich-text="true"></textarea>
                </div>
                <div class="form-group">
                    <label for="alt-cash-amount" class="occ-s6-field-label">Indicative amount (SAR)</label>
                    <input type="number" id="alt-cash-amount" name="altCashAmount" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" min="0" step="0.01">
                </div>
                <div class="form-group">
                    <label for="alt-cash-terms" class="occ-s6-field-label">Payment cadence</label>
                    <select id="alt-cash-terms" name="altCashTerms" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Select (optional)</option>
                        <option value="upfront">Upfront</option>
                        <option value="milestone_based">Milestone-based</option>
                        <option value="upon_completion">Upon completion</option>
                        <option value="monthly">Monthly</option>
                        <option value="installments">Installments</option>
                    </select>
                </div>
            </div>
            <div class="form-group mb-0">
                <label for="alt-cash-milestones" class="occ-s6-field-label">Milestone notes</label>
                <textarea id="alt-cash-milestones" name="altCashMilestones" class="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="2" placeholder="Optional detail on timing" data-rich-text="true"></textarea>
            </div>
        </div>`;
    }
    if (mode === 'equity') {
        return `<div class="occ-s6-alt-panel" data-alt-mode="equity">${head}
            <p class="occ-s6-help mb-3">Describe an equity arrangement you could consider alongside your primary model.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group md:col-span-2">
                    <label for="alt-equity-summary" class="occ-s6-field-label">Summary <span class="text-red-600">*</span></label>
                    <textarea id="alt-equity-summary" name="altEquitySummary" class="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="3" placeholder="Stake, governance, contribution expectations…" data-rich-text="true"></textarea>
                </div>
                <div class="form-group">
                    <label for="alt-equity-pct" class="occ-s6-field-label">Indicative % (optional)</label>
                    <input type="number" id="alt-equity-pct" name="altEquityPct" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 25" min="0" max="100" step="0.1">
                </div>
                <div class="form-group">
                    <label for="alt-equity-vesting" class="occ-s6-field-label">Vesting (optional)</label>
                    <select id="alt-equity-vesting" name="altEquityVesting" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="immediate">Immediate</option>
                        <option value="1_year">1 year</option>
                        <option value="2_years">2 years</option>
                        <option value="3_years">3 years</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>
            </div>
        </div>`;
    }
    if (mode === 'profit_sharing') {
        return `<div class="occ-s6-alt-panel" data-alt-mode="profit_sharing">${head}
            <p class="occ-s6-help mb-3">Explain a profit- or revenue-share you would entertain as a fallback.</p>
            <div class="form-group mb-4">
                <label for="alt-ps-summary" class="occ-s6-field-label">Summary <span class="text-red-600">*</span></label>
                <textarea id="alt-ps-summary" name="altPsSummary" class="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="3" placeholder="Basis, split idea, reconciliation…" data-rich-text="true"></textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="form-group">
                    <label for="alt-ps-pct" class="occ-s6-field-label">Share % (optional)</label>
                    <input type="number" id="alt-ps-pct" name="altPsPct" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 12" min="0" max="100" step="0.1">
                </div>
                <div class="form-group">
                    <label for="alt-ps-basis" class="occ-s6-field-label">Revenue basis</label>
                    <select id="alt-ps-basis" name="altPsBasis" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="revenue">Gross revenue</option>
                        <option value="profit">Net profit</option>
                        <option value="gross_profit">Gross profit</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="alt-ps-duration" class="occ-s6-field-label">Duration</label>
                    <select id="alt-ps-duration" name="altPsDuration" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="project">Project length</option>
                        <option value="1y">1 year</option>
                        <option value="2y">2 years</option>
                        <option value="3y">3+ years</option>
                        <option value="ongoing">Ongoing</option>
                    </select>
                </div>
            </div>
        </div>`;
    }
    if (mode === 'barter') {
        return `<div class="occ-s6-alt-panel" data-alt-mode="barter">${head}
            <p class="occ-s6-help mb-3">What you could trade and what you would want back if the collaboration shifted to barter.</p>
            <div class="occ-rtx-stack flex flex-col gap-5">
                <div class="form-group mb-0">
                    <label for="alt-barter-offer" class="occ-s6-field-label">What you offer <span class="text-red-600">*</span></label>
                    <p class="text-sm text-slate-500 mt-0 mb-2">Resources or services you would contribute.</p>
                    <textarea id="alt-barter-offer" name="altBarterOffer" class="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="3" placeholder="Example: plant, labour, design support…" data-rich-text="true"></textarea>
                </div>
                <div class="form-group mb-0">
                    <label for="alt-barter-terms" class="occ-s6-field-label">What you want in return <span class="text-red-600">*</span></label>
                    <p class="text-sm text-slate-500 mt-0 mb-2">Return, timing, and quality expectations.</p>
                    <textarea id="alt-barter-terms" name="altBarterTerms" class="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="3" placeholder="Example: space, licences, materials by milestone…" data-rich-text="true"></textarea>
                </div>
                <div class="form-group mb-0 max-w-xl">
                    <label for="alt-barter-value" class="occ-s6-field-label">Expected exchange value (optional)</label>
                    <p class="text-sm text-slate-500 mt-0 mb-2">Optional SAR equivalent for comparison.</p>
                    <input type="text" id="alt-barter-value" name="altBarterValue" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Equivalent to 50K SAR">
                </div>
            </div>
        </div>`;
    }
    if (mode === 'hybrid') {
        return `<div class="occ-s6-alt-panel" data-alt-mode="hybrid">${head}
            <p class="occ-s6-help mb-3">Describe another cash / equity / barter mix you would consider (percentages should total 100% if all three are filled).</p>
            <div class="form-group mb-4">
                <label for="alt-hybrid-summary" class="occ-s6-field-label">Overview <span class="text-red-600">*</span></label>
                <textarea id="alt-hybrid-summary" name="altHybridSummary" class="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="3" placeholder="When a hybrid fallback makes sense for you…" data-rich-text="true"></textarea>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                <div class="form-group">
                    <label for="alt-hybrid-cash" class="occ-s6-field-label">Cash %</label>
                    <input type="number" id="alt-hybrid-cash" name="altHybridCash" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 30" min="0" max="100" step="0.1">
                </div>
                <div class="form-group">
                    <label for="alt-hybrid-equity" class="occ-s6-field-label">Equity %</label>
                    <input type="number" id="alt-hybrid-equity" name="altHybridEquity" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 50" min="0" max="100" step="0.1">
                </div>
                <div class="form-group">
                    <label for="alt-hybrid-barter" class="occ-s6-field-label">Barter %</label>
                    <input type="number" id="alt-hybrid-barter" name="altHybridBarter" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 20" min="0" max="100" step="0.1">
                </div>
            </div>
            <p class="occ-s6-alt-hybrid-total mb-4" aria-live="polite"><span class="text-slate-500 font-medium">Total: </span><span id="alt-hybrid-total-pct">0%</span></p>
            <div class="occ-rtx-stack flex flex-col gap-5">
                <div class="form-group mb-0">
                    <label for="alt-hybrid-cash-details" class="occ-s6-field-label">Cash details</label>
                    <p class="text-sm text-slate-500 mt-0 mb-2">Payment cadence for the cash slice of this fallback mix.</p>
                    <textarea id="alt-hybrid-cash-details" name="altHybridCashDetails" class="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="3" placeholder="Example: milestones, retainage, currency…" data-rich-text="true"></textarea>
                </div>
                <div class="form-group mb-0">
                    <label for="alt-hybrid-equity-details" class="occ-s6-field-label">Equity details</label>
                    <p class="text-sm text-slate-500 mt-0 mb-2">Stake, vesting, or governance for the equity slice.</p>
                    <textarea id="alt-hybrid-equity-details" name="altHybridEquityDetails" class="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="3" placeholder="Example: % range, board, cliff…" data-rich-text="true"></textarea>
                </div>
                <div class="form-group mb-0">
                    <label for="alt-hybrid-barter-details" class="occ-s6-field-label">Barter details</label>
                    <p class="text-sm text-slate-500 mt-0 mb-2">In-kind items or services for the barter slice.</p>
                    <textarea id="alt-hybrid-barter-details" name="altHybridBarterDetails" class="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="3" placeholder="Example: deliverables counted as barter…" data-rich-text="true"></textarea>
                </div>
            </div>
        </div>`;
    }
    return '';
}

function collectAlternateExchangeDetailsFromForm() {
    const host = document.getElementById('occ-alternate-details-host');
    if (!host) return [];
    const out = [];
    host.querySelectorAll('.occ-s6-alt-panel[data-alt-mode]').forEach(panel => {
        const mode = panel.dataset.altMode;
        const row = { mode };
        if (mode === 'cash') {
            row.summary = (document.getElementById('alt-cash-summary')?.value || '').trim();
            const amt = document.getElementById('alt-cash-amount')?.value;
            row.indicativeAmount = amt != null && amt !== '' ? parseFloat(amt) : null;
            row.paymentTerms = document.getElementById('alt-cash-terms')?.value || '';
            row.milestoneNotes = (document.getElementById('alt-cash-milestones')?.value || '').trim();
        } else if (mode === 'equity') {
            row.summary = (document.getElementById('alt-equity-summary')?.value || '').trim();
            const p = document.getElementById('alt-equity-pct')?.value;
            row.indicativePercentage = p != null && p !== '' ? parseFloat(p) : null;
            row.vesting = document.getElementById('alt-equity-vesting')?.value || '';
        } else if (mode === 'profit_sharing') {
            row.summary = (document.getElementById('alt-ps-summary')?.value || '').trim();
            const p = document.getElementById('alt-ps-pct')?.value;
            row.sharePercentage = p != null && p !== '' ? parseFloat(p) : null;
            row.basis = document.getElementById('alt-ps-basis')?.value || '';
            row.duration = document.getElementById('alt-ps-duration')?.value || '';
        } else if (mode === 'barter') {
            row.offer = (document.getElementById('alt-barter-offer')?.value || '').trim();
            row.terms = (document.getElementById('alt-barter-terms')?.value || '').trim();
            row.expectedValue = (document.getElementById('alt-barter-value')?.value || '').trim();
        } else if (mode === 'hybrid') {
            row.summary = (document.getElementById('alt-hybrid-summary')?.value || '').trim();
            row.cashPct = parseFloat(document.getElementById('alt-hybrid-cash')?.value || '') || null;
            row.equityPct = parseFloat(document.getElementById('alt-hybrid-equity')?.value || '') || null;
            row.barterPct = parseFloat(document.getElementById('alt-hybrid-barter')?.value || '') || null;
            row.cashDetails = (document.getElementById('alt-hybrid-cash-details')?.value || '').trim();
            row.equityDetails = (document.getElementById('alt-hybrid-equity-details')?.value || '').trim();
            row.barterDetails = (document.getElementById('alt-hybrid-barter-details')?.value || '').trim();
        }
        out.push(row);
    });
    return out;
}

function validateAlternateExchangePanels() {
    const panels = document.querySelectorAll('#occ-alternate-details-host .occ-s6-alt-panel[data-alt-mode]');
    for (let i = 0; i < panels.length; i++) {
        const panel = panels[i];
        const mode = panel.dataset.altMode;
        const name = ALT_MODE_LABELS[mode] || mode;
        if (mode === 'barter') {
            const o = plainTextFromHtml(document.getElementById('alt-barter-offer')?.value || '');
            const t = plainTextFromHtml(document.getElementById('alt-barter-terms')?.value || '');
            if (!o) {
                showError(`“Also open to ${name}”: add what you would offer.`);
                return false;
            }
            if (!t) {
                showError(`“Also open to ${name}”: add barter terms.`);
                return false;
            }
        } else {
            let elId = 'alt-cash-summary';
            if (mode === 'equity') elId = 'alt-equity-summary';
            else if (mode === 'profit_sharing') elId = 'alt-ps-summary';
            else if (mode === 'hybrid') elId = 'alt-hybrid-summary';
            const s = plainTextFromHtml(document.getElementById(elId)?.value || '');
            if (!s) {
                showError(`“Also open to ${name}”: add a short description of what you would consider.`);
                return false;
            }
        }
        if (mode === 'hybrid') {
            const c = parseFloat(document.getElementById('alt-hybrid-cash')?.value || 0) || 0;
            const e = parseFloat(document.getElementById('alt-hybrid-equity')?.value || 0) || 0;
            const b = parseFloat(document.getElementById('alt-hybrid-barter')?.value || 0) || 0;
            const filled = [c, e, b].filter(x => x > 0).length;
            if (filled === 3 && Math.abs(c + e + b - 100) > 0.02) {
                showError('“Also open to Hybrid”: the three percentages should total 100% when all are filled.');
                return false;
            }
        }
    }
    return true;
}

function wireAltHybridTotalListeners() {
    const cash = document.getElementById('alt-hybrid-cash');
    const equity = document.getElementById('alt-hybrid-equity');
    const barter = document.getElementById('alt-hybrid-barter');
    const totalEl = document.getElementById('alt-hybrid-total-pct');
    if (!cash || !equity || !barter || !totalEl) return;
    function upd() {
        const t = (parseFloat(cash.value) || 0) + (parseFloat(equity.value) || 0) + (parseFloat(barter.value) || 0);
        totalEl.textContent = `${t.toFixed(1)}%`;
    }
    [cash, equity, barter].forEach(el => el.addEventListener('input', upd));
    upd();
}

function setupExchangeModeSelection() {
    const exchangeModeCards = document.querySelectorAll('.exchange-mode-card');
    const exchangeModeInput = document.getElementById('exchange-mode');
    const selectedDisplay = document.getElementById('selected-exchange-display');
    const clearButton = document.getElementById('clear-exchange-selection');
    const fieldsContainer = document.getElementById('exchange-mode-fields');
    const currencyGroup = document.getElementById('currency-group');
    if (!exchangeModeCards.length || !exchangeModeInput || !fieldsContainer) return;
    
    let selectedMode = null;
    
    exchangeModeCards.forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.dataset.mode;
            selectExchangeMode(mode);
        });
    });

    const modesWrap = document.getElementById('accepted-modes-wrap');
    if (modesWrap) {
        modesWrap.addEventListener('change', () => renderAlternateExchangePanels());
    }
    
    function syncPrimaryToAlsoOpen(mode) {
        document.querySelectorAll('.accepted-mode-cb').forEach(cb => {
            const isPrimary = cb.value === mode;
            cb.checked = false;
            cb.disabled = !!isPrimary;
            const wrap = cb.closest('.occ-s6-chip');
            if (wrap) wrap.classList.toggle('occ-s6-chip--primary-lock', isPrimary);
        });
        renderAlternateExchangePanels();
    }

    function renderAlternateExchangePanels() {
        const host = document.getElementById('occ-alternate-details-host');
        const wrap = document.getElementById('occ-alternate-details-wrap');
        if (!host || !wrap) return;
        const checked = Array.from(document.querySelectorAll('.accepted-mode-cb:checked')).filter(cb => !cb.disabled).map(cb => cb.value);
        const want = new Set(checked.filter(m => ALT_MODE_LABELS[m]));
        Array.from(host.querySelectorAll('.occ-s6-alt-panel[data-alt-mode]')).forEach(panel => {
            const m = panel.dataset.altMode;
            if (!want.has(m)) {
                if (window.RichTextEditor && typeof window.RichTextEditor.destroy === 'function') {
                    panel.querySelectorAll('textarea[data-rich-text="true"]').forEach(ta => {
                        if (ta.id) window.RichTextEditor.destroy(ta.id);
                    });
                }
                panel.remove();
            }
        });
        want.forEach(mode => {
            if (!host.querySelector(`.occ-s6-alt-panel[data-alt-mode="${mode}"]`)) {
                const html = buildAlternateOpenPanelHtml(mode);
                if (!html) return;
                const t = document.createElement('template');
                t.innerHTML = html.trim();
                const node = t.content.firstElementChild;
                if (node) host.appendChild(node);
            }
        });
        if (want.size === 0) {
            if (window.RichTextEditor && typeof window.RichTextEditor.destroy === 'function') {
                host.querySelectorAll('textarea[data-rich-text="true"]').forEach(ta => {
                    if (ta.id) window.RichTextEditor.destroy(ta.id);
                });
            }
            host.innerHTML = '';
            wrap.classList.add('hidden');
            wrap.setAttribute('hidden', '');
        } else {
            wrap.classList.remove('hidden');
            wrap.removeAttribute('hidden');
            requestAnimationFrame(() => {
                try {
                    wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } catch (e) {}
            });
        }
        setTimeout(() => {
            if (window.RichTextEditor && typeof window.RichTextEditor.initAll === 'function') {
                window.RichTextEditor.initAll();
            }
            if (want.has('hybrid')) wireAltHybridTotalListeners();
            if (typeof refreshEstimatedValueDisplay === 'function') refreshEstimatedValueDisplay();
        }, 120);
    }

    function refreshStep6ValueSummary() {
        const card = document.getElementById('occ-vx-summary-card');
        const mode = document.getElementById('exchange-mode')?.value;
        const modeNames = {
            cash: 'Cash',
            equity: 'Equity',
            profit_sharing: 'Profit sharing',
            barter: 'Barter',
            hybrid: 'Hybrid'
        };
        if (!card) return;
        if (!mode) {
            card.setAttribute('hidden', '');
            return;
        }
        card.removeAttribute('hidden');
        const elModel = document.getElementById('occ-vx-sum-model');
        const elBudget = document.getElementById('occ-vx-sum-budget');
        const elEst = document.getElementById('occ-vx-sum-estimated');
        const elTerms = document.getElementById('occ-vx-sum-terms');
        const elAlso = document.getElementById('occ-vx-sum-also');
        if (elModel) elModel.textContent = modeNames[mode] || mode;
        const bmin = document.getElementById('budgetRange_min')?.value;
        const bmax = document.getElementById('budgetRange_max')?.value;
        if (elBudget) {
            if (bmin !== '' && bmax !== '' && bmin != null && bmax != null) {
                elBudget.textContent = `${Number(bmin).toLocaleString()} – ${Number(bmax).toLocaleString()} SAR`;
            } else elBudget.textContent = '—';
        }
        if (elEst) elEst.textContent = (document.getElementById('estimated-value-display')?.textContent || '—').trim() || '—';
        let terms = '—';
        if (mode === 'cash') {
            const amt = document.getElementById('cash-amount')?.value?.trim();
            const pt = document.getElementById('cash-payment-terms');
            const ptLabel = pt?.selectedOptions?.[0]?.text?.trim() || pt?.value;
            const parts = [];
            if (amt) parts.push(`Cash: ${Number(amt).toLocaleString()} SAR`);
            if (pt?.value) parts.push(`Terms: ${ptLabel}`);
            const ms = document.getElementById('cash-milestones')?.value?.replace(/<[^>]+>/g, ' ')?.trim();
            if (ms) parts.push(`Milestones: ${ms.slice(0, 120)}${ms.length > 120 ? '…' : ''}`);
            if (parts.length) terms = parts.join(' · ');
        } else if (mode === 'equity') {
            const pct = document.getElementById('equity-percentage')?.value?.trim();
            const vest = document.getElementById('equity-vesting');
            const vestLabel = vest?.selectedOptions?.[0]?.text?.trim() || vest?.value;
            const parts = [];
            if (pct) parts.push(`${pct}% equity`);
            if (vest?.value) parts.push(`Vesting: ${vestLabel}`);
            if (parts.length) terms = parts.join(' · ');
        } else if (mode === 'profit_sharing') {
            const pct = document.getElementById('profit-share-percentage')?.value?.trim();
            const basis = document.getElementById('profit-basis');
            const basisLabel = basis?.selectedOptions?.[0]?.text?.trim() || basis?.value;
            const dur = document.getElementById('profit-duration');
            const durLabel = dur?.selectedOptions?.[0]?.text?.trim() || dur?.value;
            const parts = [];
            if (pct) parts.push(`Share: ${pct}%`);
            if (basis?.value) parts.push(`Basis: ${basisLabel}`);
            if (dur?.value) parts.push(`Duration: ${durLabel}`);
            if (parts.length) terms = parts.join(' · ');
        } else if (mode === 'barter') {
            const parts = [];
            const off = document.getElementById('barter-offer')?.value?.replace(/<[^>]+>/g, ' ')?.trim();
            const val = document.getElementById('barter-value')?.value?.trim();
            if (off) parts.push(off.slice(0, 100) + (off.length > 100 ? '…' : ''));
            if (val) parts.push(`Est. value: ${val}`);
            if (parts.length) terms = parts.join(' · ');
        } else if (mode === 'hybrid') {
            const c = document.getElementById('hybrid-cash')?.value;
            const e = document.getElementById('hybrid-equity')?.value;
            const b = document.getElementById('hybrid-barter')?.value;
            const parts = [];
            if (c) parts.push(`Cash ${c}%`);
            if (e) parts.push(`Equity ${e}%`);
            if (b) parts.push(`Barter ${b}%`);
            if (parts.length) terms = parts.join(', ');
        }
        if (elTerms) elTerms.textContent = terms;
        const primaryLabel = modeNames[mode] || mode;
        const also = Array.from(document.querySelectorAll('.accepted-mode-cb:checked'))
            .map(c => modeNames[c.value] || c.value)
            .filter(l => l && l !== primaryLabel);
        if (elAlso) elAlso.textContent = also.length ? also.join(', ') : '—';
        const elAltDet = document.getElementById('occ-vx-sum-alt-details');
        if (elAltDet) {
            const alts = collectAlternateExchangeDetailsFromForm();
            if (!alts.length) {
                elAltDet.textContent = '—';
            } else {
                elAltDet.textContent = alts.map(r => {
                    const lab = ALT_MODE_LABELS[r.mode] || r.mode;
                    let snippet = '';
                    if (r.mode === 'barter') snippet = plainTextFromHtml(r.offer || '').slice(0, 72);
                    else snippet = plainTextFromHtml(r.summary || '').slice(0, 72);
                    const tail = snippet.length >= 72 ? '…' : '';
                    return `${lab}: ${snippet}${tail}`;
                }).join(' · ');
            }
        }
    }

    function selectExchangeMode(mode) {
        selectedMode = mode;
        exchangeModeInput.value = mode;

        exchangeModeCards.forEach(c => {
            const on = c.dataset.mode === mode;
            c.classList.toggle('selected', on);
            if (typeof c.setAttribute === 'function') c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });

        const modeNames = {
            cash: 'Cash',
            equity: 'Equity',
            profit_sharing: 'Profit sharing',
            barter: 'Barter',
            hybrid: 'Hybrid'
        };

        const nameEl = document.getElementById('selected-exchange-name');
        if (nameEl) nameEl.textContent = modeNames[mode] || mode;
        selectedDisplay.classList.remove('hidden');
        syncPrimaryToAlsoOpen(mode);
        renderExchangeModeFields(mode);
        setTimeout(refreshEstimatedValueDisplay, 100);
    }

    function refreshEstimatedValueDisplay() {
        const section = document.getElementById('estimated-value-section');
        const display = document.getElementById('estimated-value-display');
        if (!display) return;
        const estimator = window.valueEstimator;
        const modeInput = document.getElementById('exchange-mode');
        const mode = modeInput?.value;
        if (!estimator || !mode) {
            display.textContent = '—';
            if (section) section.classList.add('hidden');
            refreshStep6ValueSummary();
            return;
        }
        const currency = document.getElementById('currency')?.value || 'SAR';
        const budgetMin = parseFloat(document.getElementById('budgetRange_min')?.value) || 0;
        const budgetMax = parseFloat(document.getElementById('budgetRange_max')?.value) || 0;
        const exchangeData = {
            currency,
            budgetRange: { min: budgetMin, max: budgetMax, currency }
        };
        if (mode === 'cash') {
            exchangeData.cashAmount = parseFloat(document.getElementById('cash-amount')?.value);
        } else if (mode === 'equity') {
            exchangeData.equityPercentage = parseFloat(document.getElementById('equity-percentage')?.value);
            const cv = document.getElementById('equity-company-valuation')?.value;
            if (cv) exchangeData.companyValuation = cv.trim();
        } else if (mode === 'profit_sharing') {
            const pct = document.getElementById('profit-share-percentage')?.value;
            const exp = document.getElementById('expected-profit')?.value;
            if (pct) exchangeData.profitSharePercentage = parseFloat(pct);
            if (exp) exchangeData.expectedProfit = exp.trim();
        } else if (mode === 'barter') {
            const bv = document.getElementById('barter-value')?.value;
            if (bv) exchangeData.barterValue = bv.trim();
        } else if (mode === 'hybrid') {
            exchangeData.hybridCash = parseFloat(document.getElementById('hybrid-cash')?.value || 0);
            exchangeData.hybridEquity = parseFloat(document.getElementById('hybrid-equity')?.value || 0);
            exchangeData.hybridBarter = parseFloat(document.getElementById('hybrid-barter')?.value || 0);
        }
        const result = estimator.estimateFromExchangeData(exchangeData, mode);
        if (result.estimated_value != null && !isNaN(result.estimated_value)) {
            display.textContent = (result.estimated_value.toLocaleString()) + ' ' + (result.currency || 'SAR');
        } else {
            display.textContent = '—';
        }
        if (section) section.classList.add('hidden');
        refreshStep6ValueSummary();
    }
    window.refreshEstimatedValueDisplay = refreshEstimatedValueDisplay;

    const step6 = document.getElementById('step-6');
    if (step6) {
        step6.addEventListener('input', () => refreshEstimatedValueDisplay());
        step6.addEventListener('change', () => refreshEstimatedValueDisplay());
    }

    function getValueCategories() {
        try {
            const lookups = window.dataService && typeof window.dataService.getLookups === 'function' ? window.dataService.getLookups() : null;
            const arr = lookups && lookups.valueCategories ? lookups.valueCategories : null;
            if (Array.isArray(arr) && arr.length > 0) return arr;
        } catch (e) {}
        return [
            { id: 'cash', label: 'Cash' },
            { id: 'service', label: 'Service' },
            { id: 'equipment', label: 'Equipment' },
            { id: 'resource', label: 'Resource' },
            { id: 'equity', label: 'Equity' },
            { id: 'knowledge', label: 'Knowledge' }
        ];
    }

    function addValueItemRow(data) {
        const container = document.getElementById('value-items-container');
        if (!container) return;
        const categories = getValueCategories();
        const opts = categories.map(c => '<option value="' + (c.id || c) + '">' + (c.label || c) + '</option>').join('');
        const row = document.createElement('div');
        row.className = 'value-item-row flex flex-wrap gap-2 items-end border border-gray-200 rounded p-2 bg-white';
        row.innerHTML = '<select class="value-item-category px-3 py-2 border border-gray-300 rounded-md flex-1 min-w-[120px]" name="valueItemCategory">' + opts + '</select>' +
            '<input type="text" class="value-item-desc px-3 py-2 border border-gray-300 rounded-md flex-2 min-w-[160px]" placeholder="Description" name="valueItemDesc">' +
            '<input type="number" class="value-item-est px-3 py-2 border border-gray-300 rounded-md w-28" placeholder="SAR" min="0" step="0.01" name="valueItemEst">' +
            '<button type="button" class="value-item-remove btn btn-secondary btn-sm">Remove</button>';
        if (data && data.category) {
            const sel = row.querySelector('.value-item-category');
            if (sel) sel.value = data.category;
            const desc = row.querySelector('.value-item-desc');
            if (desc && data.description) desc.value = data.description;
            const est = row.querySelector('.value-item-est');
            if (est && data.estimatedValue != null) est.value = data.estimatedValue;
        }
        row.querySelector('.value-item-remove').addEventListener('click', () => row.remove());
        container.appendChild(row);
    }

    const addValueItemBtn = document.getElementById('add-value-item');
    if (addValueItemBtn) addValueItemBtn.addEventListener('click', () => addValueItemRow());
    
    function renderExchangeModeFields(mode) {
        let html = '';
        
        switch(mode) {
            case 'cash':
                if (currencyGroup) currencyGroup.classList.remove('hidden');
                html = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="form-group">
                            <label for="cash-amount" class="form-label">Cash Amount <span class="text-red-600">*</span></label>
                            <input 
                                type="number" 
                                id="cash-amount" 
                                name="cashAmount" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="e.g., 10000"
                                step="0.01"
                                required
                            >
                            <p class="text-sm text-gray-500 mt-1">Enter the total cash amount</p>
                        </div>
                        <div class="form-group">
                            <label for="cash-payment-terms" class="form-label">Payment Terms <span class="text-red-600">*</span></label>
                            <select 
                                id="cash-payment-terms" 
                                name="cashPaymentTerms" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            >
                                <option value="">Select payment terms</option>
                                <option value="upfront">Upfront</option>
                                <option value="milestone_based">Milestone-Based</option>
                                <option value="upon_completion">Upon Completion</option>
                                <option value="monthly">Monthly</option>
                                <option value="installments">Installments</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="cash-milestones" class="form-label">Payment Milestones</label>
                        <textarea 
                            id="cash-milestones" 
                            name="cashMilestones" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            rows="3"
                            placeholder="e.g., 50% upfront (5K SAR), 50% on completion (5K SAR)"
                            data-rich-text="true"
                        ></textarea>
                        <p class="text-sm text-gray-500 mt-1">Describe payment schedule and milestones</p>
                    </div>
                `;
                break;
                
            case 'equity':
                if (currencyGroup) currencyGroup.classList.add('hidden');
                html = `
                    <div class="occ-vx-mode-fields-inner">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div class="form-group mb-0">
                                <label for="equity-percentage" class="form-label">Equity percentage <span class="text-red-600">*</span></label>
                                <input 
                                    type="number" 
                                    id="equity-percentage" 
                                    name="equityPercentage" 
                                    class="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                                    placeholder="e.g. 40"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    required
                                >
                                <p class="text-sm text-slate-500 mt-1.5">Ownership stake you are offering or seeking (%).</p>
                            </div>
                            <div class="form-group mb-0">
                                <label for="equity-company-valuation" class="form-label">Company valuation (SAR)</label>
                                <input 
                                    type="text" 
                                    id="equity-company-valuation" 
                                    name="companyValuation" 
                                    class="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                                    placeholder="e.g. 5000000"
                                >
                                <p class="text-sm text-slate-500 mt-1.5">Used with % to estimate value (e.g. 5M = 5,000,000 SAR).</p>
                            </div>
                        </div>
                        <div class="form-group mb-5 md:max-w-md">
                            <label for="equity-vesting" class="form-label">Vesting terms</label>
                            <select 
                                id="equity-vesting" 
                                name="equityVesting" 
                                class="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                            >
                                <option value="">Select vesting period</option>
                                <option value="immediate">Immediate</option>
                                <option value="1_year">1 Year</option>
                                <option value="2_years">2 Years</option>
                                <option value="3_years">3 Years</option>
                                <option value="4_years">4 Years</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        <div class="form-group mb-0">
                            <label for="equity-contribution" class="form-label">Ownership notes</label>
                            <textarea 
                                id="equity-contribution" 
                                name="equityContribution" 
                                class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white min-h-[120px]"
                                rows="4"
                                placeholder="e.g. Join our JV: 40% equity for expertise + equipment"
                                data-rich-text="true"
                            ></textarea>
                            <p class="text-sm text-slate-500 mt-1.5">What contribution or role earns this stake.</p>
                        </div>
                    </div>
                `;
                break;
                
            case 'profit_sharing':
                if (currencyGroup) currencyGroup.classList.add('hidden');
                html = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="form-group">
                            <label for="profit-share-percentage" class="form-label">Profit share percentage <span class="text-red-600">*</span></label>
                            <input 
                                type="number" 
                                id="profit-share-percentage" 
                                name="profitSharePercentage" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="e.g. 15"
                                min="0"
                                max="100"
                                step="0.1"
                                required
                            >
                            <p class="text-sm text-gray-500 mt-1">Your share of profit or revenue (%).</p>
                        </div>
                        <div class="form-group">
                            <label for="profit-basis" class="form-label">Revenue basis <span class="text-red-600">*</span></label>
                            <select 
                                id="profit-basis" 
                                name="profitBasis" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            >
                                <option value="revenue">Gross revenue</option>
                                <option value="profit">Net profit (after costs)</option>
                                <option value="gross_profit">Gross profit</option>
                            </select>
                        </div>
                        <div class="form-group md:col-span-2">
                            <label for="profit-duration" class="form-label">Duration <span class="text-red-600">*</span></label>
                            <select 
                                id="profit-duration" 
                                name="profitDuration" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            >
                                <option value="">Select duration</option>
                                <option value="project">Project length only</option>
                                <option value="1y">1 year</option>
                                <option value="2y">2 years</option>
                                <option value="3y">3+ years</option>
                                <option value="ongoing">Ongoing / open-ended</option>
                                <option value="custom">Custom (describe below)</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="form-group">
                            <label for="profit-split" class="form-label">Split structure <span class="text-gray-500 font-normal">(optional)</span></label>
                            <input 
                                type="text" 
                                id="profit-split" 
                                name="profitSplit" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="e.g. 60-40 partner split"
                            >
                        </div>
                        <div class="form-group">
                            <label for="expected-profit" class="form-label">Expected profit (SAR) <span class="text-gray-500 font-normal">(optional)</span></label>
                            <input 
                                type="text" 
                                id="expected-profit" 
                                name="expectedProfit" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="e.g. 2000000"
                            >
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="profit-distribution" class="form-label">Distribution &amp; cadence notes <span class="text-gray-500 font-normal">(optional)</span></label>
                        <textarea 
                            id="profit-distribution" 
                            name="profitDistribution" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            rows="3"
                            placeholder="e.g. Quarterly reconciliation after audited costs"
                            data-rich-text="true"
                        ></textarea>
                    </div>
                `;
                break;
                
            case 'barter':
                if (currencyGroup) currencyGroup.classList.add('hidden');
                html = `
                    <div class="occ-rtx-stack flex flex-col gap-6 mb-6">
                        <div class="form-group occ-rtx-field mb-0">
                            <label for="barter-offer" class="form-label">What you offer <span class="text-red-600">*</span></label>
                            <p class="text-sm text-slate-500 mt-0 mb-2">Services, assets, or resources you would contribute to a barter arrangement.</p>
                            <textarea 
                                id="barter-offer" 
                                name="barterOffer" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                rows="3"
                                placeholder="Example: design support, equipment loan, training days…"
                                required
                                data-rich-text="true"
                            ></textarea>
                        </div>
                        <div class="form-group occ-rtx-field mb-0">
                            <label for="barter-need" class="form-label">What you want in return <span class="text-red-600">*</span></label>
                            <p class="text-sm text-slate-500 mt-0 mb-2">Return value, timing, quality, and handover expectations.</p>
                            <textarea 
                                id="barter-need" 
                                name="barterNeed" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                rows="3"
                                placeholder="Example: office space, licences, materials by date…"
                                required
                                data-rich-text="true"
                            ></textarea>
                        </div>
                        <div class="form-group occ-rtx-field mb-0 max-w-xl">
                            <label for="barter-value" class="form-label">Expected exchange value <span class="text-gray-500 font-normal">(optional)</span></label>
                            <p class="text-sm text-slate-500 mt-0 mb-2">Rough SAR equivalent helps others compare options.</p>
                            <input 
                                type="text" 
                                id="barter-value" 
                                name="barterValue" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="e.g. Equivalent to 50K SAR"
                            >
                        </div>
                    </div>
                `;
                break;
                
            case 'hybrid':
                if (currencyGroup) currencyGroup.classList.remove('hidden');
                html = `
                    <div class="mb-6">
                        <p class="text-sm font-medium text-gray-700 mb-4">Define the mix of exchange modes (must total 100%)</p>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div class="form-group">
                                <label for="hybrid-cash" class="form-label">Cash Percentage</label>
                                <input 
                                    type="number" 
                                    id="hybrid-cash" 
                                    name="hybridCash" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="e.g., 30"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                >
                                <p class="text-sm text-gray-500 mt-1">%</p>
                            </div>
                            <div class="form-group">
                                <label for="hybrid-equity" class="form-label">Equity Percentage</label>
                                <input 
                                    type="number" 
                                    id="hybrid-equity" 
                                    name="hybridEquity" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="e.g., 50"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                >
                                <p class="text-sm text-gray-500 mt-1">%</p>
                            </div>
                            <div class="form-group">
                                <label for="hybrid-barter" class="form-label">Barter Percentage</label>
                                <input 
                                    type="number" 
                                    id="hybrid-barter" 
                                    name="hybridBarter" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="e.g., 20"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                >
                                <p class="text-sm text-gray-500 mt-1">%</p>
                            </div>
                        </div>
                        <div class="occ-vx-hybrid-meter occ-vx-hybrid-meter--pending">
                            <p class="text-sm text-gray-700">
                                <span class="font-semibold">Total: </span>
                                <span id="hybrid-total">0%</span>
                            </p>
                        </div>
                    </div>
                    <div class="occ-rtx-stack flex flex-col gap-6 mb-2">
                        <div class="form-group occ-rtx-field mb-0">
                            <label for="hybrid-cash-details" class="form-label">Cash details</label>
                            <p class="text-sm text-slate-500 mt-0 mb-2">How the cash portion is paid (timing, milestones, currency notes).</p>
                            <textarea 
                                id="hybrid-cash-details" 
                                name="hybridCashDetails" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                rows="3"
                                placeholder="Example: 30% on signature, 70% on delivery…"
                                data-rich-text="true"
                            ></textarea>
                        </div>
                        <div class="form-group occ-rtx-field mb-0">
                            <label for="hybrid-equity-details" class="form-label">Equity details</label>
                            <p class="text-sm text-slate-500 mt-0 mb-2">Stake size, vesting, governance, or valuation context.</p>
                            <textarea 
                                id="hybrid-equity-details" 
                                name="hybridEquityDetails" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                rows="3"
                                placeholder="Example: board seat, cliff, contribution in kind…"
                                data-rich-text="true"
                            ></textarea>
                        </div>
                        <div class="form-group occ-rtx-field mb-0">
                            <label for="hybrid-barter-details" class="form-label">Barter details</label>
                            <p class="text-sm text-slate-500 mt-0 mb-2">What would be exchanged in-kind and how it maps to the barter share.</p>
                            <textarea 
                                id="hybrid-barter-details" 
                                name="hybridBarterDetails" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                rows="3"
                                placeholder="Example: labour, materials, or services counted toward the barter %…"
                                data-rich-text="true"
                            ></textarea>
                        </div>
                    </div>
                `;
                
                // Add total calculation for hybrid mode
                setTimeout(() => {
                    const cashInput = document.getElementById('hybrid-cash');
                    const equityInput = document.getElementById('hybrid-equity');
                    const barterInput = document.getElementById('hybrid-barter');
                    const totalDisplay = document.getElementById('hybrid-total');
                    
                    function updateTotal() {
                        const cash = parseFloat(cashInput?.value || 0);
                        const equity = parseFloat(equityInput?.value || 0);
                        const barter = parseFloat(barterInput?.value || 0);
                        const total = cash + equity + barter;
                        if (totalDisplay) {
                            totalDisplay.textContent = `${total.toFixed(1)}%`;
                            if (total === 100) {
                                totalDisplay.parentElement.classList.remove('occ-vx-hybrid-meter--pending');
                                totalDisplay.parentElement.classList.add('occ-vx-hybrid-meter--ok');
                            } else {
                                totalDisplay.parentElement.classList.remove('occ-vx-hybrid-meter--ok');
                                totalDisplay.parentElement.classList.add('occ-vx-hybrid-meter--pending');
                            }
                        }
                    }
                    
                    if (cashInput) cashInput.addEventListener('input', updateTotal);
                    if (equityInput) equityInput.addEventListener('input', updateTotal);
                    if (barterInput) barterInput.addEventListener('input', updateTotal);
                }, 100);
                break;
        }
        
        if (window.RichTextEditor && typeof window.RichTextEditor.destroy === 'function') {
            fieldsContainer.querySelectorAll('textarea[data-rich-text="true"]').forEach(ta => {
                if (ta.id) window.RichTextEditor.destroy(ta.id);
            });
        }
        fieldsContainer.innerHTML = html;
        fieldsContainer.querySelectorAll('input:not([type="checkbox"]):not([type="hidden"]), select, textarea').forEach(el => {
            el.classList.add('occ-vx-control');
        });

        // Initialize rich text editors for newly rendered exchange mode fields
        setTimeout(() => {
            if (window.RichTextEditor) {
                window.RichTextEditor.initAll();
            }
        }, 150);
    }
    
    clearButton.addEventListener('click', () => {
        selectedMode = null;
        exchangeModeInput.value = '';
        exchangeModeCards.forEach(c => {
            c.classList.remove('selected');
            if (typeof c.setAttribute === 'function') c.setAttribute('aria-pressed', 'false');
        });
        selectedDisplay.classList.add('hidden');
        fieldsContainer.innerHTML = '<p class="occ-vx-empty">Select how value will be exchanged to see the relevant fields.</p>';
        if (currencyGroup) currencyGroup.classList.add('hidden');
        document.querySelectorAll('.accepted-mode-cb').forEach(cb => {
            cb.disabled = false;
            const wrap = cb.closest('.occ-s6-chip');
            if (wrap) wrap.classList.remove('occ-s6-chip--primary-lock');
        });
        renderAlternateExchangePanels();
        refreshEstimatedValueDisplay();
    });
    renderAlternateExchangePanels();
}

function setupDemoDataFiller() {
    const delegationKey = 'data-demo-data-filler-bound';
    if (document.body.getAttribute(delegationKey)) return;
    document.body.setAttribute(delegationKey, '1');

    function closeModal() {
        const modal = document.getElementById('demo-data-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    // Use event delegation so the button works when DOM is injected after script load (e.g. SPA navigation)
    document.body.addEventListener('click', (e) => {
        const fillDemoBtn = e.target.closest('#fill-demo-data');
        if (fillDemoBtn) {
            e.preventDefault();
            const modal = document.getElementById('demo-data-modal');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            } else {
                fillDemoData(pickRandomDemoDataset());
            }
            return;
        }
        if (e.target.id === 'demo-modal-confirm') {
            e.preventDefault();
            closeModal();
            fillDemoData(pickRandomDemoDataset());
            return;
        }
        if (e.target.id === 'demo-modal-cancel') {
            e.preventDefault();
            closeModal();
            return;
        }
    });

    document.body.addEventListener('click', (e) => {
        const modal = document.getElementById('demo-data-modal');
        if (modal && e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('demo-data-modal');
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) closeModal();
    });
}

/**
 * Fills Step 4 dynamic (model-specific) fields. Supports all attribute types: text, select, textarea,
 * number, boolean, currency, date, tags, array-percentages, currency-range, date-range, multi-select, array-objects.
 */
function fillDemoModelSpecificFields(modelType, subModelType, modelFields) {
    const formService = window.opportunityFormService;
    const attrs = (formService && formService.getAttributes(modelType, subModelType)) || [];
    const attrByKey = {};
    attrs.forEach(a => { attrByKey[a.key] = a; });

    const setField = (key, val) => {
        const el = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
        if (!el) return;
        if (el.type === 'checkbox') {
            el.checked = !!val;
        } else if (el.hasAttribute && el.hasAttribute('data-rich-text') && window.RichTextEditor && typeof val === 'string') {
            el.value = val;
            setTimeout(() => { try { window.RichTextEditor.setContent(el.id || key, val); } catch (_) {} }, 100);
        } else {
            el.value = val != null ? String(val) : '';
        }
    };

    function applyModelField(key, value) {
        const attr = attrByKey[key];
        const type = attr ? attr.type : null;

        if (type === 'currency-range' && value && typeof value === 'object' && ('min' in value || 'max' in value)) {
            const minEl = document.getElementById(`${key}_min`) || document.querySelector(`[name="${key}_min"]`);
            const maxEl = document.getElementById(`${key}_max`) || document.querySelector(`[name="${key}_max"]`);
            if (minEl) minEl.value = value.min != null ? String(value.min) : '';
            if (maxEl) maxEl.value = value.max != null ? String(value.max) : '';
            return;
        }
        if (type === 'date-range' && value && typeof value === 'object' && ('start' in value || 'end' in value)) {
            const startEl = document.getElementById(`${key}_start`) || document.querySelector(`[name="${key}_start"]`);
            const endEl = document.getElementById(`${key}_end`) || document.querySelector(`[name="${key}_end"]`);
            if (startEl) startEl.value = value.start != null ? String(value.start) : '';
            if (endEl) endEl.value = value.end != null ? String(value.end) : '';
            return;
        }
        if (type === 'multi-select' && Array.isArray(value)) {
            const wrap = document.querySelector(`.occ-ms-field[data-field-key="${key}"]`);
            if (wrap) {
                wrap.querySelectorAll('.occ-ms-option').forEach(cb => {
                    cb.checked = value.includes(cb.value);
                });
                return;
            }
            const selectEl = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
            if (selectEl && selectEl.multiple) {
                Array.from(selectEl.options).forEach(opt => {
                    opt.selected = value.includes(opt.value);
                });
            }
            return;
        }
        if (type === 'array-objects' && Array.isArray(value) && value.length > 0) {
            const container = document.getElementById(`${key}_container`);
            if (!container) return;
            const formServiceRef = window.opportunityFormService;
            if (!formServiceRef || typeof formServiceRef.addArrayObject !== 'function') return;
            const existingRows = container.querySelectorAll('.array-object-item');
            const needCount = value.length;
            for (let i = existingRows.length; i < needCount; i++) {
                formServiceRef.addArrayObject(key);
            }
            value.forEach((item, i) => {
                const labelVal = item && (item.label != null ? String(item.label) : '');
                const valueVal = item && (item.value != null ? String(item.value) : '');
                const labelInput = document.querySelector(`input[name="${key}[${i}][label]"]`);
                const valueInput = document.querySelector(`input[name="${key}[${i}][value]"]`);
                if (labelInput) labelInput.value = labelVal;
                if (valueInput) valueInput.value = valueVal;
            });
            return;
        }

        setField(key, value);
    }

    if (modelFields && typeof modelFields === 'object') {
        Object.entries(modelFields).forEach(([key, value]) => applyModelField(key, value));
        return;
    }
    // Backward compatibility: default task_based demo values
    if (modelType === 'project_based' && subModelType === 'task_based') {
        const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setField('taskTitle', 'Structural Design and Analysis for Commercial Building');
        setField('taskType', 'Engineering');
        setField('detailedScope', 'Provide complete structural engineering services including:\n- Structural analysis and design for 5-story reinforced concrete building\n- Foundation design and soil analysis\n- Construction drawings and specifications\n- Site visits and construction supervision');
        setField('duration', '90');
        setField('requiredSkills', 'Structural Engineering, Reinforced Concrete Design, Foundation Design, AutoCAD, ETABS');
        setField('experienceLevel', 'Senior');
        setField('locationRequirement', 'Hybrid');
        setField('startDate', startDate);
        setField('deliverableFormat', 'PDF drawings, CAD files, calculation reports');
    }
}

/**
 * Fills Step 6 mode-specific fields from dataset.step5.modeFields (demo payload key).
 * Field keys in modeFields match input id (e.g. cash-amount, profit-share-percentage).
 */
function fillDemoStep5ModeFields(modeFields, currency, agreement) {
    if (!modeFields || typeof modeFields !== 'object') return;
    const setField = (key, val) => {
        const el = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
        if (!el) return;
        if (el.type === 'checkbox') {
            el.checked = !!val;
        } else if (el.hasAttribute && el.hasAttribute('data-rich-text') && window.RichTextEditor && typeof val === 'string') {
            el.value = val;
            setTimeout(() => { try { window.RichTextEditor.setContent(el.id || key, val); } catch (_) {} }, 100);
        } else {
            el.value = val != null ? String(val) : '';
        }
    };
    Object.entries(modeFields).forEach(([key, value]) => setField(key, value));
    if (currency != null) {
        const currencyEl = document.getElementById('currency');
        if (currencyEl) currencyEl.value = currency;
    }
    const agreementEl = document.getElementById('exchange-agreement');
    if (agreementEl) agreementEl.checked = !!agreement;
}

async function fillDemoData(dataset) {
    const d = dataset || DEMO_DATASETS[0];
    try {
        // Step 1: Project Type
        const projectType = (d.projectType != null ? d.projectType : 'single');
        const projectTypeRadio = document.querySelector(`input[name="projectType"][value="${projectType}"]`);
        if (projectTypeRadio) projectTypeRadio.checked = true;
        updateMultiProjectTasksUI();

        // Step 2: Basic info
        const titleInput = document.getElementById('title');
        const descriptionInput = document.getElementById('description');
        if (titleInput && d.step1) titleInput.value = d.step1.title || '';
        const descriptionContent = (d.step1 && d.step1.description) || '';
        if (descriptionInput) {
            descriptionInput.value = descriptionContent;
            if (descriptionInput.hasAttribute('data-rich-text') && window.RichTextEditor && descriptionContent) {
                setTimeout(() => window.RichTextEditor.setContent('description', descriptionContent), 200);
            }
        }
        fillDemoLocation(d.step1 && d.step1.locationKey);
        
        // Step 2: Intent
        const intent = (d.step2 && d.step2.intent) || 'request';
        const intentRadio = document.querySelector(`input[name="intent"][value="${intent}"]`);
        if (intentRadio) intentRadio.checked = true;
        
        // Step 3: Scope tags (skills, sectors, interests, certifications)
        const step3 = d.step3 || {};
        const skills = step3.skills || [];
        const sectors = step3.sectors || [];
        const interests = step3.interests || [];
        const certifications = step3.certifications || [];
        const scopeIds = ['scope-skills', 'scope-sectors', 'scope-interests', 'scope-certifications'];
        const tagArrays = [skills, sectors, interests, certifications];
        scopeIds.forEach((id, i) => {
            const el = document.getElementById(id);
            if (!el) return;
            const tags = tagArrays[i] || [];
            el.dataset.tagsArray = JSON.stringify(tags);
            renderScopeTags(el, tags);
            el.value = '';
        });
        
        // Step 4: Category + Sub-Model + Model-Specific Details
        const step4 = d.step4 || { category: 'project_based', subModel: 'task_based' };
        const categoryKey = step4.category || 'project_based';
        const subModelKey = step4.subModel || 'task_based';
        const categoryRadio = document.querySelector(`input[name="category"][value="${categoryKey}"]`);
        if (categoryRadio) {
            categoryRadio.checked = true;
            const modelTypeInput = document.getElementById('model-type');
            if (modelTypeInput) modelTypeInput.value = categoryKey;
            const submodelGroup = document.getElementById('submodel-group');
            const submodelOptions = document.getElementById('submodel-options');
            if (submodelGroup && submodelOptions) {
                categoryRadio.dispatchEvent(new Event('change', { bubbles: true }));
                setTimeout(() => {
                    const submodelRadio = document.querySelector(`input[name="submodel"][value="${subModelKey}"]`);
                    if (submodelRadio) {
                        submodelRadio.checked = true;
                        const submodelTypeInput = document.getElementById('submodel-type');
                        if (submodelTypeInput) submodelTypeInput.value = subModelKey;
                        const modelDetailsSection = document.getElementById('model-details-section');
                        if (modelDetailsSection) modelDetailsSection.style.display = 'block';
                        renderDynamicFields(categoryKey, subModelKey);
                        setTimeout(() => {
                            fillDemoModelSpecificFields(categoryKey, subModelKey, step4.modelFields);
                            if (d.step4MultiTasks && Array.isArray(d.step4MultiTasks)) {
                                const list = document.getElementById('multi-project-tasks-list');
                                if (list) {
                                    list.innerHTML = '';
                                    d.step4MultiTasks.forEach(t => addMultiProjectTaskRow(t));
                                }
                                updateMultiProjectTasksUI();
                            }
                        }, 500);
                    }
                }, 50);
            }
        }
        
        // Step 6: Budget range, exchange mode & financial terms
        const step5 = d.step5 || {};
        const budgetMinEl = document.getElementById('budgetRange_min');
        const budgetMaxEl = document.getElementById('budgetRange_max');
        if (budgetMinEl) budgetMinEl.value = step5.budgetMin != null ? String(step5.budgetMin) : '';
        if (budgetMaxEl) budgetMaxEl.value = step5.budgetMax != null ? String(step5.budgetMax) : '';
        const exchangeMode = step5.exchangeMode || 'cash';
        const modeCard = document.querySelector(`.exchange-mode-card[data-mode="${exchangeMode}"]`);
        if (modeCard) {
            modeCard.click();
            setTimeout(() => {
                fillDemoStep5ModeFields(step5.modeFields, step5.currency, step5.agreement);
            }, 150);
        }
        
        // Step 6: Status
        const step6 = d.step6 || {};
        const statusField = document.getElementById('status');
        if (statusField) statusField.value = (step6.status != null ? step6.status : 'draft') || 'draft';
        
        updateScopeLabels();
        
        const successDiv = document.getElementById('form-success');
        if (successDiv) {
            const rawTitle = (d.step1 && d.step1.title) ? String(d.step1.title).trim() : '';
            const titleSnippet = rawTitle.length > 72 ? `${rawTitle.slice(0, 69)}…` : rawTitle;
            successDiv.textContent = titleSnippet
                ? `Demo loaded: “${titleSnippet}”. Step through the wizard to review and submit.`
                : 'Demo data filled. Move through steps to review and submit.';
            successDiv.classList.remove('hidden');
            setTimeout(() => successDiv.classList.add('hidden'), 5000);
        }
    } catch (error) {
        console.error('Error filling demo data:', error);
        const errorDiv = document.getElementById('form-error');
        if (errorDiv) {
            errorDiv.textContent = 'Error filling demo data: ' + error.message;
            errorDiv.classList.remove('hidden');
        }
    }
}

/**
 * Resolves country, region, city (and optional district) from locationKey.
 * @param {string} [locationKey] - 'riyadh' | 'jeddah' | 'remote'; default 'riyadh'.
 * @returns {{ country: object, region: object|null, city: object|null, district: string|null }}
 */
function resolveDemoLocation(locationKey) {
    const locations = getLocationsData();
    if (!locations || !locations.countries) return { country: null, region: null, city: null, district: null };
    const key = (locationKey || 'riyadh').toLowerCase();
    if (key === 'remote') {
        const country = locations.countries.find(c => c.id === 'remote');
        return { country: country || null, region: null, city: null, district: null };
    }
    const sa = locations.countries.find(c => c.id === 'sa');
    if (!sa) return { country: null, region: null, city: null, district: null };
    if (key === 'jeddah') {
        const region = sa.regions && sa.regions.find(r => r.id === 'makkah');
        const city = region && region.cities && region.cities.find(c => c.id === 'jeddah');
        const district = city && city.districts && city.districts.length > 0 ? city.districts[0] : null;
        return { country: sa, region: region || null, city: city || null, district };
    }
    // riyadh (default)
    const region = sa.regions && sa.regions.find(r => r.id === 'riyadh');
    const city = region && region.cities && region.cities.find(c => c.id === 'riyadh-city');
    const district = city && city.districts && city.districts.length > 0 ? city.districts[0] : null;
    return { country: sa, region: region || null, city: city || null, district };
}

async function fillDemoLocation(locationKey) {
    const locations = getLocationsData();
    if (!locations) return;
    const { country, region, city, district } = resolveDemoLocation(locationKey);
    if (!country) return;
    try {
        const countrySearch = document.getElementById('location-country-search');
        const countryInput = document.getElementById('location-country');
        const countryDropdown = document.getElementById('location-country-dropdown');
        if (!countrySearch || !countryInput) return;
        countrySearch.focus();
        countrySearch.value = country.name;
        countrySearch.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(() => {
            const countryOptions = countryDropdown?.querySelectorAll('.searchable-dropdown-item');
            if (countryOptions) {
                for (let option of countryOptions) {
                    if (option.textContent.trim() === country.name || option.dataset.id === country.id) {
                        option.click();
                        break;
                    }
                }
            }
            if (!region || !city) return;
            setTimeout(() => {
                const regionSearch = document.getElementById('location-region-search');
                const regionInput = document.getElementById('location-region');
                const regionDropdown = document.getElementById('location-region-dropdown');
                if (!regionSearch || !regionInput || regionSearch.disabled) return;
                regionSearch.focus();
                regionSearch.value = region.name;
                regionSearch.dispatchEvent(new Event('input', { bubbles: true }));
                setTimeout(() => {
                    const regionOptions = regionDropdown?.querySelectorAll('.searchable-dropdown-item');
                    if (regionOptions) {
                        for (let option of regionOptions) {
                            if (option.textContent.trim() === region.name || option.dataset.id === region.id) {
                                option.click();
                                break;
                            }
                        }
                    }
                    setTimeout(() => {
                        const citySearch = document.getElementById('location-city-search');
                        const cityInput = document.getElementById('location-city');
                        const cityDropdown = document.getElementById('location-city-dropdown');
                        if (!citySearch || !cityInput || citySearch.disabled) return;
                        citySearch.focus();
                        citySearch.value = city.name;
                        citySearch.dispatchEvent(new Event('input', { bubbles: true }));
                        setTimeout(() => {
                            const cityOptions = cityDropdown?.querySelectorAll('.searchable-dropdown-item');
                            if (cityOptions) {
                                for (let option of cityOptions) {
                                    if (option.textContent.trim() === city.name || option.dataset.id === city.id) {
                                        option.click();
                                        break;
                                    }
                                }
                            }
                            if (!district) return;
                            setTimeout(() => {
                                const districtSearch = document.getElementById('location-district-search');
                                const districtInput = document.getElementById('location-district');
                                const districtDropdown = document.getElementById('location-district-dropdown');
                                if (!districtSearch || !districtInput || districtSearch.disabled) return;
                                districtSearch.focus();
                                districtSearch.value = district;
                                districtSearch.dispatchEvent(new Event('input', { bubbles: true }));
                                setTimeout(() => {
                                    const districtOptions = districtDropdown?.querySelectorAll('.searchable-dropdown-item');
                                    if (districtOptions) {
                                        for (let option of districtOptions) {
                                            if (option.textContent.trim() === district || option.dataset.name === district) {
                                                option.click();
                                                break;
                                            }
                                        }
                                    }
                                }, 200);
                            }, 200);
                        }, 200);
                    }, 200);
                }, 200);
            }, 200);
        }, 200);
    } catch (error) {
        console.error('Error filling location:', error);
    }
}

function fillDemoDynamicFields() {
    const form = document.getElementById('opportunity-form');
    if (!form) {
        console.error('Form not found');
        return;
    }
    
    // Fill common fields based on task_based model
    const fieldMappings = {
        'taskTitle': 'Structural Design and Analysis for Commercial Building',
        'taskType': 'Engineering',
        'detailedScope': 'Provide complete structural engineering services including:\n- Structural analysis and design for 5-story reinforced concrete building\n- Foundation design and soil analysis\n- Construction drawings and specifications\n- Site visits and construction supervision\n- Coordination with architectural and MEP teams',
        'duration': '90',
        'budgetRange_min': '50000',
        'budgetRange_max': '75000',
        'requiredSkills': 'Structural Engineering, Reinforced Concrete Design, Foundation Design, AutoCAD, ETABS',
        'experienceLevel': 'Senior',
        'locationRequirement': 'Hybrid',
        'startDate': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        'deliverableFormat': 'PDF drawings, CAD files, calculation reports',
        'paymentTerms': 'Milestone-Based',
        'exchangeType': 'Cash'
    };
    
    console.log('Filling demo dynamic fields...');
    let filledCount = 0;
    let missingCount = 0;
    
    // Fill fields directly (they can be in hidden steps)
    Object.keys(fieldMappings).forEach(key => {
        // Try multiple selectors to find the field
        let field = form.querySelector(`[name="${key}"]`);
        if (!field) {
            // Try by ID as well
            field = document.getElementById(key);
        }
        
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = fieldMappings[key];
                filledCount++;
            } else if (field.tagName === 'SELECT') {
                field.value = fieldMappings[key];
                // Trigger change event for select fields
                field.dispatchEvent(new Event('change', { bubbles: true }));
                filledCount++;
            } else if (field.tagName === 'TEXTAREA') {
                const value = fieldMappings[key];
                field.value = value;
                // Trigger input event to ensure value is set
                field.dispatchEvent(new Event('input', { bubbles: true }));
                
                // If it's a rich text editor field, initialize the editor
                if (field.hasAttribute('data-rich-text') && window.RichTextEditor) {
                    // Initialize editor if not already initialized
                    if (!window.RichTextEditor.get(field.id)) {
                        window.RichTextEditor.init(field.id);
                    }
                    // Set content in the editor
                    setTimeout(() => {
                        window.RichTextEditor.setContent(key, value);
                    }, 200);
                }
                filledCount++;
            } else {
                field.value = fieldMappings[key];
                // Trigger input event for other input fields
                field.dispatchEvent(new Event('input', { bubbles: true }));
                filledCount++;
            }
            console.log(`✓ Filled field: ${key} = ${fieldMappings[key]}`);
        } else {
            missingCount++;
            console.warn(`✗ Field not found: ${key}`);
        }
    });
    
    // Handle tags input (requiredSkills) - this might be a special component
    const skillsInput = form.querySelector('[name="requiredSkills"]');
    if (skillsInput) {
        if (skillsInput.type === 'text') {
            skillsInput.value = fieldMappings.requiredSkills;
            // Trigger input event to process tags
            skillsInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log(`✓ Filled requiredSkills: ${fieldMappings.requiredSkills}`);
        }
    } else {
        console.warn('✗ requiredSkills field not found');
    }
    
    // Handle budget range fields specifically
    const budgetMin = document.getElementById('budgetRange_min') || form.querySelector('[name="budgetRange_min"]');
    const budgetMax = document.getElementById('budgetRange_max') || form.querySelector('[name="budgetRange_max"]');
    if (budgetMin && budgetMax) {
        budgetMin.value = fieldMappings.budgetRange_min;
        budgetMax.value = fieldMappings.budgetRange_max;
        budgetMin.dispatchEvent(new Event('input', { bubbles: true }));
        budgetMax.dispatchEvent(new Event('input', { bubbles: true }));
        console.log(`✓ Filled budget range: ${fieldMappings.budgetRange_min} - ${fieldMappings.budgetRange_max}`);
    } else {
        console.warn('✗ Budget range fields not found');
    }
    
    console.log(`Demo data fill complete: ${filledCount} fields filled, ${missingCount} fields missing`);
    
    // Log all available fields for debugging
    const allFields = Array.from(form.querySelectorAll('[name]'));
    console.log('Available fields:', allFields.map(f => f.name));
}

function fillDemoExchangeMode() {
    // Fill budget range fields (now in step 4)
    const budgetMin = document.getElementById('budgetRange_min');
    const budgetMax = document.getElementById('budgetRange_max');
    if (budgetMin && budgetMax) {
        budgetMin.value = '50000';
        budgetMax.value = '75000';
        budgetMin.dispatchEvent(new Event('input', { bubbles: true }));
        budgetMax.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('✓ Filled budget range: 50,000 - 75,000 SAR');
    }
    
    // Select Cash mode (can be in hidden step)
    const cashCard = document.querySelector('.exchange-mode-card[data-mode="cash"]');
    if (cashCard) {
        // Trigger click event to select the mode
        cashCard.dispatchEvent(new Event('click', { bubbles: true }));
        
        setTimeout(() => {
            // Fill cash mode fields (they can be in hidden step)
            const cashAmount = document.getElementById('cash-amount');
            const cashPaymentTerms = document.getElementById('cash-payment-terms');
            const currency = document.getElementById('currency');
            const cashMilestones = document.getElementById('cash-milestones');
            const exchangeTermsSummary = document.getElementById('exchange-terms-summary');
            const exchangeAgreement = document.getElementById('exchange-agreement');
            
            if (cashAmount) cashAmount.value = '60000';
            if (cashPaymentTerms) cashPaymentTerms.value = 'milestone_based';
            if (currency) currency.value = 'SAR';
            
            // Set textarea values (rich text editors will be initialized when step becomes visible)
            const milestonesContent = 'Payment Schedule:\n- 30% upfront (18,000 SAR) upon contract signing\n- 40% (24,000 SAR) upon completion of design phase\n- 30% (18,000 SAR) upon final delivery and approval';
            if (cashMilestones) {
                cashMilestones.value = milestonesContent;
            }
            
            const termsContent = 'All payments will be made via bank transfer within 7 days of milestone completion. Final payment subject to client approval of deliverables.';
            if (exchangeTermsSummary) {
                exchangeTermsSummary.value = termsContent;
            }
            
            if (exchangeAgreement) exchangeAgreement.checked = true;
        }, 300);
    }
}

function renderDynamicFields(modelKey, subModelKey, preserveValues = false) {
    const formService = window.opportunityFormService;
    const container = document.getElementById('dynamic-fields');
    
    if (!container || !formService) return;
    
    const allAttributes = formService.getAttributes(modelKey, subModelKey);
    const paymentFieldKeys = ['paymentTerms', 'exchangeType', 'barterOffer'];
    const attributes = allAttributes.filter(a => !paymentFieldKeys.includes(a.key));
    
    // If preserving values, collect current field values before re-rendering
    const savedValues = {};
    if (preserveValues) {
        attributes.forEach(attr => {
            // Handle currency-range fields separately (they have _min and _max suffixes)
            if (attr.type === 'currency-range') {
                const minField = document.getElementById(`${attr.key}_min`) || document.querySelector(`[name="${attr.key}_min"]`);
                const maxField = document.getElementById(`${attr.key}_max`) || document.querySelector(`[name="${attr.key}_max"]`);
                if (minField) {
                    savedValues[`${attr.key}_min`] = minField.value;
                }
                if (maxField) {
                    savedValues[`${attr.key}_max`] = maxField.value;
                }
            } else {
                // Regular fields
                const field = document.getElementById(attr.key) || document.querySelector(`[name="${attr.key}"]`);
                if (field) {
                    if (field.type === 'checkbox') {
                        savedValues[attr.key] = field.checked;
                    } else {
                        savedValues[attr.key] = field.value;
                    }
                }
            }
        });
    }
    
    // Update form service to use lookups
    const lookups = getLookupsData();
    if (lookups) {
        formService.setLookups(lookups);
    }
    
    if (attributes.length === 0) {
        container.innerHTML = '<p class="text-gray-500 italic">No additional fields required for this model.</p>';
        return;
    }
    
    // Render fields with saved values if preserving
    container.innerHTML = attributes.map(attr => {
        const value = preserveValues && savedValues[attr.key] !== undefined ? savedValues[attr.key] : '';
        return formService.renderField(attr, value);
    }).join('');
    
    // Restore currency-range values
    if (preserveValues) {
        attributes.forEach(attr => {
            if (attr.type === 'currency-range') {
                const minValue = savedValues[`${attr.key}_min`];
                const maxValue = savedValues[`${attr.key}_max`];
                if (minValue !== undefined) {
                    const minField = document.getElementById(`${attr.key}_min`);
                    if (minField) minField.value = minValue;
                }
                if (maxValue !== undefined) {
                    const maxField = document.getElementById(`${attr.key}_max`);
                    if (maxField) maxField.value = maxValue;
                }
            }
        });
    }
    
    const form = document.getElementById('opportunity-form');
    formService.setupConditionalFields(form);
    updateMultiProjectTasksUI();
    formService.wireDynamicBehaviours(form);

    // Initialize rich text editors for newly rendered fields (use container's step, e.g. step-4)
    const stepEl = container ? container.closest('.wizard-step-content') : null;
    const isStepVisible = stepEl && !stepEl.classList.contains('hidden');
    
    if (isStepVisible && stepEl) {
        setTimeout(() => {
            if (window.RichTextEditor && typeof Quill !== 'undefined') {
                const textareas = stepEl.querySelectorAll('textarea[data-rich-text="true"]');
                textareas.forEach(textarea => {
                    if (!window.RichTextEditor.get(textarea.id)) {
                        window.RichTextEditor.init(textarea.id);
                    }
                });
                if (preserveValues) {
                    Object.keys(savedValues).forEach(key => {
                        const field = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
                        if (field && field.tagName === 'TEXTAREA' && field.hasAttribute('data-rich-text') && savedValues[key]) {
                            setTimeout(() => {
                                window.RichTextEditor.setContent(key, savedValues[key]);
                            }, 200);
                        }
                    });
                }
            }
        }, 400);
    }
}

function setupFormHandlers() {
    const form = document.getElementById('opportunity-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (authService.isPendingApproval && authService.isPendingApproval()) {
            return;
        }
        
        // Remove required attribute from hidden fields to prevent HTML5 validation errors
        const allRequiredFields = form.querySelectorAll('[required]');
        const hiddenFields = [];
        
        allRequiredFields.forEach(field => {
            const stepContent = field.closest('.wizard-step-content');
            if (stepContent && stepContent.classList.contains('hidden')) {
                field.removeAttribute('required');
                hiddenFields.push(field);
            }
        });
        
        if (!validateStepsRange(1, 7)) {
            // Restore required attributes if validation fails
            hiddenFields.forEach(field => field.setAttribute('required', 'required'));
            return;
        }
        
        // Restore required attributes after validation passes
        hiddenFields.forEach(field => field.setAttribute('required', 'required'));
        
        const errorDiv = document.getElementById('form-error');
        const successDiv = document.getElementById('form-success');
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');
        
        try {
            const user = authService.getCurrentUser();
            if (!user) {
                throw new Error('You must be logged in to create an opportunity');
            }
            
            const projectType = document.querySelector('input[name="projectType"]:checked')?.value || 'single';
            const intent = document.querySelector('input[name="intent"]:checked')?.value || 'request';
            const modelType = document.getElementById('model-type')?.value;
            const subModelType = document.getElementById('submodel-type')?.value;
            if (!modelType || !subModelType) throw new Error('Please select category and sub-model');
            const exchangeMode = document.getElementById('exchange-mode')?.value;
            if (!exchangeMode) throw new Error('Please select an exchange mode');
            const validModes = ['cash', 'equity', 'profit_sharing', 'barter', 'hybrid'];
            const acceptedModesEls = document.querySelectorAll('.accepted-mode-cb:checked');
            const altModes = Array.from(acceptedModesEls).map(cb => cb.value).filter(m => validModes.includes(m));
            const paymentModesArr = [exchangeMode];
            altModes.forEach(m => {
                if (!paymentModesArr.includes(m)) paymentModesArr.push(m);
            });
            const accepted_modes = paymentModesArr.slice();
            const description = document.getElementById('description')?.value?.trim() || '';
            const location = document.getElementById('location')?.value || '';
            const locationCountry = document.getElementById('location-country')?.value || '';
            const locationRegion = document.getElementById('location-region')?.value || '';
            const locationCity = document.getElementById('location-city')?.value || '';
            const locationDistrict = document.getElementById('location-district')?.value || '';
            const status = document.getElementById('status')?.value || 'draft';
            const currency = document.getElementById('currency')?.value || 'SAR';
            
            const scopeSkillsTags = getScopeTagsFromInput('scope-skills');
            const requiredSkillsForRequest = (intent === 'request' || intent === 'hybrid') ? scopeSkillsTags : [];
            const offeredSkills = (intent === 'offer' || intent === 'hybrid') ? scopeSkillsTags : [];
            const sectors = getScopeTagsFromInput('scope-sectors');
            const interests = getScopeTagsFromInput('scope-interests');
            const certifications = getScopeTagsFromInput('scope-certifications');
            
            const scope = {
                requiredSkills: requiredSkillsForRequest,
                offeredSkills: offeredSkills,
                sectors,
                interests,
                certifications
            };
            
            const valueItemsRows = document.querySelectorAll('#value-items-container .value-item-row');
            const valueItems = [];
            valueItemsRows.forEach(row => {
                const cat = row.querySelector('.value-item-category')?.value;
                const desc = row.querySelector('.value-item-desc')?.value?.trim();
                const est = row.querySelector('.value-item-est')?.value;
                if (cat) valueItems.push({ category: cat, description: desc || '', estimatedValue: est ? parseFloat(est) : null });
            });
            const flexibilityNegotiable = document.getElementById('flexibility-negotiable')?.checked || false;
            const flexibilityMin = document.getElementById('flexibility-min')?.value;
            const flexibilityMax = document.getElementById('flexibility-max')?.value;
            const flexibility = {
                negotiable: flexibilityNegotiable,
                min_acceptable: flexibilityMin ? parseFloat(flexibilityMin) : null,
                max_offer: flexibilityMax ? parseFloat(flexibilityMax) : null
            };

            const exchangeData = {
                exchangeMode,
                currency,
                exchangeTermsSummary: (document.getElementById('exchange-terms-summary')?.value || '').trim(),
                budgetRange: {
                    min: parseFloat(document.getElementById('budgetRange_min')?.value) || 0,
                    max: parseFloat(document.getElementById('budgetRange_max')?.value) || 0,
                    currency
                }
            };
            if (valueItems.length > 0) exchangeData.valueItems = valueItems;
            if (exchangeMode === 'cash') {
                exchangeData.cashAmount = parseFloat(document.getElementById('cash-amount')?.value) || 0;
                exchangeData.cashPaymentTerms = document.getElementById('cash-payment-terms')?.value || '';
                exchangeData.cashMilestones = (document.getElementById('cash-milestones')?.value || '').trim();
            } else if (exchangeMode === 'equity') {
                exchangeData.equityPercentage = parseFloat(document.getElementById('equity-percentage')?.value) || 0;
                exchangeData.equityVesting = document.getElementById('equity-vesting')?.value || '';
                exchangeData.equityContribution = (document.getElementById('equity-contribution')?.value || '').trim();
                const companyValEl = document.getElementById('equity-company-valuation');
                if (companyValEl?.value) exchangeData.companyValuation = companyValEl.value.trim();
            } else if (exchangeMode === 'profit_sharing') {
                exchangeData.profitSplit = document.getElementById('profit-split')?.value || '';
                exchangeData.profitBasis = document.getElementById('profit-basis')?.value || 'profit';
                exchangeData.profitDuration = document.getElementById('profit-duration')?.value || '';
                exchangeData.profitDistribution = (document.getElementById('profit-distribution')?.value || '').trim();
                const sharePctEl = document.getElementById('profit-share-percentage');
                const expectedProfitEl = document.getElementById('expected-profit');
                if (sharePctEl?.value) exchangeData.profitSharePercentage = parseFloat(sharePctEl.value) || null;
                if (expectedProfitEl?.value) exchangeData.expectedProfit = expectedProfitEl.value.trim();
            } else if (exchangeMode === 'barter') {
                exchangeData.barterOffer = (document.getElementById('barter-offer')?.value || '').trim();
                exchangeData.barterNeed = (document.getElementById('barter-need')?.value || '').trim();
                exchangeData.barterValue = (document.getElementById('barter-value')?.value || '').trim();
            } else if (exchangeMode === 'hybrid') {
                exchangeData.hybridCash = parseFloat(document.getElementById('hybrid-cash')?.value || 0);
                exchangeData.hybridEquity = parseFloat(document.getElementById('hybrid-equity')?.value || 0);
                exchangeData.hybridBarter = parseFloat(document.getElementById('hybrid-barter')?.value || 0);
                exchangeData.hybridCashDetails = (document.getElementById('hybrid-cash-details')?.value || '').trim();
                exchangeData.hybridEquityDetails = (document.getElementById('hybrid-equity-details')?.value || '').trim();
                exchangeData.hybridBarterDetails = (document.getElementById('hybrid-barter-details')?.value || '').trim();
            }

            const alternateExchangeDetails = collectAlternateExchangeDetailsFromForm();
            if (alternateExchangeDetails.length > 0) {
                exchangeData.alternateExchangeDetails = alternateExchangeDetails;
            }

            const valueExpected = collectValueExpectedFromForm();
            const estimator = window.valueEstimator;
            let value_exchange = null;
            if (estimator) {
                const buildOptions = { accepted_modes, flexibility };
                value_exchange = estimator.buildValueExchange(exchangeData, exchangeMode, valueExpected, buildOptions);
                if (exchangeMode === 'hybrid' && !estimator.validateHybrid(exchangeData)) {
                    throw new Error('Hybrid mode must include at least 2 value types with non-zero percentages.');
                }
                if (value_exchange.estimated_value != null && exchangeData.budgetRange && !estimator.isWithinBudgetRange(value_exchange.estimated_value, exchangeData.budgetRange)) {
                    const min = exchangeData.budgetRange.min;
                    const max = exchangeData.budgetRange.max;
                    if (confirm('Estimated value is outside the budget range (' + (min != null ? min : '?') + '–' + (max != null ? max : '?') + ' ' + (exchangeData.budgetRange.currency || 'SAR') + '). Continue anyway?')) {
                        // proceed
                    } else {
                        return;
                    }
                }
            }
            
            let modelData = {};
            syncMultiTaskTitleFromRows();
            const formService = window.opportunityFormService;
            if (formService && form) {
                const allData = formService.collectFormData(form);
                const attrKeys = new Set((formService.getAttributes(modelType, subModelType) || []).map(a => a.key));
                attrKeys.forEach(key => {
                    if (allData[key] !== undefined) modelData[key] = allData[key];
                });
            }
            const locationRequirement = document.getElementById('location-requirement')?.value?.trim();
            const attrStartDate = document.getElementById('attr-startDate')?.value?.trim();
            const attrApplicationDeadline = document.getElementById('attr-applicationDeadline')?.value?.trim();
            const attrEndDate = document.getElementById('attr-endDate')?.value?.trim();
            const commonAttrs = {};
            if (locationRequirement) commonAttrs.locationRequirement = locationRequirement;
            if (attrStartDate) commonAttrs.startDate = attrStartDate;
            if (attrApplicationDeadline) commonAttrs.applicationDeadline = attrApplicationDeadline;
            if (attrEndDate) commonAttrs.endDate = attrEndDate;
            const attributesPayload = { ...scope, paymentModes: paymentModesArr, ...commonAttrs, ...modelData };
            
            let latVal = parseFloat(document.getElementById('latitude')?.value);
            let lngVal = parseFloat(document.getElementById('longitude')?.value);
            if ((isNaN(latVal) || isNaN(lngVal)) && locationCity) {
                const cityCoords = getCityCoords(locationCity);
                if (cityCoords) {
                    latVal = isNaN(latVal) ? cityCoords.lat : latVal;
                    lngVal = isNaN(lngVal) ? cityCoords.lng : lngVal;
                }
            }

            const oppPayload = {
                projectType,
                title,
                description,
                intent,
                paymentModes: paymentModesArr,
                scope,
                modelType,
                subModelType,
                status,
                location,
                locationCountry,
                locationRegion,
                locationCity,
                locationDistrict,
                latitude: isNaN(latVal) ? null : latVal,
                longitude: isNaN(lngVal) ? null : lngVal,
                exchangeMode,
                exchangeData,
                creatorId: user.id,
                attributes: attributesPayload,
                modelData
            };
            if (multiProjectWorkPackagesRequired()) {
                const pt = collectProjectTasksFromUI();
                if (pt.length) oppPayload.projectTasks = pt;
            }
            if (value_exchange) oppPayload.value_exchange = value_exchange;

            const oppService = window.opportunityService;
            const opportunity = await oppService.createOpportunity(oppPayload);
            
            await dataService.createAuditLog({
                userId: user.id,
                action: 'opportunity_created',
                entityType: 'opportunity',
                entityId: opportunity.id,
                details: { title: opportunity.title, modelType: opportunity.modelType }
            });
            
            successDiv.textContent = 'Opportunity created successfully!';
            successDiv.classList.remove('hidden');
            
            setTimeout(() => {
                router.navigate('/opportunities/map');
            }, 1500);
            
        } catch (error) {
            console.error('Error creating opportunity:', error);
            showError(error.message || 'Failed to create opportunity. Please try again.');
        }
    });
}

function showError(message) {
    const errorDiv = document.getElementById('form-error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
