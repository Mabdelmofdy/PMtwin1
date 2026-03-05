/**
 * Opportunity Create Component - Wizard Flow
 */

let currentStep = 1;
const TOTAL_STEPS = 6;
let allLocations = [];
let demoDataIndex = 0;

/**
 * Demo datasets for "Fill Demo Data" – each click rotates to the next scenario.
 * step1: title, description, locationKey ('riyadh' | 'jeddah' | 'remote').
 * step2: intent ('request' | 'offer').
 * step3: skills, sectors, interests (arrays).
 * step4: category, subModel, modelFields (object key -> value for dynamic Step 4 fields).
 * step5: budgetMin, budgetMax, exchangeMode, currency, modeFields, agreement.
 * step6: status.
 */
const DEMO_DATASETS = [
    {
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
                profitSplit: '60-40',
                profitBasis: 'profit',
                profitDistribution: '60-40 profit split after costs, distributed quarterly.',
                exchangeTermsSummary: 'Profit share calculated after project costs. Quarterly distributions.'
            },
            agreement: true
        },
        step6: { status: 'draft' }
    },
    {
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
    setupMapPicker();
    setupIntentLabels();
    setupScopeTags();
    setupCategoryAndSubModel();
    setupInlineAdvisor();
    setupExchangeModeSelection();
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
    if (!nextBtn || !prevBtn) return;
    
    nextBtn.addEventListener('click', () => {
        if (validateCurrentStep()) {
            if (currentStep === 3) persistScopeTags();
            if (currentStep === 6) fillReviewSummary();
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

function syncPaymentModesToPrimary() {
    const checked = Array.from(document.querySelectorAll('.payment-mode-cb:checked')).map(c => c.value);
    const primary = document.getElementById('exchange-mode');
    if (primary) primary.value = checked[0] || '';
}

function fillReviewSummary() {
    const summary = document.getElementById('review-summary');
    if (!summary) return;
    const models = getOpportunityModels();
    const title = document.getElementById('title')?.value || '—';
    const desc = document.getElementById('description')?.value || '—';
    const intentEl = document.querySelector('input[name="intent"]:checked');
    const intent = intentEl ? (intentEl.value === 'request' ? 'NEED' : 'OFFER') : '—';
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
    const modeNames = { cash: 'Cash', equity: 'Equity', profit_sharing: 'Profit-Sharing', barter: 'Barter', hybrid: 'Hybrid' };
    const modeLabel = exchangeMode ? (modeNames[exchangeMode] || exchangeMode) : '—';
    const budgetMin = document.getElementById('budgetRange_min')?.value;
    const budgetMax = document.getElementById('budgetRange_max')?.value;
    const budgetLabel = (budgetMin != null && budgetMax != null && budgetMin !== '' && budgetMax !== '') ? `${Number(budgetMin).toLocaleString()} – ${Number(budgetMax).toLocaleString()} SAR` : '—';
    const skills = getScopeTagsFromInput('scope-skills');
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
        <p><strong>Title:</strong> ${escapeHtml(title)}</p>
        <p><strong>Intent:</strong> ${escapeHtml(intent)}</p>
        <p><strong>Location:</strong> ${escapeHtml(location)}</p>
        <p><strong>Category:</strong> ${escapeHtml(categoryLabel)}</p>
        <p><strong>Sub-Model:</strong> ${escapeHtml(subModelLabel)}</p>
        <p><strong>Exchange mode:</strong> ${escapeHtml(modeLabel)}</p>
        <p><strong>Budget range:</strong> ${escapeHtml(budgetLabel)}</p>
        <p><strong>Skills:</strong> ${skills.length ? escapeHtml(skills.join(', ')) : '—'}</p>
        <p><strong>Model details:</strong> ${escapeHtml(modelDetailsLine)}</p>
        <p class="text-gray-600 mt-2">${escapeHtml(desc.slice(0, 200))}${desc.length > 200 ? '...' : ''}</p>
    `;
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function validateCurrentStep() {
    const errorDiv = document.getElementById('form-error');
    errorDiv.classList.add('hidden');
    
    switch (currentStep) {
        case 1: {
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
        case 2: {
            const intent = document.querySelector('input[name="intent"]:checked');
            if (!intent) {
                showError('Please select an intent (NEED or OFFER)');
                return false;
            }
            break;
        }
        case 3: {
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
        case 4: {
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
            break;
        }
        case 5: {
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
                const profitSplit = document.getElementById('profit-split')?.value?.trim();
                if (!profitSplit) { showError('Profit split is required'); return false; }
            } else if (exchangeMode === 'barter') {
                const barterOffer = document.getElementById('barter-offer')?.value?.trim();
                const barterNeed = document.getElementById('barter-need')?.value?.trim();
                if (!barterOffer) { showError('What you offer is required for Barter'); return false; }
                if (!barterNeed) { showError('What you need is required for Barter'); return false; }
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
            if (!agreement) {
                showError('You must agree to the exchange terms to proceed');
                return false;
            }
            break;
        }
        case 6: {
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

function goToStep(step) {
    if (step < 1 || step > TOTAL_STEPS) return;
    
    const prevStepEl = document.getElementById(`step-${currentStep}`);
    if (prevStepEl) prevStepEl.classList.add('hidden');
    
    currentStep = step;
    const nextStepEl = document.getElementById(`step-${currentStep}`);
    if (nextStepEl) nextStepEl.classList.remove('hidden');
    
    updateWizardUI();
    
    if (currentStep === 2) updateScopeLabels();
    if (currentStep === 6) {
        fillReviewSummary();
        const statusField = document.getElementById('status');
        if (statusField && !statusField.value) statusField.value = 'draft';
    }
    
    setTimeout(() => {
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
    prevBtn.classList.toggle('hidden', currentStep === 1);
    nextBtn.classList.toggle('hidden', currentStep === TOTAL_STEPS);
    submitBtn.classList.toggle('hidden', currentStep !== TOTAL_STEPS);
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
}

let createMapInstance = null;

function setupMapPicker() {
    if (typeof mapService === 'undefined') return;

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

    createMapInstance = mapService.initMapPicker('location-map', {
        center: mapService.DEFAULT_CENTER,
        zoom: mapService.DEFAULT_ZOOM,
        draggableMarker: true,
        onClick: (lat, lng) => updateCoords(lat, lng),
        onMarkerMove: (lat, lng) => updateCoords(lat, lng)
    });

    if (addressBtn && addressInput) {
        const doGeocode = async () => {
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

function centerMapOnCity(cityId) {
    if (!createMapInstance) return;
    const locations = getLocationsData();
    if (!locations || !locations.countries) return;

    for (const country of locations.countries) {
        for (const region of (country.regions || [])) {
            for (const city of (region.cities || [])) {
                if (city.id === cityId && city.lat && city.lng) {
                    createMapInstance.setMarker(city.lat, city.lng);
                    return;
                }
            }
        }
    }
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
    
    function selectExchangeMode(mode) {
        selectedMode = mode;
        exchangeModeInput.value = mode;
        
        // Update card selection
        exchangeModeCards.forEach(c => {
            c.classList.remove('selected');
            if (c.dataset.mode === mode) {
                c.classList.add('selected');
            }
        });
        
        // Update display
        const modeNames = {
            'cash': 'Cash',
            'equity': 'Equity',
            'profit_sharing': 'Profit-Sharing',
            'barter': 'Barter',
            'hybrid': 'Hybrid'
        };
        
        document.getElementById('selected-exchange-name').textContent = modeNames[mode];
        selectedDisplay.classList.remove('hidden');
        
        // Render mode-specific fields
        renderExchangeModeFields(mode);
    }
    
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
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="form-group">
                            <label for="equity-percentage" class="form-label">Equity Percentage <span class="text-red-600">*</span></label>
                            <input 
                                type="number" 
                                id="equity-percentage" 
                                name="equityPercentage" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="e.g., 40"
                                min="0"
                                max="100"
                                step="0.1"
                                required
                            >
                            <p class="text-sm text-gray-500 mt-1">Percentage of ownership stake</p>
                        </div>
                        <div class="form-group">
                            <label for="equity-vesting" class="form-label">Vesting Period</label>
                            <select 
                                id="equity-vesting" 
                                name="equityVesting" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    </div>
                    <div class="form-group">
                        <label for="equity-contribution" class="form-label">Contribution Description</label>
                        <textarea 
                            id="equity-contribution" 
                            name="equityContribution" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            rows="3"
                            placeholder="e.g., Join our JV: 40% equity for expertise + equipment"
                            data-rich-text="true"
                        ></textarea>
                        <p class="text-sm text-gray-500 mt-1">Describe what contribution earns this equity stake</p>
                    </div>
                `;
                break;
                
            case 'profit_sharing':
                if (currencyGroup) currencyGroup.classList.add('hidden');
                html = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="form-group">
                            <label for="profit-split" class="form-label">Profit Split Percentage <span class="text-red-600">*</span></label>
                            <input 
                                type="text" 
                                id="profit-split" 
                                name="profitSplit" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="e.g., 60-40 or 50-30-20"
                                required
                            >
                            <p class="text-sm text-gray-500 mt-1">Enter profit split (e.g., 60-40 for 60% partner, 40% partner)</p>
                        </div>
                        <div class="form-group">
                            <label for="profit-basis" class="form-label">Profit Basis</label>
                            <select 
                                id="profit-basis" 
                                name="profitBasis" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="revenue">Revenue Share</option>
                                <option value="profit">Profit Share (After Costs)</option>
                                <option value="gross_profit">Gross Profit Share</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="profit-distribution" class="form-label">Distribution Schedule</label>
                        <textarea 
                            id="profit-distribution" 
                            name="profitDistribution" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            rows="3"
                            placeholder="e.g., Consortium: 60-40 profit split after costs, distributed quarterly"
                            data-rich-text="true"
                        ></textarea>
                        <p class="text-sm text-gray-500 mt-1">Describe how and when profits will be distributed</p>
                    </div>
                `;
                break;
                
            case 'barter':
                if (currencyGroup) currencyGroup.classList.add('hidden');
                html = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="form-group">
                            <label for="barter-offer" class="form-label">What You Offer <span class="text-red-600">*</span></label>
                            <textarea 
                                id="barter-offer" 
                                name="barterOffer" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                rows="3"
                                placeholder="e.g., Office space, equipment, services..."
                                required
                                data-rich-text="true"
                            ></textarea>
                            <p class="text-sm text-gray-500 mt-2 form-help">Describe what you're offering in exchange</p>
                        </div>
                        <div class="form-group">
                            <label for="barter-need" class="form-label">What You Need <span class="text-red-600">*</span></label>
                            <textarea 
                                id="barter-need" 
                                name="barterNeed" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                rows="3"
                                placeholder="e.g., Structural engineering services..."
                                required
                                data-rich-text="true"
                            ></textarea>
                            <p class="text-sm text-gray-500 mt-2 form-help">Describe what you need in return</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="barter-value" class="form-label">Estimated Value (Optional)</label>
                        <input 
                            type="text" 
                            id="barter-value" 
                            name="barterValue" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="e.g., Equivalent to 50K SAR"
                        >
                        <p class="text-sm text-gray-500 mt-2 form-help">Optional: Estimated equivalent value</p>
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
                        <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p class="text-sm text-gray-700">
                                <span class="font-semibold">Total: </span>
                                <span id="hybrid-total">0%</span>
                            </p>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="form-group">
                            <label for="hybrid-cash-details" class="form-label">Cash Details</label>
                            <textarea 
                                id="hybrid-cash-details" 
                                name="hybridCashDetails" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                rows="2"
                                placeholder="e.g., 30% cash upfront"
                                data-rich-text="true"
                            ></textarea>
                        </div>
                        <div class="form-group">
                            <label for="hybrid-equity-details" class="form-label">Equity Details</label>
                            <textarea 
                                id="hybrid-equity-details" 
                                name="hybridEquityDetails" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                rows="2"
                                placeholder="e.g., 50% equity stake"
                                data-rich-text="true"
                            ></textarea>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="hybrid-barter-details" class="form-label">Barter Details</label>
                        <textarea 
                            id="hybrid-barter-details" 
                            name="hybridBarterDetails" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            rows="2"
                            placeholder="e.g., 20% in-kind services"
                            data-rich-text="true"
                        ></textarea>
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
                                totalDisplay.parentElement.classList.remove('bg-blue-50', 'border-blue-200');
                                totalDisplay.parentElement.classList.add('bg-green-50', 'border-green-200');
                            } else {
                                totalDisplay.parentElement.classList.remove('bg-green-50', 'border-green-200');
                                totalDisplay.parentElement.classList.add('bg-blue-50', 'border-blue-200');
                            }
                        }
                    }
                    
                    if (cashInput) cashInput.addEventListener('input', updateTotal);
                    if (equityInput) equityInput.addEventListener('input', updateTotal);
                    if (barterInput) barterInput.addEventListener('input', updateTotal);
                }, 100);
                break;
        }
        
        fieldsContainer.innerHTML = html;
        
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
        exchangeModeCards.forEach(c => c.classList.remove('selected'));
        selectedDisplay.classList.add('hidden');
        fieldsContainer.innerHTML = '<p class="text-gray-500 italic">Please select an exchange mode to see specific fields.</p>';
        if (currencyGroup) currencyGroup.classList.add('hidden');
    });
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
                demoDataIndex = (demoDataIndex + 1) % DEMO_DATASETS.length;
                fillDemoData(DEMO_DATASETS[demoDataIndex]);
            }
            return;
        }
        if (e.target.id === 'demo-modal-confirm') {
            e.preventDefault();
            closeModal();
            demoDataIndex = (demoDataIndex + 1) % DEMO_DATASETS.length;
            fillDemoData(DEMO_DATASETS[demoDataIndex]);
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
 * Fills Step 5 mode-specific fields from dataset.step5.modeFields.
 * Field keys in modeFields match input name (e.g. cashAmount, equityPercentage).
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
        // Step 1: Basic info
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
                        }, 500);
                    }
                }, 50);
            }
        }
        
        // Step 5: Exchange Mode & Financial Terms
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
            successDiv.textContent = 'Demo data filled. Move through steps to review and submit.';
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
        
        if (!validateCurrentStep()) {
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
            
            const intent = document.querySelector('input[name="intent"]:checked')?.value || 'request';
            const modelType = document.getElementById('model-type')?.value;
            const subModelType = document.getElementById('submodel-type')?.value;
            if (!modelType || !subModelType) throw new Error('Please select category and sub-model');
            const exchangeMode = document.getElementById('exchange-mode')?.value;
            if (!exchangeMode) throw new Error('Please select an exchange mode');
            const paymentModesArr = [exchangeMode];
            
            const title = document.getElementById('title')?.value?.trim();
            const description = document.getElementById('description')?.value?.trim() || '';
            const location = document.getElementById('location')?.value || '';
            const locationCountry = document.getElementById('location-country')?.value || '';
            const locationRegion = document.getElementById('location-region')?.value || '';
            const locationCity = document.getElementById('location-city')?.value || '';
            const locationDistrict = document.getElementById('location-district')?.value || '';
            const status = document.getElementById('status')?.value || 'draft';
            const currency = document.getElementById('currency')?.value || 'SAR';
            
            const requiredSkills = getScopeTagsFromInput('scope-skills');
            const offeredSkills = intent === 'offer' ? getScopeTagsFromInput('scope-skills') : [];
            const requiredSkillsForRequest = intent === 'request' ? getScopeTagsFromInput('scope-skills') : [];
            const sectors = getScopeTagsFromInput('scope-sectors');
            const interests = getScopeTagsFromInput('scope-interests');
            const certifications = getScopeTagsFromInput('scope-certifications');
            
            const scope = {
                requiredSkills: intent === 'request' ? requiredSkillsForRequest : [],
                offeredSkills: intent === 'offer' ? offeredSkills : [],
                sectors,
                interests,
                certifications
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
            if (exchangeMode === 'cash') {
                exchangeData.cashAmount = parseFloat(document.getElementById('cash-amount')?.value) || 0;
                exchangeData.cashPaymentTerms = document.getElementById('cash-payment-terms')?.value || '';
                exchangeData.cashMilestones = (document.getElementById('cash-milestones')?.value || '').trim();
            } else if (exchangeMode === 'equity') {
                exchangeData.equityPercentage = parseFloat(document.getElementById('equity-percentage')?.value) || 0;
                exchangeData.equityVesting = document.getElementById('equity-vesting')?.value || '';
                exchangeData.equityContribution = (document.getElementById('equity-contribution')?.value || '').trim();
            } else if (exchangeMode === 'profit_sharing') {
                exchangeData.profitSplit = document.getElementById('profit-split')?.value || '';
                exchangeData.profitBasis = document.getElementById('profit-basis')?.value || 'profit';
                exchangeData.profitDistribution = (document.getElementById('profit-distribution')?.value || '').trim();
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
            
            let modelData = {};
            const formService = window.opportunityFormService;
            if (formService && form) {
                const allData = formService.collectFormData(form);
                const attrKeys = new Set((formService.getAttributes(modelType, subModelType) || []).map(a => a.key));
                attrKeys.forEach(key => {
                    if (allData[key] !== undefined) modelData[key] = allData[key];
                });
            }
            const attributesPayload = { ...scope, paymentModes: paymentModesArr, ...modelData };
            
            const latVal = parseFloat(document.getElementById('latitude')?.value);
            const lngVal = parseFloat(document.getElementById('longitude')?.value);

            const oppService = window.opportunityService;
            const opportunity = await oppService.createOpportunity({
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
            });
            
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
                router.navigate(`/opportunities/${opportunity.id}`);
            }, 2000);
            
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
