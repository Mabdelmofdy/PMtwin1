/**
 * Profile Component
 * Matches BRD Flow 7: View current profile → Edit → Save → Profile updated (matching recalculated)
 */

const BASE_PATH = (window.CONFIG && window.CONFIG.BASE_PATH) || '';
let profileLookups = null;

async function loadProfileLookups() {
    if (profileLookups) return profileLookups;
    try {
        const storage = typeof storageService !== 'undefined' ? storageService : (window.storageService || null);
        const overrideKey = typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS && CONFIG.STORAGE_KEYS.LOOKUPS_OVERRIDE;
        if (storage && overrideKey) {
            const override = storage.get(overrideKey);
            if (override && typeof override === 'object') {
                profileLookups = override;
                return profileLookups;
            }
        }
        const res = await fetch(BASE_PATH + 'data/lookups.json');
        profileLookups = await res.json();
        return profileLookups;
    } catch (e) {
        console.warn('Failed to load lookups for profile', e);
        return {};
    }
}

function parseArray(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    return [];
}

function formatArray(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return '—';
    return arr.join(', ');
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/** Social media icon SVGs (24x24, currentColor). */
const SOCIAL_ICONS = {
    linkedin: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    twitter: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    facebook: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    instagram: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.441 1.441 1.441 1.441-.646 1.441-1.441-.645-1.44-1.441-1.44z"/></svg>'
};
const SOCIAL_LABELS = { linkedin: 'LinkedIn', twitter: 'Twitter', facebook: 'Facebook', instagram: 'Instagram' };

function getSocialIconsHtml(sm) {
    if (!sm) return '—';
    const items = [
        { key: 'linkedin', url: sm.linkedin },
        { key: 'twitter', url: sm.twitter },
        { key: 'facebook', url: sm.facebook },
        { key: 'instagram', url: sm.instagram }
    ].filter(x => x.url);
    if (items.length === 0) return '—';
    return '<div class="social-icons flex flex-wrap gap-3 items-center">' + items.map(item =>
        `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" class="social-icon-link text-gray-600 hover:text-primary" title="${escapeHtml(SOCIAL_LABELS[item.key])}">${SOCIAL_ICONS[item.key]}</a>`
    ).join('') + '</div>';
}

function renderCaseStudiesList(containerId, cases) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    (cases || []).forEach((c, i) => {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap gap-2 items-start border border-gray-200 rounded p-2 case-study-row';
        row.innerHTML = `
            <input type="text" class="case-study-title form-input flex-1 min-w-[120px]" placeholder="Title" value="${escapeHtml(c.title || '')}">
            <input type="url" class="case-study-url form-input flex-1 min-w-[120px]" placeholder="URL" value="${escapeHtml(c.url || '')}">
            <textarea class="case-study-desc form-input flex-1 min-w-[180px]" rows="1" placeholder="Description">${escapeHtml(c.description || '')}</textarea>
            <button type="button" class="case-study-remove btn btn-ghost btn-sm">Remove</button>
        `;
        row.querySelector('.case-study-remove').addEventListener('click', () => row.remove());
        container.appendChild(row);
    });
}

function setupCaseStudyAddButton(btnId, listId) {
    const btn = document.getElementById(btnId);
    const list = document.getElementById(listId);
    if (!btn || !list) return;
    btn.onclick = () => {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap gap-2 items-start border border-gray-200 rounded p-2 case-study-row';
        row.innerHTML = `
            <input type="text" class="case-study-title form-input flex-1 min-w-[120px]" placeholder="Title">
            <input type="url" class="case-study-url form-input flex-1 min-w-[120px]" placeholder="URL">
            <textarea class="case-study-desc form-input flex-1 min-w-[180px]" rows="1" placeholder="Description"></textarea>
            <button type="button" class="case-study-remove btn btn-ghost btn-sm">Remove</button>
        `;
        row.querySelector('.case-study-remove').addEventListener('click', () => row.remove());
        list.appendChild(row);
    };
}

function collectCaseStudiesFromList(listId) {
    const list = document.getElementById(listId);
    if (!list) return [];
    return Array.from(list.querySelectorAll('.case-study-row')).map(row => ({
        title: row.querySelector('.case-study-title')?.value?.trim() || null,
        url: row.querySelector('.case-study-url')?.value?.trim() || null,
        description: row.querySelector('.case-study-desc')?.value?.trim() || null,
        createdAt: new Date().toISOString()
    })).filter(c => c.title || c.url || c.description);
}

function renderPortfolioList(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    (items || []).forEach((p) => {
        const row = document.createElement('div');
        row.className = 'border border-gray-200 rounded p-3 portfolio-row';
        row.innerHTML = `
            <input type="text" class="portfolio-title form-input w-full mb-2" placeholder="Project title" value="${escapeHtml(p.projectTitle || '')}">
            <textarea class="portfolio-description form-input w-full mb-2" rows="2" placeholder="Description">${escapeHtml(p.description || '')}</textarea>
            <input type="text" class="portfolio-role form-input w-full mb-2" placeholder="Your role" value="${escapeHtml(p.role || '')}">
            <textarea class="portfolio-results form-input w-full mb-2" rows="1" placeholder="Results">${escapeHtml(p.results || '')}</textarea>
            <input type="url" class="portfolio-link form-input w-full mb-2" placeholder="Media/link URL (optional)" value="${escapeHtml((p.mediaAttachments && p.mediaAttachments[0]) ? (p.mediaAttachments[0].url || '') : '')}">
            <button type="button" class="portfolio-remove btn btn-ghost btn-sm">Remove</button>
        `;
        row.querySelector('.portfolio-remove').addEventListener('click', () => row.remove());
        container.appendChild(row);
    });
}

function collectPortfolioFromList(listId) {
    const list = document.getElementById(listId);
    if (!list) return [];
    return Array.from(list.querySelectorAll('.portfolio-row')).map(row => {
        const title = row.querySelector('.portfolio-title')?.value?.trim();
        const description = row.querySelector('.portfolio-description')?.value?.trim();
        const role = row.querySelector('.portfolio-role')?.value?.trim();
        const results = row.querySelector('.portfolio-results')?.value?.trim();
        const url = row.querySelector('.portfolio-link')?.value?.trim();
        if (!title && !description && !role && !results) return null;
        return {
            projectTitle: title || null,
            description: description || null,
            role: role || null,
            results: results || null,
            mediaAttachments: url ? [{ url }] : []
        };
    }).filter(Boolean);
}

function setupPortfolioAddButton(btnId, listId) {
    const btn = document.getElementById(btnId);
    const list = document.getElementById(listId);
    if (!btn || !list) return;
    btn.onclick = () => {
        const row = document.createElement('div');
        row.className = 'border border-gray-200 rounded p-3 portfolio-row';
        row.innerHTML = `
            <input type="text" class="portfolio-title form-input w-full mb-2" placeholder="Project title">
            <textarea class="portfolio-description form-input w-full mb-2" rows="2" placeholder="Description"></textarea>
            <input type="text" class="portfolio-role form-input w-full mb-2" placeholder="Your role">
            <textarea class="portfolio-results form-input w-full mb-2" rows="1" placeholder="Results"></textarea>
            <input type="url" class="portfolio-link form-input w-full mb-2" placeholder="Media/link URL (optional)">
            <button type="button" class="portfolio-remove btn btn-ghost btn-sm">Remove</button>
        `;
        row.querySelector('.portfolio-remove').addEventListener('click', () => row.remove());
        list.appendChild(row);
    };
}

function renderReferencesList(containerId, refs) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    (refs || []).forEach((r, i) => {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap gap-2 items-start border border-gray-200 rounded p-2 reference-row';
        row.innerHTML = `
            <input type="text" class="ref-name form-input flex-1 min-w-[100px]" placeholder="Reference name" value="${escapeHtml(r.name || '')}">
            <input type="text" class="ref-company form-input flex-1 min-w-[100px]" placeholder="Company" value="${escapeHtml(r.company || '')}">
            <input type="text" class="ref-relationship form-input flex-1 min-w-[100px]" placeholder="Relationship" value="${escapeHtml(r.relationship || r.role || '')}">
            <input type="text" class="ref-contact form-input flex-1 min-w-[120px]" placeholder="Contact (optional)" value="${escapeHtml(r.contact || '')}">
            <textarea class="ref-text form-input flex-1 min-w-[180px]" rows="2" placeholder="Testimonial">${escapeHtml(r.text || r.testimonial || '')}</textarea>
            <button type="button" class="ref-remove btn btn-ghost btn-sm">Remove</button>
        `;
        row.querySelector('.ref-remove').addEventListener('click', () => row.remove());
        container.appendChild(row);
    });
}

function setupReferenceAddButton(btnId, listId) {
    const btn = document.getElementById(btnId);
    const list = document.getElementById(listId);
    if (!btn || !list) return;
    btn.onclick = () => {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap gap-2 items-start border border-gray-200 rounded p-2 reference-row';
        row.innerHTML = `
            <input type="text" class="ref-name form-input flex-1 min-w-[100px]" placeholder="Reference name">
            <input type="text" class="ref-company form-input flex-1 min-w-[100px]" placeholder="Company">
            <input type="text" class="ref-relationship form-input flex-1 min-w-[100px]" placeholder="Relationship">
            <input type="text" class="ref-contact form-input flex-1 min-w-[120px]" placeholder="Contact (optional)">
            <textarea class="ref-text form-input flex-1 min-w-[180px]" rows="2" placeholder="Testimonial"></textarea>
            <button type="button" class="ref-remove btn btn-ghost btn-sm">Remove</button>
        `;
        row.querySelector('.ref-remove').addEventListener('click', () => row.remove());
        list.appendChild(row);
    };
}

function collectReferencesFromList(listId) {
    const list = document.getElementById(listId);
    if (!list) return [];
    return Array.from(list.querySelectorAll('.reference-row')).map(row => ({
        name: row.querySelector('.ref-name')?.value?.trim() || null,
        company: row.querySelector('.ref-company')?.value?.trim() || null,
        relationship: row.querySelector('.ref-relationship')?.value?.trim() || null,
        role: row.querySelector('.ref-relationship')?.value?.trim() || null,
        contact: row.querySelector('.ref-contact')?.value?.trim() || null,
        text: row.querySelector('.ref-text')?.value?.trim() || null,
        testimonial: row.querySelector('.ref-text')?.value?.trim() || null,
        createdAt: new Date().toISOString()
    })).filter(r => r.name || r.company || r.relationship || r.contact || r.text);
}

function getProfileDomainsList() {
    const cats = profileLookups?.jobCategories || [];
    return cats.map(c => (typeof c === 'string' ? { id: c, label: c } : { id: c.id || c, label: c.label || c.id || c }));
}

function getProfessionalFieldsList() {
    const fields = profileLookups?.professionalFields || [];
    return fields.map(f => (typeof f === 'string' ? { id: f, label: f } : { id: f.id || f, label: f.label || f.id || f }));
}

function getExperienceLevelsList() {
    const levels = profileLookups?.experienceLevels || [];
    return Array.isArray(levels) ? levels : [];
}

function renderProfessionalFieldsList(containerId, fields) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const fieldList = getProfessionalFieldsList();
    const levels = getExperienceLevelsList();
    const levelOpts = levels.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join('');
    (fields || []).forEach((pf) => {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap gap-2 items-center border border-gray-200 rounded p-2 professional-field-row';
        const fieldOpts = fieldList.map(f => `<option value="${escapeHtml(f.id)}" ${pf.fieldId === f.id ? 'selected' : ''}>${escapeHtml(f.label)}</option>`).join('');
        row.innerHTML = `
            <select class="pf-field form-input flex-1 min-w-[140px]">
                <option value="">Select field</option>${fieldOpts}
            </select>
            <label class="inline-flex items-center gap-1"><input type="checkbox" class="pf-primary" ${pf.isPrimary ? 'checked' : ''}> Primary</label>
            <select class="pf-level form-input min-w-[120px]">
                <option value="professional" ${pf.level === 'professional' ? 'selected' : ''}>Professional</option>
                <option value="consultant" ${pf.level === 'consultant' ? 'selected' : ''}>Consultant</option>
            </select>
            <select class="pf-experience form-input min-w-[100px]">
                <option value="">Level</option>${levelOpts}
            </select>
            <button type="button" class="pf-remove btn btn-ghost btn-sm">Remove</button>
        `;
        const expSelect = row.querySelector('.pf-experience');
        if (expSelect && pf.experienceLevel) expSelect.value = pf.experienceLevel;
        row.querySelector('.pf-remove').addEventListener('click', () => row.remove());
        container.appendChild(row);
    });
}

function collectProfessionalFieldsFromList(listId) {
    const list = document.getElementById(listId);
    if (!list) return [];
    const fieldList = getProfessionalFieldsList();
    const rows = list.querySelectorAll('.professional-field-row');
    const collected = Array.from(rows).map(row => {
        const fieldId = row.querySelector('.pf-field')?.value?.trim();
        if (!fieldId) return null;
        const label = fieldList.find(f => f.id === fieldId)?.label;
        return {
            fieldId,
            label: label || fieldId,
            isPrimary: row.querySelector('.pf-primary')?.checked === true,
            level: row.querySelector('.pf-level')?.value || 'professional',
            experienceLevel: row.querySelector('.pf-experience')?.value || null
        };
    }).filter(Boolean);
    if (collected.length > 0 && !collected.some(p => p.isPrimary)) collected[0].isPrimary = true;
    return collected;
}

function normalizeCertifications(certs) {
    if (!certs) return [];
    if (Array.isArray(certs)) {
        return certs.map(c => typeof c === 'object' && c !== null && ('name' in c || 'url' in c || 'fileRef' in c)
            ? { name: c.name || null, type: c.type || null, url: c.url || null, fileRef: c.fileRef || null }
            : { name: typeof c === 'string' ? c : null, type: null, url: null, fileRef: null });
    }
    if (typeof certs === 'string') return parseArray(certs).map(s => ({ name: s, type: null, url: null, fileRef: null }));
    return [];
}

function renderCertificationsList(containerId, certs) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const normalized = normalizeCertifications(certs);
    normalized.forEach((cert) => {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap gap-2 items-center border border-gray-200 rounded p-2 certification-row';
        row.innerHTML = `
            <select class="cert-type form-input min-w-[110px]">
                <option value="">Type</option>
                <option value="certificate" ${cert.type === 'certificate' ? 'selected' : ''}>Certificate</option>
                <option value="degree" ${cert.type === 'degree' ? 'selected' : ''}>Degree</option>
                <option value="license" ${cert.type === 'license' ? 'selected' : ''}>License</option>
            </select>
            <input type="text" class="cert-name form-input flex-1 min-w-[120px]" placeholder="Name" value="${escapeHtml(cert.name || '')}">
            <input type="url" class="cert-url form-input flex-1 min-w-[140px]" placeholder="URL (optional)" value="${escapeHtml(cert.url || '')}">
            <input type="file" class="cert-file form-input min-w-[120px]" accept=".pdf,.jpg,.jpeg,.png" title="Optional file (POC: stored in browser)">
            <button type="button" class="cert-remove btn btn-ghost btn-sm">Remove</button>
        `;
        row.querySelector('.cert-remove').addEventListener('click', () => row.remove());
        if (cert.fileRef) row.dataset.fileRef = cert.fileRef;
        container.appendChild(row);
    });
}

async function collectCertificationsFromList(listId) {
    const list = document.getElementById(listId);
    if (!list) return [];
    const promises = Array.from(list.querySelectorAll('.certification-row')).map(row => {
        const name = row.querySelector('.cert-name')?.value?.trim();
        const type = row.querySelector('.cert-type')?.value?.trim() || null;
        const url = row.querySelector('.cert-url')?.value?.trim() || null;
        const fileRef = row.dataset.fileRef || null;
        const fileInput = row.querySelector('.cert-file');
        if (fileInput?.files?.[0] && !fileRef) {
            return new Promise((resolve) => {
                const r = new FileReader();
                r.onload = () => resolve({ name: name || null, type, url, fileRef: r.result });
                r.readAsDataURL(fileInput.files[0]);
            });
        }
        return Promise.resolve((name || url || fileRef) ? { name: name || null, type, url, fileRef } : null);
    });
    const results = await Promise.all(promises);
    return results.filter(Boolean);
}

function setupCertificationsAddButton(btnId, listId) {
    const btn = document.getElementById(btnId);
    const list = document.getElementById(listId);
    if (!btn || !list) return;
    btn.onclick = () => {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap gap-2 items-center border border-gray-200 rounded p-2 certification-row';
        row.innerHTML = `
            <select class="cert-type form-input min-w-[110px]">
                <option value="">Type</option>
                <option value="certificate">Certificate</option>
                <option value="degree">Degree</option>
                <option value="license">License</option>
            </select>
            <input type="text" class="cert-name form-input flex-1 min-w-[120px]" placeholder="Name">
            <input type="url" class="cert-url form-input flex-1 min-w-[140px]" placeholder="URL (optional)">
            <input type="file" class="cert-file form-input min-w-[120px]" accept=".pdf,.jpg,.jpeg,.png" title="Optional file">
            <button type="button" class="cert-remove btn btn-ghost btn-sm">Remove</button>
        `;
        row.querySelector('.cert-remove').addEventListener('click', () => row.remove());
        list.appendChild(row);
    };
}

function renderVettingCaseStudyDocuments(containerId, documents) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const docs = Array.isArray(documents) ? documents : [];
    docs.forEach((doc) => {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap gap-2 items-center border border-gray-200 rounded p-2 vc-doc-row';
        row.innerHTML = `
            <input type="text" class="vc-doc-name form-input flex-1 min-w-[120px]" placeholder="File name" value="${escapeHtml(doc.name || '')}">
            <input type="file" class="vc-doc-file form-input min-w-[140px]" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
            <span class="vc-doc-current text-sm text-gray-500">${doc.name ? doc.name + ((doc.url || doc.fileRef) ? ' (saved)' : '') : ''}</span>
            <button type="button" class="vc-doc-remove btn btn-ghost btn-sm">Remove</button>
        `;
        if (doc.url || doc.fileRef) row.dataset.fileRef = doc.url || doc.fileRef;
        row.querySelector('.vc-doc-remove').addEventListener('click', () => row.remove());
        container.appendChild(row);
    });
}

function setupVettingCaseStudyDocumentsAddButton(btnId, listId) {
    const btn = document.getElementById(btnId);
    const list = document.getElementById(listId);
    if (!btn || !list) return;
    btn.onclick = () => {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap gap-2 items-center border border-gray-200 rounded p-2 vc-doc-row';
        row.innerHTML = `
            <input type="text" class="vc-doc-name form-input flex-1 min-w-[120px]" placeholder="File name">
            <input type="file" class="vc-doc-file form-input min-w-[140px]" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
            <span class="vc-doc-current text-sm text-gray-500"></span>
            <button type="button" class="vc-doc-remove btn btn-ghost btn-sm">Remove</button>
        `;
        row.querySelector('.vc-doc-remove').addEventListener('click', () => row.remove());
        list.appendChild(row);
    };
}

async function collectVettingCaseStudyDocuments(listId) {
    const list = document.getElementById(listId);
    if (!list) return [];
    const rows = list.querySelectorAll('.vc-doc-row');
    const promises = Array.from(rows).map(row => {
        const name = row.querySelector('.vc-doc-name')?.value?.trim() || null;
        const fileRef = row.dataset.fileRef || null;
        const fileInput = row.querySelector('.vc-doc-file');
        if (fileInput?.files?.[0] && !fileRef) {
            return new Promise((resolve) => {
                const r = new FileReader();
                r.onload = () => resolve({ name: name || fileInput.files[0].name, url: r.result, fileRef: r.result });
                r.readAsDataURL(fileInput.files[0]);
            });
        }
        return Promise.resolve((name || fileRef) ? { name: name || null, url: fileRef || null, fileRef: fileRef || null } : null);
    });
    const results = await Promise.all(promises);
    return results.filter(Boolean);
}

function setupProfessionalFieldsAddButton(btnId, listId) {
    const btn = document.getElementById(btnId);
    const list = document.getElementById(listId);
    if (!btn || !list) return;
    btn.onclick = () => {
        const fieldList = getProfessionalFieldsList();
        const levels = getExperienceLevelsList();
        const levelOpts = levels.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join('');
        const row = document.createElement('div');
        row.className = 'flex flex-wrap gap-2 items-center border border-gray-200 rounded p-2 professional-field-row';
        const fieldOpts = fieldList.map(f => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.label)}</option>`).join('');
        row.innerHTML = `
            <select class="pf-field form-input flex-1 min-w-[140px]">
                <option value="">Select field</option>${fieldOpts}
            </select>
            <label class="inline-flex items-center gap-1"><input type="checkbox" class="pf-primary"> Primary</label>
            <select class="pf-level form-input min-w-[120px]">
                <option value="professional">Professional</option>
                <option value="consultant">Consultant</option>
            </select>
            <select class="pf-experience form-input min-w-[100px]">
                <option value="">Level</option>${levelOpts}
            </select>
            <button type="button" class="pf-remove btn btn-ghost btn-sm">Remove</button>
        `;
        row.querySelector('.pf-remove').addEventListener('click', () => row.remove());
        list.appendChild(row);
    };
}

function renderExpertiseAreasList(containerId, areas) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const domains = getProfileDomainsList();
    container.innerHTML = '';
    (areas || []).forEach((ea, i) => {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap gap-2 items-center mb-2 expertise-area-row';
        const domainSelect = document.createElement('select');
        domainSelect.className = 'expertise-domain form-input flex-1 min-w-[120px]';
        domainSelect.innerHTML = '<option value="">Domain</option>';
        domains.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.label;
            if (ea.domain === d.id) opt.selected = true;
            domainSelect.appendChild(opt);
        });
        const roleSelect = document.createElement('select');
        roleSelect.className = 'expertise-role form-input min-w-[120px]';
        roleSelect.innerHTML = '<option value="professional">Professional</option><option value="consultant">Consultant</option>';
        roleSelect.value = ea.role || 'professional';
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-ghost btn-sm';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => row.remove());
        row.appendChild(domainSelect);
        row.appendChild(roleSelect);
        row.appendChild(removeBtn);
        container.appendChild(row);
    });
}

function setupExpertiseAddButton(btnId, listId) {
    const btn = document.getElementById(btnId);
    const list = document.getElementById(listId);
    if (!btn || !list) return;
    btn.onclick = () => {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap gap-2 items-center mb-2 expertise-area-row';
        const domains = getProfileDomainsList();
        const domainSelect = document.createElement('select');
        domainSelect.className = 'expertise-domain form-input flex-1 min-w-[120px]';
        domainSelect.innerHTML = '<option value="">Domain</option>';
        domains.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.label;
            domainSelect.appendChild(opt);
        });
        const roleSelect = document.createElement('select');
        roleSelect.className = 'expertise-role form-input min-w-[120px]';
        roleSelect.innerHTML = '<option value="professional">Professional</option><option value="consultant">Consultant</option>';
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-ghost btn-sm';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => row.remove());
        row.appendChild(domainSelect);
        row.appendChild(roleSelect);
        row.appendChild(removeBtn);
        list.appendChild(row);
    };
}

function collectExpertiseAreasFromList(listId) {
    const list = document.getElementById(listId);
    if (!list) return [];
    return Array.from(list.querySelectorAll('.expertise-area-row')).map(row => ({
        domain: row.querySelector('.expertise-domain')?.value?.trim() || null,
        role: row.querySelector('.expertise-role')?.value || 'professional'
    })).filter(ea => ea.domain);
}

function getPreferredCollaborationModelsList() {
    if (profileLookups?.preferredCollaborationLabels?.length) {
        return profileLookups.preferredCollaborationLabels.map(m => ({ id: m.id, label: m.label || m.id }));
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

function getPreferredModelsLabel(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return '—';
    const list = getPreferredCollaborationModelsList();
    return ids.map(id => list.find(m => m.id === id)?.label || id).join(', ');
}

/** Return HTML for verification badge (Verified Professional / Consultant / Company) or empty string. */
function getVerificationBadgeHtml(verificationStatus) {
    if (!verificationStatus || verificationStatus === CONFIG.VERIFICATION_STATUS.UNVERIFIED) return '';
    if (verificationStatus === CONFIG.VERIFICATION_STATUS.PROFESSIONAL_VERIFIED) return '<span class="badge badge-success verification-badge">Verified Professional</span>';
    if (verificationStatus === CONFIG.VERIFICATION_STATUS.CONSULTANT_VERIFIED) return '<span class="badge badge-success verification-badge">Verified Consultant</span>';
    if (verificationStatus === CONFIG.VERIFICATION_STATUS.COMPANY_VERIFIED) return '<span class="badge badge-success verification-badge">Verified Company</span>';
    return '';
}

async function initProfile() {
    const user = authService.getCurrentUser();
    if (!user) {
        router.navigate(CONFIG.ROUTES.LOGIN);
        return;
    }
    await loadProfileLookups();
    await loadProfile(user);
    await loadProfileStats(user.id);
    await loadCompanyAffiliation(user);
    await loadReputation(user.id);
    await loadReviewsReceived(user.id);
    await loadTeamMembers(user);
    loadMatchingPreferences(user);
    setupMatchingPreferencesSave();
    setupSkillAutocomplete();

    // Read-only demo: disable profile edits for pending users
    if (authService.isPendingApproval && authService.isPendingApproval()) {
        const msg = 'Action disabled until your account is approved.';
        document.querySelectorAll('#matching-preferences-save, #company-profile-edit-btn, #professional-profile-edit-btn, #team-add-member-btn').forEach(el => {
            if (el) {
                el.disabled = true;
                el.setAttribute('title', msg);
                el.classList.add('opacity-75', 'cursor-not-allowed');
            }
        });
    }
}

async function loadCompanyAffiliation(user) {
    const banner = document.getElementById('prof-company-affiliation');
    if (!banner) return;
    if (!user.companyId) { banner.style.display = 'none'; return; }
    try {
        const company = await dataService.getCompanyById(user.companyId);
        if (company) {
            const nameEl = document.getElementById('prof-company-name-link');
            if (nameEl) nameEl.textContent = company.profile?.name || company.id;
            banner.style.display = 'block';
        }
    } catch (e) { banner.style.display = 'none'; }
}

async function loadReputation(userId) {
    try {
        let score = 0;
        let count = 0;
        if (typeof dataService.getReviewsByRevieweeId === 'function') {
            const reviews = await dataService.getReviewsByRevieweeId(userId);
            count = reviews.length;
            if (count > 0) {
                const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
                score = sum / count;
            }
        }
        if (count === 0) {
            const contracts = typeof dataService.getContracts === 'function'
                ? await dataService.getContracts() : [];
            const completed = contracts.filter(c =>
                c.status === 'completed' && (c.creatorId === userId || c.contractorId === userId)
            );
            count = completed.length;
            score = count > 0 ? Math.min(5, 3 + (count * 0.4)) : 0;
        }
        const rounded = Math.round(score * 10) / 10;

        const scoreEl = document.getElementById('reputation-score');
        const barEl = document.getElementById('reputation-bar');
        const labelEl = document.getElementById('reputation-label');
        if (scoreEl) scoreEl.textContent = count > 0 ? rounded.toFixed(1) : '—';
        if (barEl) barEl.style.width = count > 0 ? ((Math.min(5, rounded) / 5) * 100) + '%' : '0%';
        if (labelEl) labelEl.textContent = count > 0
            ? `Based on ${count} review${count !== 1 ? 's' : ''}`
            : 'No reviews yet';
    } catch (e) { /* ignore */ }
}

async function loadReviewsReceived(userId) {
    try {
        const listEl = document.getElementById('reviews-received-list');
        const emptyEl = document.getElementById('reviews-received-empty');
        if (!listEl) return;
        if (typeof dataService.getReviewsByRevieweeId !== 'function') {
            if (emptyEl) { emptyEl.style.display = 'block'; emptyEl.textContent = 'No reviews yet.'; }
            return;
        }
        const reviews = await dataService.getReviewsByRevieweeId(userId);
        if (reviews.length === 0) {
            listEl.innerHTML = '';
            if (emptyEl) { emptyEl.style.display = 'block'; emptyEl.textContent = 'No reviews yet.'; }
            return;
        }
        if (emptyEl) emptyEl.style.display = 'none';
        const maxRating = (typeof CONFIG !== 'undefined' && CONFIG.REVIEW_RATING_MAX) ? CONFIG.REVIEW_RATING_MAX : 5;
        const rows = await Promise.all(reviews.slice(0, 10).map(async (r) => {
            const reviewer = await dataService.getUserOrCompanyById(r.reviewerId);
            const name = reviewer?.profile?.name || reviewer?.email || 'Someone';
            const contractLink = r.contractId ? `<a href="#" data-route="/contracts/${r.contractId}" class="text-primary text-xs">View contract</a>` : '';
            return `<div class="border-b border-gray-100 pb-2 last:border-0"><strong>${escapeHtml(name)}</strong> — ${r.rating}/${maxRating}${r.comment ? '<br/><span class="text-gray-600">' + escapeHtml(r.comment) + '</span>' : ''}${contractLink ? '<br/>' + contractLink : ''}</div>`;
        }));
        listEl.innerHTML = rows.join('');
        listEl.querySelectorAll('a[data-route]').forEach((a) => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const route = a.getAttribute('data-route');
                if (route && typeof router !== 'undefined') router.navigate(route);
            });
        });
    } catch (e) { /* ignore */ }
}

function loadMatchingPreferences(user) {
    const input = document.getElementById('matching-min-score');
    if (!input) return;
    const minScore = user?.profile?.matchingPreferences?.minScore;
    if (minScore != null && typeof minScore === 'number') {
        input.value = Math.round(Math.min(100, Math.max(70, minScore * 100)));
    } else {
        input.value = 70;
    }
}

function setupMatchingPreferencesSave() {
    const btn = document.getElementById('matching-preferences-save');
    const input = document.getElementById('matching-min-score');
    if (!btn || !input) return;
    if (authService.isPendingApproval && authService.isPendingApproval()) {
        btn.disabled = true;
        btn.setAttribute('title', 'Action disabled until your account is approved.');
        return;
    }
    btn.addEventListener('click', async () => {
        const user = authService.getCurrentUser();
        if (!user) return;
        if (authService.isPendingApproval && authService.isPendingApproval()) return;
        const raw = parseInt(input.value, 10);
        const pct = isNaN(raw) ? 70 : Math.min(100, Math.max(70, raw));
        const minScore = pct / 100;
        const merged = { ...(user.profile || {}), matchingPreferences: { ...(user.profile?.matchingPreferences || {}), minScore } };
        try {
            if (user.profile?.type === 'company' || authService.isCompanyUser?.()) {
                await dataService.updateCompany(user.id, { profile: merged });
            } else {
                await dataService.updateUser(user.id, { profile: merged });
            }
            authService.currentUser = { ...user, profile: merged };
            showProfileSuccess('Matching preferences saved.');
        } catch (e) {
            console.error('Error saving matching preferences:', e);
            alert('Failed to save preferences.');
        }
    });
}

async function loadTeamMembers(user) {
    const card = document.getElementById('team-members-card');
    const list = document.getElementById('team-members-list');
    const addBtn = document.getElementById('team-add-member-btn');
    if (!card || !list) return;
    const isCompany = authService.isCompanyUser && authService.isCompanyUser();
    if (!isCompany) { card.style.display = 'none'; return; }
    const canManageTeam = user.role === CONFIG.ROLES.COMPANY_OWNER || user.role === CONFIG.ROLES.COMPANY_ADMIN;
    if (addBtn) {
        addBtn.style.display = canManageTeam ? 'inline-flex' : 'none';
        addBtn.onclick = () => showAddTeamMemberModal(user.id);
    }
    try {
        const members = await dataService.getCompanyMembers(user.id);
        if (members.length === 0) {
            list.innerHTML = '<p class="text-sm text-gray-500">No team members linked yet.</p>';
        } else {
            list.innerHTML = members.map(m => {
                const roleLabel = (m.role === CONFIG.ROLES.COMPANY_ADMIN ? 'Admin' : m.role === CONFIG.ROLES.COMPANY_MEMBER ? 'Member' : m.role) || 'Member';
                const removeBtn = canManageTeam && m.id !== user.id
                    ? `<button type="button" class="btn btn-ghost btn-sm text-red-600 team-remove-member" data-member-id="${escapeHtml(m.id)}">Remove</button>`
                    : '';
                return `<div class="flex items-center justify-between gap-2 py-1 border-b border-gray-100 last:border-0 team-member-row" data-member-id="${escapeHtml(m.id)}">
                    <div class="flex items-center gap-2 min-w-0">
                        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">${escapeHtml((m.profile?.name || '?')[0])}</div>
                        <div class="min-w-0">
                            <div class="text-sm font-medium truncate">${escapeHtml(m.profile?.name || m.email)}</div>
                            <div class="text-xs text-gray-500 truncate">${escapeHtml(m.profile?.title || roleLabel)}</div>
                        </div>
                    </div>
                    ${removeBtn}
                </div>`;
            }).join('');
        }
        card.style.display = 'block';
        list.querySelectorAll('.team-remove-member').forEach(btn => {
            btn.addEventListener('click', () => {
                const memberId = btn.getAttribute('data-member-id');
                if (memberId) removeTeamMember(memberId, user.id);
            });
        });
    } catch (e) { card.style.display = 'none'; }
}

function showAddTeamMemberModal(companyId) {
    if (authService.isPendingApproval && authService.isPendingApproval()) return;
    const roleOptions = [
        { value: CONFIG.ROLES.COMPANY_ADMIN, label: 'Admin' },
        { value: CONFIG.ROLES.COMPANY_MEMBER, label: 'Member' }
    ].map(o => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
    const contentHTML = `
        <form id="add-team-member-form" class="space-y-3">
            <p class="text-sm text-gray-600">Link an existing user to your company by email. They must already have an account.</p>
            <div>
                <label for="team-member-email" class="block text-sm font-medium text-gray-700 mb-1">Email <span class="text-red-500">*</span></label>
                <input type="email" id="team-member-email" class="w-full px-3 py-2 border border-gray-300 rounded-md" required placeholder="colleague@example.com" />
            </div>
            <div>
                <label for="team-member-role" class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select id="team-member-role" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                    ${roleOptions}
                </select>
            </div>
            <div id="add-team-member-error" class="text-sm text-red-600" style="display: none;"></div>
            <div class="flex gap-2 pt-2">
                <button type="button" id="add-team-member-submit" class="btn btn-primary">Add</button>
                <button type="button" id="add-team-member-cancel" class="btn btn-secondary">Cancel</button>
            </div>
        </form>
    `;
    if (typeof modalService === 'undefined') {
        const email = prompt('Team member email:');
        if (email == null || !email.trim()) return;
        const role = confirm('Grant Admin role? (Cancel = Member)') ? CONFIG.ROLES.COMPANY_ADMIN : CONFIG.ROLES.COMPANY_MEMBER;
        addTeamMemberByEmail(companyId, email.trim(), role);
        return;
    }
    modalService.showCustom(contentHTML, 'Add team member', { confirmText: 'Close' }).then(() => {});
    const modalEl = document.getElementById('modal-container');
    if (!modalEl) return;
    const submitBtn = modalEl.querySelector('#add-team-member-submit');
    const cancelBtn = modalEl.querySelector('#add-team-member-cancel');
    const emailInput = modalEl.querySelector('#team-member-email');
    const roleSelect = modalEl.querySelector('#team-member-role');
    const errorEl = modalEl.querySelector('#add-team-member-error');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            if (authService.isPendingApproval && authService.isPendingApproval()) return;
            const email = emailInput?.value?.trim();
            const role = roleSelect?.value || CONFIG.ROLES.COMPANY_MEMBER;
            if (!email) {
                if (errorEl) { errorEl.textContent = 'Email is required.'; errorEl.style.display = 'block'; }
                return;
            }
            if (errorEl) errorEl.style.display = 'none';
            const done = await addTeamMemberByEmail(companyId, email, role);
            if (done) modalService.close();
        });
    }
    if (cancelBtn) cancelBtn.addEventListener('click', () => modalService.close());
}

async function addTeamMemberByEmail(companyId, email, role) {
    try {
        const user = await dataService.getUserByEmail(email);
        if (!user) {
            const errEl = document.getElementById('add-team-member-error');
            if (errEl) { errEl.textContent = 'No user found with this email. They need to register first.'; errEl.style.display = 'block'; }
            return false;
        }
        if (user.companyId && user.companyId !== companyId) {
            const errEl = document.getElementById('add-team-member-error');
            if (errEl) { errEl.textContent = 'This user is already linked to another company.'; errEl.style.display = 'block'; }
            return false;
        }
        await dataService.updateUser(user.id, { companyId, role });
        const currentUser = authService.getCurrentUser();
        if (currentUser && typeof loadTeamMembers === 'function') await loadTeamMembers(currentUser);
        return true;
    } catch (e) {
        const errEl = document.getElementById('add-team-member-error');
        if (errEl) { errEl.textContent = 'Failed to add member. Please try again.'; errEl.style.display = 'block'; }
        return false;
    }
}

async function removeTeamMember(memberId, companyId) {
    if (authService.isPendingApproval && authService.isPendingApproval()) return;
    if (!confirm('Remove this member from your company? They will no longer have access to company opportunities.')) return;
    try {
        await dataService.updateUser(memberId, { companyId: null, role: CONFIG.ROLES.PROFESSIONAL });
        const user = authService.getCurrentUser();
        if (user && typeof loadTeamMembers === 'function') await loadTeamMembers(user);
    } catch (e) {
        console.error('Error removing team member:', e);
        alert('Failed to remove member.');
    }
}

function setupSkillAutocomplete() {
    const input = document.getElementById('skills');
    const sugBox = document.getElementById('skills-suggestions');
    const tagsBox = document.getElementById('skills-tags');
    if (!input || !sugBox || !tagsBox) return;

    let selectedSkills = [];
    const currentVal = input.value;
    if (currentVal) {
        selectedSkills = parseArray(currentVal);
    }
    renderSkillTags();

    input.addEventListener('input', async () => {
        const q = input.value.trim();
        if (q.length < 1) { sugBox.style.display = 'none'; return; }
        if (typeof skillService === 'undefined') { return; }
        const catalog = await skillService.getCatalog();
        const lq = q.toLowerCase();
        let html = '';
        for (const [cat, skills] of Object.entries(catalog)) {
            const matching = skills.filter(s =>
                s.toLowerCase().includes(lq) && !selectedSkills.includes(s)
            );
            if (matching.length > 0) {
                html += `<div class="skill-suggestion-category">${escapeHtml(cat)}</div>`;
                matching.forEach(s => {
                    html += `<div class="skill-suggestion-item" data-skill="${escapeHtml(s)}">${escapeHtml(s)}</div>`;
                });
            }
        }
        if (!html) html = '<div class="p-2 text-sm text-gray-400">No matching skills</div>';
        sugBox.innerHTML = html;
        sugBox.style.display = 'block';

        sugBox.querySelectorAll('.skill-suggestion-item').forEach(el => {
            el.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const skill = el.dataset.skill;
                if (skill && !selectedSkills.includes(skill)) {
                    selectedSkills.push(skill);
                    renderSkillTags();
                    syncSkillInput();
                }
                input.value = '';
                sugBox.style.display = 'none';
            });
        });
    });

    input.addEventListener('blur', () => {
        setTimeout(() => { sugBox.style.display = 'none'; }, 200);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const raw = input.value.trim();
            if (raw && !selectedSkills.includes(raw)) {
                selectedSkills.push(raw);
                renderSkillTags();
                syncSkillInput();
            }
            input.value = '';
            sugBox.style.display = 'none';
        }
    });

    function renderSkillTags() {
        tagsBox.innerHTML = selectedSkills.map((s, i) =>
            `<span class="skill-tag">${escapeHtml(s)}<span class="skill-tag-remove" data-idx="${i}">&times;</span></span>`
        ).join('');
        tagsBox.querySelectorAll('.skill-tag-remove').forEach(el => {
            el.addEventListener('click', () => {
                selectedSkills.splice(Number(el.dataset.idx), 1);
                renderSkillTags();
                syncSkillInput();
            });
        });
    }

    function syncSkillInput() {
        input.value = selectedSkills.join(', ');
    }
}

function getCompanyCompleteness(profile) {
    const fields = [
        !!profile?.name,
        !!(profile?.crNumber || profile?.registrationNumber),
        (Array.isArray(profile?.sectors) ? profile.sectors.length : parseArray(profile?.sectors).length) > 0 ||
            (Array.isArray(profile?.classifications) ? profile.classifications.length : parseArray(profile?.classifications).length) > 0,
        profile?.financialCapacity != null && profile?.financialCapacity !== '' && Number(profile.financialCapacity) >= 0,
        !!profile?.companyRole,
        (Array.isArray(profile?.preferredPaymentModes) ? profile.preferredPaymentModes.length : 0) > 0,
        (Array.isArray(profile?.preferredCollaborationModels) ? profile.preferredCollaborationModels.length : 0) > 0,
        (Array.isArray(profile?.caseStudies) ? profile.caseStudies.length : 0) > 0,
        (Array.isArray(profile?.references) ? profile.references.length : 0) > 0,
        !!profile?.primaryDomain || (Array.isArray(profile?.expertiseAreas) && profile.expertiseAreas.length > 0)
    ];
    const total = 10;
    const filled = fields.filter(Boolean).length;
    return { percent: Math.round((filled / total) * 100), total, filled };
}

function getProfessionalCompleteness(profile) {
    const hasName = !!profile?.name;
    const hasSpec = Array.isArray(profile?.specializations) ? profile.specializations.length > 0 : !!profile?.specializations;
    const hasSkills = Array.isArray(profile?.skills) ? profile.skills.length > 0 : !!profile?.skills;
    const hasCert = Array.isArray(profile?.certifications) ? profile.certifications.length > 0 : !!profile?.certifications;
    const hasExp = (profile?.yearsExperience != null && profile?.yearsExperience !== '') || (profile?.experience != null && profile?.experience !== '');
    const hasHeadline = !!profile?.headline;
    const hasLocation = !!profile?.location;
    const hasWorkMode = !!profile?.preferredWorkMode;
    const hasPaymentModes = (Array.isArray(profile?.preferredPaymentModes) ? profile.preferredPaymentModes.length : 0) > 0;
    const hasPreferredModels = (Array.isArray(profile?.preferredCollaborationModels) ? profile.preferredCollaborationModels.length : 0) > 0;
    const hasCaseStudies = (Array.isArray(profile?.caseStudies) ? profile.caseStudies.length : 0) > 0;
    const hasReferences = (Array.isArray(profile?.references) ? profile.references.length : 0) > 0;
    const hasDomainOrExpertise = !!profile?.primaryDomain || (Array.isArray(profile?.expertiseAreas) && profile.expertiseAreas.length > 0);
    const fields = [hasName, hasSpec || hasSkills, hasCert, hasExp, hasHeadline, hasLocation, hasWorkMode, hasPaymentModes, hasPreferredModels, hasCaseStudies, hasReferences, hasDomainOrExpertise];
    const total = 12;
    const filled = fields.filter(Boolean).length;
    return { percent: Math.round((filled / total) * 100), total, filled };
}

function renderCompleteness(profile, isCompany) {
    const card = document.getElementById('profile-completeness-card');
    const textEl = document.getElementById('profile-completeness-text');
    const barEl = document.getElementById('profile-completeness-bar');
    const percentEl = document.getElementById('profile-completeness-percent');
    if (!card || !barEl) return;
    const result = isCompany ? getCompanyCompleteness(profile) : getProfessionalCompleteness(profile);
    card.style.display = 'block';
    barEl.style.width = result.percent + '%';
    percentEl.textContent = result.percent + '%';
    if (result.percent === 100) {
        textEl.textContent = 'Your profile is complete. Keeping it updated improves your match recommendations.';
    } else {
        textEl.textContent = 'Complete your profile to improve match recommendations.';
    }
}

function showProfileSuccess(message) {
    const el = document.getElementById('profile-success-message');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 6000);
}

function setCompanyViewMode(profile) {
    const lookups = profileLookups || {};
    const roles = lookups.companyRoles || [];
    const roleLabel = profile?.companyRole ? (roles.find(r => r.id === profile.companyRole)?.label || profile.companyRole) : '—';
    const subTypes = lookups.companyRoleSubTypes?.[profile?.companyRole] || [];
    const subLabel = profile?.companySubType ? (subTypes.find(s => s.id === profile.companySubType)?.label || profile.companySubType) : '—';
    const paymentModes = lookups.paymentModes || [];
    const preferredLabels = (Array.isArray(profile?.preferredPaymentModes) ? profile.preferredPaymentModes : [])
        .map(id => paymentModes.find(p => p.id === id || p.label === id)?.label || id);
    const preferredText = preferredLabels.length ? preferredLabels.join(', ') : '—';

    document.getElementById('view-company-name').textContent = profile?.name || '—';
    document.getElementById('view-company-headline').textContent = profile?.headline || '—';
    document.getElementById('view-company-role').textContent = roleLabel;
    document.getElementById('view-company-subtype').textContent = subLabel;
    document.getElementById('view-cr-number').textContent = profile?.crNumber || profile?.registrationNumber || '—';
    document.getElementById('view-company-website').textContent = profile?.website || '—';
    document.getElementById('view-company-phone').textContent = profile?.phone || '—';
    document.getElementById('view-company-location').textContent = profile?.location || profile?.address || '—';
    document.getElementById('view-company-description').textContent = profile?.description || '—';
    const socialEl = document.getElementById('view-company-socialMedia');
    if (socialEl) socialEl.innerHTML = getSocialIconsHtml(profile?.socialMediaLinks);
    document.getElementById('view-company-sectors').textContent = formatArray(profile?.sectors);
    document.getElementById('view-company-classifications').textContent = formatArray(profile?.classifications);
    document.getElementById('view-company-employeeCount').textContent = profile?.employeeCount || '—';
    document.getElementById('view-company-yearEstablished').textContent = profile?.yearEstablished != null && profile?.yearEstablished !== '' ? profile.yearEstablished : '—';
    document.getElementById('view-company-certifications').textContent = formatArray(profile?.certifications);
    document.getElementById('view-company-services').textContent = formatArray(profile?.services);
    document.getElementById('view-company-interests').textContent = formatArray(profile?.interests);
    document.getElementById('view-financial-capacity').textContent =
        profile?.financialCapacity != null && profile?.financialCapacity !== ''
            ? Number(profile.financialCapacity).toLocaleString() + ' SAR' : '—';
    document.getElementById('view-company-paymentModes').textContent = preferredText;
    const prefModelsEl = document.getElementById('view-company-preferredModels');
    if (prefModelsEl) prefModelsEl.textContent = getPreferredModelsLabel(profile?.preferredCollaborationModels);
    const primaryDomainEl = document.getElementById('view-company-primaryDomain');
    if (primaryDomainEl) primaryDomainEl.textContent = profile?.primaryDomain || '—';
    const expertiseEl = document.getElementById('view-company-expertiseAreas');
    if (expertiseEl) {
        const areas = profile?.expertiseAreas || [];
        expertiseEl.textContent = areas.length === 0 ? '—' : areas.map(ea => `${ea.domain || '?'} (${ea.role || 'professional'})`).join(', ');
    }
    const caseEl = document.getElementById('view-company-caseStudies');
    if (caseEl) {
        const cases = profile?.caseStudies || [];
        caseEl.innerHTML = cases.length === 0 ? '—' : cases.map(c => `
            <div class="border border-gray-200 rounded p-2">
                <div class="font-medium">${escapeHtml(c.title || 'Untitled')}</div>
                ${c.description ? `<div class="text-sm text-gray-600">${escapeHtml(c.description)}</div>` : ''}
                ${c.url ? `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener" class="text-primary text-sm">View</a>` : ''}
            </div>
        `).join('');
    }
    const refEl = document.getElementById('view-company-references');
    if (refEl) {
        const refs = profile?.references || [];
        refEl.innerHTML = refs.length === 0 ? '—' : refs.map(r => `
            <div class="border border-gray-200 rounded p-2">
                <div class="font-medium">${escapeHtml(r.name || '—')}${r.company ? ` · ${escapeHtml(r.company)}` : ''}${(r.relationship || r.role) ? ` · ${escapeHtml(r.relationship || r.role)}` : ''}</div>
                ${r.contact ? `<div class="text-sm text-gray-600">${escapeHtml(r.contact)}</div>` : ''}
                ${(r.testimonial || r.text) ? `<div class="text-sm mt-1">${escapeHtml(r.testimonial || r.text)}</div>` : ''}
            </div>
        `).join('');
    }
    const certVettingEl = document.getElementById('view-company-certifications-vetting');
    if (certVettingEl) {
        const docs = profile?.documents || [];
        certVettingEl.textContent = docs.length === 0 ? 'None uploaded' : docs.map(d => d.label || d.type || 'Document').join(', ');
    }
    const vcEl = document.getElementById('view-company-vettingCaseStudy');
    if (vcEl) {
        const vc = profile?.vettingCaseStudy;
        if (!vc || (!vc.title && !vc.description && !vc.url)) vcEl.textContent = '—';
        else vcEl.innerHTML = (vc.title ? escapeHtml(vc.title) : '') + (vc.url ? ` · <a href="${escapeHtml(vc.url)}" target="_blank" rel="noopener">Link</a>` : '') + (vc.description ? ` · ${escapeHtml(vc.description)}` : '');
    }
    const intEl = document.getElementById('view-company-interview');
    if (intEl) {
        const inv = profile?.interview;
        if (inv?.link) intEl.innerHTML = `<a href="${escapeHtml(inv.link)}" target="_blank" rel="noopener">Interview link</a>` + (inv.scheduledAt ? ` · ${new Date(inv.scheduledAt).toLocaleString()}` : '');
        else if (inv?.scheduledAt) intEl.textContent = 'Scheduled: ' + new Date(inv.scheduledAt).toLocaleString();
        else intEl.textContent = 'An interview may be scheduled; you will be notified.';
    }
}

function setProfessionalViewMode(profile) {
    const lookups = profileLookups || {};
    const workModes = lookups.workModes || [];
    const workModeLabel = profile?.preferredWorkMode ? (workModes.includes(profile.preferredWorkMode) ? profile.preferredWorkMode : profile.preferredWorkMode) : '—';
    const paymentModes = lookups.paymentModes || [];
    const preferredLabels = (Array.isArray(profile?.preferredPaymentModes) ? profile.preferredPaymentModes : [])
        .map(id => paymentModes.find(p => p.id === id || p.label === id)?.label || id);
    const preferredText = preferredLabels.length ? preferredLabels.join(', ') : '—';
    const exp = profile?.yearsExperience ?? profile?.experience;

    document.getElementById('view-full-name').textContent = profile?.name || '—';
    document.getElementById('view-prof-headline').textContent = profile?.headline || '—';
    document.getElementById('view-prof-title').textContent = profile?.title || '—';
    document.getElementById('view-prof-phone').textContent = profile?.phone || '—';
    document.getElementById('view-prof-location').textContent = profile?.location || '—';

    const expLevelEl = document.getElementById('view-prof-experienceLevel');
    if (expLevelEl) {
        const years = Number(exp) || 0;
        let level = '—';
        if (years >= 15) level = 'Expert (' + years + ' years)';
        else if (years >= 8) level = 'Senior (' + years + ' years)';
        else if (years >= 3) level = 'Mid-Level (' + years + ' years)';
        else if (years > 0) level = 'Junior (' + years + ' years)';
        expLevelEl.textContent = level;
    }

    document.getElementById('view-prof-bio').textContent = profile?.bio || '—';
    const profSocialEl = document.getElementById('view-prof-socialMedia');
    if (profSocialEl) profSocialEl.innerHTML = getSocialIconsHtml(profile?.socialMediaLinks);
    document.getElementById('view-specializations').textContent = formatArray(profile?.specializations);

    const skillsViewEl = document.getElementById('view-skills');
    if (skillsViewEl) {
        const skills = Array.isArray(profile?.skills) ? profile.skills : [];
        if (skills.length === 0) {
            skillsViewEl.innerHTML = '—';
        } else {
            skillsViewEl.innerHTML = skills.map(s =>
                `<span class="skill-tag">${escapeHtml(s)}</span>`
            ).join('');
        }
    }

    document.getElementById('view-prof-sectors').textContent = formatArray(profile?.sectors || profile?.industry);
    document.getElementById('view-prof-education').textContent = profile?.education || '—';
    const certsEl = document.getElementById('view-certifications');
    if (certsEl) {
        const certs = normalizeCertifications(profile?.certifications);
        if (certs.length === 0) certsEl.textContent = '—';
        else certsEl.innerHTML = certs.map(c => {
            const typeLabel = c.type ? ` (${c.type})` : '';
            const link = c.url ? `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener">${escapeHtml(c.name || 'Link')}</a>` : escapeHtml(c.name || '—');
            return `<span class="inline-block mr-2 mb-1">${link}${typeLabel}</span>`;
        }).join('');
    }
    document.getElementById('view-years-experience').textContent = exp != null && exp !== '' ? exp : '—';
    document.getElementById('view-prof-services').textContent = formatArray(profile?.services);
    document.getElementById('view-prof-interests').textContent = formatArray(profile?.interests);

    const availEl = document.getElementById('view-prof-availability');
    if (availEl) {
        const avail = profile?.availability || '';
        const lower = avail.toLowerCase();
        let badgeClass = '';
        if (lower.includes('available') && !lower.includes('un')) badgeClass = 'available';
        else if (lower.includes('limited') || lower.includes('busy')) badgeClass = 'limited';
        else if (lower.includes('unavailable')) badgeClass = 'unavailable';
        if (avail && badgeClass) {
            availEl.innerHTML = `<span class="availability-badge ${badgeClass}">${escapeHtml(avail)}</span>`;
        } else {
            availEl.textContent = avail || '—';
        }
    }

    document.getElementById('view-prof-workMode').textContent = workModeLabel;
    document.getElementById('view-prof-paymentModes').textContent = preferredText;
    const rate = profile?.hourlyRate;
    const currency = profile?.currency || 'SAR';
    document.getElementById('view-prof-hourlyRate').textContent = rate != null && rate !== '' ? rate + ' ' + currency : '—';
    document.getElementById('view-prof-languages').textContent = formatArray(profile?.languages);
    const prefModelsEl = document.getElementById('view-prof-preferredModels');
    if (prefModelsEl) prefModelsEl.textContent = getPreferredModelsLabel(profile?.preferredCollaborationModels);
    const primaryDomainEl = document.getElementById('view-prof-primaryDomain');
    if (primaryDomainEl) primaryDomainEl.textContent = profile?.primaryDomain || '—';
    const expertiseEl = document.getElementById('view-prof-expertiseAreas');
    if (expertiseEl) {
        const areas = profile?.expertiseAreas || [];
        expertiseEl.textContent = areas.length === 0 ? '—' : areas.map(ea => `${ea.domain || '?'} (${ea.role || 'professional'})`).join(', ');
    }
    const profFieldsEl = document.getElementById('view-prof-professionalFields');
    if (profFieldsEl) {
        const pfs = profile?.professionalFields || [];
        if (pfs.length === 0) profFieldsEl.textContent = '—';
        else profFieldsEl.innerHTML = pfs.map(pf => {
            const primary = pf.isPrimary ? ' (Primary)' : '';
            const level = pf.level === 'consultant' ? 'Consultant' : 'Professional';
            const exp = pf.experienceLevel ? ` · ${escapeHtml(pf.experienceLevel)}` : '';
            return `<span class="inline-block mr-2 mb-1">${escapeHtml(pf.label || pf.fieldId)}${primary} — ${level}${exp}</span>`;
        }).join('');
    }
    const caseEl = document.getElementById('view-prof-caseStudies');
    if (caseEl) {
        const cases = profile?.caseStudies || [];
        caseEl.innerHTML = cases.length === 0 ? '—' : cases.map(c => `
            <div class="border border-gray-200 rounded p-2">
                <div class="font-medium">${escapeHtml(c.title || 'Untitled')}</div>
                ${c.description ? `<div class="text-sm text-gray-600">${escapeHtml(c.description)}</div>` : ''}
                ${c.url ? `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener" class="text-primary text-sm">View</a>` : ''}
            </div>
        `).join('');
    }
    const portfolioEl = document.getElementById('view-prof-portfolio');
    if (portfolioEl) {
        const portfolio = profile?.portfolio || [];
        if (portfolio.length === 0) portfolioEl.innerHTML = '—';
        else portfolioEl.innerHTML = portfolio.map(p => `
            <div class="border border-gray-200 rounded p-3">
                <div class="font-medium">${escapeHtml(p.projectTitle || '—')}</div>
                ${p.role ? `<div class="text-sm text-gray-600">Role: ${escapeHtml(p.role)}</div>` : ''}
                ${p.description ? `<div class="text-sm mt-1">${escapeHtml(p.description)}</div>` : ''}
                ${p.results ? `<div class="text-sm mt-1"><strong>Results:</strong> ${escapeHtml(p.results)}</div>` : ''}
                ${p.mediaAttachments?.length ? `<a href="${escapeHtml(p.mediaAttachments[0].url)}" target="_blank" rel="noopener" class="text-sm text-primary">Link</a>` : ''}
            </div>
        `).join('');
    }
    const refEl = document.getElementById('view-prof-references');
    if (refEl) {
        const refs = profile?.references || [];
        refEl.innerHTML = refs.length === 0 ? '—' : refs.map(r => `
            <div class="border border-gray-200 rounded p-2">
                <div class="font-medium">${escapeHtml(r.name || '—')}${r.company ? ` · ${escapeHtml(r.company)}` : ''}${(r.relationship || r.role) ? ` · ${escapeHtml(r.relationship || r.role)}` : ''}</div>
                ${r.contact ? `<div class="text-sm text-gray-600">${escapeHtml(r.contact)}</div>` : ''}
                ${(r.testimonial || r.text) ? `<div class="text-sm mt-1">${escapeHtml(r.testimonial || r.text)}</div>` : ''}
            </div>
        `).join('');
    }
    const certVettingEl = document.getElementById('view-prof-certifications-vetting');
    if (certVettingEl) {
        const docs = profile?.documents || [];
        certVettingEl.textContent = docs.length === 0 ? 'None uploaded' : docs.map(d => d.label || d.type || 'Document').join(', ');
    }
    const vcEl = document.getElementById('view-prof-vettingCaseStudy');
    if (vcEl) {
        const vc = profile?.vettingCaseStudy;
        if (!vc || (!vc.title && !vc.projectTitle && !vc.description && !vc.url && !vc.role && !vc.problem && !vc.solution && !vc.impact)) vcEl.textContent = '—';
        else {
            const title = vc.projectTitle || vc.title;
            const parts = [];
            if (title) parts.push(escapeHtml(title));
            if (vc.role) parts.push('Role: ' + escapeHtml(vc.role));
            if (vc.problem) parts.push('Problem: ' + escapeHtml(vc.problem).slice(0, 80) + (vc.problem.length > 80 ? '…' : ''));
            if (vc.solution) parts.push('Solution: ' + escapeHtml(vc.solution).slice(0, 80) + (vc.solution.length > 80 ? '…' : ''));
            if (vc.impact) parts.push('Impact: ' + escapeHtml(vc.impact).slice(0, 80) + (vc.impact.length > 80 ? '…' : ''));
            if (vc.url) parts.push('<a href="' + escapeHtml(vc.url) + '" target="_blank" rel="noopener">Link</a>');
            if (vc.description) parts.push(escapeHtml(vc.description));
            vcEl.innerHTML = parts.join(' · ');
        }
    }
    const intEl = document.getElementById('view-prof-interview');
    if (intEl) {
        const inv = profile?.interview;
        if (inv?.link) intEl.innerHTML = `<a href="${escapeHtml(inv.link)}" target="_blank" rel="noopener">Interview link</a>` + (inv.scheduledAt ? ` · ${new Date(inv.scheduledAt).toLocaleString()}` : '');
        else if (inv?.scheduledAt) intEl.textContent = 'Scheduled: ' + new Date(inv.scheduledAt).toLocaleString();
        else intEl.textContent = 'An interview may be scheduled; you will be notified.';
    }
}

function fillCompanyLookups() {
    const lookups = profileLookups || {};
    const roleSelect = document.getElementById('company-role');
    if (roleSelect && roleSelect.options.length <= 1) {
        const roles = lookups.companyRoles || [];
        roleSelect.innerHTML = '<option value="">Select role</option>';
        roles.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = r.label;
            roleSelect.appendChild(opt);
        });
    }
    const paySelect = document.getElementById('company-paymentModes');
    if (paySelect && paySelect.options.length === 0) {
        const modes = lookups.paymentModes || [];
        modes.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.label;
            paySelect.appendChild(opt);
        });
    }
    const prefContainer = document.getElementById('company-preferredModels-checkboxes');
    if (prefContainer && prefContainer.children.length === 0) {
        getPreferredCollaborationModelsList().forEach(m => {
            const label = document.createElement('label');
            label.className = 'inline-flex items-center gap-1 cursor-pointer';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.name = 'preferredCollaborationModels';
            cb.value = m.id;
            label.appendChild(cb);
            label.appendChild(document.createTextNode(m.label));
            prefContainer.appendChild(label);
        });
    }
}

function fillCompanySubTypeOptions(companyRole) {
    const lookups = profileLookups || {};
    const subSelect = document.getElementById('company-subtype');
    if (!subSelect) return;
    const subTypes = lookups.companyRoleSubTypes?.[companyRole] || [];
    subSelect.innerHTML = '<option value="">Select sub-type</option>';
    subTypes.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.label;
        subSelect.appendChild(opt);
    });
    const wrap = document.getElementById('company-subtype-wrap');
    if (wrap) wrap.style.display = subTypes.length ? 'block' : 'none';
}

function fillProfessionalLookups() {
    const lookups = profileLookups || {};
    const workSelect = document.getElementById('prof-workMode');
    if (workSelect && workSelect.options.length <= 1) {
        const modes = lookups.workModes || [];
        workSelect.innerHTML = '<option value="">Select</option>';
        modes.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            workSelect.appendChild(opt);
        });
    }
    const paySelect = document.getElementById('prof-paymentModes');
    if (paySelect && paySelect.options.length === 0) {
        const modes = lookups.paymentModes || [];
        modes.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.label;
            paySelect.appendChild(opt);
        });
    }
    const prefContainer = document.getElementById('prof-preferredModels-checkboxes');
    if (prefContainer && prefContainer.children.length === 0) {
        getPreferredCollaborationModelsList().forEach(m => {
            const label = document.createElement('label');
            label.className = 'inline-flex items-center gap-1 cursor-pointer';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.name = 'preferredCollaborationModels';
            cb.value = m.id;
            label.appendChild(cb);
            label.appendChild(document.createTextNode(m.label));
            prefContainer.appendChild(label);
        });
    }
}

function renderProfileClarificationDocuments(user, lookups) {
    const container = document.getElementById('profile-clarification-documents');
    if (!container) return;
    const profile = user.profile || {};
    const isCompany = profile.type === 'company';
    const existingDocs = profile.documents || [];
    const docList = isCompany
        ? (lookups?.companyRoleDocuments?.[profile.companyRole] || [])
        : (lookups?.individualTypeDocuments?.[profile.type || profile.individualType || 'professional'] || []);
    container.innerHTML = '';
    docList.forEach(d => {
        const existing = existingDocs.find(x => x.type === d.id);
        const div = document.createElement('div');
        div.innerHTML = `
            <label class="block mb-1 font-medium text-gray-700">${escapeHtml(d.label)} ${d.required ? '<span class="text-red-600">*</span>' : ''}</label>
            <input type="file" data-doc-type="${escapeHtml(d.id)}" data-doc-label="${escapeHtml(d.label)}" class="profile-clarification-doc-input form-input w-full" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
            <span class="profile-clarification-doc-name text-sm text-gray-500">${existing?.fileName ? existing.fileName + ' (current)' : ''}</span>
        `;
        container.appendChild(div);
    });
}

async function collectProfileClarificationDocuments() {
    const container = document.getElementById('profile-clarification-documents');
    const user = authService.getCurrentUser();
    if (!container || !user) return user?.profile?.documents || [];
    const existingDocs = user.profile?.documents || [];
    const inputs = container.querySelectorAll('.profile-clarification-doc-input');
    const result = [];
    for (const input of inputs) {
        const type = input.dataset.docType;
        const label = input.dataset.docLabel;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            if (file.size > 5 * 1024 * 1024) continue;
            const data = await new Promise((resolve) => {
                const r = new FileReader();
                r.onload = () => resolve(r.result);
                r.readAsDataURL(file);
            });
            result.push({ type, label, fileName: file.name, data });
        } else {
            const existing = existingDocs.find(x => x.type === type);
            if (existing) result.push(existing);
        }
    }
    return result;
}

async function loadProfile(user) {
    // Basic info
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-role').value = user.role || '';
    document.getElementById('profile-status').value = user.status || '';
    // Verification badge (for professional/consultant only)
    const verificationGroup = document.getElementById('profile-verification-group');
    const verificationBadgeEl = document.getElementById('profile-verification-badge');
    if (verificationGroup && verificationBadgeEl) {
        const isIndividual = user.role === CONFIG.ROLES.PROFESSIONAL || user.role === CONFIG.ROLES.CONSULTANT;
        if (isIndividual) {
            verificationGroup.style.display = 'block';
            const status = user.profile?.verificationStatus;
            verificationBadgeEl.innerHTML = getVerificationBadgeHtml(status) || '<span class="badge badge-secondary verification-badge">Unverified</span>';
        } else {
            verificationGroup.style.display = 'none';
        }
    }
    // Social media in Account card (always visible)
    const accountSocialEl = document.getElementById('view-account-socialMedia');
    if (accountSocialEl) accountSocialEl.innerHTML = getSocialIconsHtml(user.profile?.socialMediaLinks);
    // Hide success message and other card by default
    const successEl = document.getElementById('profile-success-message');
    if (successEl) successEl.classList.add('hidden');
    const otherCard = document.getElementById('profile-other-card');
    if (otherCard) otherCard.style.display = 'none';
    
    // Show vetting banner when not active or vetting was skipped at registration (for company/professional only)
    const vettingBanner = document.getElementById('profile-vetting-banner');
    if (vettingBanner) {
        const showVetting = (user.status !== 'active' || user.profile?.vettingSkippedAtRegistration === true) &&
            (user.profile?.type === 'company' || user.role === 'professional' || user.role === 'consultant');
        vettingBanner.style.display = showVetting ? 'block' : 'none';
        const cta = document.getElementById('profile-vetting-cta');
        if (cta) cta.href = user.profile?.type === 'company' ? '#company-profile-card' : '#professional-profile-card';
    }
    // Show clarification banner and "Submit for review again" when status is clarification_requested
    const clarificationBanner = document.getElementById('profile-clarification-banner');
    const clarificationDocsWrap = document.getElementById('profile-clarification-documents-wrap');
    const submitReviewBtn = document.getElementById('profile-submit-review-again');
    if (clarificationBanner) {
        clarificationBanner.style.display = user.status === 'clarification_requested' ? 'block' : 'none';
    }
    if (clarificationDocsWrap) {
        clarificationDocsWrap.style.display = user.status === 'clarification_requested' ? 'block' : 'none';
    }
    if (user.status === 'clarification_requested') {
        const lookups = await loadProfileLookups();
        renderProfileClarificationDocuments(user, lookups);
    }
    if (submitReviewBtn) {
        submitReviewBtn.onclick = null;
        if (user.status === 'clarification_requested') {
            submitReviewBtn.onclick = async () => {
                try {
                    const documents = await collectProfileClarificationDocuments();
                    const isCompany = user.profile?.type === 'company';
                    const updatedProfile = { ...(user.profile || {}), documents };
                    if (isCompany) {
                        await dataService.updateCompany(user.id, { status: 'pending', profile: updatedProfile });
                    } else {
                        await dataService.updateUser(user.id, { status: 'pending', profile: updatedProfile });
                    }
                    alert('Your account has been resubmitted for review. You will be notified once an admin reviews it.');
                    location.reload();
                } catch (err) {
                    console.error('Error resubmitting for review:', err);
                    alert('Failed to resubmit. Please try again.');
                }
            };
        }
    }
    
    const profile = user.profile || {};
    
    if (authService.isCompanyUser()) {
        document.getElementById('company-profile-card').style.display = 'block';
        document.getElementById('professional-profile-card').style.display = 'none';

        fillCompanyLookups();
        document.getElementById('company-name').value = profile.name || '';
        document.getElementById('company-headline').value = profile.headline || '';
        document.getElementById('company-role').value = profile.companyRole || '';
        fillCompanySubTypeOptions(profile.companyRole);
        document.getElementById('company-subtype').value = profile.companySubType || '';
        document.getElementById('cr-number').value = profile.crNumber || profile.registrationNumber || '';
        document.getElementById('company-website').value = profile.website || '';
        const sm = profile.socialMediaLinks || {};
        document.getElementById('company-linkedin').value = sm.linkedin || '';
        document.getElementById('company-twitter').value = sm.twitter || '';
        document.getElementById('company-facebook').value = sm.facebook || '';
        document.getElementById('company-instagram').value = sm.instagram || '';
        document.getElementById('company-phone').value = profile.phone || '';
        document.getElementById('company-location').value = profile.location || profile.address || '';
        document.getElementById('company-description').value = profile.description || '';
        document.getElementById('company-sectors').value = Array.isArray(profile.sectors) ? profile.sectors.join(', ') : (profile.sectors || '');
        document.getElementById('company-classifications').value = Array.isArray(profile.classifications) ? profile.classifications.join(', ') : (profile.classifications || '');
        document.getElementById('company-employeeCount').value = profile.employeeCount || '';
        document.getElementById('company-yearEstablished').value = profile.yearEstablished ?? '';
        document.getElementById('company-certifications').value = Array.isArray(profile.certifications) ? profile.certifications.join(', ') : (profile.certifications || '');
        document.getElementById('company-services').value = Array.isArray(profile.services) ? profile.services.join(', ') : (profile.services || '');
        document.getElementById('company-interests').value = Array.isArray(profile.interests) ? profile.interests.join(', ') : (profile.interests || '');
        document.getElementById('financial-capacity').value = profile.financialCapacity ?? '';
        const preferredPayment = profile.preferredPaymentModes || [];
        const paySelect = document.getElementById('company-paymentModes');
        if (paySelect) Array.from(paySelect.options).forEach(opt => { opt.selected = preferredPayment.indexOf(opt.value) !== -1; });
        const preferredModels = profile.preferredCollaborationModels || [];
        const prefContainer = document.getElementById('company-preferredModels-checkboxes');
        if (prefContainer) prefContainer.querySelectorAll('input[name="preferredCollaborationModels"]').forEach(cb => { cb.checked = preferredModels.indexOf(cb.value) !== -1; });
        const primaryDomainSelect = document.getElementById('company-primaryDomain');
        if (primaryDomainSelect) {
            primaryDomainSelect.innerHTML = '<option value="">Select domain</option>';
            getProfileDomainsList().forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.textContent = d.label;
                if (profile.primaryDomain === d.id) opt.selected = true;
                primaryDomainSelect.appendChild(opt);
            });
        }
        renderExpertiseAreasList('company-expertiseAreas-list', profile.expertiseAreas || []);
        setupExpertiseAddButton('company-add-expertise', 'company-expertiseAreas-list');
        renderCaseStudiesList('company-caseStudies-list', profile.caseStudies || []);
        setupCaseStudyAddButton('company-add-caseStudy', 'company-caseStudies-list');
        renderReferencesList('company-references-list', profile.references || []);
        setupReferenceAddButton('company-add-reference', 'company-references-list');
        const vc = profile.vettingCaseStudy || {};
        document.getElementById('company-vettingCaseStudy-title').value = vc.title || '';
        document.getElementById('company-vettingCaseStudy-url').value = vc.url || '';
        document.getElementById('company-vettingCaseStudy-description').value = vc.description || '';
        renderVettingCaseStudyDocuments('company-vettingCaseStudy-documents', vc.documents || []);
        setupVettingCaseStudyDocumentsAddButton('company-add-vettingCaseStudy-doc', 'company-vettingCaseStudy-documents');

        setCompanyViewMode(profile);
        renderCompleteness(profile, true);
        showCompanyView();
        setupCompanyForm(user.id);
    } else if (authService.isProfessional()) {
        document.getElementById('professional-profile-card').style.display = 'block';
        document.getElementById('company-profile-card').style.display = 'none';

        fillProfessionalLookups();
        document.getElementById('full-name').value = profile.name || '';
        document.getElementById('prof-headline').value = profile.headline || '';
        document.getElementById('prof-title').value = profile.title || '';
        document.getElementById('prof-phone').value = profile.phone || '';
        document.getElementById('prof-location').value = profile.location || '';
        document.getElementById('prof-bio').value = profile.bio || '';
        const profSm = profile.socialMediaLinks || {};
        document.getElementById('prof-linkedin').value = profSm.linkedin || '';
        document.getElementById('prof-twitter').value = profSm.twitter || '';
        document.getElementById('prof-facebook').value = profSm.facebook || '';
        document.getElementById('prof-instagram').value = profSm.instagram || '';
        document.getElementById('specializations').value = Array.isArray(profile.specializations) ? profile.specializations.join(', ') : (profile.specializations || '');
        document.getElementById('skills').value = Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || '');
        document.getElementById('prof-sectors').value = Array.isArray(profile.sectors) ? profile.sectors.join(', ') : (profile.sectors || profile.industry || '');
        document.getElementById('prof-education').value = profile.education || '';
        renderCertificationsList('prof-certifications-list', profile.certifications || []);
        setupCertificationsAddButton('prof-add-certification', 'prof-certifications-list');
        document.getElementById('years-experience').value = profile.yearsExperience ?? profile.experience ?? '';
        document.getElementById('prof-services').value = Array.isArray(profile.services) ? profile.services.join(', ') : (profile.services || '');
        document.getElementById('prof-interests').value = Array.isArray(profile.interests) ? profile.interests.join(', ') : (profile.interests || '');
        document.getElementById('prof-availability').value = profile.availability || '';
        document.getElementById('prof-workMode').value = profile.preferredWorkMode || '';
        const preferredPayment = profile.preferredPaymentModes || [];
        const paySelect = document.getElementById('prof-paymentModes');
        if (paySelect) Array.from(paySelect.options).forEach(opt => { opt.selected = preferredPayment.indexOf(opt.value) !== -1; });
        document.getElementById('prof-hourlyRate').value = profile.hourlyRate ?? '';
        document.getElementById('prof-currency').value = profile.currency || 'SAR';
        document.getElementById('prof-languages').value = Array.isArray(profile.languages) ? profile.languages.join(', ') : (profile.languages || '');
        const preferredModels = profile.preferredCollaborationModels || [];
        const profPrefContainer = document.getElementById('prof-preferredModels-checkboxes');
        if (profPrefContainer) profPrefContainer.querySelectorAll('input[name="preferredCollaborationModels"]').forEach(cb => { cb.checked = preferredModels.indexOf(cb.value) !== -1; });
        const profPrimaryDomainSelect = document.getElementById('prof-primaryDomain');
        if (profPrimaryDomainSelect) {
            profPrimaryDomainSelect.innerHTML = '<option value="">Select domain</option>';
            getProfileDomainsList().forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.textContent = d.label;
                if (profile.primaryDomain === d.id) opt.selected = true;
                profPrimaryDomainSelect.appendChild(opt);
            });
        }
        renderProfessionalFieldsList('prof-professionalFields-list', profile.professionalFields || []);
        setupProfessionalFieldsAddButton('prof-add-professionalField', 'prof-professionalFields-list');
        renderExpertiseAreasList('prof-expertiseAreas-list', profile.expertiseAreas || []);
        setupExpertiseAddButton('prof-add-expertise', 'prof-expertiseAreas-list');
        renderCaseStudiesList('prof-caseStudies-list', profile.caseStudies || []);
        setupCaseStudyAddButton('prof-add-caseStudy', 'prof-caseStudies-list');
        renderPortfolioList('prof-portfolio-list', profile.portfolio || []);
        setupPortfolioAddButton('prof-add-portfolio', 'prof-portfolio-list');
        renderReferencesList('prof-references-list', profile.references || []);
        setupReferenceAddButton('prof-add-reference', 'prof-references-list');
        const profVc = profile.vettingCaseStudy || {};
        document.getElementById('prof-vettingCaseStudy-title').value = profVc.projectTitle || profVc.title || '';
        document.getElementById('prof-vettingCaseStudy-role').value = profVc.role || '';
        document.getElementById('prof-vettingCaseStudy-problem').value = profVc.problem || '';
        document.getElementById('prof-vettingCaseStudy-solution').value = profVc.solution || '';
        document.getElementById('prof-vettingCaseStudy-impact').value = profVc.impact || '';
        document.getElementById('prof-vettingCaseStudy-url').value = profVc.url || '';
        document.getElementById('prof-vettingCaseStudy-description').value = profVc.description || '';
        renderVettingCaseStudyDocuments('prof-vettingCaseStudy-documents', profVc.documents || []);
        setupVettingCaseStudyDocumentsAddButton('prof-add-vettingCaseStudy-doc', 'prof-vettingCaseStudy-documents');
        const req = profileLookups?.vettingRequirements?.[profile.type || 'professional'];
        const hintEl = document.getElementById('prof-vetting-case-study-hint');
        if (hintEl) hintEl.textContent = req?.caseStudy === 'required' ? 'Required for Consultants.' : 'Optional for Professionals.';

        setProfessionalViewMode(profile);
        renderCompleteness(profile, false);
        showProfessionalView();
        setupProfessionalForm(user.id);
    } else {
        if (otherCard) otherCard.style.display = 'block';
        document.getElementById('company-profile-card').style.display = 'none';
        document.getElementById('professional-profile-card').style.display = 'none';
    }
}

function showCompanyView() {
    const view = document.getElementById('company-profile-view');
    const form = document.getElementById('company-profile-form');
    const editBtn = document.getElementById('company-profile-edit-btn');
    const cancelBtn = document.getElementById('company-profile-cancel-btn');
    if (view) view.style.display = 'block';
    if (form) form.style.display = 'none';
    if (editBtn) editBtn.style.display = 'inline-block';
    if (cancelBtn) cancelBtn.style.display = 'none';
}

function showCompanyEdit() {
    const view = document.getElementById('company-profile-view');
    const form = document.getElementById('company-profile-form');
    const editBtn = document.getElementById('company-profile-edit-btn');
    const cancelBtn = document.getElementById('company-profile-cancel-btn');
    if (view) view.style.display = 'none';
    if (form) form.style.display = 'block';
    if (editBtn) editBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
}

function showProfessionalView() {
    const view = document.getElementById('professional-profile-view');
    const form = document.getElementById('professional-profile-form');
    const editBtn = document.getElementById('professional-profile-edit-btn');
    const cancelBtn = document.getElementById('professional-profile-cancel-btn');
    if (view) view.style.display = 'block';
    if (form) form.style.display = 'none';
    if (editBtn) editBtn.style.display = 'inline-block';
    if (cancelBtn) cancelBtn.style.display = 'none';
}

function showProfessionalEdit() {
    const view = document.getElementById('professional-profile-view');
    const form = document.getElementById('professional-profile-form');
    const editBtn = document.getElementById('professional-profile-edit-btn');
    const cancelBtn = document.getElementById('professional-profile-cancel-btn');
    if (view) view.style.display = 'none';
    if (form) form.style.display = 'block';
    if (editBtn) editBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    setupSkillAutocomplete();
}

function setupCompanyForm(userId) {
    const form = document.getElementById('company-profile-form');
    const editBtn = document.getElementById('company-profile-edit-btn');
    const cancelBtn = document.getElementById('company-profile-cancel-btn');
    const roleSelect = document.getElementById('company-role');
    if (!form) return;

    if (roleSelect) roleSelect.addEventListener('change', () => fillCompanySubTypeOptions(roleSelect.value));
    if (editBtn) editBtn.addEventListener('click', () => showCompanyEdit());
    if (cancelBtn) cancelBtn.addEventListener('click', () => showCompanyView());

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (authService.isPendingApproval && authService.isPendingApproval()) {
            alert('Action disabled until your account is approved.');
            return;
        }
        const formData = new FormData(form);
        const payEl = document.getElementById('company-paymentModes');
        const preferredPaymentModes = payEl ? Array.from(payEl.selectedOptions).map(o => o.value) : [];
        const prefModelsEl = document.getElementById('company-preferredModels-checkboxes');
        const preferredCollaborationModels = prefModelsEl ? Array.from(prefModelsEl.querySelectorAll('input[name="preferredCollaborationModels"]:checked')).map(cb => cb.value) : [];
        const caseStudies = collectCaseStudiesFromList('company-caseStudies-list');
        const profileData = {
            type: 'company',
            name: formData.get('name') || null,
            headline: formData.get('headline') || null,
            companyRole: formData.get('companyRole') || null,
            companySubType: formData.get('companySubType') || null,
            crNumber: formData.get('crNumber') || null,
            registrationNumber: formData.get('crNumber') || null,
            website: formData.get('website') || null,
            socialMediaLinks: {
                linkedin: document.getElementById('company-linkedin')?.value?.trim() || null,
                twitter: document.getElementById('company-twitter')?.value?.trim() || null,
                facebook: document.getElementById('company-facebook')?.value?.trim() || null,
                instagram: document.getElementById('company-instagram')?.value?.trim() || null
            },
            phone: formData.get('phone') || null,
            location: formData.get('location') || null,
            description: formData.get('description') || null,
            sectors: parseArray(formData.get('sectors')),
            classifications: parseArray(formData.get('classifications')),
            employeeCount: formData.get('employeeCount') || null,
            yearEstablished: formData.get('yearEstablished') ? parseInt(formData.get('yearEstablished'), 10) : null,
            certifications: parseArray(formData.get('certifications')),
            services: parseArray(formData.get('services')),
            interests: parseArray(formData.get('interests')),
            financialCapacity: parseFloat(formData.get('financialCapacity')) || 0,
            preferredPaymentModes,
            preferredCollaborationModels,
            caseStudies,
            references: collectReferencesFromList('company-references-list'),
            primaryDomain: document.getElementById('company-primaryDomain')?.value?.trim() || null,
            expertiseAreas: collectExpertiseAreasFromList('company-expertiseAreas-list'),
            vettingCaseStudy: {
                title: document.getElementById('company-vettingCaseStudy-title')?.value?.trim() || null,
                description: document.getElementById('company-vettingCaseStudy-description')?.value?.trim() || null,
                url: document.getElementById('company-vettingCaseStudy-url')?.value?.trim() || null,
                documents: await collectVettingCaseStudyDocuments('company-vettingCaseStudy-documents')
            }
        };
        try {
            const user = authService.getCurrentUser();
            const merged = { ...(user?.profile || {}), ...profileData };
            if (user?.profile?.interview) merged.interview = user.profile.interview;
            await dataService.updateCompany(userId, { profile: merged });
            authService.currentUser = { ...user, profile: merged };
            setCompanyViewMode(merged);
            renderCompleteness(merged, true);
            showCompanyView();
            const ms = window.matchingService;
            if (ms && typeof ms.findOpportunitiesForCandidate === 'function') {
                ms.findOpportunitiesForCandidate(userId).catch(e =>
                    console.warn('Matching refresh after profile save failed', e)
                );
            }
            showProfileSuccess('Profile updated successfully. Your match recommendations will update to reflect these changes.');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    });
}

function setupProfessionalForm(userId) {
    const form = document.getElementById('professional-profile-form');
    const editBtn = document.getElementById('professional-profile-edit-btn');
    const cancelBtn = document.getElementById('professional-profile-cancel-btn');
    if (!form) return;

    if (editBtn) editBtn.addEventListener('click', () => showProfessionalEdit());
    if (cancelBtn) cancelBtn.addEventListener('click', () => showProfessionalView());

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (authService.isPendingApproval && authService.isPendingApproval()) {
            alert('Action disabled until your account is approved.');
            return;
        }
        const formData = new FormData(form);
        const payEl = document.getElementById('prof-paymentModes');
        const preferredPaymentModes = payEl ? Array.from(payEl.selectedOptions).map(o => o.value) : [];
        const profPrefEl = document.getElementById('prof-preferredModels-checkboxes');
        const preferredCollaborationModels = profPrefEl ? Array.from(profPrefEl.querySelectorAll('input[name="preferredCollaborationModels"]:checked')).map(cb => cb.value) : [];
        const caseStudies = collectCaseStudiesFromList('prof-caseStudies-list');
        const yearsVal = formData.get('yearsExperience');
        const yearsExperience = yearsVal !== '' && yearsVal != null ? parseInt(yearsVal, 10) : null;
        const profileData = {
            name: formData.get('name') || null,
            headline: formData.get('headline') || null,
            title: formData.get('title') || null,
            phone: formData.get('phone') || null,
            location: formData.get('location') || null,
            bio: formData.get('bio') || null,
            socialMediaLinks: {
                linkedin: document.getElementById('prof-linkedin')?.value?.trim() || null,
                twitter: document.getElementById('prof-twitter')?.value?.trim() || null,
                facebook: document.getElementById('prof-facebook')?.value?.trim() || null,
                instagram: document.getElementById('prof-instagram')?.value?.trim() || null
            },
            specializations: parseArray(formData.get('specializations')),
            skills: parseArray(formData.get('skills')),
            sectors: parseArray(formData.get('sectors')),
            education: formData.get('education') || null,
            certifications: await collectCertificationsFromList('prof-certifications-list'),
            yearsExperience: yearsExperience != null ? yearsExperience : 0,
            experience: yearsExperience,
            services: parseArray(formData.get('services')),
            interests: parseArray(formData.get('interests')),
            availability: formData.get('availability') || null,
            preferredWorkMode: formData.get('preferredWorkMode') || null,
            preferredPaymentModes,
            preferredCollaborationModels,
            caseStudies,
            portfolio: collectPortfolioFromList('prof-portfolio-list'),
            references: collectReferencesFromList('prof-references-list'),
            primaryDomain: document.getElementById('prof-primaryDomain')?.value?.trim() || null,
            professionalFields: collectProfessionalFieldsFromList('prof-professionalFields-list'),
            expertiseAreas: collectExpertiseAreasFromList('prof-expertiseAreas-list'),
            vettingCaseStudy: {
                projectTitle: document.getElementById('prof-vettingCaseStudy-title')?.value?.trim() || null,
                title: document.getElementById('prof-vettingCaseStudy-title')?.value?.trim() || null,
                role: document.getElementById('prof-vettingCaseStudy-role')?.value?.trim() || null,
                problem: document.getElementById('prof-vettingCaseStudy-problem')?.value?.trim() || null,
                solution: document.getElementById('prof-vettingCaseStudy-solution')?.value?.trim() || null,
                impact: document.getElementById('prof-vettingCaseStudy-impact')?.value?.trim() || null,
                description: document.getElementById('prof-vettingCaseStudy-description')?.value?.trim() || null,
                url: document.getElementById('prof-vettingCaseStudy-url')?.value?.trim() || null,
                documents: await collectVettingCaseStudyDocuments('prof-vettingCaseStudy-documents')
            },
            hourlyRate: formData.get('hourlyRate') !== '' ? parseFloat(formData.get('hourlyRate')) : null,
            currency: formData.get('currency') || 'SAR',
            languages: parseArray(formData.get('languages'))
        };
        try {
            const user = authService.getCurrentUser();
            const merged = { ...(user?.profile || {}), ...profileData };
            if (user?.profile?.type) merged.type = user.profile.type;
            if (user?.profile?.interview) merged.interview = user.profile.interview;
            await dataService.updateUser(userId, { profile: merged });
            authService.currentUser = { ...user, profile: merged };
            setProfessionalViewMode(merged);
            renderCompleteness(merged, false);
            showProfessionalView();
            const ms = window.matchingService;
            if (ms && typeof ms.findOpportunitiesForCandidate === 'function') {
                ms.findOpportunitiesForCandidate(userId).catch(e =>
                    console.warn('Matching refresh after profile save failed', e)
                );
            }
            showProfileSuccess('Profile updated successfully. Your match recommendations will update to reflect these changes.');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    });
}

async function loadProfileStats(userId) {
    try {
        const allOpportunities = await dataService.getOpportunities();
        const oppsCreated = allOpportunities.filter(o => o.creatorId === userId).length;
        document.getElementById('stat-opps-created').textContent = oppsCreated;

        const allApplications = await dataService.getApplications();
        const appsSubmitted = allApplications.filter(a => a.applicantId === userId).length;
        document.getElementById('stat-apps-submitted').textContent = appsSubmitted;

        const allMatches = await dataService.getMatches();
        const matchesReceived = allMatches.filter(m => (m.candidateId || m.userId) === userId).length;
        document.getElementById('stat-matches-received').textContent = matchesReceived;

        const contracts = typeof dataService.getContracts === 'function'
            ? await dataService.getContracts() : [];
        const collaborations = contracts.filter(c =>
            c.status === 'completed' && (c.creatorId === userId || c.contractorId === userId)
        ).length;
        const collabEl = document.getElementById('stat-collaborations');
        if (collabEl) collabEl.textContent = collaborations;

    } catch (error) {
        console.error('Error loading profile stats:', error);
    }
}
