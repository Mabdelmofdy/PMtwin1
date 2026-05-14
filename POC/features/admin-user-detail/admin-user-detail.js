/**
 * Admin User Detail — profile, vetting checklist, submitted documents, activity.
 * Includes a dedicated Documents view that previews images/PDFs and surfaces
 * required-document fulfilment based on lookups.json.
 */

let adminDetailLookups = null;

async function loadAdminDetailLookups() {
    if (adminDetailLookups) return adminDetailLookups;
    try {
        const base = (window.CONFIG && window.CONFIG.BASE_PATH) || '';
        const res = await fetch(base + 'data/lookups.json');
        adminDetailLookups = await res.json();
        return adminDetailLookups;
    } catch (e) {
        return {};
    }
}

function escapeHtmlDetail(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDateDetail(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
}

function formatDateOnlyDetail(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
}

function formatBytes(size) {
    if (!Number.isFinite(size) || size <= 0) return null;
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let n = size;
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i++;
    }
    return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function getWaitingPill(timestamp) {
    if (!timestamp) return null;
    const ms = Date.now() - new Date(timestamp).getTime();
    if (Number.isNaN(ms) || ms < 0) return null;
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor(ms / 3600000);
    let label;
    if (hours < 1) label = 'Just registered';
    else if (hours < 24) label = `${hours}h since registration`;
    else if (days === 1) label = '1 day in queue';
    else label = `${days} days in queue`;
    let tone = '';
    if (days >= 7) tone = 'is-crit';
    else if (days >= 3) tone = 'is-warn';
    return { label, tone };
}

function getDataUrlMimeType(url) {
    if (typeof url !== 'string' || !url.startsWith('data:')) return null;
    const match = url.match(/^data:([^;,]+)[;,]/);
    return match ? match[1] : null;
}

function getDocumentMimeType(doc) {
    if (!doc) return null;
    const fromMime = doc.mimeType || doc.contentType;
    if (fromMime) return fromMime;
    const dataUrl = doc.data || doc.dataUrl || doc.url || doc.fileRef;
    const mime = getDataUrlMimeType(dataUrl);
    if (mime) return mime;
    const name = doc.fileName || doc.name || '';
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return `image/${ext}`;
    if (ext === 'pdf') return 'application/pdf';
    if (['doc', 'docx'].includes(ext)) return 'application/msword';
    if (['xls', 'xlsx'].includes(ext)) return 'application/vnd.ms-excel';
    return null;
}

function getDocumentSource(doc) {
    if (!doc) return null;
    return doc.data || doc.dataUrl || doc.url || doc.fileRef || null;
}

function getDocumentName(doc) {
    if (!doc) return 'Document';
    return doc.fileName || doc.name || doc.label || doc.type || 'Document';
}

function isImageMime(mime) {
    return typeof mime === 'string' && mime.startsWith('image/');
}

function isPdfMime(mime) {
    return mime === 'application/pdf';
}

function getDocIconClass(mime) {
    if (isImageMime(mime)) return 'ph-duotone ph-image';
    if (isPdfMime(mime)) return 'ph-duotone ph-file-pdf';
    if (mime && mime.includes('word')) return 'ph-duotone ph-file-doc';
    if (mime && mime.includes('sheet')) return 'ph-duotone ph-file-xls';
    if (mime && mime.includes('zip')) return 'ph-duotone ph-file-zip';
    return 'ph-duotone ph-file';
}

function getDocBadgeLabel(mime, doc) {
    if (isPdfMime(mime)) return 'PDF';
    if (isImageMime(mime)) return mime.split('/')[1].toUpperCase();
    const name = doc.fileName || doc.name || '';
    const ext = (name.split('.').pop() || '').toUpperCase();
    if (ext && ext.length <= 4) return ext;
    return 'FILE';
}

async function initAdminUserDetail(params) {
    if (!authService.canAccessAdmin() || !authService.hasAdminCapability('admin.users.read')) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }
    const id = params?.id;
    if (!id) {
        router.navigate(CONFIG.ROUTES.ADMIN_USERS);
        return;
    }
    setupUserDetailTabs();
    await loadUserDetail(id);
}

function setupUserDetailTabs() {
    document.querySelectorAll('.user-detail-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            document.querySelectorAll('.user-detail-tab').forEach(b => {
                const isActive = b === btn;
                b.classList.toggle('is-active', isActive);
                b.setAttribute('aria-selected', String(isActive));
            });
            document.querySelectorAll('.user-detail-tabpanel').forEach(panel => {
                const match = panel.getAttribute('data-tabpanel') === tab;
                panel.classList.toggle('is-active', match);
                panel.hidden = !match;
            });
        });
    });
}

async function loadUserDetail(userId) {
    const person = await dataService.getPersonById(userId);
    const main = document.getElementById('main-content');
    if (!person) {
        if (main) main.innerHTML = '<div class="empty-state">User or company not found.</div>';
        return;
    }

    const isCompany = person.profile?.type === 'company';

    const headerMount = document.getElementById('page-context-header-mount');
    if (headerMount && window.pageContextHeader) {
        const baseConfig = window.pageContextHeader.PRESETS?.adminUserDetail || {};
        const subjectName = person.profile?.name || person.email || userId;
        window.pageContextHeader.mount(headerMount, {
            ...baseConfig,
            label: 'Admin Workspace',
            title: subjectName,
            description: person.email ? `${person.email} · review submitted information and documents` : baseConfig.description,
            primaryAction:
                person.status === 'active'
                    ? null
                    : { label: 'Approve', id: 'page-cta-userdetail-approve', type: 'button' },
            secondaryAction: { label: 'Back to vetting', route: (CONFIG.ROUTES && CONFIG.ROUTES.ADMIN_VETTING) || '/admin/vetting' }
        });
        document.getElementById('page-cta-userdetail-approve')?.addEventListener('click', () => {
            approveFromDetail(userId, isCompany);
        });
    }

    renderUserSummary(person, userId, isCompany);
    renderProfileSection(person);
    await renderVettingAdminPanel(person, userId, isCompany);
    await loadAdminDetailLookups();
    renderVettingChecklist(person, isCompany);
    renderDocumentsTab(person, isCompany);
    setupVerificationAndInterviewControls(person, userId, isCompany);
    await renderActivitySection(userId);
}

function renderUserSummary(person, userId, isCompany) {
    const displayName = person.profile?.name || person.email || userId;
    const initial = (displayName.trim().charAt(0) || '?').toUpperCase();
    setText('user-detail-avatar', initial);
    setText('user-detail-name', displayName);
    setText('user-detail-email', person.email || '—');

    const badgesEl = document.getElementById('user-detail-badges');
    if (badgesEl) {
        const statusKey = person.status || 'unknown';
        const sb = window.statusBadgeSystem;
        const statusLabel =
            sb && typeof sb.getStatusLabel === 'function'
                ? sb.getStatusLabel(statusKey, 'vetting')
                : window.vettingActions && typeof window.vettingActions.formatAdminAccountStatus === 'function'
                  ? window.vettingActions.formatAdminAccountStatus(statusKey)
                  : statusKey === 'clarification_requested'
                    ? 'Waiting for Updates'
                    : statusKey.charAt(0).toUpperCase() + statusKey.slice(1);

        const accountType = isCompany
            ? 'Company'
            : person.role === 'consultant' || person.profile?.individualType === 'consultant'
              ? 'Consultant'
              : 'Professional';
        const verification = person.profile?.verificationStatus;
        const verificationLabel =
            verification === 'professional_verified'
                ? 'Verified Professional'
                : verification === 'consultant_verified'
                  ? 'Verified Consultant'
                  : verification === 'company_verified'
                    ? 'Verified Company'
                    : null;
        const waiting = getWaitingPill(person.createdAt);

        const pills = [];
        if (sb && typeof sb.renderBadge === 'function') {
            pills.push(sb.renderBadge(statusLabel, sb.resolveVariant(statusKey, 'vetting')));
            pills.push(sb.renderBadge(accountType, accountType === 'Consultant' ? 'purple' : 'neutral'));
            if (verificationLabel) {
                pills.push(sb.renderBadge(verificationLabel, 'success', { extraClass: 'verification-badge' }));
            }
            if (person.profile?.verificationTier === 'top_expert') {
                pills.push(sb.renderBadge('Top Expert', 'purple', { extraClass: 'verification-badge' }));
            }
        } else {
            const statusPillClass =
                statusKey === 'active'
                    ? 'user-detail-pill--active'
                    : statusKey === 'pending'
                      ? 'user-detail-pill--pending'
                      : statusKey === 'clarification_requested'
                        ? 'user-detail-pill--clarif'
                        : statusKey === 'rejected'
                          ? 'user-detail-pill--rejected'
                          : 'user-detail-pill--neutral';
            pills.push(`<span class="user-detail-pill ${statusPillClass}">${escapeHtmlDetail(statusLabel)}</span>`);
            pills.push(`<span class="user-detail-pill user-detail-pill--neutral">${escapeHtmlDetail(accountType)}</span>`);
            if (verificationLabel) {
                pills.push(`<span class="user-detail-pill user-detail-pill--verified">${escapeHtmlDetail(verificationLabel)}</span>`);
            }
            if (person.profile?.verificationTier === 'top_expert') {
                pills.push('<span class="user-detail-pill user-detail-pill--verified">Top Expert</span>');
            }
        }
        if (waiting && person.status !== 'active') {
            pills.push(`<span class="user-detail-pill user-detail-pill--age ${waiting.tone}">${escapeHtmlDetail(waiting.label)}</span>`);
        }
        badgesEl.innerHTML = pills.join('');
    }

    renderDecisionActions(person, userId, isCompany);
}

function renderDecisionActions(person, userId, isCompany) {
    const wrap = document.getElementById('user-detail-decision-actions');
    if (!wrap) return;
    const canWrite = authService.hasAdminCapability && authService.hasAdminCapability('admin.vetting');
    if (!canWrite) {
        wrap.innerHTML = '';
        return;
    }
    const status = person.status;
    if (status === 'active') {
        wrap.innerHTML = `
            <button type="button" class="btn btn-warning" id="detail-action-clarify">
                <i class="ph-duotone ph-info" aria-hidden="true"></i>
                <span>Request updates</span>
            </button>
            <button type="button" class="btn btn-danger" id="detail-action-reject">
                <i class="ph-duotone ph-prohibit" aria-hidden="true"></i>
                <span>Revoke / reject</span>
            </button>
        `;
    } else if (status === 'rejected') {
        wrap.innerHTML = `
            <button type="button" class="btn btn-success" id="detail-action-approve">
                <i class="ph-duotone ph-check-circle" aria-hidden="true"></i>
                <span>Approve</span>
            </button>
            <button type="button" class="btn btn-warning" id="detail-action-clarify">
                <i class="ph-duotone ph-info" aria-hidden="true"></i>
                <span>Request updates</span>
            </button>
        `;
    } else {
        wrap.innerHTML = `
            <button type="button" class="btn btn-success" id="detail-action-approve">
                <i class="ph-duotone ph-check-circle" aria-hidden="true"></i>
                <span>Approve</span>
            </button>
            <button type="button" class="btn btn-warning" id="detail-action-clarify">
                <i class="ph-duotone ph-info" aria-hidden="true"></i>
                <span>Request updates</span>
            </button>
            <button type="button" class="btn btn-danger" id="detail-action-reject">
                <i class="ph-duotone ph-x-circle" aria-hidden="true"></i>
                <span>Reject</span>
            </button>
        `;
    }

    document.getElementById('detail-action-approve')?.addEventListener('click', () => approveFromDetail(userId, isCompany));
    document.getElementById('detail-action-clarify')?.addEventListener('click', () => clarifyFromDetail(userId, isCompany));
    document.getElementById('detail-action-reject')?.addEventListener('click', () => rejectFromDetail(userId, isCompany));
}

function renderProfileSection(person) {
    const profileEl = document.getElementById('user-detail-profile');
    if (!profileEl) return;
    const profile = person.profile || {};

    const rows = [
        { label: 'Account ID', value: person.id },
        { label: 'Email', value: person.email || '—' },
        { label: 'Display name', value: profile.name || '—' },
        { label: 'Role', value: person.role || '—' },
        { label: 'Status', value: window.vettingActions?.formatAdminAccountStatus?.(person.status) || person.status || '—' }
    ];
    if (profile.type === 'company' || profile.companyType) {
        rows.push({ label: 'Company type', value: profile.companyType || profile.companyRole || '—' });
    }
    if (profile.location || profile.locationRegion || profile.locationCity) {
        rows.push({ label: 'Location', value: profile.location || profile.locationRegion || profile.locationCity });
    }
    if (Array.isArray(profile.skills) && profile.skills.length > 0) {
        rows.push({ label: 'Skills', value: profile.skills.join(', ') });
    }
    if (Array.isArray(profile.sectors) && profile.sectors.length > 0) {
        rows.push({ label: 'Sectors', value: profile.sectors.join(', ') });
    }
    if (profile.description) {
        rows.push({ label: 'Description', value: profile.description });
    }
    rows.push({ label: 'Registered', value: formatDateOnlyDetail(person.createdAt) });
    if (person.updatedAt && person.updatedAt !== person.createdAt) {
        rows.push({ label: 'Last updated', value: formatDateOnlyDetail(person.updatedAt) });
    }

    profileEl.innerHTML = rows
        .map(
            r => `
        <div class="user-detail-data-row">
            <div class="user-detail-data-label">${escapeHtmlDetail(r.label)}</div>
            <div class="user-detail-data-value">${escapeHtmlDetail(r.value)}</div>
        </div>`
        )
        .join('');
}

function timelineActionLabel(action) {
    const map = {
        user_registered: 'Registered',
        company_registered: 'Registered',
        user_clarification_requested: 'Admin requested updates',
        company_clarification_requested: 'Admin requested updates',
        user_vetting_resubmitted: 'Applicant resubmitted',
        company_vetting_resubmitted: 'Applicant resubmitted',
        user_approved: 'Approved',
        company_approved: 'Approved',
        user_rejected: 'Rejected',
        company_rejected: 'Rejected'
    };
    return map[action] || action.replace(/_/g, ' ');
}

async function renderVettingAdminPanel(person, userId, isCompany) {
    const body = document.getElementById('user-detail-admin-vetting-body');
    const timelineBody = document.getElementById('user-detail-vetting-timeline-body');
    const card = document.getElementById('user-detail-admin-vetting-card');
    const timelineCard = document.getElementById('user-detail-vetting-timeline-card');
    if (!body || !window.vettingActions) {
        if (card) card.hidden = true;
        if (timelineCard) timelineCard.hidden = true;
        return;
    }
    if (card) card.hidden = false;
    if (timelineCard) timelineCard.hidden = false;

    const va = window.vettingActions;
    const statusLabel = va.formatAdminAccountStatus(person.status);
    const vt = person.profile?.vetting || {};
    const reasons = Array.isArray(vt.requestedReasonLabels) ? vt.requestedReasonLabels : [];
    const note = vt.adminNote ? String(vt.adminNote) : '';
    const requestedAt = vt.updateRequestAt ? formatDateDetail(vt.updateRequestAt) : '—';
    const resubmittedAt = vt.lastResubmittedAt ? formatDateDetail(vt.lastResubmittedAt) : '—';

    const reasonsHtml =
        reasons.length > 0
            ? `<ul class="profile-needs-updates-list">${reasons.map(r => `<li>${escapeHtmlDetail(r)}</li>`).join('')}</ul>`
            : '<p class="user-detail-empty-section">No specific update reasons on file.</p>';

    body.innerHTML = `
        <div class="user-detail-data-row">
            <div class="user-detail-data-label">Current status</div>
            <div class="user-detail-data-value">${escapeHtmlDetail(statusLabel)}</div>
        </div>
        <div class="user-detail-data-row">
            <div class="user-detail-data-label">Requested update reasons</div>
            <div class="user-detail-data-value">${reasonsHtml}</div>
        </div>
        <div class="user-detail-data-row">
            <div class="user-detail-data-label">Admin note</div>
            <div class="user-detail-data-value">${note ? escapeHtmlDetail(note) : '—'}</div>
        </div>
        <div class="user-detail-data-row">
            <div class="user-detail-data-label">Last update request</div>
            <div class="user-detail-data-value">${escapeHtmlDetail(requestedAt)}</div>
        </div>
        <div class="user-detail-data-row">
            <div class="user-detail-data-label">Last resubmitted</div>
            <div class="user-detail-data-value">${escapeHtmlDetail(resubmittedAt)}</div>
        </div>
    `;

    let events = [];
    try {
        events = await va.getVettingTimelineEvents(userId, isCompany);
    } catch (e) {
        console.warn('Vetting timeline load failed', e);
    }
    const lines = [];
    const hasReg = events.some(ev => ev.action === 'user_registered' || ev.action === 'company_registered');
    if (!hasReg) {
        lines.push(`<li><strong>Registered</strong> — ${escapeHtmlDetail(formatDateDetail(person.createdAt))}</li>`);
    }
    events.forEach(ev => {
        const label = timelineActionLabel(ev.action);
        lines.push(`<li><strong>${escapeHtmlDetail(label)}</strong> — ${escapeHtmlDetail(formatDateDetail(ev.timestamp))}</li>`);
    });
    if (timelineBody) {
        timelineBody.innerHTML = `<ul class="user-detail-vetting-timeline">${lines.join('')}</ul>`;
    }
}

function getRequirementsContext(person, isCompany) {
    const profile = person.profile || {};
    const lookups = adminDetailLookups || {};
    if (isCompany) {
        const role = profile.companyRole || 'beneficiary';
        const expected = lookups.companyRoleDocuments?.[role] || [];
        return {
            type: 'company',
            expected,
            requirements: { documents: expected.length ? 'required' : 'optional' },
            label: `Company (${role})`
        };
    }
    const indivType = profile.type === 'consultant' || profile.individualType === 'consultant' || person.role === 'consultant' ? 'consultant' : 'professional';
    const expected = lookups.individualTypeDocuments?.[indivType] || [];
    const requirements = lookups.vettingRequirements?.[indivType] || {};
    return { type: indivType, expected, requirements, label: indivType === 'consultant' ? 'Consultant' : 'Professional' };
}

function getSubmittedDocuments(person) {
    const profile = person.profile || {};
    return Array.isArray(profile.documents) ? profile.documents : [];
}

function findDocByType(docs, typeId) {
    if (!Array.isArray(docs) || !typeId) return null;
    return docs.find(d => d?.type === typeId) || null;
}

function renderVettingChecklist(person, isCompany) {
    const ul = document.getElementById('user-detail-vetting');
    const progress = document.getElementById('user-detail-vetting-progress');
    if (!ul) return;

    const profile = person.profile || {};
    const ctx = getRequirementsContext(person, isCompany);
    const docs = getSubmittedDocuments(person);
    const items = [];

    const requiredDocs = (ctx.expected || []).filter(d => d.required);
    const optionalDocs = (ctx.expected || []).filter(d => !d.required);

    requiredDocs.forEach(d => {
        const submitted = findDocByType(docs, d.id);
        items.push({
            label: d.label,
            note: submitted ? `Submitted: ${escapeHtmlDetail(submitted.fileName || submitted.name || 'file attached')}` : 'Required — not submitted',
            state: submitted ? 'ok' : 'missing',
            link: 'documents'
        });
    });

    optionalDocs.forEach(d => {
        const submitted = findDocByType(docs, d.id);
        items.push({
            label: `${d.label} (optional)`,
            note: submitted ? `Submitted: ${escapeHtmlDetail(submitted.fileName || submitted.name || 'file attached')}` : 'Optional — not submitted',
            state: submitted ? 'ok' : 'optional',
            link: 'documents'
        });
    });

    if (!isCompany) {
        const vc = profile.vettingCaseStudy;
        const caseStudies = profile.caseStudies || [];
        const hasCaseStudy = (vc && (vc.title || vc.url || vc.description)) || caseStudies.length > 0;
        const caseStudyState = ctx.requirements.caseStudy === 'required' ? (hasCaseStudy ? 'ok' : 'missing') : hasCaseStudy ? 'ok' : 'optional';
        items.push({
            label: `Case study${ctx.requirements.caseStudy === 'optional' ? ' (optional)' : ''}`,
            note: hasCaseStudy
                ? vc?.title
                    ? `“${escapeHtmlDetail(vc.title)}”`
                    : 'Provided'
                : ctx.requirements.caseStudy === 'required'
                  ? 'Required for this role'
                  : 'Optional for this role',
            state: caseStudyState,
            link: 'documents'
        });

        const inv = profile.interview;
        const interviewOk = !!(inv?.link || inv?.scheduledAt || inv?.result === 'pass');
        const interviewState = ctx.requirements.interview === 'required' ? (interviewOk ? 'ok' : 'missing') : interviewOk ? 'ok' : 'optional';
        items.push({
            label: `Interview${ctx.requirements.interview === 'optional' ? ' (optional)' : ''}`,
            note: interviewOk
                ? `${inv?.link ? 'Link set' : ''}${inv?.scheduledAt ? ` · ${formatDateDetail(inv.scheduledAt)}` : ''}${inv?.result ? ` · Result: ${inv.result}` : ''}`
                : ctx.requirements.interview === 'required'
                  ? 'Required — not scheduled'
                  : 'Not scheduled',
            state: interviewState
        });

        items.push({
            label: 'Phone verified',
            note: profile.phoneVerified || profile.mobileVerified ? 'Yes' : 'Not verified yet',
            state: profile.phoneVerified || profile.mobileVerified ? 'ok' : 'optional'
        });
        items.push({
            label: 'ID verified',
            note: profile.idVerified ? 'Yes' : 'Not verified yet',
            state: profile.idVerified ? 'ok' : 'optional'
        });
    }

    ul.innerHTML = items
        .map(it => {
            const stateClass =
                it.state === 'ok'
                    ? 'is-ok'
                    : it.state === 'missing'
                      ? 'is-missing'
                      : 'is-optional';
            const icon = it.state === 'ok' ? '✓' : it.state === 'missing' ? '✕' : '–';
            const action = it.link === 'documents'
                ? '<button type="button" class="user-detail-checklist-action" data-go-tab="documents">View documents →</button>'
                : '';
            return `
            <li class="user-detail-checklist-item ${stateClass}">
                <span class="user-detail-checklist-icon ${stateClass}">${icon}</span>
                <div class="user-detail-checklist-body">
                    <div class="user-detail-checklist-label">${escapeHtmlDetail(it.label)}</div>
                    <div class="user-detail-checklist-note">${it.note || ''}</div>
                </div>
                ${action}
            </li>
        `;
        })
        .join('');

    ul.querySelectorAll('[data-go-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-go-tab');
            const tabBtn = document.querySelector(`.user-detail-tab[data-tab="${target}"]`);
            tabBtn?.click();
        });
    });

    if (progress) {
        const required = items.filter(i => i.state === 'missing' || i.state === 'ok').filter((i, idx, arr) => {
            return i.state !== 'optional';
        });
        const okCount = required.filter(i => i.state === 'ok').length;
        const total = required.length;
        progress.textContent = total
            ? `${okCount} of ${total} required items satisfied${ctx.label ? ` for ${ctx.label}` : ''}.`
            : 'No required items to verify.';
    }
}

function renderDocumentsTab(person, isCompany) {
    const profile = person.profile || {};
    const ctx = getRequirementsContext(person, isCompany);
    const docs = getSubmittedDocuments(person);
    const summary = document.getElementById('documents-summary');
    const tabCount = document.getElementById('tab-count-documents');
    const required = document.getElementById('documents-required');
    const requiredList = document.getElementById('documents-required-list');
    const extra = document.getElementById('documents-extra');
    const extraList = document.getElementById('documents-extra-list');
    const caseStudyWrap = document.getElementById('documents-case-study');
    const caseStudyCard = document.getElementById('documents-case-study-card');
    const empty = document.getElementById('documents-empty');
    const openAllBtn = document.getElementById('documents-download-all');

    const expected = ctx.expected || [];
    const hasExpected = expected.length > 0;
    const submittedCount = docs.length;

    if (tabCount) {
        if (submittedCount > 0) {
            tabCount.hidden = false;
            tabCount.textContent = String(submittedCount);
        } else {
            tabCount.hidden = true;
        }
    }

    let caseStudyVisible = false;
    if (!isCompany) {
        const vc = profile.vettingCaseStudy;
        const caseStudies = profile.caseStudies || [];
        const hasCaseStudy = (vc && (vc.title || vc.url || vc.description || (vc.documents || []).length > 0)) || caseStudies.length > 0;
        if (hasCaseStudy && caseStudyWrap && caseStudyCard) {
            caseStudyVisible = true;
            caseStudyCard.innerHTML = renderCaseStudyCard(vc, caseStudies);
        }
        if (caseStudyWrap) caseStudyWrap.hidden = !caseStudyVisible;
    } else if (caseStudyWrap) {
        caseStudyWrap.hidden = true;
    }

    if (hasExpected && requiredList && required) {
        required.hidden = false;
        requiredList.innerHTML = expected
            .map(item => {
                const submitted = findDocByType(docs, item.id);
                const stateClass = submitted ? 'is-submitted' : item.required ? 'is-missing is-required-strict' : 'is-missing';
                const iconClass = submitted ? 'is-ok' : item.required ? 'is-strict-missing' : 'is-missing';
                const iconChar = submitted ? '✓' : item.required ? '✕' : '!';
                const note = submitted
                    ? `Submitted${submitted.fileName ? ` · ${escapeHtmlDetail(submitted.fileName)}` : ''}`
                    : item.required
                      ? 'Required document — missing'
                      : 'Optional document — not provided';
                const action = submitted
                    ? `<button type="button" class="document-required-row-action" data-doc-id="${escapeHtmlDetail(item.id)}">
                            <i class="ph-duotone ph-eye" aria-hidden="true"></i><span>View</span>
                        </button>`
                    : '';
                return `
                <div class="document-required-row ${stateClass}">
                    <span class="document-required-row-state ${iconClass}">${iconChar}</span>
                    <div class="document-required-row-body">
                        <div class="document-required-row-label">${escapeHtmlDetail(item.label)}</div>
                        <div class="document-required-row-note">${note}</div>
                    </div>
                    ${action}
                </div>
            `;
            })
            .join('');

        requiredList.querySelectorAll('[data-doc-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-doc-id');
                const doc = findDocByType(docs, id);
                if (doc) openDocumentPreview(doc);
            });
        });
    } else if (required) {
        required.hidden = true;
    }

    const renderableDocs = docs.filter(d => !!getDocumentName(d));
    if (renderableDocs.length > 0 && extra && extraList) {
        extra.hidden = false;
        extraList.innerHTML = renderableDocs.map((d, idx) => renderDocumentCard(d, idx)).join('');

        extraList.querySelectorAll('[data-doc-index]').forEach(el => {
            el.addEventListener('click', e => {
                if (e.target.closest('[data-doc-action="download"]')) return;
                const idx = Number(el.getAttribute('data-doc-index'));
                const doc = renderableDocs[idx];
                if (doc) openDocumentPreview(doc);
            });
        });
        extraList.querySelectorAll('[data-doc-action="view"]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const idx = Number(btn.getAttribute('data-doc-index'));
                const doc = renderableDocs[idx];
                if (doc) openDocumentPreview(doc);
            });
        });
        extraList.querySelectorAll('[data-doc-action="download"]').forEach(link => {
            link.addEventListener('click', e => e.stopPropagation());
        });
    } else if (extra) {
        extra.hidden = true;
    }

    if (openAllBtn) {
        const docsWithSource = renderableDocs.filter(d => !!getDocumentSource(d));
        if (docsWithSource.length > 1) {
            openAllBtn.hidden = false;
            openAllBtn.onclick = () => {
                docsWithSource.forEach(d => {
                    const src = getDocumentSource(d);
                    if (src) window.open(src, '_blank', 'noopener');
                });
            };
        } else {
            openAllBtn.hidden = true;
        }
    }

    const totalDescription = [];
    if (submittedCount) totalDescription.push(`${submittedCount} file${submittedCount === 1 ? '' : 's'} submitted`);
    if (expected.length) totalDescription.push(`${expected.filter(e => findDocByType(docs, e.id)).length}/${expected.length} required document${expected.length === 1 ? '' : 's'}`);
    if (caseStudyVisible) totalDescription.push('Case study attached');
    if (summary) summary.textContent = totalDescription.length ? totalDescription.join(' · ') : 'No documents submitted yet.';

    const nothingToShow = submittedCount === 0 && !hasExpected && !caseStudyVisible;
    if (empty) empty.hidden = !nothingToShow;
}

function renderDocumentCard(doc, index) {
    const mime = getDocumentMimeType(doc);
    const src = getDocumentSource(doc);
    const name = getDocumentName(doc);
    const badge = getDocBadgeLabel(mime, doc);
    const preview = isImageMime(mime) && src
        ? `<img src="${escapeHtmlDetail(src)}" alt="${escapeHtmlDetail(name)}">`
        : `<i class="document-card-preview-icon ${getDocIconClass(mime)}" aria-hidden="true"></i>`;

    const sizeLabel = formatBytes(doc.size);
    const dateLabel = doc.uploadedAt ? formatDateOnlyDetail(doc.uploadedAt) : null;
    const meta = [];
    if (doc.label && doc.label !== name) meta.push(escapeHtmlDetail(doc.label));
    if (sizeLabel) meta.push(escapeHtmlDetail(sizeLabel));
    if (dateLabel) meta.push(escapeHtmlDetail(dateLabel));

    const viewAttrs = src ? '' : 'disabled';
    const downloadAttrs = src
        ? `href="${escapeHtmlDetail(src)}" target="_blank" rel="noopener" download="${escapeHtmlDetail(name)}"`
        : 'aria-disabled="true" style="pointer-events:none;opacity:.5"';

    return `
        <article class="document-card" data-doc-index="${index}">
            <div class="document-card-preview">
                ${preview}
                <span class="document-card-preview-badge">${escapeHtmlDetail(badge)}</span>
            </div>
            <div class="document-card-body">
                <div class="document-card-label" title="${escapeHtmlDetail(name)}">${escapeHtmlDetail(name)}</div>
                <div class="document-card-meta">${meta.map(m => `<span>${m}</span>`).join('')}</div>
            </div>
            <div class="document-card-actions">
                <button type="button" class="btn btn-secondary" data-doc-action="view" data-doc-index="${index}" ${viewAttrs}>
                    <i class="ph-duotone ph-eye" aria-hidden="true"></i>
                    <span>Preview</span>
                </button>
                <a class="btn btn-secondary" data-doc-action="download" ${downloadAttrs}>
                    <i class="ph-duotone ph-download-simple" aria-hidden="true"></i>
                    <span>Open</span>
                </a>
            </div>
        </article>
    `;
}

function renderCaseStudyCard(vc, caseStudies) {
    const parts = [];
    if (vc && (vc.title || vc.url || vc.description)) {
        parts.push(`<p class="documents-case-study-title">${escapeHtmlDetail(vc.title || 'Case study')}</p>`);
        if (vc.description) {
            parts.push(`<p class="documents-case-study-desc">${escapeHtmlDetail(vc.description)}</p>`);
        }
        if (vc.url) {
            parts.push(`<a href="${escapeHtmlDetail(vc.url)}" class="documents-case-study-url" target="_blank" rel="noopener">
                <i class="ph-duotone ph-link-simple" aria-hidden="true"></i>
                <span>${escapeHtmlDetail(vc.url)}</span>
            </a>`);
        }
        const files = Array.isArray(vc.documents) ? vc.documents : [];
        if (files.length > 0) {
            parts.push('<div class="documents-case-study-files">');
            files.forEach((f, idx) => {
                parts.push(renderDocumentCard(f, `case-${idx}`));
            });
            parts.push('</div>');
        }
    }
    if (caseStudies.length > 0) {
        parts.push('<div class="documents-case-study-files">');
        caseStudies.forEach((cs, idx) => {
            const dummyDoc = {
                name: cs.title || `Case study ${idx + 1}`,
                url: cs.url || null,
                description: cs.description || ''
            };
            parts.push(renderDocumentCard(dummyDoc, `cs-${idx}`));
        });
        parts.push('</div>');
    }
    return parts.join('');
}

function openDocumentPreview(doc) {
    const mime = getDocumentMimeType(doc);
    const src = getDocumentSource(doc);
    const name = getDocumentName(doc);
    const safeName = escapeHtmlDetail(name);
    if (!window.modalService) {
        if (src) window.open(src, '_blank', 'noopener');
        return;
    }
    let body;
    if (!src) {
        body = `<div class="document-preview-fallback">
            <p>No file attached for <strong>${safeName}</strong>.</p>
        </div>`;
    } else if (isImageMime(mime)) {
        body = `<img class="document-preview-image" src="${escapeHtmlDetail(src)}" alt="${safeName}">`;
    } else if (isPdfMime(mime)) {
        body = `<iframe class="document-preview-frame" src="${escapeHtmlDetail(src)}" title="${safeName}"></iframe>`;
    } else {
        body = `<div class="document-preview-fallback">
            <p><strong>${safeName}</strong></p>
            <p>This file type can’t be previewed in-browser. Use the link below to open or download it.</p>
            <p><a href="${escapeHtmlDetail(src)}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
                <i class="ph-duotone ph-download-simple" aria-hidden="true"></i>
                <span>Open file</span>
            </a></p>
        </div>`;
    }
    window.modalService.showCustom(body, name, { confirmText: 'Close' });
}

function setupVerificationAndInterviewControls(person, userId, isCompany) {
    const canWriteUsers = authService.hasAdminCapability && authService.hasAdminCapability('admin.users.write');
    const verificationWrap = document.getElementById('user-detail-verification-edit');
    const interviewWrap = document.getElementById('user-detail-interview-edit');
    const isIndividual = !isCompany && (person.role === 'professional' || person.role === 'consultant');
    const showVerificationEdit = (isIndividual || isCompany) && canWriteUsers;

    if (verificationWrap) verificationWrap.hidden = !showVerificationEdit;
    if (interviewWrap) interviewWrap.hidden = !canWriteUsers;

    const verificationSelect = document.getElementById('admin-verification-status');
    const tierSelect = document.getElementById('admin-verification-tier');
    if (verificationSelect) verificationSelect.value = person.profile?.verificationStatus || 'unverified';
    if (tierSelect) tierSelect.value = person.profile?.verificationTier || '';

    if (showVerificationEdit) {
        document.getElementById('admin-save-verification').onclick = async () => {
            try {
                authService.assertAdminCapability('admin.users.write');
            } catch (err) {
                await (window.modalService?.error?.(err?.message || 'You do not have permission.') ?? Promise.resolve());
                return;
            }
            const status = verificationSelect.value;
            const tier = tierSelect?.value || '';
            const updatedProfile = { ...(person.profile || {}), verificationStatus: status, verificationTier: tier || null };
            try {
                if (isCompany) await dataService.updateCompany(userId, { profile: updatedProfile });
                else await dataService.updateUser(userId, { profile: updatedProfile });
                await loadUserDetail(userId);
            } catch (e) {
                console.error(e);
                await (window.modalService?.error?.('Failed to save verification status.') ?? Promise.resolve());
            }
        };
    }

    const inv = person.profile?.interview;
    const linkInput = document.getElementById('admin-interview-link');
    const dateInput = document.getElementById('admin-interview-scheduledAt');
    const resultSelect = document.getElementById('admin-interview-result');
    if (linkInput) linkInput.value = inv?.link || '';
    if (dateInput) dateInput.value = inv?.scheduledAt ? new Date(inv.scheduledAt).toISOString().slice(0, 16) : '';
    if (resultSelect) resultSelect.value = inv?.result || 'pending';

    if (canWriteUsers) {
        document.getElementById('admin-save-interview').onclick = async () => {
            try {
                authService.assertAdminCapability('admin.users.write');
            } catch (err) {
                await (window.modalService?.error?.(err?.message || 'You do not have permission.') ?? Promise.resolve());
                return;
            }
            const link = (linkInput?.value || '').trim();
            const scheduledAt = dateInput?.value;
            const result = resultSelect?.value || 'pending';
            const interview = {
                link: link || null,
                scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
                result: result || null
            };
            let updatedProfile = { ...(person.profile || {}), interview };
            if (!isCompany && person.role === 'consultant' && result === 'pass') {
                updatedProfile = { ...updatedProfile, verificationStatus: 'consultant_verified' };
            }
            try {
                if (isCompany) await dataService.updateCompany(userId, { profile: updatedProfile });
                else await dataService.updateUser(userId, { profile: updatedProfile });
                await loadUserDetail(userId);
            } catch (e) {
                console.error(e);
                await (window.modalService?.error?.('Failed to save interview details.') ?? Promise.resolve());
            }
        };
    }
}

async function renderActivitySection(userId) {
    const opportunities = await dataService.getOpportunities();
    const oppEl = document.getElementById('user-opportunities');
    const userOpps = opportunities.filter(o => o.creatorId === userId);
    if (oppEl) {
        oppEl.innerHTML =
            userOpps.length === 0
                ? '<p class="user-detail-empty-section">No opportunities created.</p>'
                : userOpps
                      .map(o => {
                          const sb = window.statusBadgeSystem;
                          const stHtml =
                              sb && typeof sb.renderStatusBadge === 'function'
                                  ? sb.renderStatusBadge(o.status || 'draft', 'opportunity')
                                  : `<span class="badge badge--neutral">${escapeHtmlDetail(o.status || 'draft')}</span>`;
                          return `
                <div class="user-detail-link-row">
                    <a href="#" data-route="/opportunities/${escapeHtmlDetail(o.id)}">${escapeHtmlDetail(o.title || o.id)}</a>
                    ${stHtml}
                </div>`;
                      })
                      .join('');
    }

    const applications = await dataService.getApplications();
    const appEl = document.getElementById('user-applications');
    const userApps = applications.filter(a => a.applicantId === userId);
    if (appEl) {
        if (userApps.length === 0) {
            appEl.innerHTML = '<p class="user-detail-empty-section">No applications submitted.</p>';
        } else {
            const oppMap = {};
            opportunities.forEach(o => {
                oppMap[o.id] = o;
            });
            appEl.innerHTML = userApps
                .map(a => {
                    const opp = oppMap[a.opportunityId];
                    const title = opp ? opp.title : a.opportunityId;
                    const sb = window.statusBadgeSystem;
                    const stHtml =
                        sb && typeof sb.renderStatusBadge === 'function'
                            ? sb.renderStatusBadge(a.status || 'pending', 'application')
                            : `<span class="badge badge--neutral">${escapeHtmlDetail(a.status || 'pending')}</span>`;
                    return `
                <div class="user-detail-link-row">
                    <a href="#" data-route="/opportunities/${escapeHtmlDetail(a.opportunityId)}">${escapeHtmlDetail(title)}</a>
                    ${stHtml}
                </div>`;
                })
                .join('');
        }
    }

    const auditLogs = await dataService.getAuditLogs({});
    const relatedLogs = auditLogs
        .filter(l =>
            l.userId === userId ||
            (l.entityType === 'user' && l.entityId === userId) ||
            (l.entityType === 'company' && l.entityId === userId)
        )
        .slice(0, 30);
    const auditEl = document.getElementById('user-audit');
    if (auditEl) {
        if (relatedLogs.length === 0) {
            auditEl.innerHTML = '<p class="user-detail-empty-section">No related audit entries.</p>';
        } else {
            auditEl.innerHTML = relatedLogs
                .map(l => {
                    const a = (l.action || '').toLowerCase();
                    let dotClass = '';
                    if (/(approv|reject|vet|clarif)/.test(a)) dotClass = 'is-approval';
                    else if (/(fail|error|exception)/.test(a)) dotClass = 'is-error';
                    else if (/(login|logout|session|signin|sign_in)/.test(a)) dotClass = 'is-login';
                    return `
                    <div class="user-detail-audit-row">
                        <span class="user-detail-audit-dot ${dotClass}" aria-hidden="true"></span>
                        <div>
                            <span class="user-detail-audit-action">${escapeHtmlDetail((l.action || '').replace(/_/g, ' '))}</span>
                            ${l.entityType ? `<span class="user-detail-audit-entity">${escapeHtmlDetail(l.entityType)}${l.entityId ? ` · ${escapeHtmlDetail(l.entityId)}` : ''}</span>` : ''}
                            ${
                                l.userName || l.ipAddress
                                    ? `<div class="user-detail-audit-meta">${escapeHtmlDetail([l.userName, l.ipAddress].filter(Boolean).join(' · '))}</div>`
                                    : ''
                            }
                        </div>
                        <span class="user-detail-audit-time">${escapeHtmlDetail(formatDateDetail(l.timestamp))}</span>
                    </div>`;
                })
                .join('');
        }
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

async function approveFromDetail(userId, isCompany) {
    try {
        authService.assertAdminCapability('admin.vetting');
    } catch (err) {
        await (window.modalService?.error?.(err?.message || 'You do not have permission.') ?? Promise.resolve());
        return;
    }
    if (!window.vettingActions) {
        await (window.modalService?.error?.('Vetting module not loaded. Refresh the page.') ?? Promise.resolve());
        return;
    }
    const ok = await (window.modalService?.confirm?.(
        `Approve this ${isCompany ? 'company' : 'user'}? They will be notified and gain full access.`,
        'Approve account',
        { confirmText: 'Approve', cancelText: 'Cancel', type: 'success' }
    ) ?? Promise.resolve(true));
    if (!ok) return;
    try {
        await window.vettingActions.approveAccount(userId, isCompany, { details: { from: 'admin-user-detail' } });
        await loadUserDetail(userId);
    } catch (e) {
        console.error('Error approving:', e);
        await (window.modalService?.error?.(e?.message || 'Failed to approve. Please try again.') ?? Promise.resolve());
    }
}

async function rejectFromDetail(userId, isCompany) {
    try {
        authService.assertAdminCapability('admin.vetting');
    } catch (err) {
        await (window.modalService?.error?.(err?.message || 'You do not have permission.') ?? Promise.resolve());
        return;
    }
    if (!window.vettingActions) {
        await (window.modalService?.error?.('Vetting module not loaded. Refresh the page.') ?? Promise.resolve());
        return;
    }
    const reason = await (window.modalService?.prompt?.(
        `Reject this ${isCompany ? 'company' : 'user'}? Add an optional reason — they will be notified.`,
        {
            title: 'Reject account',
            confirmText: 'Reject account',
            cancelText: 'Cancel',
            placeholder: 'Reason for rejection (optional)…',
            type: 'error'
        }
    ) ?? Promise.resolve(null));
    if (reason === null) return;
    try {
        await window.vettingActions.rejectAccount(userId, isCompany, (reason || '').trim(), { details: { from: 'admin-user-detail' } });
        await loadUserDetail(userId);
    } catch (e) {
        console.error('Error rejecting:', e);
        await (window.modalService?.error?.(e?.message || 'Failed to reject. Please try again.') ?? Promise.resolve());
    }
}

async function clarifyFromDetail(userId, isCompany) {
    try {
        authService.assertAdminCapability('admin.vetting');
    } catch (err) {
        await (window.modalService?.error?.(err?.message || 'You do not have permission.') ?? Promise.resolve());
        return;
    }
    if (!window.vettingActions) {
        await (window.modalService?.error?.('Vetting module not loaded. Refresh the page.') ?? Promise.resolve());
        return;
    }
    const data = await window.vettingActions.openRequestUpdatesModal({ bulkCount: 0 });
    if (!data) return;
    try {
        await window.vettingActions.requestAccountUpdates(userId, isCompany, data.reasonIds, data.note, { details: { from: 'admin-user-detail' } });
        await loadUserDetail(userId);
    } catch (e) {
        console.error('Error requesting updates:', e);
        await (window.modalService?.error?.(e?.message || 'Failed to request updates.') ?? Promise.resolve());
    }
}
