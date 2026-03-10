/**
 * Register Page Component - Dual workflow (Company vs Individual)
 */

const BASE_PATH = (window.CONFIG && window.CONFIG.BASE_PATH) || '';

let regState = {
    accountType: null,
    currentStep: 0,
    companyRole: null,
    companySubType: null,
    companyName: '',
    website: '',
    industry: '',
    companySize: '',
    companyDescription: '',
    crNumber: '',
    taxId: '',
    authorizedRepresentative: { name: '', role: '' },
    email: '',
    mobile: '',
    address: { country: '', region: '', city: '' },
    password: '',
    emailVerified: false,
    mobileVerified: false,
    documents: [],
    termsAccepted: false,
    individualType: null,
    fullName: '',
    specialty: '',
    expertise: '',
    currentRole: '',
    yearsExperience: '',
    skills: '',
    languages: '',
    linkedin: '',
    preferredCollaborationModels: [],
    vettingSkippedAtRegistration: null,
    primaryDomain: null,
    expertiseAreas: []
};

let lookupsData = null;
let locationsData = null;
let otpCodes = { email: null, mobile: null, indEmail: null, indMobile: null };

function showRegError(msg) {
    const el = document.getElementById('register-error');
    if (el) {
        el.textContent = msg;
        el.style.display = 'block';
    }
    const successEl = document.getElementById('register-success');
    if (successEl) successEl.style.display = 'none';
}

function showRegFieldError(fieldId, msg) {
    showRegError(msg);
    const input = document.getElementById(fieldId);
    if (input) {
        input.classList.add('reg-field-invalid');
    }
    const inlineEl = document.getElementById('reg-error-' + fieldId);
    if (inlineEl) {
        inlineEl.textContent = msg;
        inlineEl.classList.remove('hidden');
    }
}

function clearRegFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    if (input) input.classList.remove('reg-field-invalid');
    const inlineEl = document.getElementById('reg-error-' + fieldId);
    if (inlineEl) {
        inlineEl.textContent = '';
        inlineEl.classList.add('hidden');
    }
}

function clearAllRegFieldErrors() {
    document.querySelectorAll('.reg-field-invalid').forEach(el => el.classList.remove('reg-field-invalid'));
    document.querySelectorAll('[id^="reg-error-reg-"]').forEach(el => {
        el.textContent = '';
        el.classList.add('hidden');
    });
}

var regDemoData = {
    company: {
        name: 'Demo Construction Co',
        website: 'https://demo.pmtwin.com',
        email: 'signup-demo@demo.test',
        mobile: '+966501234567',
        country: 'sa',
        region: 'riyadh',
        city: 'riyadh-city',
        industry: 'Engineering',
        size: '11-50',
        description: 'Demo company for testing PMTwin signup and collaboration workflows.',
        crNumber: '',
        taxId: '',
        authRepName: 'Ahmed Demo',
        authRepRole: 'Director',
        password: 'demo123'
    },
    individual: {
        fullName: 'Ahmed Hassan',
        email: 'signup-demo@demo.test',
        mobile: '+966501234567',
        country: 'sa',
        region: 'riyadh',
        city: 'riyadh-city',
        currentRole: 'Senior Structural Engineer',
        yearsExperience: '8',
        skills: 'Structural Engineering, BIM, Project Management',
        languages: 'Arabic, English',
        linkedin: 'https://linkedin.com/in/demo',
        password: 'demo123',
        specialty: 'Civil Engineering',
        expertise: 'Structural Design & Review'
    }
};

function setRegLocationCascade(prefix, countryId, regionId, cityId) {
    const countrySelect = document.getElementById(prefix === 'company' ? 'reg-address-country' : 'reg-ind-address-country');
    const regionSelect = document.getElementById(prefix === 'company' ? 'reg-address-region' : 'reg-ind-address-region');
    const citySelect = document.getElementById(prefix === 'company' ? 'reg-address-city' : 'reg-ind-address-city');
    if (!countrySelect || !regionSelect || !citySelect) return;
    countrySelect.value = countryId || '';
    countrySelect.dispatchEvent(new Event('change'));
    setTimeout(() => {
        regionSelect.value = regionId || '';
        regionSelect.dispatchEvent(new Event('change'));
        setTimeout(() => {
            citySelect.value = cityId || '';
        }, 50);
    }, 50);
}

function fillRegDemoData() {
    const visible = document.querySelector('.reg-step-content:not(.hidden)');
    if (!visible) return;
    const id = visible.id;
    const d = regDemoData;

    if (id === 'reg-step-0') {
        const ind = document.querySelector('input[name="accountType"][value="individual"]');
        if (ind) { ind.checked = true; }
        regState.accountType = 'individual';
        const btn = document.getElementById('reg-btn-continue');
        if (btn) btn.disabled = false;
        const hint = document.getElementById('reg-continue-hint');
        if (hint) hint.classList.add('hidden');
        hideRegMessages();
        return;
    }
    if (id === 'reg-step-b1') {
        const pro = document.querySelector('input[name="individualType"][value="professional"]');
        if (pro) { pro.checked = true; }
        regState.individualType = 'professional';
        const nextBtn = document.getElementById('reg-btn-next-b1');
        if (nextBtn) nextBtn.disabled = false;
        const b1Hint = document.getElementById('reg-b1-continue-hint');
        if (b1Hint) b1Hint.classList.add('hidden');
        hideRegMessages();
        return;
    }

    if (id === 'reg-step-a1') {
        const roleSelect = document.getElementById('reg-company-role');
        if (roleSelect && roleSelect.options.length > 1) {
            const opt = Array.from(roleSelect.options).find(o => o.value === 'vendor') || roleSelect.options[1];
            if (opt) roleSelect.value = opt.value;
            roleSelect.dispatchEvent(new Event('change'));
        }
        hideRegMessages();
        return;
    }

    if (id === 'reg-step-a2') {
        const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val || ''; };
        set('reg-company-name', d.company.name);
        set('reg-company-website', d.company.website);
        set('reg-email', d.company.email);
        set('reg-mobile', d.company.mobile);
        set('reg-company-industry', d.company.industry);
        set('reg-company-size', d.company.size);
        set('reg-company-description', d.company.description);
        set('reg-company-cr', d.company.crNumber);
        set('reg-company-tax-id', d.company.taxId);
        set('reg-company-auth-rep-name', d.company.authRepName);
        set('reg-company-auth-rep-role', d.company.authRepRole);
        set('reg-password', d.company.password);
        set('reg-confirm-password', d.company.password);
        setRegLocationCascade('company', d.company.country, d.company.region, d.company.city);
        clearAllRegFieldErrors();
        hideRegMessages();
        return;
    }

    if (id === 'reg-step-b1') {
        const pro = document.querySelector('input[name="individualType"][value="professional"]');
        if (pro) pro.checked = true;
        hideRegMessages();
        return;
    }

    if (id === 'reg-step-b2') {
        const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val || ''; };
        set('reg-full-name', d.individual.fullName);
        set('reg-ind-email', d.individual.email);
        set('reg-ind-mobile', d.individual.mobile);
        set('reg-ind-current-role', d.individual.currentRole);
        set('reg-ind-years-experience', d.individual.yearsExperience);
        set('reg-ind-skills', d.individual.skills);
        set('reg-ind-languages', d.individual.languages);
        set('reg-ind-linkedin', d.individual.linkedin);
        set('reg-ind-password', d.individual.password);
        set('reg-ind-confirm-password', d.individual.password);
        set('reg-specialty', d.individual.specialty);
        const expertiseEl = document.getElementById('reg-expertise');
        if (expertiseEl) expertiseEl.value = d.individual.expertise || '';
        setRegLocationCascade('individual', d.individual.country, d.individual.region, d.individual.city);
        clearAllRegFieldErrors();
        hideRegMessages();
        return;
    }
}

function showRegSuccess(msg) {
    const el = document.getElementById('register-success');
    if (el) {
        el.innerHTML = msg;
        el.style.display = 'block';
    }
    const errEl = document.getElementById('register-error');
    if (errEl) errEl.style.display = 'none';
}

function hideRegMessages() {
    const err = document.getElementById('register-error');
    const success = document.getElementById('register-success');
    if (err) err.style.display = 'none';
    if (success) success.style.display = 'none';
}

function getRegStepId() {
    if (regState.currentStep === 0) return 'reg-step-0';
    if (regState.accountType === 'company') return `reg-step-a${Math.min(regState.currentStep, 5)}`;
    // Individual path: step 1->B1 (choose role), 2->B2, ...; same for professional/consultant after B1
    if (regState.accountType === 'individual' || regState.accountType === 'professional' || regState.accountType === 'consultant') {
        return `reg-step-b${Math.min(regState.currentStep, 5)}`;
    }
    return `reg-step-b${Math.min(regState.currentStep, 5)}`;
}

function showRegStep(stepId) {
    document.querySelectorAll('.reg-step-content').forEach(el => {
        el.classList.add('hidden');
        el.removeAttribute('aria-current');
    });
    const step = document.getElementById(stepId);
    if (step) {
        step.classList.remove('hidden');
        step.setAttribute('aria-current', 'step');
    }
}

function getRegPreferredModelsList() {
    if (lookupsData?.preferredCollaborationLabels?.length) {
        return lookupsData.preferredCollaborationLabels.map(m => ({ id: m.id, label: m.label || m.id }));
    }
    const list = [];
    if (window.CONFIG?.MODELS) {
        Object.entries(CONFIG.MODELS).forEach(([key, id]) => {
            list.push({ id, label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) });
        });
    }
    if (window.CONFIG?.COLLABORATION_MODEL) {
        Object.entries(CONFIG.COLLABORATION_MODEL).forEach(([key, id]) => {
            if (!list.some(m => m.id === id)) list.push({ id, label: key.charAt(0).toUpperCase() + key.slice(1) });
        });
    }
    return list;
}

function fillRegPreferredModels(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const preferred = regState.preferredCollaborationModels || [];
    getRegPreferredModelsList().forEach(m => {
        const label = document.createElement('label');
        label.className = 'inline-flex items-center gap-1 cursor-pointer';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = m.id;
        cb.checked = preferred.indexOf(m.id) !== -1;
        cb.addEventListener('change', () => {
            if (cb.checked) regState.preferredCollaborationModels = [...(regState.preferredCollaborationModels || []), m.id];
            else regState.preferredCollaborationModels = (regState.preferredCollaborationModels || []).filter(id => id !== m.id);
        });
        label.appendChild(cb);
        label.appendChild(document.createTextNode(m.label));
        container.appendChild(label);
    });
}

var regStepTitles = {
    'reg-step-0': 'Account type',
    'reg-step-a1': 'Company role',
    'reg-step-a2': 'Company details',
    'reg-step-a3': 'Documents & terms',
    'reg-step-a4': 'Review & submit',
    'reg-step-a5': 'Vetting',
    'reg-step-b1': 'Choose role',
    'reg-step-b2': 'Personal details',
    'reg-step-b3': 'Documents & terms',
    'reg-step-b4': 'Review & submit',
    'reg-step-b5': 'Verification'
};

var regStepNavLabelsCompany = ['Account Type', 'Role', 'Profile Info', 'Documents', 'Review', 'Vetting'];
var regStepNavLabelsIndividual = ['Account Type', 'Role', 'Profile Info', 'Documents', 'Review', 'Verification'];

function updateRegProgress() {
    const progressWrap = document.getElementById('reg-wizard-progress');
    const label = document.getElementById('reg-step-label');
    const list = document.getElementById('reg-step-nav-list');
    if (!progressWrap || !list) return;
    progressWrap.classList.remove('hidden');
    const totalSteps = 6;
    const stepNumber = regState.currentStep === 0 ? 1 : regState.currentStep + 1;
    const activeIndex = regState.currentStep === 0 ? 0 : Math.min(regState.currentStep, 5);
    if (label) label.textContent = `Step ${stepNumber} of ${totalSteps}`;
    const labels = (regState.accountType === 'company' ? regStepNavLabelsCompany : regStepNavLabelsIndividual);
    list.querySelectorAll('.reg-step-nav-item').forEach((el, i) => {
        const idx = parseInt(el.getAttribute('data-step-index'), 10);
        if (!isNaN(idx) && labels[idx]) el.querySelector('.reg-step-nav-label').textContent = labels[idx];
        el.classList.remove('reg-step-done', 'reg-step-active', 'reg-step-upcoming');
        const icon = el.querySelector('.reg-step-nav-icon');
        if (idx < activeIndex) {
            el.classList.add('reg-step-done');
            el.setAttribute('aria-current', null);
            if (icon) { icon.innerHTML = '<i class="ph-fill ph-check" aria-hidden="true"></i>'; icon.classList.add('reg-step-nav-icon-check'); }
        } else if (idx === activeIndex) {
            el.classList.add('reg-step-active');
            el.setAttribute('aria-current', 'step');
            if (icon) { icon.innerHTML = ''; icon.classList.remove('reg-step-nav-icon-check'); }
        } else {
            el.classList.add('reg-step-upcoming');
            el.setAttribute('aria-current', null);
            if (icon) { icon.innerHTML = ''; icon.classList.remove('reg-step-nav-icon-check'); }
        }
    });
}

function getRegDomainsList() {
    const cats = lookupsData?.jobCategories || [];
    return cats.map(c => (typeof c === 'string' ? { id: c, label: c } : { id: c.id || c, label: c.label || c.id || c }));
}

function goToRegStep(step) {
    regState.currentStep = step;
    const stepId = getRegStepId();
    showRegStep(stepId);
    if (stepId === 'reg-step-a4') fillRegPreferredModels('reg-company-preferred-models');
    if (stepId === 'reg-step-b4') fillRegPreferredModels('reg-individual-preferred-models');
    if (stepId === 'reg-step-a5') fillRegVettingStep('company');
    if (stepId === 'reg-step-b5') fillRegVettingStep('individual');
    if (stepId === 'reg-step-b2') {
        document.getElementById('reg-specialty-wrap')?.classList.toggle('hidden', regState.individualType !== 'professional');
        document.getElementById('reg-expertise-wrap')?.classList.toggle('hidden', regState.individualType !== 'consultant');
    }
    if (stepId === 'reg-step-b1') updateRegB1CTAState();
    updateRegProgress();
    hideRegMessages();
}

function updateRegB1CTAState() {
    const sel = document.querySelector('input[name="individualType"]:checked')?.value;
    const nextBtn = document.getElementById('reg-btn-next-b1');
    const hint = document.getElementById('reg-b1-continue-hint');
    if (nextBtn) nextBtn.disabled = !sel;
    if (hint) hint.classList.toggle('hidden', !!sel);
}

function fillRegVettingStep(prefix) {
    const domains = getRegDomainsList();
    const primarySelect = document.getElementById(prefix === 'company' ? 'reg-vetting-primary-domain' : 'reg-vetting-ind-primary-domain');
    if (primarySelect) {
        primarySelect.innerHTML = '<option value="">Select primary domain</option>';
        domains.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.label;
            opt.selected = regState.primaryDomain === d.id;
            primarySelect.appendChild(opt);
        });
    }
    const listId = prefix === 'company' ? 'reg-vetting-expertise-list' : 'reg-vetting-ind-expertise-list';
    renderRegExpertiseAreas(listId, prefix);
    const choiceName = prefix === 'company' ? 'reg-vetting-choice' : 'reg-vetting-choice-ind';
    const choice = document.querySelector(`input[name="${choiceName}"][value="skip"]`);
    const complete = document.querySelector(`input[name="${choiceName}"][value="complete"]`);
    const vettingForm = document.getElementById(prefix === 'company' ? 'reg-vetting-form-company' : 'reg-vetting-form-individual');
    if (vettingForm) vettingForm.style.display = regState.vettingSkippedAtRegistration === false ? 'block' : 'none';
    if (choice) choice.checked = regState.vettingSkippedAtRegistration === true;
    if (complete) complete.checked = regState.vettingSkippedAtRegistration === false;
}

function renderRegExpertiseAreas(containerId, prefix) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const domains = getRegDomainsList();
    container.innerHTML = '';
    (regState.expertiseAreas || []).forEach((ea, i) => {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap gap-2 items-center mb-2 reg-expertise-row';
        const domainSelect = document.createElement('select');
        domainSelect.className = 'reg-expertise-domain px-4 py-2 border rounded flex-1 min-w-[120px]';
        domainSelect.innerHTML = '<option value="">Domain</option>';
        domains.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.label;
            if (ea.domain === d.id) opt.selected = true;
            domainSelect.appendChild(opt);
        });
        const roleSelect = document.createElement('select');
        roleSelect.className = 'reg-expertise-role px-4 py-2 border rounded min-w-[120px]';
        roleSelect.innerHTML = '<option value="professional">Professional</option><option value="consultant">Consultant</option>';
        roleSelect.value = ea.role || 'professional';
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'px-3 py-1 border border-gray-300 rounded hover:bg-gray-50';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => { row.remove(); });
        row.appendChild(domainSelect);
        row.appendChild(roleSelect);
        row.appendChild(removeBtn);
        container.appendChild(row);
    });
}

function addRegExpertiseRow(prefix) {
    const listId = prefix === 'company' ? 'reg-vetting-expertise-list' : 'reg-vetting-ind-expertise-list';
    const container = document.getElementById(listId);
    if (!container) return;
    regState.expertiseAreas = regState.expertiseAreas || [];
    regState.expertiseAreas.push({ domain: '', role: 'professional' });
    renderRegExpertiseAreas(listId, prefix);
}

function collectRegVettingFromForm(prefix) {
    const primarySelect = document.getElementById(prefix === 'company' ? 'reg-vetting-primary-domain' : 'reg-vetting-ind-primary-domain');
    regState.primaryDomain = primarySelect?.value?.trim() || null;
    const listId = prefix === 'company' ? 'reg-vetting-expertise-list' : 'reg-vetting-ind-expertise-list';
    const list = document.getElementById(listId);
    regState.expertiseAreas = [];
    if (list) {
        list.querySelectorAll('.reg-expertise-row').forEach(row => {
            const domain = row.querySelector('.reg-expertise-domain')?.value?.trim();
            const role = row.querySelector('.reg-expertise-role')?.value || 'professional';
            if (domain) regState.expertiseAreas.push({ domain, role });
        });
    }
}

function generateOTP() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function requestOTP(channel, prefix) {
    const code = generateOTP();
    if (prefix === 'company') {
        if (channel === 'email') otpCodes.email = code;
        else otpCodes.mobile = code;
    } else {
        if (channel === 'email') otpCodes.indEmail = code;
        else otpCodes.indMobile = code;
    }
    return code;
}

function verifyOTP(channel, code, prefix) {
    let stored;
    if (prefix === 'company') {
        stored = channel === 'email' ? otpCodes.email : otpCodes.mobile;
    } else {
        stored = channel === 'email' ? otpCodes.indEmail : otpCodes.indMobile;
    }
    const ok = stored && String(code).trim() === String(stored);
    if (ok && prefix === 'company') {
        if (channel === 'email') regState.emailVerified = true;
        else regState.mobileVerified = true;
    }
    if (ok && prefix === 'individual') {
        if (channel === 'email') regState.emailVerified = true;
        else regState.mobileVerified = true;
    }
    return ok;
}

async function loadRegData() {
    if (lookupsData && locationsData) return;
    try {
        const [lookupRes, locRes] = await Promise.all([
            fetch(BASE_PATH + 'data/lookups.json'),
            fetch(BASE_PATH + 'data/locations.json')
        ]);
        lookupsData = await lookupRes.json();
        locationsData = await locRes.json();
    } catch (e) {
        console.error('Failed to load registration data', e);
    }
}

function setupLocationDropdowns(prefix) {
    const countryId = prefix === 'company' ? 'reg-address-country' : 'reg-ind-address-country';
    const regionId = prefix === 'company' ? 'reg-address-region' : 'reg-ind-address-region';
    const cityId = prefix === 'company' ? 'reg-address-city' : 'reg-ind-address-city';
    const countries = locationsData?.countries || [];
    const countrySelect = document.getElementById(countryId);
    const regionSelect = document.getElementById(regionId);
    const citySelect = document.getElementById(cityId);
    if (!countrySelect || !regionSelect || !citySelect) return;

    countrySelect.innerHTML = '<option value="">Select country</option>';
    countries.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        countrySelect.appendChild(opt);
    });

    regionSelect.innerHTML = '<option value="">Select region</option>';
    citySelect.innerHTML = '<option value="">Select city</option>';

    function onCountryChange() {
        const cid = countrySelect.value;
        regionSelect.innerHTML = '<option value="">Select region</option>';
        citySelect.innerHTML = '<option value="">Select city</option>';
        if (!cid) return;
        const country = countries.find(c => c.id === cid);
        const regions = country?.regions || [];
        regions.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = r.name;
            regionSelect.appendChild(opt);
        });
    }

    function onRegionChange() {
        const cid = countrySelect.value;
        const rid = regionSelect.value;
        citySelect.innerHTML = '<option value="">Select city</option>';
        if (!cid || !rid) return;
        const country = countries.find(c => c.id === cid);
        const region = country?.regions?.find(r => r.id === rid);
        const cities = region?.cities || [];
        cities.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            citySelect.appendChild(opt);
        });
    }

    countrySelect.removeEventListener('change', onCountryChange);
    regionSelect.removeEventListener('change', onRegionChange);
    countrySelect.addEventListener('change', onCountryChange);
    regionSelect.addEventListener('change', onRegionChange);
}

function validateRegStep(step) {
    clearAllRegFieldErrors();
    if (regState.accountType === 'company') {
        if (step === 1) {
            const role = document.getElementById('reg-company-role')?.value;
            if (!role) { showRegError('Please select a company role'); return false; }
            const wrap = document.getElementById('reg-company-subtype-wrap');
            if (wrap && !wrap.classList.contains('hidden')) {
                const sub = document.getElementById('reg-company-subtype')?.value;
                if (!sub) { showRegError('Please select a sub-type'); return false; }
            }
            return true;
        }
        if (step === 2) {
            const name = document.getElementById('reg-company-name')?.value?.trim();
            if (!name) { showRegFieldError('reg-company-name', 'Company name is required'); return false; }
            const email = document.getElementById('reg-email')?.value?.trim();
            if (!email) { showRegFieldError('reg-email', 'Email is required'); return false; }
            if (!regState.emailVerified) { showRegFieldError('reg-email', 'Please verify your email with OTP'); return false; }
            const mobile = document.getElementById('reg-mobile')?.value?.trim();
            if (!mobile) { showRegFieldError('reg-mobile', 'Mobile is required'); return false; }
            if (!regState.mobileVerified) { showRegFieldError('reg-mobile', 'Please verify your mobile with OTP'); return false; }
            const country = document.getElementById('reg-address-country')?.value;
            if (!country) { showRegFieldError('reg-address-country', 'Country is required'); return false; }
            const password = document.getElementById('reg-password')?.value;
            const confirm = document.getElementById('reg-confirm-password')?.value;
            if (!password || password.length < 6) { showRegFieldError('reg-password', 'Password must be at least 6 characters'); return false; }
            if (password !== confirm) { showRegFieldError('reg-confirm-password', 'Passwords do not match'); return false; }
            return true;
        }
        if (step === 3) {
            const role = regState.companyRole;
            const docs = lookupsData?.companyRoleDocuments?.[role] || [];
            const required = docs.filter(d => d.required);
            for (const r of required) {
                const has = regState.documents.some(d => d.type === r.id);
                if (!has) { showRegError(`Please upload: ${r.label}`); return false; }
            }
            const terms = document.getElementById('reg-terms-company')?.checked;
            if (!terms) { showRegError('You must accept the Terms & Conditions'); return false; }
            return true;
        }
    }
    if (regState.accountType === 'individual') {
        if (step === 1) {
            const type = document.querySelector('input[name="individualType"]:checked')?.value;
            if (!type) { showRegError('Please select Professional or Consultant'); return false; }
            return true;
        }
    }
    if (regState.accountType === 'professional' || regState.accountType === 'consultant') {
        if (step === 1) {
            const type = document.querySelector('input[name="individualType"]:checked')?.value;
            if (!type) { showRegError('Please select Professional or Consultant'); return false; }
            return true;
        }
        if (step === 2) {
            const name = document.getElementById('reg-full-name')?.value?.trim();
            if (!name) { showRegFieldError('reg-full-name', 'Full name is required'); return false; }
            const email = document.getElementById('reg-ind-email')?.value?.trim();
            if (!email) { showRegFieldError('reg-ind-email', 'Email is required'); return false; }
            if (!regState.emailVerified) { showRegFieldError('reg-ind-email', 'Please verify your email with OTP'); return false; }
            const mobile = document.getElementById('reg-ind-mobile')?.value?.trim();
            if (!mobile) { showRegFieldError('reg-ind-mobile', 'Mobile is required'); return false; }
            if (!regState.mobileVerified) { showRegFieldError('reg-ind-mobile', 'Please verify your mobile with OTP'); return false; }
            const country = document.getElementById('reg-ind-address-country')?.value;
            if (!country) { showRegFieldError('reg-ind-address-country', 'Country is required'); return false; }
            const password = document.getElementById('reg-ind-password')?.value;
            const confirm = document.getElementById('reg-ind-confirm-password')?.value;
            if (!password || password.length < 6) { showRegFieldError('reg-ind-password', 'Password must be at least 6 characters'); return false; }
            if (password !== confirm) { showRegFieldError('reg-ind-confirm-password', 'Passwords do not match'); return false; }
            const indType = regState.individualType;
            if (indType === 'professional') {
                const spec = document.getElementById('reg-specialty')?.value?.trim();
                if (!spec) { showRegFieldError('reg-specialty', 'Discipline / Specialty is required'); return false; }
            } else {
                const exp = document.getElementById('reg-expertise')?.value?.trim();
                if (!exp) { showRegFieldError('reg-expertise', 'Expertise area is required'); return false; }
            }
            return true;
        }
        if (step === 3) {
            const type = regState.individualType;
            const docs = lookupsData?.individualTypeDocuments?.[type] || [];
            const required = docs.filter(d => d.required);
            for (const r of required) {
                const has = regState.documents.some(d => d.type === r.id);
                if (!has) { showRegError(`Please upload: ${r.label}`); return false; }
            }
            const terms = document.getElementById('reg-terms-individual')?.checked;
            if (!terms) { showRegError('You must accept the Terms & Conditions'); return false; }
            return true;
        }
        if (step === 4 || step === 5) return true;
    }
    return true;
}

function syncRegStateFromForm() {
    if (regState.accountType === 'company') {
        regState.companyRole = document.getElementById('reg-company-role')?.value || null;
        regState.companySubType = document.getElementById('reg-company-subtype')?.value || null;
        regState.companyName = document.getElementById('reg-company-name')?.value?.trim() || '';
        regState.website = document.getElementById('reg-company-website')?.value?.trim() || '';
        regState.industry = document.getElementById('reg-company-industry')?.value?.trim() || '';
        regState.companySize = document.getElementById('reg-company-size')?.value?.trim() || '';
        regState.companyDescription = document.getElementById('reg-company-description')?.value?.trim() || '';
        regState.crNumber = document.getElementById('reg-company-cr')?.value?.trim() || '';
        regState.taxId = document.getElementById('reg-company-tax-id')?.value?.trim() || '';
        regState.authorizedRepresentative = {
            name: document.getElementById('reg-company-auth-rep-name')?.value?.trim() || '',
            role: document.getElementById('reg-company-auth-rep-role')?.value?.trim() || ''
        };
        regState.email = document.getElementById('reg-email')?.value?.trim() || '';
        regState.mobile = document.getElementById('reg-mobile')?.value?.trim() || '';
        regState.address = {
            country: document.getElementById('reg-address-country')?.value || '',
            region: document.getElementById('reg-address-region')?.value || '',
            city: document.getElementById('reg-address-city')?.value || ''
        };
        regState.password = document.getElementById('reg-password')?.value || '';
    } else if (regState.accountType === 'professional' || regState.accountType === 'consultant') {
        regState.individualType = regState.individualType || regState.accountType;
        regState.fullName = document.getElementById('reg-full-name')?.value?.trim() || '';
        regState.email = document.getElementById('reg-ind-email')?.value?.trim() || '';
        regState.mobile = document.getElementById('reg-ind-mobile')?.value?.trim() || '';
        regState.address = {
            country: document.getElementById('reg-ind-address-country')?.value || '',
            region: document.getElementById('reg-ind-address-region')?.value || '',
            city: document.getElementById('reg-ind-address-city')?.value || ''
        };
        regState.password = document.getElementById('reg-ind-password')?.value || '';
        regState.specialty = document.getElementById('reg-specialty')?.value?.trim() || '';
        regState.expertise = document.getElementById('reg-expertise')?.value?.trim() || '';
        regState.currentRole = document.getElementById('reg-ind-current-role')?.value?.trim() || '';
        regState.yearsExperience = document.getElementById('reg-ind-years-experience')?.value?.trim() || '';
        regState.skills = document.getElementById('reg-ind-skills')?.value?.trim() || '';
        regState.languages = document.getElementById('reg-ind-languages')?.value?.trim() || '';
        regState.linkedin = document.getElementById('reg-ind-linkedin')?.value?.trim() || '';
    }
}

function renderCompanyDocuments() {
    const container = document.getElementById('reg-company-documents');
    if (!container) return;
    const role = regState.companyRole;
    const docs = lookupsData?.companyRoleDocuments?.[role] || [];
    container.innerHTML = '';
    docs.forEach(d => {
        const div = document.createElement('div');
        div.className = 'reg-upload-item mb-4';
        div.innerHTML = `
            <label class="block mb-2 font-medium text-gray-900">${d.label} ${d.required ? '<span class="text-red-600">*</span>' : ''}</label>
            <div class="reg-upload-zone relative border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary/50 transition-colors" data-doc-type="${d.id}">
                <input type="file" data-doc-type="${d.id}" data-doc-label="${d.label}" class="reg-doc-input absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" tabindex="0">
                <div class="reg-upload-placeholder pointer-events-none">
                    <i class="ph-duotone ph-cloud-arrow-up text-3xl text-gray-400 mb-2 block"></i>
                    <p class="text-sm text-gray-500 mb-1">Drag and drop or <span class="text-primary font-medium">browse</span></p>
                    <p class="text-xs text-gray-400">PDF or DOCX recommended. PDF, DOC, DOCX, JPG, PNG (max 5MB)</p>
                </div>
                <div class="reg-upload-loading flex flex-col items-center justify-center hidden pointer-events-none">
                    <span class="text-sm text-gray-600">Uploading…</span>
                </div>
                <div class="reg-upload-preview flex flex-col items-center hidden">
                    <span class="reg-doc-name text-sm font-medium text-gray-700 mb-2"></span>
                    <div class="flex gap-2">
                        <button type="button" class="reg-doc-replace px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Replace file</button>
                        <button type="button" class="reg-doc-remove px-3 py-1.5 text-sm border border-red-200 rounded-lg hover:bg-red-50 text-red-600">Remove file</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(div);
        const zone = div.querySelector('.reg-upload-zone');
        const input = div.querySelector('.reg-doc-input');
        const nameSpan = div.querySelector('.reg-doc-name');
        const placeholder = div.querySelector('.reg-upload-placeholder');
        const loadingEl = div.querySelector('.reg-upload-loading');
        const preview = div.querySelector('.reg-upload-preview');
        const replaceBtn = div.querySelector('.reg-doc-replace');
        const removeBtn = div.querySelector('.reg-doc-remove');
        const allowedExt = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

        function setFile(file) {
            if (!file) {
                regState.documents = regState.documents.filter(x => x.type !== d.id);
                nameSpan.textContent = '';
                placeholder.classList.remove('hidden');
                if (loadingEl) loadingEl.classList.add('hidden');
                preview.classList.add('hidden');
                input.value = '';
                return;
            }
            if (!allowedExt.test(file.name) && !allowedTypes.includes(file.type)) {
                showRegError('File type not supported. Please use PDF, DOC, DOCX, JPG, or PNG.');
                input.value = '';
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showRegError('File size must be under 5MB');
                input.value = '';
                return;
            }
            placeholder.classList.add('hidden');
            if (loadingEl) loadingEl.classList.remove('hidden');
            preview.classList.add('hidden');
            const reader = new FileReader();
            reader.onload = () => {
                regState.documents = regState.documents.filter(x => x.type !== d.id);
                regState.documents.push({ type: d.id, label: d.label, fileName: file.name, data: reader.result });
                nameSpan.textContent = file.name;
                if (loadingEl) loadingEl.classList.add('hidden');
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }

        input.addEventListener('change', function() { setFile(this.files[0]); });
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('border-primary', 'bg-primary/5'); });
        zone.addEventListener('dragleave', () => { zone.classList.remove('border-primary', 'bg-primary/5'); });
        zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('border-primary', 'bg-primary/5'); setFile(e.dataTransfer?.files?.[0]); });
        replaceBtn.addEventListener('click', (e) => { e.preventDefault(); input.click(); });
        removeBtn.addEventListener('click', (e) => { e.preventDefault(); setFile(null); });
    });
}

function renderIndividualDocuments() {
    const container = document.getElementById('reg-individual-documents');
    if (!container) return;
    const type = regState.individualType;
    const docs = lookupsData?.individualTypeDocuments?.[type] || [];
    container.innerHTML = '';
    regState.documents = [];
    docs.forEach(d => {
        const div = document.createElement('div');
        div.className = 'reg-upload-item mb-4';
        div.innerHTML = `
            <label class="block mb-2 font-medium text-gray-900">${d.label} ${d.required ? '<span class="text-red-600">*</span>' : ''}</label>
            <div class="reg-upload-zone border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary/50 transition-colors relative" data-doc-type="${d.id}">
                <input type="file" data-doc-type="${d.id}" data-doc-label="${d.label}" class="reg-doc-ind-input absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" tabindex="0">
                <div class="reg-upload-placeholder pointer-events-none">
                    <i class="ph-duotone ph-cloud-arrow-up text-3xl text-gray-400 mb-2 block"></i>
                    <p class="text-sm text-gray-500 mb-1">Drag and drop or <span class="text-primary font-medium">browse</span></p>
                    <p class="text-xs text-gray-400">PDF or DOCX recommended. PDF, DOC, DOCX, JPG, PNG (max 5MB)</p>
                </div>
                <div class="reg-upload-loading flex flex-col items-center justify-center hidden pointer-events-none">
                    <span class="text-sm text-gray-600">Uploading…</span>
                </div>
                <div class="reg-upload-preview flex flex-col items-center hidden">
                    <span class="reg-doc-ind-name text-sm font-medium text-gray-700 mb-2"></span>
                    <div class="flex gap-2">
                        <button type="button" class="reg-doc-ind-replace px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Replace file</button>
                        <button type="button" class="reg-doc-ind-remove px-3 py-1.5 text-sm border border-red-200 rounded-lg hover:bg-red-50 text-red-600">Remove file</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(div);
        const zone = div.querySelector('.reg-upload-zone');
        const input = div.querySelector('.reg-doc-ind-input');
        const nameSpan = div.querySelector('.reg-doc-ind-name');
        const placeholder = div.querySelector('.reg-upload-placeholder');
        const loadingEl = div.querySelector('.reg-upload-loading');
        const preview = div.querySelector('.reg-upload-preview');
        const replaceBtn = div.querySelector('.reg-doc-ind-replace');
        const removeBtn = div.querySelector('.reg-doc-ind-remove');
        const allowedExt = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

        function setFile(file) {
            if (!file) {
                regState.documents = regState.documents.filter(x => x.type !== d.id);
                nameSpan.textContent = '';
                placeholder.classList.remove('hidden');
                if (loadingEl) loadingEl.classList.add('hidden');
                preview.classList.add('hidden');
                input.value = '';
                return;
            }
            if (!allowedExt.test(file.name) && !allowedTypes.includes(file.type)) {
                showRegError('File type not supported. Please use PDF, DOC, DOCX, JPG, or PNG.');
                input.value = '';
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showRegError('File size must be under 5MB');
                input.value = '';
                return;
            }
            placeholder.classList.add('hidden');
            if (loadingEl) loadingEl.classList.remove('hidden');
            preview.classList.add('hidden');
            const reader = new FileReader();
            reader.onload = () => {
                regState.documents = regState.documents.filter(x => x.type !== d.id);
                regState.documents.push({ type: d.id, label: d.label, fileName: file.name, data: reader.result });
                nameSpan.textContent = file.name;
                if (loadingEl) loadingEl.classList.add('hidden');
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }

        input.addEventListener('change', function() { setFile(this.files[0]); });
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('border-primary', 'bg-primary/5'); });
        zone.addEventListener('dragleave', () => { zone.classList.remove('border-primary', 'bg-primary/5'); });
        zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('border-primary', 'bg-primary/5'); setFile(e.dataTransfer?.files?.[0]); });
        replaceBtn.addEventListener('click', (e) => { e.preventDefault(); input.click(); });
        removeBtn.addEventListener('click', (e) => { e.preventDefault(); setFile(null); });
    });
}

function updateRegProfileCompletionCompany() {
    syncRegStateFromForm();
    const bar = document.getElementById('reg-completion-bar-company');
    const doneEl = document.getElementById('reg-completion-done-company');
    const missingEl = document.getElementById('reg-completion-missing-company');
    if (!bar || !doneEl || !missingEl) return;
    const requiredDocs = (lookupsData?.companyRoleDocuments?.[regState.companyRole] || []).filter(d => d.required).map(d => d.id);
    const hasRequiredDocs = requiredDocs.every(id => regState.documents.some(d => d.type === id));
    const items = [
        { key: 'role', done: !!regState.companyRole },
        { key: 'Company name', done: !!regState.companyName?.trim() },
        { key: 'Email', done: !!regState.email?.trim() },
        { key: 'Mobile', done: !!regState.mobile?.trim() },
        { key: 'Country', done: !!regState.address?.country },
        { key: 'Password', done: !!regState.password },
        { key: 'Documents', done: hasRequiredDocs },
        { key: 'Terms', done: document.getElementById('reg-terms-company')?.checked }
    ];
    const done = items.filter(i => i.done);
    const missing = items.filter(i => !i.done);
    const pct = items.length ? Math.round((done.length / items.length) * 100) : 0;
    bar.style.width = pct + '%';
    const pctEl = document.getElementById('reg-completion-pct-company');
    if (pctEl) pctEl.textContent = pct + '%';
    doneEl.innerHTML = done.length ? 'Completed:<br><span class="text-green-600">✔ ' + done.map(i => i.key).join('<br>✔ ') + '</span>' : '';
    missingEl.innerHTML = missing.length ? 'Missing:<br><span class="text-amber-600">• ' + missing.map(i => i.key).join('<br>• ') + '</span>' : '';
}

function updateRegProfileCompletionIndividual() {
    syncRegStateFromForm();
    const bar = document.getElementById('reg-completion-bar-individual');
    const doneEl = document.getElementById('reg-completion-done-individual');
    const missingEl = document.getElementById('reg-completion-missing-individual');
    if (!bar || !doneEl || !missingEl) return;
    const requiredDocs = (lookupsData?.individualTypeDocuments?.[regState.individualType] || []).filter(d => d.required).map(d => d.id);
    const hasRequiredDocs = requiredDocs.every(id => regState.documents.some(d => d.type === id));
    const items = [
        { key: 'Full name', done: !!regState.fullName?.trim() },
        { key: 'Email', done: !!regState.email?.trim() },
        { key: 'Mobile', done: !!regState.mobile?.trim() },
        { key: 'Country', done: !!regState.address?.country },
        { key: 'Specialty/Expertise', done: !!(regState.specialty?.trim() || regState.expertise?.trim()) },
        { key: 'Password', done: !!regState.password },
        { key: 'Documents', done: hasRequiredDocs },
        { key: 'Terms', done: document.getElementById('reg-terms-individual')?.checked }
    ];
    const done = items.filter(i => i.done);
    const missing = items.filter(i => !i.done);
    const pct = items.length ? Math.round((done.length / items.length) * 100) : 0;
    bar.style.width = pct + '%';
    const pctEl = document.getElementById('reg-completion-pct-individual');
    if (pctEl) pctEl.textContent = pct + '%';
    doneEl.innerHTML = done.length ? 'Completed:<br><span class="text-green-600">✔ ' + done.map(i => i.key).join('<br>✔ ') + '</span>' : '';
    missingEl.innerHTML = missing.length ? 'Missing:<br><span class="text-amber-600">• ' + missing.map(i => i.key).join('<br>• ') + '</span>' : '';
}

function renderReviewCompany() {
    syncRegStateFromForm();
    updateRegProfileCompletionCompany();
    const container = document.getElementById('reg-review-company');
    if (!container) return;
    const roles = lookupsData?.companyRoles || [];
    const roleLabel = roles.find(r => r.id === regState.companyRole)?.label || regState.companyRole;
    const subTypes = lookupsData?.companyRoleSubTypes?.[regState.companyRole] || [];
    const subLabel = regState.companySubType ? (subTypes.find(s => s.id === regState.companySubType)?.label || regState.companySubType) : '';
    const industries = lookupsData?.jobCategories || [];
    const industryItem = regState.industry ? industries.find(i => (typeof i === 'string' ? i : (i.id || i.label)) === regState.industry) : null;
    const industryLabel = industryItem ? (typeof industryItem === 'string' ? industryItem : (industryItem.label || industryItem.id)) : (regState.industry || '—');
    const sizes = lookupsData?.companySizes || [];
    const sizeLabel = regState.companySize ? (sizes.find(s => s.id === regState.companySize)?.label || regState.companySize) : '—';
    const loc = [regState.address.country, regState.address.region, regState.address.city].filter(Boolean).join(', ');
    const docList = regState.documents.map(d => d.label + ': ' + d.fileName).join('; ');
    const prefModels = (regState.preferredCollaborationModels || []).map(id => getRegPreferredModelsList().find(m => m.id === id)?.label || id).join(', ');
    const authRep = regState.authorizedRepresentative && (regState.authorizedRepresentative.name || regState.authorizedRepresentative.role) ? (regState.authorizedRepresentative.name + (regState.authorizedRepresentative.role ? ' (' + regState.authorizedRepresentative.role + ')' : '')) : '—';
    container.innerHTML = `
        <p><strong>Role:</strong> ${roleLabel} ${subLabel ? ' / ' + subLabel : ''}</p>
        <p><strong>Company:</strong> ${regState.companyName}</p>
        <p><strong>Industry:</strong> ${industryLabel}</p>
        <p><strong>Company size:</strong> ${sizeLabel}</p>
        ${regState.companyDescription ? `<p><strong>Description:</strong> ${regState.companyDescription.slice(0, 200)}${regState.companyDescription.length > 200 ? '…' : ''}</p>` : ''}
        ${regState.crNumber ? `<p><strong>CR number:</strong> ${regState.crNumber}</p>` : ''}
        ${regState.taxId ? `<p><strong>Tax ID:</strong> ${regState.taxId}</p>` : ''}
        <p><strong>Authorized representative:</strong> ${authRep}</p>
        <p><strong>Email:</strong> ${regState.email} (verified)</p>
        <p><strong>Mobile:</strong> ${regState.mobile} (verified)</p>
        <p><strong>Address:</strong> ${loc || '—'}</p>
        <p><strong>Documents:</strong> ${docList || '—'}</p>
        ${prefModels ? `<p><strong>Preferred collaboration models:</strong> ${prefModels}</p>` : ''}
    `;
}

function renderReviewIndividual() {
    syncRegStateFromForm();
    updateRegProfileCompletionIndividual();
    const container = document.getElementById('reg-review-individual');
    if (!container) return;
    const typeLabel = regState.individualType === 'professional' ? 'Professional' : 'Consultant';
    const spec = regState.individualType === 'professional' ? regState.specialty : regState.expertise;
    const loc = [regState.address.country, regState.address.region, regState.address.city].filter(Boolean).join(', ');
    const docList = regState.documents.map(d => d.label + ': ' + d.fileName).join('; ');
    const prefModels = (regState.preferredCollaborationModels || []).map(id => getRegPreferredModelsList().find(m => m.id === id)?.label || id).join(', ');
    const optional = [];
    if (regState.currentRole) optional.push(`<p><strong>Current role:</strong> ${regState.currentRole}</p>`);
    if (regState.yearsExperience) optional.push(`<p><strong>Years of experience:</strong> ${regState.yearsExperience}</p>`);
    if (regState.skills) optional.push(`<p><strong>Skills:</strong> ${regState.skills}</p>`);
    if (regState.languages) optional.push(`<p><strong>Languages:</strong> ${regState.languages}</p>`);
    if (regState.linkedin) optional.push(`<p><strong>LinkedIn:</strong> ${regState.linkedin}</p>`);
    container.innerHTML = `
        <p><strong>Type:</strong> ${typeLabel}</p>
        <p><strong>Name:</strong> ${regState.fullName}</p>
        <p><strong>Specialty/Expertise:</strong> ${spec}</p>
        <p><strong>Email:</strong> ${regState.email} (verified)</p>
        <p><strong>Mobile:</strong> ${regState.mobile} (verified)</p>
        <p><strong>Address:</strong> ${loc || '—'}</p>
        ${optional.join('')}
        <p><strong>Documents:</strong> ${docList || '—'}</p>
        ${prefModels ? `<p><strong>Preferred collaboration models:</strong> ${prefModels}</p>` : ''}
    `;
}

async function notifyAdminsOfNewRegistration(entityName) {
    try {
        const allUsers = await dataService.getUsers();
        const adminRoles = [CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR];
        const admins = allUsers.filter(u => adminRoles.includes(u.role));
        const vettingRoute = (CONFIG.ROUTES && CONFIG.ROUTES.ADMIN_VETTING) || '/admin/vetting';
        await Promise.all(admins.map(admin =>
            dataService.createNotification({
                userId: admin.id,
                type: 'new_registration_pending',
                title: 'New Registration Pending',
                message: `${entityName} has registered and requires approval.`,
                link: vettingRoute
            })
        ));
    } catch (e) {
        console.warn('Could not send admin registration notifications', e);
    }
}

async function submitCompany() {
    syncRegStateFromForm();
    const companyPrefEl = document.getElementById('reg-company-preferred-models');
    if (companyPrefEl) regState.preferredCollaborationModels = Array.from(companyPrefEl.querySelectorAll('input:checked')).map(cb => cb.value);
    const address = {
        country: regState.address.country,
        region: regState.address.region,
        city: regState.address.city
    };
    try {
        await authService.registerCompany({
            companyName: regState.companyName,
            website: regState.website,
            industry: regState.industry || null,
            companySize: regState.companySize || null,
            companyDescription: regState.companyDescription || null,
            crNumber: regState.crNumber || null,
            taxId: regState.taxId || null,
            authorizedRepresentative: regState.authorizedRepresentative,
            email: regState.email,
            mobile: regState.mobile,
            address,
            password: regState.password,
            companyRole: regState.companyRole,
            companySubType: regState.companySubType || null,
            documents: regState.documents,
            emailVerified: true,
            mobileVerified: true,
            preferredCollaborationModels: regState.preferredCollaborationModels || [],
            vettingSkippedAtRegistration: regState.vettingSkippedAtRegistration === true,
            primaryDomain: regState.primaryDomain || null,
            expertiseAreas: regState.expertiseAreas || []
        });
        await notifyAdminsOfNewRegistration('Company: ' + (regState.companyName || regState.email));
        showRegSuccess('Account created successfully. Your account is pending admin approval. You will receive an email once approved. Redirecting to login...');
        setTimeout(() => router.navigate(CONFIG.ROUTES.LOGIN), 3000);
    } catch (err) {
        showRegError(err.message || 'Registration failed. Please try again.');
    }
}

function parseCommaList(str) {
    if (!str || typeof str !== 'string') return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
}

async function submitIndividual() {
    syncRegStateFromForm();
    const indPrefEl = document.getElementById('reg-individual-preferred-models');
    if (indPrefEl) regState.preferredCollaborationModels = Array.from(indPrefEl.querySelectorAll('input:checked')).map(cb => cb.value);
    const role = regState.individualType === 'professional' ? CONFIG.ROLES.PROFESSIONAL : CONFIG.ROLES.CONSULTANT;
    const specialty = regState.individualType === 'professional' ? regState.specialty : regState.expertise;
    const profile = {
        type: regState.individualType,
        name: regState.fullName,
        phone: regState.mobile,
        location: [regState.address.country, regState.address.region, regState.address.city].filter(Boolean).join(', '),
        specialty,
        individualType: regState.individualType
    };
    if (regState.currentRole) profile.headline = regState.currentRole;
    if (regState.yearsExperience !== '') profile.yearsExperience = regState.yearsExperience;
    if (regState.skills) profile.skills = parseCommaList(regState.skills);
    if (regState.languages) profile.languages = parseCommaList(regState.languages);
    if (regState.linkedin) profile.socialMediaLinks = { linkedin: regState.linkedin };
    try {
        Object.assign(profile, {
            preferredCollaborationModels: regState.preferredCollaborationModels || [],
            vettingSkippedAtRegistration: regState.vettingSkippedAtRegistration === true,
            primaryDomain: regState.primaryDomain || null,
            expertiseAreas: regState.expertiseAreas || []
        });
        await authService.register({
            email: regState.email,
            password: regState.password,
            role,
            profile,
            address: regState.address,
            individualType: regState.individualType,
            specialty,
            documents: regState.documents,
            emailVerified: true,
            mobileVerified: true,
            preferredCollaborationModels: regState.preferredCollaborationModels || []
        });
        await notifyAdminsOfNewRegistration((regState.fullName || regState.email) + (regState.fullName && regState.email ? ' (' + regState.email + ')' : ''));
        showRegSuccess('Account created successfully. Your account is pending admin approval. You will receive an email once approved. Redirecting to login...');
        setTimeout(() => router.navigate(CONFIG.ROUTES.LOGIN), 3000);
    } catch (err) {
        showRegError(err.message || 'Registration failed. Please try again.');
    }
}

function setupOTPCompany() {
    const emailSend = document.getElementById('reg-otp-email-send');
    const emailWrap = document.getElementById('reg-otp-email-verify-wrap');
    const emailCode = document.getElementById('reg-otp-email-code');
    const emailDisplay = document.getElementById('reg-otp-email-display');
    const emailVerify = document.getElementById('reg-otp-email-verify');
    const emailBadge = document.getElementById('reg-email-verified-badge');
    if (emailSend) {
        emailSend.addEventListener('click', () => {
            const code = requestOTP('email', 'company');
            if (emailDisplay) emailDisplay.textContent = 'Code: ' + code;
            if (emailWrap) emailWrap.classList.remove('hidden');
        });
    }
    if (emailVerify) {
        emailVerify.addEventListener('click', () => {
            const ok = verifyOTP('email', emailCode?.value, 'company');
            if (ok && emailBadge) { emailBadge.classList.remove('hidden'); }
            else if (!ok) showRegError('Invalid code');
        });
    }
    const mobileSend = document.getElementById('reg-otp-mobile-send');
    const mobileWrap = document.getElementById('reg-otp-mobile-verify-wrap');
    const mobileCode = document.getElementById('reg-otp-mobile-code');
    const mobileDisplay = document.getElementById('reg-otp-mobile-display');
    const mobileVerify = document.getElementById('reg-otp-mobile-verify');
    const mobileBadge = document.getElementById('reg-mobile-verified-badge');
    if (mobileSend) {
        mobileSend.addEventListener('click', () => {
            const code = requestOTP('mobile', 'company');
            if (mobileDisplay) mobileDisplay.textContent = 'Code: ' + code;
            if (mobileWrap) mobileWrap.classList.remove('hidden');
        });
    }
    if (mobileVerify) {
        mobileVerify.addEventListener('click', () => {
            const ok = verifyOTP('mobile', mobileCode?.value, 'company');
            if (ok && mobileBadge) { mobileBadge.classList.remove('hidden'); }
            else if (!ok) showRegError('Invalid code');
        });
    }
}

function setupOTPIndividual() {
    const emailSend = document.getElementById('reg-otp-ind-email-send');
    const emailWrap = document.getElementById('reg-otp-ind-email-verify-wrap');
    const emailCode = document.getElementById('reg-otp-ind-email-code');
    const emailDisplay = document.getElementById('reg-otp-ind-email-display');
    const emailVerify = document.getElementById('reg-otp-ind-email-verify');
    const emailBadge = document.getElementById('reg-ind-email-verified-badge');
    if (emailSend) {
        emailSend.addEventListener('click', () => {
            const code = requestOTP('email', 'individual');
            if (emailDisplay) emailDisplay.textContent = 'Code: ' + code;
            if (emailWrap) emailWrap.classList.remove('hidden');
        });
    }
    if (emailVerify) {
        emailVerify.addEventListener('click', () => {
            const ok = verifyOTP('email', emailCode?.value, 'individual');
            if (ok && emailBadge) { emailBadge.classList.remove('hidden'); }
            else if (!ok) showRegError('Invalid code');
        });
    }
    const mobileSend = document.getElementById('reg-otp-ind-mobile-send');
    const mobileWrap = document.getElementById('reg-otp-ind-mobile-verify-wrap');
    const mobileCode = document.getElementById('reg-otp-ind-mobile-code');
    const mobileDisplay = document.getElementById('reg-otp-ind-mobile-display');
    const mobileVerify = document.getElementById('reg-otp-ind-mobile-verify');
    const mobileBadge = document.getElementById('reg-ind-mobile-verified-badge');
    if (mobileSend) {
        mobileSend.addEventListener('click', () => {
            const code = requestOTP('mobile', 'individual');
            if (mobileDisplay) mobileDisplay.textContent = 'Code: ' + code;
            if (mobileWrap) mobileWrap.classList.remove('hidden');
        });
    }
    if (mobileVerify) {
        mobileVerify.addEventListener('click', () => {
            const ok = verifyOTP('mobile', mobileCode?.value, 'individual');
            if (ok && mobileBadge) { mobileBadge.classList.remove('hidden'); }
            else if (!ok) showRegError('Invalid code');
        });
    }
}

function initRegister() {
    regState = {
        accountType: null,
        currentStep: 0,
        companyRole: null,
        companySubType: null,
        companyName: '',
        website: '',
        industry: '',
        companySize: '',
        companyDescription: '',
        crNumber: '',
        taxId: '',
        authorizedRepresentative: { name: '', role: '' },
        email: '',
        mobile: '',
        address: { country: '', region: '', city: '' },
        password: '',
        emailVerified: false,
        mobileVerified: false,
        documents: [],
        termsAccepted: false,
        individualType: null,
        fullName: '',
        specialty: '',
        expertise: '',
        currentRole: '',
        yearsExperience: '',
        skills: '',
        languages: '',
        linkedin: '',
        preferredCollaborationModels: [],
        vettingSkippedAtRegistration: null,
        primaryDomain: null,
        expertiseAreas: []
    };
    otpCodes = { email: null, mobile: null, indEmail: null, indMobile: null };

    loadRegData().then(() => {
        const roles = lookupsData?.companyRoles || [];
        const roleSelect = document.getElementById('reg-company-role');
        if (roleSelect) {
            roleSelect.innerHTML = '<option value="">Select role</option>';
            roles.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.id;
                opt.textContent = r.label;
                roleSelect.appendChild(opt);
            });
        }
        const industrySelect = document.getElementById('reg-company-industry');
        if (industrySelect) {
            industrySelect.innerHTML = '<option value="">Select industry</option>';
            const categories = lookupsData?.jobCategories || [];
            categories.forEach(c => {
                const id = typeof c === 'string' ? c : (c.id || c.label);
                const label = typeof c === 'string' ? c : (c.label || c.id);
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = label;
                industrySelect.appendChild(opt);
            });
        }
        const sizeSelect = document.getElementById('reg-company-size');
        if (sizeSelect) {
            sizeSelect.innerHTML = '<option value="">Select size</option>';
            const sizes = lookupsData?.companySizes || [];
            sizes.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.label;
                sizeSelect.appendChild(opt);
            });
        }
        const subtypeWrap = document.getElementById('reg-company-subtype-wrap');
        const subtypeSelect = document.getElementById('reg-company-subtype');
        if (roleSelect) {
            roleSelect.addEventListener('change', () => {
                const role = roleSelect.value;
                const subTypes = lookupsData?.companyRoleSubTypes?.[role];
                if (subTypes && subTypes.length) {
                    subtypeWrap.classList.remove('hidden');
                    subtypeSelect.innerHTML = '<option value="">Select sub-type</option>';
                    subTypes.forEach(s => {
                        const o = document.createElement('option');
                        o.value = s.id;
                        o.textContent = s.label;
                        subtypeSelect.appendChild(o);
                    });
                } else {
                    subtypeWrap.classList.add('hidden');
                    subtypeSelect.innerHTML = '<option value="">Select sub-type</option>';
                }
            });
        }
        setupLocationDropdowns('company');
        setupLocationDropdowns('individual');
        setupOTPCompany();
        setupOTPIndividual();
    });

    document.querySelectorAll('input[name="accountType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            regState.accountType = document.querySelector('input[name="accountType"]:checked')?.value || null;
            const btn = document.getElementById('reg-btn-continue');
            if (btn) btn.disabled = !regState.accountType;
            const hint = document.getElementById('reg-continue-hint');
            if (hint) hint.classList.toggle('hidden', !!regState.accountType);
        });
    });
    document.querySelectorAll('input[name="individualType"]').forEach(radio => {
        radio.addEventListener('change', () => { updateRegB1CTAState(); });
    });
    const continueHint = document.getElementById('reg-continue-hint');
    if (continueHint) continueHint.classList.remove('hidden');

    document.getElementById('reg-fill-demo')?.addEventListener('click', (e) => {
        e.preventDefault();
        fillRegDemoData();
    });

    document.getElementById('reg-btn-continue')?.addEventListener('click', () => {
        regState.accountType = document.querySelector('input[name="accountType"]:checked')?.value || null;
        if (!regState.accountType) return;
        // Step 0 only sets company | individual; individual type (professional/consultant) is chosen on B1
        regState.currentStep = 1;
        document.getElementById('reg-wizard-progress')?.classList.remove('hidden');
        goToRegStep(1);
    });

    document.getElementById('reg-btn-back-a1')?.addEventListener('click', () => goToRegStep(0));
    document.getElementById('reg-btn-next-a1')?.addEventListener('click', () => {
        if (!validateRegStep(1)) return;
        regState.companyRole = document.getElementById('reg-company-role')?.value;
        regState.companySubType = document.getElementById('reg-company-subtype')?.value;
        renderCompanyDocuments();
        goToRegStep(2);
    });
    document.getElementById('reg-btn-back-a2')?.addEventListener('click', () => goToRegStep(1));
    document.getElementById('reg-btn-next-a2')?.addEventListener('click', () => {
        if (!validateRegStep(2)) return;
        goToRegStep(3);
    });
    document.getElementById('reg-btn-back-a3')?.addEventListener('click', () => goToRegStep(2));
    document.getElementById('reg-btn-next-a3')?.addEventListener('click', () => {
        regState.termsAccepted = document.getElementById('reg-terms-company')?.checked;
        if (!validateRegStep(3)) return;
        renderReviewCompany();
        goToRegStep(4);
    });
    document.getElementById('reg-btn-back-a4')?.addEventListener('click', () => goToRegStep(3));
    document.getElementById('reg-btn-next-a4')?.addEventListener('click', () => {
        syncRegStateFromForm();
        const companyPrefEl = document.getElementById('reg-company-preferred-models');
        if (companyPrefEl) regState.preferredCollaborationModels = Array.from(companyPrefEl.querySelectorAll('input:checked')).map(cb => cb.value);
        goToRegStep(5);
    });
    document.getElementById('reg-btn-back-a5')?.addEventListener('click', () => goToRegStep(4));
    document.querySelectorAll('input[name="reg-vetting-choice"]').forEach(radio => {
        radio.addEventListener('change', () => {
            regState.vettingSkippedAtRegistration = document.querySelector('input[name="reg-vetting-choice"]:checked')?.value === 'skip';
            const form = document.getElementById('reg-vetting-form-company');
            if (form) form.style.display = regState.vettingSkippedAtRegistration === false ? 'block' : 'none';
        });
    });
    document.getElementById('reg-vetting-add-expertise-company')?.addEventListener('click', () => addRegExpertiseRow('company'));
    document.getElementById('reg-btn-submit-company')?.addEventListener('click', () => {
        const choice = document.querySelector('input[name="reg-vetting-choice"]:checked')?.value;
        if (choice === 'skip' || !choice) regState.vettingSkippedAtRegistration = true;
        else if (choice === 'complete') {
            regState.vettingSkippedAtRegistration = false;
            collectRegVettingFromForm('company');
        }
        submitCompany();
    });

    document.getElementById('reg-btn-back-b1')?.addEventListener('click', () => goToRegStep(0));
    document.getElementById('reg-btn-next-b1')?.addEventListener('click', () => {
        if (!validateRegStep(1)) return;
        regState.individualType = document.querySelector('input[name="individualType"]:checked')?.value;
        regState.accountType = regState.individualType; // so rest of flow sees professional/consultant
        goToRegStep(2);
    });
    document.getElementById('reg-btn-back-b2')?.addEventListener('click', () => goToRegStep(1));
    document.getElementById('reg-btn-next-b2')?.addEventListener('click', () => {
        if (!validateRegStep(2)) return;
        renderIndividualDocuments();
        goToRegStep(3);
    });
    document.getElementById('reg-btn-back-b3')?.addEventListener('click', () => goToRegStep(2));
    document.getElementById('reg-btn-next-b3')?.addEventListener('click', () => {
        regState.termsAccepted = document.getElementById('reg-terms-individual')?.checked;
        if (!validateRegStep(3)) return;
        renderReviewIndividual();
        goToRegStep(4);
    });
    document.getElementById('reg-btn-back-b4')?.addEventListener('click', () => goToRegStep(3));
    document.getElementById('reg-btn-next-b4')?.addEventListener('click', () => {
        syncRegStateFromForm();
        const indPrefEl = document.getElementById('reg-individual-preferred-models');
        if (indPrefEl) regState.preferredCollaborationModels = Array.from(indPrefEl.querySelectorAll('input:checked')).map(cb => cb.value);
        goToRegStep(5);
    });
    document.getElementById('reg-btn-back-b5')?.addEventListener('click', () => goToRegStep(4));
    document.querySelectorAll('input[name="reg-vetting-choice-ind"]').forEach(radio => {
        radio.addEventListener('change', () => {
            regState.vettingSkippedAtRegistration = document.querySelector('input[name="reg-vetting-choice-ind"]:checked')?.value === 'skip';
            const form = document.getElementById('reg-vetting-form-individual');
            if (form) form.style.display = regState.vettingSkippedAtRegistration === false ? 'block' : 'none';
        });
    });
    document.getElementById('reg-vetting-add-expertise-individual')?.addEventListener('click', () => addRegExpertiseRow('individual'));
    document.getElementById('reg-btn-submit-individual')?.addEventListener('click', () => {
        const choice = document.querySelector('input[name="reg-vetting-choice-ind"]:checked')?.value;
        if (choice === 'skip' || !choice) regState.vettingSkippedAtRegistration = true;
        else if (choice === 'complete') {
            regState.vettingSkippedAtRegistration = false;
            collectRegVettingFromForm('individual');
            if (!regState.primaryDomain && (!regState.expertiseAreas || regState.expertiseAreas.length === 0)) {
                showRegError('Please select at least primary domain or one expertise area when completing vetting now.');
                return;
            }
        }
        submitIndividual();
    });

    const termsModal = document.getElementById('reg-terms-modal');
    const openTermsModal = (e) => { e.preventDefault(); if (termsModal) termsModal.classList.remove('hidden'); };
    const closeTermsModal = () => { if (termsModal) termsModal.classList.add('hidden'); };
    document.getElementById('reg-terms-link-company')?.addEventListener('click', openTermsModal);
    document.getElementById('reg-terms-link-individual')?.addEventListener('click', openTermsModal);
    document.getElementById('reg-terms-modal-close')?.addEventListener('click', closeTermsModal);
    document.getElementById('reg-terms-modal-close-btn')?.addEventListener('click', closeTermsModal);
    termsModal?.addEventListener('click', (e) => { if (e.target === termsModal) closeTermsModal(); });

    document.querySelector('.register-page')?.addEventListener('input', (e) => {
        const id = e.target.id;
        if (id && document.getElementById('reg-error-' + id)) {
            clearRegFieldError(id);
            const errEl = document.getElementById('register-error');
            if (errEl) errEl.style.display = 'none';
        }
    });
    document.querySelector('.register-page')?.addEventListener('change', (e) => {
        const id = e.target.id;
        if (id && document.getElementById('reg-error-' + id)) {
            clearRegFieldError(id);
            const errEl = document.getElementById('register-error');
            if (errEl) errEl.style.display = 'none';
        }
    });

    showRegStep('reg-step-0');
    updateRegProgress();
}
