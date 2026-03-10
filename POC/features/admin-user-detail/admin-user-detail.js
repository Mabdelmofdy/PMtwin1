/**
 * Admin User Detail – full profile, activity, opportunities, applications, audit
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

async function initAdminUserDetail(params) {
    if (!authService.isAdmin()) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }
    const id = params?.id;
    if (!id) {
        router.navigate(CONFIG.ROUTES.ADMIN_USERS);
        return;
    }
    await loadUserDetail(id);
}

async function loadUserDetail(userId) {
    const person = await dataService.getPersonById(userId);
    if (!person) {
        document.getElementById('main-content').innerHTML = '<div class="empty-state">User or company not found.</div>';
        return;
    }

    const isCompany = person.profile?.type === 'company';
    document.getElementById('user-detail-name').textContent = person.profile?.name || person.email || userId;
    document.getElementById('user-detail-email').textContent = person.email || '-';
    const verificationStatus = person.profile?.verificationStatus;
    const verificationBadge = verificationStatus === 'professional_verified' ? 'Verified Professional' : verificationStatus === 'consultant_verified' ? 'Verified Consultant' : verificationStatus === 'company_verified' ? 'Verified Company' : null;
    const badgesEl = document.getElementById('user-detail-badges');
    badgesEl.innerHTML = `
        <span class="badge badge-${person.status === 'active' ? 'success' : person.status === 'pending' ? 'warning' : 'secondary'}">${person.status}</span>
        <span class="badge badge-secondary">${person.role || '-'}</span>
        <span class="badge badge-secondary">${isCompany ? 'Company' : 'User'}</span>
        ${verificationBadge ? `<span class="badge badge-success">${verificationBadge}</span>` : ''}
    `;

    const profileEl = document.getElementById('user-detail-profile');
    profileEl.innerHTML = `
        <div class="detail-item"><strong>ID</strong> ${person.id}</div>
        <div class="detail-item"><strong>Email</strong> ${person.email || '-'}</div>
        <div class="detail-item"><strong>Name</strong> ${person.profile?.name || '-'}</div>
        <div class="detail-item"><strong>Role</strong> ${person.role || '-'}</div>
        <div class="detail-item"><strong>Status</strong> ${person.status || '-'}</div>
        <div class="detail-item"><strong>Registered</strong> ${person.createdAt ? new Date(person.createdAt).toLocaleDateString() : '-'}</div>
    `;

    await loadAdminDetailLookups();
    const docs = person.profile?.documents || [];
    const vc = person.profile?.vettingCaseStudy;
    const inv = person.profile?.interview;
    const caseStudies = person.profile?.caseStudies || [];
    const hasCaseStudy = (vc && (vc.title || vc.url || vc.description)) || caseStudies.length > 0;
    const supportingFiles = vc?.documents || [];
    const type = person.profile?.type === 'consultant' || person.role === 'consultant' ? 'consultant' : 'professional';
    const req = adminDetailLookups?.vettingRequirements?.[type] || {};
    const certOk = docs.length > 0;
    const caseStudyOk = req.caseStudy === 'optional' ? true : hasCaseStudy;
    const interviewOk = !!(inv?.link || inv?.scheduledAt);
    const vettingEl = document.getElementById('user-detail-vetting');
    const supportingFilesHtml = supportingFiles.length > 0
        ? '<div class="detail-item">Case study supporting files: ' + supportingFiles.map(f => f.name || 'File').join(', ') + '</div>'
        : '';
    vettingEl.innerHTML = `
        <div class="detail-item"><strong>Requirements</strong> <span class="badge badge-secondary">${type === 'consultant' ? 'Consultant' : 'Professional'}</span></div>
        <div class="detail-item">Certifications ${req.certifications === 'required' ? (certOk ? '✓' : '✗') : '—'} ${docs.length === 0 ? 'None' : docs.map(d => d.label || d.type || 'Document').join(', ')}</div>
        <div class="detail-item">Case study ${req.caseStudy ? (caseStudyOk ? '✓' : '✗') : '—'} ${vc && (vc.title || vc.url || vc.description) ? (vc.title || '') + (vc.url ? ' · ' + vc.url : '') + (vc.description ? ' · ' + vc.description : '') : (caseStudies.length ? 'Portfolio provided' : '—')}</div>
        ${supportingFilesHtml}
        <div class="detail-item">Interview ${req.interview === 'required' ? (interviewOk ? '✓' : '✗') : '—'} ${inv?.link ? '<a href="' + inv.link + '" target="_blank">Link</a>' : '—'} ${inv?.scheduledAt ? ' · ' + new Date(inv.scheduledAt).toLocaleString() : ''} ${inv?.result ? ' · Result: ' + inv.result : ''}</div>
    `;
    const isIndividual = !isCompany && (person.role === 'professional' || person.role === 'consultant');
    const verificationEditWrap = document.getElementById('user-detail-verification-edit');
    const showVerificationEdit = isIndividual || isCompany;
    if (verificationEditWrap) verificationEditWrap.style.display = showVerificationEdit ? 'block' : 'none';
    const verificationSelect = document.getElementById('admin-verification-status');
    if (verificationSelect) {
        verificationSelect.innerHTML = [
            '<option value="unverified">Unverified</option>',
            '<option value="professional_verified">Verified Professional</option>',
            '<option value="consultant_verified">Verified Consultant</option>',
            '<option value="company_verified">Verified Company</option>'
        ].join('');
        verificationSelect.value = person.profile?.verificationStatus || 'unverified';
    }
    if (showVerificationEdit) {
        document.getElementById('admin-save-verification').onclick = async () => {
            const status = document.getElementById('admin-verification-status').value;
            const updatedProfile = { ...(person.profile || {}), verificationStatus: status };
            try {
                if (isCompany) await dataService.updateCompany(userId, { profile: updatedProfile });
                else await dataService.updateUser(userId, { profile: updatedProfile });
                await loadUserDetail(userId);
            } catch (e) {
                console.error(e);
                alert('Failed to save verification status.');
            }
        };
    }
    const interviewEditWrap = document.getElementById('user-detail-interview-edit');
    if (interviewEditWrap) interviewEditWrap.style.display = 'block';
    document.getElementById('admin-interview-link').value = inv?.link || '';
    document.getElementById('admin-interview-scheduledAt').value = inv?.scheduledAt ? new Date(inv.scheduledAt).toISOString().slice(0, 16) : '';
    const resultSelect = document.getElementById('admin-interview-result');
    if (resultSelect) resultSelect.value = inv?.result || 'pending';
    document.getElementById('admin-save-interview').onclick = async () => {
        const link = document.getElementById('admin-interview-link').value.trim();
        const scheduledAt = document.getElementById('admin-interview-scheduledAt').value;
        const result = document.getElementById('admin-interview-result')?.value || 'pending';
        const interview = { link: link || null, scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null, result: result || null };
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
            alert('Failed to save interview details.');
        }
    };

    const opportunities = await dataService.getOpportunities();
    const userOpps = opportunities.filter(o => o.creatorId === userId);
    const oppEl = document.getElementById('user-opportunities');
    if (userOpps.length === 0) {
        oppEl.innerHTML = '<p class="empty-section">None</p>';
    } else {
        oppEl.innerHTML = userOpps.map(o => `
            <div class="detail-item">
                <a href="#" data-route="/opportunities/${o.id}">${o.title || o.id}</a>
                <span class="badge badge-secondary">${o.status || 'draft'}</span>
            </div>
        `).join('');
    }

    const applications = await dataService.getApplications();
    const userApps = applications.filter(a => a.applicantId === userId);
    const appEl = document.getElementById('user-applications');
    if (userApps.length === 0) {
        appEl.innerHTML = '<p class="empty-section">None</p>';
    } else {
        const oppMap = {};
        opportunities.forEach(o => { oppMap[o.id] = o; });
        appEl.innerHTML = userApps.map(a => {
            const opp = oppMap[a.opportunityId];
            const title = opp ? opp.title : a.opportunityId;
            return `
            <div class="detail-item">
                <a href="#" data-route="/opportunities/${a.opportunityId}">${title}</a>
                <span class="badge badge-secondary">${a.status || 'pending'}</span>
            </div>
            `;
        }).join('');
    }

    const auditLogs = await dataService.getAuditLogs({});
    const relatedLogs = auditLogs.filter(l =>
        l.userId === userId || (l.entityType === 'user' && l.entityId === userId) || (l.entityType === 'company' && l.entityId === userId)
    ).slice(0, 30);
    const auditEl = document.getElementById('user-audit');
    if (relatedLogs.length === 0) {
        auditEl.innerHTML = '<p class="empty-section">No related audit entries</p>';
    } else {
        auditEl.innerHTML = relatedLogs.map(l => `
            <div class="audit-item">
                <strong>${(l.action || '').replace(/_/g, ' ')}</strong>
                ${l.entityType ? ` · ${l.entityType}` : ''}
                ${l.entityId ? ` · ${l.entityId}` : ''}
                <span class="text-muted">${l.timestamp ? new Date(l.timestamp).toLocaleString() : ''}</span>
            </div>
        `).join('');
    }
}
