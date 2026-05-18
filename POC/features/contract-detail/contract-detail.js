/**
 * Contract Detail – legal agreement only (multi-party).
 * Shows parties, scope, payment, duration, dates. Execution is on the linked Deal.
 */

function escapeHtml(str) {
    if (str == null || str === '') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getContractStatusBadgeClass(status) {
    return window.statusBadgeSystem ? window.statusBadgeSystem.getStatusBadgeClass(status, 'contract') : 'badge--neutral';
}

function getContractStatusLabel(status) {
    const ui = window.DealContractFlowUi;
    if (ui && typeof ui.getContractStatusDisplayLabel === 'function') return ui.getContractStatusDisplayLabel(status);
    const map = {
        pending: 'Pending Signature',
        active: 'Active Contract',
        completed: 'Completed',
        terminated: 'Terminated'
    };
    return map[status] || status;
}

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return iso;
    }
}

function formatDateShort(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return iso;
    }
}

function formatAgreedValue(av) {
    const ui = window.DealContractFlowUi;
    if (ui && typeof ui.formatAgreedValueSummary === 'function') {
        const s = ui.formatAgreedValueSummary(av);
        return s && s !== '—' ? s : '';
    }
    if (av == null || av === '') return '';
    if (typeof av === 'number') return String(av);
    if (typeof av === 'string') return av;
    if (typeof av === 'object') {
        const cash = av.cash != null ? Number(av.cash).toLocaleString(undefined, { maximumFractionDigits: 2 }) : null;
        const cur = av.currency ? String(av.currency) : '';
        if (cash != null && !Number.isNaN(Number(av.cash))) return (cur ? cur + ' ' : '') + cash;
        try {
            return JSON.stringify(av);
        } catch {
            return String(av);
        }
    }
    return String(av);
}

function buildContractEditReadonlyHtml(contract, parties, partyUsers, opportunity, dealRecord) {
    const av = formatAgreedValue(contract.agreedValue);
    const oppLabel = opportunity
        ? escapeHtml(opportunity.title || '—') +
          ' <span class="text-muted">(' +
          escapeHtml(contract.opportunityId || '') +
          ')</span>'
        : escapeHtml(contract.opportunityId || '—');
    const dealLabel = contract.dealId
        ? escapeHtml((dealRecord && dealRecord.title) || contract.dealId) +
          ' <span class="text-muted">(' +
          escapeHtml(contract.dealId) +
          ')</span>'
        : '<span class="text-muted">—</span>';
    const partyBlock = parties
        .map((p, i) => {
            const u = partyUsers[i];
            const name = escapeHtml(u?.profile?.name || u?.email || p.userId);
            const role = escapeHtml((p.role || 'participant').replace(/_/g, ' '));
            const sig = p.signedAt ? escapeHtml(formatDateShort(p.signedAt)) : 'Not signed';
            return '<li><strong>' + name + '</strong> — ' + role + ' — ' + sig + '</li>';
        })
        .join('');
    const snap = Array.isArray(contract.milestonesSnapshot) ? contract.milestonesSnapshot : [];
    const mileBlock = snap.length
        ? '<ul class="contract-edit-mile-list">' +
          snap
              .map((m) => {
                  const t = m && m.title ? String(m.title) : 'Milestone';
                  const due = m && m.dueDate ? formatDateShort(m.dueDate) : '';
                  const del = m && m.deliverables ? String(m.deliverables) : '';
                  return (
                      '<li>' +
                      escapeHtml(t) +
                      (due ? ' <span class="text-muted">· Due ' + escapeHtml(due) + '</span>' : '') +
                      (del
                          ? '<div class="text-muted" style="font-size:0.8rem;margin-top:0.15rem">' + escapeHtml(del) + '</div>'
                          : '') +
                      '</li>'
                  );
              })
              .join('') +
          '</ul>'
        : '<p class="text-muted mb-0" style="font-size:0.8125rem">No milestone snapshot on this contract.</p>';
    const pm = escapeHtml(String(contract.paymentMode || (opportunity && opportunity.exchangeMode) || '—'));
    return (
        '<div class="contract-edit-summary">' +
        '<p class="contract-edit-summary__label">All contract details (read-only)</p>' +
        '<dl class="contract-edit-summary__dl">' +
        '<dt>Contract ID</dt><dd>' +
        escapeHtml(contract.id) +
        '</dd>' +
        '<dt>Status</dt><dd>' +
        escapeHtml(getContractStatusLabel(contract.status)) +
        '</dd>' +
        '<dt>Payment mode</dt><dd>' +
        pm +
        '</dd>' +
        (av ? '<dt>Agreed value</dt><dd>' + escapeHtml(av) + '</dd>' : '') +
        '<dt>Opportunity</dt><dd>' +
        oppLabel +
        '</dd>' +
        (contract.applicationId ? '<dt>Application ID</dt><dd>' + escapeHtml(contract.applicationId) + '</dd>' : '') +
        '<dt>Linked deal</dt><dd>' +
        dealLabel +
        '</dd>' +
        '<dt>Created</dt><dd>' +
        escapeHtml(formatDateShort(contract.createdAt)) +
        '</dd>' +
        '<dt>Last updated</dt><dd>' +
        escapeHtml(formatDateShort(contract.updatedAt)) +
        '</dd>' +
        '</dl>' +
        '<p class="contract-edit-summary__label">Parties</p>' +
        '<ul class="contract-edit-party-list">' +
        (partyBlock || '<li class="text-muted">—</li>') +
        '</ul>' +
        '<p class="contract-edit-summary__label">Milestones snapshot</p>' +
        mileBlock +
        '</div>'
    );
}

/** Payment mode cards in edit modal (value + display) */
const CONTRACT_PAYMENT_MODE_FLOW = {
    cash: { label: 'Cash / invoice', desc: 'Milestones & billing', icon: 'ph-duotone ph-currency-circle-dollar' },
    barter: { label: 'Barter', desc: 'In-kind exchange', icon: 'ph-duotone ph-arrows-left-right' },
    equity: { label: 'Equity', desc: 'Ownership stake', icon: 'ph-duotone ph-chart-pie' },
    hybrid: { label: 'Hybrid', desc: 'Mixed structure', icon: 'ph-duotone ph-stack' },
    services: { label: 'Services', desc: 'Time & materials', icon: 'ph-duotone ph-clock-countdown' }
};

function paymentModeFlowCardsHtml(currentPm, modeChoices) {
    return modeChoices
        .map((code) => {
            const key = String(code || '').toLowerCase();
            const meta = CONTRACT_PAYMENT_MODE_FLOW[key] || {
                label: key || 'Custom',
                desc: 'Agreement-specific',
                icon: 'ph-duotone ph-handshake'
            };
            const safeId = 'edit-pay-mode-' + key.replace(/[^a-z0-9]+/gi, '-');
            const checked = key === currentPm ? ' checked' : '';
            return (
                '<label class="contract-pay-flow__card" for="' +
                escapeHtml(safeId) +
                '">' +
                '<input type="radio" name="edit-contract-payment-mode" id="' +
                escapeHtml(safeId) +
                '" value="' +
                escapeHtml(key) +
                '"' +
                checked +
                ' class="contract-pay-flow__radio" />' +
                '<span class="contract-pay-flow__card-inner">' +
                '<i class="' +
                escapeHtml(meta.icon) +
                '" aria-hidden="true"></i>' +
                '<span class="contract-pay-flow__card-title">' +
                escapeHtml(meta.label) +
                '</span>' +
                '<span class="contract-pay-flow__card-desc">' +
                escapeHtml(meta.desc) +
                '</span>' +
                '</span>' +
                '</label>'
            );
        })
        .join('');
}

function milestoneEditorRowHtml(m, idx) {
    const title = m && m.title != null ? String(m.title) : '';
    let due = m && m.dueDate != null ? String(m.dueDate) : '';
    if (due && due.length >= 10 && due.indexOf('T') >= 0) {
        due = due.slice(0, 10);
    }
    const del = m && m.deliverables != null ? String(m.deliverables) : '';
    return (
        '<div class="contract-edit-milestone-row" data-milestone-index="' +
        String(idx) +
        '">' +
        '<div class="contract-edit-milestone-row__grid">' +
        '<div class="contract-edit-milestone-field">' +
        '<label class="contract-edit-milestone-label">Milestone title</label>' +
        '<input type="text" class="contract-edit-milestone-input" data-field="title" value="' +
        escapeHtml(title) +
        '" placeholder="e.g. Design sign-off" />' +
        '</div>' +
        '<div class="contract-edit-milestone-field contract-edit-milestone-field--date">' +
        '<label class="contract-edit-milestone-label">Due date</label>' +
        '<input type="date" class="contract-edit-milestone-input" data-field="due" value="' +
        escapeHtml(due) +
        '" />' +
        '</div>' +
        '<div class="contract-edit-milestone-field">' +
        '<label class="contract-edit-milestone-label">Deliverables</label>' +
        '<input type="text" class="contract-edit-milestone-input" data-field="deliverables" value="' +
        escapeHtml(del) +
        '" placeholder="What is delivered or verified" />' +
        '</div>' +
        '</div>' +
        '<button type="button" class="btn btn-outline btn-sm contract-edit-milestone-remove" aria-label="Remove milestone">Remove</button>' +
        '</div>'
    );
}

function collectMilestonesSnapshotFromModal(modal) {
    const list = modal.querySelector('#contract-edit-milestones-list');
    if (!list) return [];
    const out = [];
    list.querySelectorAll('.contract-edit-milestone-row').forEach((row) => {
        const title = (row.querySelector('[data-field="title"]')?.value || '').trim();
        const due = (row.querySelector('[data-field="due"]')?.value || '').trim();
        const deliv = (row.querySelector('[data-field="deliverables"]')?.value || '').trim();
        if (!title && !due && !deliv) return;
        out.push({
            title: title || 'Milestone',
            dueDate: due || null,
            deliverables: deliv || ''
        });
    });
    return out;
}

function wireContractEditMilestoneList(modal) {
    const list = modal.querySelector('#contract-edit-milestones-list');
    const addBtn = modal.querySelector('#contract-edit-milestone-add');
    if (!list) return;

    let nextIdx = list.querySelectorAll('.contract-edit-milestone-row').length;

    function bindRemove(row) {
        const btn = row.querySelector('.contract-edit-milestone-remove');
        if (!btn) return;
        btn.addEventListener('click', function () {
            const rows = list.querySelectorAll('.contract-edit-milestone-row');
            if (rows.length <= 1) {
                row.querySelectorAll('.contract-edit-milestone-input').forEach(function (el) {
                    el.value = '';
                });
                return;
            }
            row.remove();
        });
    }

    list.querySelectorAll('.contract-edit-milestone-row').forEach(bindRemove);

    if (addBtn) {
        addBtn.addEventListener('click', function () {
            const tpl = document.createElement('template');
            tpl.innerHTML = milestoneEditorRowHtml({ title: '', dueDate: '', deliverables: '' }, nextIdx++).trim();
            const row = tpl.content.firstElementChild;
            if (row) {
                list.appendChild(row);
                bindRemove(row);
            }
        });
    }
}

function wireRouteLinks(root) {
    if (!root || typeof router === 'undefined') return;
    root.querySelectorAll('a[data-route]').forEach((link) => {
        const route = link.getAttribute('data-route');
        if (!route) return;
        link.onclick = (e) => {
            e.preventDefault();
            router.navigate(route);
        };
    });
}

async function initContractDetail(params) {
    const contractId = params?.id;
    const loadingEl = document.getElementById('contract-loading');
    const errorEl = document.getElementById('contract-error');
    const contentEl = document.getElementById('contract-content');

    if (!contractId) {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        contentEl.style.display = 'none';
        wireRouteLinks(errorEl);
        return;
    }

    const user = authService.getCurrentUser();
    if (!user) {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        contentEl.style.display = 'none';
        wireRouteLinks(errorEl);
        return;
    }

    try {
        const contract = await dataService.getContractById(contractId);
        if (!contract) {
            loadingEl.style.display = 'none';
            errorEl.style.display = 'block';
            contentEl.style.display = 'none';
            wireRouteLinks(errorEl);
            return;
        }

        const parties = dataService.getContractParties(contract);
        const isParty = parties.some(p => p.userId === user.id);
        const isAdminView = authService.canAccessAdmin && authService.canAccessAdmin();
        if (!isParty && !isAdminView) {
            loadingEl.style.display = 'none';
            errorEl.style.display = 'block';
            contentEl.style.display = 'none';
            wireRouteLinks(errorEl);
            return;
        }

        const opportunity = await dataService.getOpportunityById(contract.opportunityId);
        const partyUsers = await Promise.all(parties.map(p => dataService.getUserOrCompanyById(p.userId)));
        const myParty = parties.find(p => p.userId === user.id);
        const myRole = (myParty && myParty.role) ? (myParty.role.charAt(0).toUpperCase() + myParty.role.slice(1)) : (isAdminView ? 'Admin (view only)' : 'Participant');
        const scopeDisplay = contract.scope || (opportunity && opportunity.title) || '—';

        loadingEl.style.display = 'none';
        errorEl.style.display = 'none';
        contentEl.style.display = 'block';

        document.getElementById('contract-title').textContent = scopeDisplay;
        document.getElementById('contract-status-badge').textContent = getContractStatusLabel(contract.status);
        document.getElementById('contract-status-badge').className = 'badge ' + getContractStatusBadgeClass(contract.status);
        document.getElementById('contract-role-badge').textContent = 'Your role: ' + myRole;

        const heroMeta = document.getElementById('contract-hero-meta');
        if (heroMeta) {
            heroMeta.textContent =
                'Contract ID: ' + contract.id + ' · Updated ' + formatDateShort(contract.updatedAt);
        }

        const partiesHtml = parties
            .map((p, i) => {
                const u = partyUsers[i];
                const name = u?.profile?.name || u?.email || p.userId;
                const email = u?.email || '—';
                const roleLabel =
                    (p.role || 'participant').charAt(0).toUpperCase() + (p.role || 'participant').slice(1);
                const signed = p.signedAt ? formatDate(p.signedAt) : 'Signature pending';
                return (
                    '<div class="cd-party-card">' +
                    '<div class="cd-party-card__role">' +
                    escapeHtml(roleLabel) +
                    '</div>' +
                    '<p class="cd-party-card__name">' +
                    escapeHtml(name) +
                    '</p>' +
                    '<p class="cd-party-card__email">' +
                    escapeHtml(email) +
                    '</p>' +
                    '<p class="cd-party-card__signed">' +
                    (p.signedAt ? 'Signed: ' + escapeHtml(signed) : '<span class="text-muted">Not signed yet</span>') +
                    '</p>' +
                    '</div>'
                );
            })
            .join('');
        document.getElementById('contract-parties').innerHTML = partiesHtml;

        const paymentMode = contract.paymentMode || (opportunity && opportunity.exchangeMode) || '—';
        const duration = contract.duration || '—';
        const paymentSchedule =
            contract.paymentSchedule ||
            (opportunity && opportunity.exchangeData && opportunity.exchangeData.cashMilestones) ||
            '';
        const equityVesting = contract.equityVesting;
        const profitShare = contract.profitShare;
        const agreedValStr = formatAgreedValue(contract.agreedValue);
        let termsHtml =
            '<p class="mb-3"><span class="cd-kv__label" style="margin-bottom:0.35rem">Scope</span><span class="cd-kv__value" style="font-weight:400">' +
            escapeHtml(scopeDisplay) +
            '</span></p>' +
            '<div class="cd-terms-kv">' +
            '<div class="cd-kv"><span class="cd-kv__label">Payment mode</span><span class="cd-kv__value">' +
            escapeHtml(paymentMode) +
            '</span></div>' +
            '<div class="cd-kv"><span class="cd-kv__label">Duration</span><span class="cd-kv__value">' +
            escapeHtml(duration) +
            '</span></div>';
        if (agreedValStr) {
            termsHtml +=
                '<div class="cd-kv"><span class="cd-kv__label">Agreed value</span><span class="cd-kv__value">' +
                escapeHtml(agreedValStr) +
                '</span></div>';
        }
        termsHtml += '</div>';
        if (paymentSchedule) {
            termsHtml +=
                '<p class="mt-3 mb-0"><span class="cd-kv__label" style="margin-bottom:0.35rem">Payment schedule</span><span class="cd-kv__value" style="font-weight:400">' +
                escapeHtml(typeof paymentSchedule === 'string' ? paymentSchedule : JSON.stringify(paymentSchedule)) +
                '</span></p>';
        }
        if (equityVesting) {
            const eqStr =
                typeof equityVesting === 'string'
                    ? equityVesting
                    : equityVesting.period || equityVesting.percentage != null
                      ? (equityVesting.percentage != null ? equityVesting.percentage + '% ' : '') +
                        (equityVesting.period || '')
                      : '';
            if (eqStr)
                termsHtml +=
                    '<p class="mt-3 mb-0"><span class="cd-kv__label" style="margin-bottom:0.35rem">Equity vesting</span><span class="cd-kv__value" style="font-weight:400">' +
                    escapeHtml(eqStr) +
                    '</span></p>';
        }
        if (profitShare) {
            if (typeof profitShare === 'string') {
                termsHtml +=
                    '<p class="mt-3 mb-0"><span class="cd-kv__label" style="margin-bottom:0.35rem">Profit share</span><span class="cd-kv__value" style="font-weight:400">' +
                    escapeHtml(profitShare) +
                    '</span></p>';
            } else if (profitShare.percentage != null || profitShare.split) {
                termsHtml +=
                    '<p class="mt-3 mb-0"><span class="cd-kv__label" style="margin-bottom:0.35rem">Profit share</span><span class="cd-kv__value" style="font-weight:400">' +
                    (profitShare.percentage != null ? profitShare.percentage + '%' : '') +
                    ' ' +
                    (profitShare.split ? escapeHtml(profitShare.split) : '') +
                    (profitShare.basis ? ' · ' + escapeHtml(profitShare.basis) : '') +
                    (profitShare.distribution
                        ? '<br/><span class="text-muted">' + escapeHtml(profitShare.distribution) + '</span>'
                        : '') +
                    '</span></p>';
            }
        }
        document.getElementById('contract-scope-terms').innerHTML = termsHtml;

        const dealId = contract.dealId;
        const dealRecord = dealId ? await dataService.getDealById(dealId) : null;
        const snapshot = Array.isArray(contract.milestonesSnapshot) ? contract.milestonesSnapshot : [];
        let milestonesHtml = '';
        if (snapshot.length) {
            milestonesHtml = snapshot
                .map((m) => {
                    const title = m && m.title ? String(m.title) : 'Milestone';
                    const due = m && m.dueDate ? formatDateShort(m.dueDate) : '';
                    const deliv = m && m.deliverables ? String(m.deliverables) : '';
                    return (
                        '<div class="cd-milestone-row">' +
                        '<span class="cd-milestone-title">' +
                        escapeHtml(title) +
                        '</span>' +
                        (due || deliv
                            ? '<span class="cd-milestone-meta">' +
                              (due ? 'Due ' + escapeHtml(due) : '') +
                              (due && deliv ? ' · ' : '') +
                              (deliv ? escapeHtml(deliv) : '') +
                              '</span>'
                            : '') +
                        '</div>'
                    );
                })
                .join('');
        } else {
            milestonesHtml =
                '<p class="text-muted mb-0">No milestone snapshot on this contract yet. Execution and live milestones are managed in the Deal workspace (sidebar).</p>';
        }
        const milestonesEl = document.getElementById('contract-milestones');
        if (milestonesEl) milestonesEl.innerHTML = milestonesHtml;

        document.getElementById('contract-dates').innerHTML = `
            <p><strong>Created</strong> — ${formatDate(contract.createdAt)}</p>
            <p><strong>Last updated</strong> — ${formatDate(contract.updatedAt)}</p>
            ${contract.signedAt ? '<p><strong>Fully signed</strong> — ' + formatDate(contract.signedAt) + '</p>' : '<p><strong>Fully signed</strong><span class="text-muted"> — Pending all parties</span></p>'}
        `;

        const linkedDealMount = document.getElementById('contract-linked-deal');
        if (linkedDealMount) {
            linkedDealMount.innerHTML = dealId
                ? '<p style="margin:0 0 0.35rem 0;font-weight:600;color:var(--text-primary,#0f172a)">' +
                  escapeHtml((dealRecord && dealRecord.title) || 'Deal ' + dealId) +
                  '</p>' +
                  '<p style="margin:0;font-size:0.8125rem;color:var(--text-secondary,#64748b)">Milestones, documents, and delivery run here.</p>' +
                  '<a href="#" data-route="/deals/' +
                  escapeHtml(dealId) +
                  '" class="btn btn-primary">Open Deal workspace</a>'
                : '<p class="text-muted mb-0">No deal workspace is linked.</p>';
        }

        const auditSection = document.getElementById('contract-audit-section');
        const auditLogEl = document.getElementById('contract-audit-log');
        if (auditLogEl && typeof dataService.getAuditLogs === 'function') {
            const logs = await dataService.getAuditLogs({ entityType: 'contract', entityId: contractId });
            const slice = logs.slice(0, 40);
            if (slice.length && auditSection) {
                auditSection.style.display = 'block';
                auditLogEl.innerHTML = slice
                    .map(
                        (l) =>
                            '<div class="contract-audit-row"><span class="text-muted small">' +
                            escapeHtml(formatDate(l.timestamp)) +
                            '</span> · <strong>' +
                            escapeHtml((l.action || 'event').replace(/_/g, ' ')) +
                            '</strong></div>'
                    )
                    .join('');
            } else if (auditSection) {
                auditSection.style.display = 'none';
            }
        }

        const oppTitle = (opportunity && opportunity.title) || scopeDisplay;
        const oppId = contract.opportunityId;
        let opportunityLinkHtml = '';
        if (oppId) {
            opportunityLinkHtml +=
                '<p style="margin:0 0 0.35rem 0;font-weight:600;color:var(--text-primary,#0f172a)">' +
                escapeHtml(oppTitle) +
                '</p>' +
                '<a href="#" data-route="/opportunities/' +
                escapeHtml(oppId) +
                '" class="btn btn-outline">View opportunity</a>';
        }
        document.getElementById('contract-opportunity-link').innerHTML = opportunityLinkHtml || '<p class="text-muted mb-0">—</p>';

        const leadParty = parties.find(
            (p) =>
                (p.role || '').toLowerCase() === 'creator' ||
                (p.role || '').toLowerCase() === 'need_owner'
        );
        const isLead = leadParty ? leadParty.userId === user.id : parties.length > 0 && parties[0].userId === user.id;
        const canEditContract = isLead && (contract.status === 'pending' || contract.status === 'active');
        const canCloseContract = isLead && contract.status === 'active';
        const oppStatus = opportunity ? opportunity.status : '';
        const mySigned = myParty && myParty.signedAt;
        const actionsEl = document.getElementById('contract-detail-actions');
        if (actionsEl) {
            let actionsHtml = '';
            if (contract.status === 'pending' && isParty && !mySigned) {
                actionsHtml += `<button type="button" id="contract-sign-btn" class="btn btn-primary no-print">Sign Agreement</button>`;
            } else if (contract.status === 'pending' && isParty && mySigned) {
                actionsHtml += `<p class="text-muted no-print mb-0" id="contract-signed-note">You have signed this agreement.</p>`;
            }
            if (canEditContract) {
                actionsHtml += `<button type="button" id="contract-edit-btn" class="btn btn-secondary no-print" data-contract-id="${escapeHtml(contract.id)}">Edit contract</button>`;
            }
            if (canCloseContract) {
                actionsHtml += `<button type="button" id="contract-close-btn" class="btn btn-primary no-print">Close contract</button>`;
            }
            actionsHtml += `<button type="button" id="contract-print-btn" class="btn btn-secondary">Print / PDF</button>`;
            actionsEl.innerHTML = actionsHtml;
        }

        document.getElementById('contract-sign-btn')?.addEventListener('click', async () => {
            try {
                const fresh = await dataService.getContractById(contractId);
                if (!fresh) return;
                const plist = dataService.getContractParties(fresh);
                if (plist.some((p) => p.userId === user.id && p.signedAt)) {
                    await initContractDetail({ id: contractId });
                    return;
                }
                if (typeof dataService.signContractParty === 'function') {
                    await dataService.signContractParty(contractId, user.id);
                } else {
                    const partiesSigned = plist.map((p) =>
                        p.userId === user.id ? { ...p, signedAt: new Date().toISOString() } : p
                    );
                    await dataService.updateContract(contractId, { parties: partiesSigned });
                }
                if (dealId) {
                    const d = await dataService.getDealById(dealId);
                    if (d && d.participants) {
                        const merged = d.participants.map((p) =>
                            p.userId === user.id ? { ...p, signedAt: new Date().toISOString() } : p
                        );
                        await dataService.updateDeal(dealId, { participants: merged });
                    }
                }
                await initContractDetail({ id: contractId });
            } catch (err) {
                console.error(err);
                alert('Could not sign. Try again.');
            }
        });

        document.getElementById('contract-close-btn')?.addEventListener('click', () => closeContract(contractId, contract.opportunityId, oppStatus));

        document.getElementById('contract-edit-btn')?.addEventListener('click', () => {
            showEditContractModal(contractId, {
                contract,
                parties,
                partyUsers,
                opportunity,
                dealRecord
            });
        });

        document.getElementById('contract-print-btn')?.addEventListener('click', () => {
            window.print();
        });

        // Reviews section: show when contract/opportunity is completed
        const contractCompleted = contract.status === 'completed' || oppStatus === 'completed';
        const reviewsSection = document.getElementById('contract-reviews-section');
        const reviewsListEl = document.getElementById('contract-reviews-list');
        const leaveReviewEl = document.getElementById('contract-leave-review');
        if (reviewsSection && reviewsListEl && leaveReviewEl) {
            const contractReviews = await dataService.getReviewsByContractId(contractId);
            const minRating = (typeof CONFIG !== 'undefined' && CONFIG.REVIEW_RATING_MIN) ? CONFIG.REVIEW_RATING_MIN : 1;
            const maxRating = (typeof CONFIG !== 'undefined' && CONFIG.REVIEW_RATING_MAX) ? CONFIG.REVIEW_RATING_MAX : 5;

            if (contractCompleted || contractReviews.length > 0) {
                reviewsSection.style.display = 'block';
                const reviewRows = await Promise.all(contractReviews.map(async (r) => {
                    const reviewer = await dataService.getUserOrCompanyById(r.reviewerId);
                    const reviewerName = reviewer?.profile?.name || reviewer?.email || r.reviewerId;
                    return `<div class="review-item"><strong>${escapeHtml(reviewerName)}</strong> — ${r.rating}/${maxRating}${r.comment ? '<br/><span class="text-muted">' + escapeHtml(r.comment) + '</span>' : ''}<br/><span class="text-muted small">${formatDate(r.createdAt)}</span></div>`;
                }));
                reviewsListEl.innerHTML = reviewRows.length ? reviewRows.join('') : '<p class="text-muted">No reviews yet.</p>';

                const otherParties = parties.filter(p => p.userId !== user.id);
                const otherPartyId = otherParties.length > 0 ? otherParties[0].userId : null;
                const otherPartyIndex = otherPartyId ? parties.findIndex(p => p.userId === otherPartyId) : -1;
                const otherPartyName = otherPartyIndex >= 0 && partyUsers[otherPartyIndex] ? (partyUsers[otherPartyIndex]?.profile?.name || partyUsers[otherPartyIndex]?.email || otherPartyId) : (otherPartyId || '');
                const myReview = await dataService.getReviewByContractAndReviewer(contractId, user.id);
                if (contractCompleted && otherPartyId && !myReview) {
                    leaveReviewEl.style.display = 'block';
                    leaveReviewEl.innerHTML = `<button type="button" id="contract-leave-review-btn" class="btn btn-primary">Leave a review</button>`;
                    document.getElementById('contract-leave-review-btn')?.addEventListener('click', () => {
                        showLeaveReviewModal(contractId, contract.opportunityId, user.id, otherPartyId, otherPartyName, minRating, maxRating);
                    });
                } else {
                    leaveReviewEl.style.display = 'none';
                }
            } else {
                reviewsSection.style.display = 'none';
            }
        }

        wireRouteLinks(contentEl);
    } catch (err) {
        console.error('Error loading contract:', err);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        contentEl.style.display = 'none';
        wireRouteLinks(errorEl);
    }
}

function showEditContractModal(contractId, ctx) {
    const contract = ctx && ctx.contract;
    if (!contract) {
        return;
    }

    const parties = ctx.parties || [];
    const partyUsers = ctx.partyUsers || [];
    const opportunity = ctx.opportunity || null;
    const dealRecord = ctx.dealRecord || null;

    const scope = contract.scope || '';
    const duration = contract.duration || '';
    const scheduleRaw =
        contract.paymentSchedule || (opportunity && opportunity.exchangeData && opportunity.exchangeData.cashMilestones) || '';
    const paymentSchedule =
        typeof scheduleRaw === 'string'
            ? scheduleRaw
            : scheduleRaw
              ? (function () {
                    try {
                        return JSON.stringify(scheduleRaw);
                    } catch {
                        return String(scheduleRaw);
                    }
                })()
              : '';
    const equityVesting = contract.equityVesting
        ? typeof contract.equityVesting === 'string'
            ? contract.equityVesting
            : (function () {
                  try {
                      return JSON.stringify(contract.equityVesting);
                  } catch {
                      return '';
                  }
              })()
        : '';
    const profitShare = contract.profitShare
        ? typeof contract.profitShare === 'string'
            ? contract.profitShare
            : (function () {
                  try {
                      return JSON.stringify(contract.profitShare);
                  } catch {
                      return '';
                  }
              })()
        : '';

    const currentPm = String(contract.paymentMode || (opportunity && opportunity.exchangeMode) || 'cash').toLowerCase();
    const modeChoices = [...new Set([currentPm, 'cash', 'barter', 'equity', 'hybrid', 'services'])];

    const snap = Array.isArray(contract.milestonesSnapshot) ? [...contract.milestonesSnapshot] : [];
    if (snap.length === 0) {
        snap.push({ title: '', dueDate: '', deliverables: '' });
    }
    const milestonesEditorHtml = snap.map((m, i) => milestoneEditorRowHtml(m, i)).join('');

    const summaryHtml = buildContractEditReadonlyHtml(contract, parties, partyUsers, opportunity, dealRecord);

    const contentHTML =
        summaryHtml +
        '<p class="contract-edit-form-title">Edit negotiable terms</p>' +
        '<form id="contract-edit-form" class="contract-edit-form">' +
        '<div class="contract-edit-form__block">' +
        '<label for="edit-contract-scope" class="contract-edit-field-label">Scope <span class="text-red-500">*</span></label>' +
        '<input type="text" id="edit-contract-scope" class="contract-edit-text-input" value="' +
        escapeHtml(scope) +
        '" required placeholder="Contract scope / title" />' +
        '</div>' +
        '<div class="contract-edit-form__block">' +
        '<label for="edit-contract-duration" class="contract-edit-field-label">Duration (optional)</label>' +
        '<input type="text" id="edit-contract-duration" class="contract-edit-text-input" value="' +
        escapeHtml(duration) +
        '" placeholder="e.g. 3 months, Q2 2026" />' +
        '</div>' +
        '<section class="contract-pay-flow" aria-labelledby="contract-pay-flow-h">' +
        '<h4 id="contract-pay-flow-h" class="contract-pay-flow__heading">Payment flow</h4>' +
        '<ol class="contract-pay-flow__steps">' +
        '<li class="contract-pay-flow__step">' +
        '<span class="contract-pay-flow__badge" aria-hidden="true">1</span>' +
        '<div class="contract-pay-flow__panel">' +
        '<p class="contract-pay-flow__step-title">How value moves</p>' +
        '<p class="contract-pay-flow__step-lead">Choose the structure for this agreement. You can describe timing and splits in step 2.</p>' +
        '<div class="contract-pay-flow__cards" role="radiogroup" aria-label="Payment structure">' +
        paymentModeFlowCardsHtml(currentPm, modeChoices) +
        '</div>' +
        '</div>' +
        '</li>' +
        '<li class="contract-pay-flow__step">' +
        '<span class="contract-pay-flow__badge" aria-hidden="true">2</span>' +
        '<div class="contract-pay-flow__panel">' +
        '<label for="edit-contract-payment-schedule" class="contract-pay-flow__step-title">Schedule & payment notes</label>' +
        '<p class="contract-pay-flow__step-lead">Instalments, triggers, barter settlement, or how cash ties to milestones below.</p>' +
        '<textarea id="edit-contract-payment-schedule" class="contract-pay-flow__textarea" rows="3" placeholder="e.g. 30% on signature, 40% at mid-review, 30% on completion">' +
        escapeHtml(paymentSchedule) +
        '</textarea>' +
        '</div>' +
        '</li>' +
        '</ol>' +
        '</section>' +
        '<section class="contract-milestone-editor" aria-labelledby="contract-milestone-editor-h">' +
        '<div class="contract-milestone-editor__head">' +
        '<div>' +
        '<h4 id="contract-milestone-editor-h" class="contract-milestone-editor__title">Milestones snapshot</h4>' +
        '<p class="contract-milestone-editor__subtitle">Stored on the contract for the legal record. Day-to-day execution remains in the Deal workspace.</p>' +
        '</div>' +
        '<button type="button" class="btn btn-secondary btn-sm" id="contract-edit-milestone-add">+ Add milestone</button>' +
        '</div>' +
        '<div id="contract-edit-milestones-list" class="contract-edit-milestones-list">' +
        milestonesEditorHtml +
        '</div>' +
        '</section>' +
        '<div class="contract-edit-form__block">' +
        '<label for="edit-contract-equity-vesting" class="contract-edit-field-label">Equity vesting (optional)</label>' +
        '<input type="text" id="edit-contract-equity-vesting" class="contract-edit-text-input" value="' +
        escapeHtml(equityVesting) +
        '" placeholder="e.g. 2 years, 25% per year" />' +
        '</div>' +
        '<div class="contract-edit-form__block">' +
        '<label for="edit-contract-profit-share" class="contract-edit-field-label">Profit share agreement (optional)</label>' +
        '<textarea id="edit-contract-profit-share" class="contract-edit-text-input contract-edit-text-input--multi" rows="2" placeholder="e.g. 10% of net profit, quarterly">' +
        escapeHtml(profitShare) +
        '</textarea>' +
        '</div>' +
        '<div class="contract-edit-form__actions">' +
        '<button type="button" id="contract-edit-save" class="btn btn-primary">Save</button>' +
        '<button type="button" id="contract-edit-cancel" class="btn btn-secondary">Cancel</button>' +
        '</div>' +
        '</form>';

    if (typeof modalService === 'undefined') {
        const scopeVal = prompt('Scope (required):', scope);
        if (scopeVal === null) return;
        if (!scopeVal.trim()) {
            alert('Scope is required.');
            return;
        }
        const durationVal = prompt('Duration (optional):', duration) || '';
        saveContractEdit(contractId, {
            scope: scopeVal.trim(),
            duration: durationVal.trim(),
            paymentMode: currentPm
        });
        return;
    }

    modalService.showCustom(contentHTML, 'Edit contract', {
        confirmText: 'Close',
        modalClass: 'modal-dialog--contract-edit',
        onMount: function (modal) {
            wireContractEditMilestoneList(modal);

            const saveBtn = modal.querySelector('#contract-edit-save');
            const cancelBtn = modal.querySelector('#contract-edit-cancel');
            const scopeInput = modal.querySelector('#edit-contract-scope');
            const durationInput = modal.querySelector('#edit-contract-duration');
            const paymentScheduleInput = modal.querySelector('#edit-contract-payment-schedule');
            const equityVestingInput = modal.querySelector('#edit-contract-equity-vesting');
            const profitShareInput = modal.querySelector('#edit-contract-profit-share');

            if (saveBtn) {
                saveBtn.addEventListener('click', async function () {
                    const scopeVal = scopeInput && scopeInput.value != null ? String(scopeInput.value).trim() : '';
                    const durationVal = durationInput && durationInput.value != null ? String(durationInput.value).trim() : '';
                    if (!scopeVal) {
                        alert('Scope is required.');
                        if (scopeInput) scopeInput.focus();
                        return;
                    }
                    const modeRadio = modal.querySelector('input[name="edit-contract-payment-mode"]:checked');
                    const paymentModeVal = modeRadio && modeRadio.value ? String(modeRadio.value).trim() : '';
                    const paymentScheduleVal =
                        paymentScheduleInput && paymentScheduleInput.value != null
                            ? String(paymentScheduleInput.value).trim()
                            : '';
                    const equityVestingVal =
                        equityVestingInput && equityVestingInput.value != null ? String(equityVestingInput.value).trim() : '';
                    const profitShareVal =
                        profitShareInput && profitShareInput.value != null ? String(profitShareInput.value).trim() : '';
                    const milestonesSnapshot = collectMilestonesSnapshotFromModal(modal);
                    modalService.close();
                    await saveContractEdit(contractId, {
                        scope: scopeVal,
                        duration: durationVal,
                        paymentMode: paymentModeVal || undefined,
                        paymentSchedule: paymentScheduleVal || undefined,
                        equityVesting: equityVestingVal || undefined,
                        profitShare: profitShareVal || undefined,
                        milestonesSnapshot: milestonesSnapshot
                    });
                });
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', function () {
                    modalService.close();
                });
            }
        }
    }).then(function () {});
}

async function saveContractEdit(contractId, updates) {
    try {
        const payload = typeof updates === 'object' && updates !== null ? updates : { scope: updates, duration: '' };
        await dataService.updateContract(contractId, payload);
        if (typeof initContractDetail === 'function') {
            await initContractDetail({ id: contractId });
        }
    } catch (err) {
        console.error('Error updating contract:', err);
        alert('Failed to update contract. Please try again.');
    }
}

function showLeaveReviewModal(contractId, opportunityId, reviewerId, revieweeId, revieweeName, minRating, maxRating) {
    const ratingOptions = [];
    for (let i = minRating; i <= maxRating; i++) {
        ratingOptions.push(`<option value="${i}">${i} star${i > 1 ? 's' : ''}</option>`);
    }
    const contentHTML = `
        <form id="review-form" class="space-y-3">
            <p class="text-muted small">You are reviewing <strong>${escapeHtml(revieweeName || '')}</strong> for this completed collaboration.</p>
            <div>
                <label for="review-rating" class="block text-sm font-medium text-gray-700 mb-1">Rating (${minRating}-${maxRating}) <span class="text-red-500">*</span></label>
                <select id="review-rating" class="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                    <option value="">Select rating</option>
                    ${ratingOptions.join('')}
                </select>
            </div>
            <div>
                <label for="review-comment" class="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
                <textarea id="review-comment" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3" placeholder="Share your experience..."></textarea>
            </div>
            <div class="flex gap-2 pt-2">
                <button type="button" id="review-submit" class="btn btn-primary">Submit review</button>
                <button type="button" id="review-cancel" class="btn btn-secondary">Cancel</button>
            </div>
        </form>
    `;

    if (typeof modalService === 'undefined') {
        const ratingStr = prompt(`Rating (${minRating}-${maxRating}):`, String(maxRating));
        if (ratingStr === null) return;
        const rating = parseInt(ratingStr, 10);
        if (isNaN(rating) || rating < minRating || rating > maxRating) {
            alert(`Please enter a number between ${minRating} and ${maxRating}.`);
            return;
        }
        submitReview(contractId, opportunityId, reviewerId, revieweeId, rating, '');
        return;
    }

    modalService.showCustom(contentHTML, 'Leave a review', { confirmText: 'Close' }).then(() => {});

    const modalEl = document.getElementById('modal-container');
    if (!modalEl) return;

    const submitBtn = modalEl.querySelector('#review-submit');
    const cancelBtn = modalEl.querySelector('#review-cancel');
    const ratingSelect = modalEl.querySelector('#review-rating');
    const commentInput = modalEl.querySelector('#review-comment');

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const rating = ratingSelect?.value != null ? parseInt(ratingSelect.value, 10) : NaN;
            const comment = commentInput?.value != null ? String(commentInput.value).trim() : '';
            if (isNaN(rating) || rating < minRating || rating > maxRating) {
                alert(`Please select a rating between ${minRating} and ${maxRating}.`);
                return;
            }
            modalService.close();
            await submitReview(contractId, opportunityId, reviewerId, revieweeId, rating, comment);
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => modalService.close());
    }
}

async function submitReview(contractId, opportunityId, reviewerId, revieweeId, rating, comment) {
    try {
        await dataService.createReview({
            contractId,
            opportunityId: opportunityId || null,
            reviewerId,
            revieweeId,
            rating,
            comment: comment || undefined
        });
        if (typeof initContractDetail === 'function') {
            await initContractDetail({ id: contractId });
        }
    } catch (err) {
        console.error('Error submitting review:', err);
        alert('Failed to submit review. Please try again.');
    }
}

async function closeContract(contractId, opportunityId, oppStatus) {
    if (!confirm('Close this contract? This marks the contract as completed. The linked opportunity will also be marked completed if it is in execution.')) return;
    try {
        await dataService.updateContract(contractId, { status: 'completed' });
        if (opportunityId && oppStatus === 'in_execution') {
            await dataService.updateOpportunity(opportunityId, { status: 'completed' });
        }
        if (typeof initContractDetail === 'function') {
            await initContractDetail({ id: contractId });
        }
    } catch (err) {
        console.error('Error closing contract:', err);
        alert('Failed to close contract. Please try again.');
    }
}

