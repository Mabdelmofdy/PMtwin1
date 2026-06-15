/**
 * Deal Detail – post-matching collaboration workflow (stage-based view)
 */

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

/** Exchange mode label for summary cards (not HTML-escaped — escape at use site if needed). */
function formatExchangeModeLabel(mode) {
    const m = (mode == null ? '' : String(mode)).toLowerCase().trim();
    if (m === 'cash') return 'Cash';
    if (m === 'barter') return 'Barter';
    return mode == null || String(mode).trim() === '' ? '—' : String(mode).trim();
}

/** Human-readable agreed value for deal summary (avoids raw JSON in the UI). */
function formatAgreedValueSummary(av) {
    if (av == null || typeof av !== 'object') return '';
    const cash = av.cash != null && !Number.isNaN(Number(av.cash)) ? Number(av.cash) : null;
    const cur = av.currency != null ? String(av.currency).trim() : '';
    if (cash != null) {
        const parts = [new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(cash)];
        if (cur) parts.push(cur);
        return parts.join(' ');
    }
    const keys = Object.keys(av).filter(k => av[k] != null && av[k] !== '');
    if (!keys.length) return '';
    try {
        return JSON.stringify(av);
    } catch {
        return '';
    }
}

function dealModalMilestoneRowHtml(m) {
    const id = m && m.id ? escapeAttr(m.id) : '';
    const title = m && m.title != null ? escapeAttr(m.title) : '';
    const dueRaw = m && m.dueDate != null ? String(m.dueDate) : '';
    const due = dueRaw ? escapeAttr(dueRaw.slice(0, 10)) : '';
    return (
        '<div class="deal-modal-milestone-row"' +
        (id ? ' data-milestone-id="' + id + '"' : '') +
        '><div class="deal-modal-milestone-row__fields">' +
        '<input type="text" class="form-input deal-modal-ms-title" placeholder="Milestone title" value="' +
        title +
        '" />' +
        '<input type="date" class="form-input deal-modal-ms-due" value="' +
        due +
        '" />' +
        '</div>' +
        '<button type="button" class="btn btn-outline btn-sm deal-modal-milestone-remove">Remove</button>' +
        '</div>'
    );
}

/**
 * @param {string} title
 * @param {string} leadHtml — short HTML (already escaped where needed)
 * @param {string} bodyHtml
 * @param {string} [actionsHtml]
 * @param {string} [sectionClassExtra] — extra classes on the section (e.g. deal-work-card--draft)
 */
function dealWorkCard(title, leadHtml, bodyHtml, actionsHtml, sectionClassExtra) {
    const secClass = 'deal-work-card' + (sectionClassExtra ? ' ' + sectionClassExtra : '');
    return (
        '<section class="' +
        secClass +
        '">' +
        '<header class="deal-work-card__head">' +
        '<h2 class="deal-work-card__title">' +
        title +
        '</h2>' +
        (leadHtml ? '<p class="deal-work-card__lead">' + leadHtml + '</p>' : '') +
        '</header>' +
        '<div class="deal-work-card__body">' +
        bodyHtml +
        '</div>' +
        (actionsHtml ? '<div class="deal-work-actions">' + actionsHtml + '</div>' : '') +
        '</section>'
    );
}

function renderMessagePrimaryButton(messageRoute, hasPeer) {
    if (hasPeer) {
        return '<a href="#" data-route="' + escapeHtml(messageRoute) + '" class="btn btn-primary btn-sm">Send Message</a>';
    }
    return '<button type="button" class="btn btn-primary btn-sm deal-btn-message-unavailable" title="No other active participant">Send Message</button>';
}

function renderMessageInlineLink(messageRoute, hasPeer) {
    if (hasPeer) {
        return '<a href="#" data-route="' + escapeHtml(messageRoute) + '" class="deal-work-card__inline-link">Message participants</a>';
    }
    return '<button type="button" class="deal-work-card__inline-link deal-btn-message-unavailable">Message participants</button>';
}

/**
 * @param {object} deal
 * @param {{ title: string, submitLabel: string }} opts
 * @returns {Promise<object|null>} — update payload or null if cancelled
 */
async function openDealWorkspaceTermsModal(deal, opts) {
    const ms = window.modalService;
    if (!ms || typeof ms.showCustom !== 'function') return null;

    const vt = deal.valueTerms || {};
    const agreed = vt.agreedValue && typeof vt.agreedValue === 'object' ? vt.agreedValue : {};
    const cashAmount = agreed.cash != null && !Number.isNaN(Number(agreed.cash)) ? String(agreed.cash) : '';
    const currency = escapeAttr(agreed.currency || '');
    const paySched = escapeAttr(vt.paymentSchedule || '');
    const deliv = escapeHtml(deal.deliverables || '');
    const scope = escapeHtml(deal.scope || '');
    const tStart = escapeAttr((deal.timeline && deal.timeline.start) || '');
    const tEnd = escapeAttr((deal.timeline && deal.timeline.end) || '');
    const ex = escapeAttr(deal.exchangeMode || 'cash');

    const allMs = deal.milestones || [];
    const lockedMilestones = allMs.filter(m => (m.status || 'pending') !== 'pending');
    const pendingMilestones = allMs.filter(m => (m.status || 'pending') === 'pending');
    let lockedBlock = '';
    if (lockedMilestones.length) {
        lockedBlock =
            '<p class="deal-modal-locked-ms-note">These milestones are already in progress or completed and stay on the deal unchanged from this form:</p>' +
            '<ul class="deal-modal-locked-ms-list">' +
            lockedMilestones
                .map(
                    m =>
                        '<li>' +
                        escapeHtml(m.title || '(untitled)') +
                        ' — <span class="deal-modal-locked-ms-list__st">' +
                        escapeHtml(m.status || 'pending') +
                        '</span></li>'
                )
                .join('') +
            '</ul>';
    }
    const initialRows =
        pendingMilestones.length > 0
            ? pendingMilestones.map(m => dealModalMilestoneRowHtml(m)).join('')
            : dealModalMilestoneRowHtml(null);

    const html =
        '<div class="deal-modal-form">' +
        '<p id="deal-modal-form-err" class="deal-modal-form__error" role="alert"></p>' +
        '<div class="form-group">' +
        '<label class="form-label" for="deal-modal-scope">Scope / summary</label>' +
        '<textarea id="deal-modal-scope" class="form-input" rows="4">' +
        scope +
        '</textarea></div>' +
        '<div class="form-group">' +
        '<label class="form-label" for="deal-modal-t0">Timeline start (optional)</label>' +
        '<input type="text" id="deal-modal-t0" class="form-input" placeholder="e.g. 2026-04-01" value="' +
        tStart +
        '" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label class="form-label" for="deal-modal-t1">Timeline end (optional)</label>' +
        '<input type="text" id="deal-modal-t1" class="form-input" placeholder="e.g. 2026-06-30" value="' +
        tEnd +
        '" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label class="form-label" for="deal-modal-exchange">Exchange</label>' +
        '<select id="deal-modal-exchange" class="form-select">' +
        '<option value="cash"' +
        (ex === 'cash' ? ' selected' : '') +
        '>Cash</option>' +
        '<option value="barter"' +
        (ex === 'barter' ? ' selected' : '') +
        '>Barter</option>' +
        '</select></div>' +
        '<div class="form-group">' +
        '<label class="form-label" for="deal-modal-cash">Agreed cash amount (optional)</label>' +
        '<input type="number" id="deal-modal-cash" class="form-input" min="0" step="1" value="' +
        escapeAttr(cashAmount) +
        '" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label class="form-label" for="deal-modal-currency">Currency</label>' +
        '<input type="text" id="deal-modal-currency" class="form-input" placeholder="SAR" value="' +
        currency +
        '" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label class="form-label" for="deal-modal-pay">Payment schedule</label>' +
        '<input type="text" id="deal-modal-pay" class="form-input" value="' +
        paySched +
        '" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label class="form-label" for="deal-modal-deliv">Deliverables (optional)</label>' +
        '<textarea id="deal-modal-deliv" class="form-input" rows="2">' +
        deliv +
        '</textarea></div>' +
        '<div class="form-group deal-modal-milestones-wrap">' +
        '<label class="form-label">Milestones (optional)</label>' +
        '<p class="deal-modal-form__hint">Add checkpoints aligned to your payment schedule. Rows with an empty title are ignored.</p>' +
        lockedBlock +
        '<div id="deal-modal-milestone-rows">' +
        initialRows +
        '</div>' +
        '<button type="button" class="btn btn-outline btn-sm" id="deal-modal-milestone-add">+ Add milestone</button>' +
        '</div></div>';

    const mountMilestoneControls = dialog => {
        const rowsEl = dialog.querySelector('#deal-modal-milestone-rows');
        const addBtn = dialog.querySelector('#deal-modal-milestone-add');
        if (!rowsEl || !addBtn) return;
        addBtn.addEventListener('click', () => {
            rowsEl.insertAdjacentHTML('beforeend', dealModalMilestoneRowHtml(null));
        });
        rowsEl.addEventListener('click', e => {
            const rm = e.target.closest('.deal-modal-milestone-remove');
            if (!rm) return;
            const row = rm.closest('.deal-modal-milestone-row');
            if (!row || !rowsEl.contains(row)) return;
            const all = rowsEl.querySelectorAll('.deal-modal-milestone-row');
            if (all.length <= 1) {
                row.querySelector('.deal-modal-ms-title') && (row.querySelector('.deal-modal-ms-title').value = '');
                const d = row.querySelector('.deal-modal-ms-due');
                if (d) d.value = '';
                row.removeAttribute('data-milestone-id');
                return;
            }
            row.remove();
        });
    };

    const result = await ms.showCustom(html, opts.title, {
        confirmText: opts.submitLabel,
        showCancel: true,
        cancelText: 'Cancel',
        modalClass: 'modal-dialog--deal-form',
        onMount: mountMilestoneControls,
        getPayload: dialog => {
            const errEl = dialog.querySelector('#deal-modal-form-err');
            const setErr = msg => {
                if (errEl) {
                    errEl.textContent = msg;
                    errEl.classList.add('deal-modal-form__error--visible');
                }
            };
            const clearErr = () => {
                if (errEl) {
                    errEl.textContent = '';
                    errEl.classList.remove('deal-modal-form__error--visible');
                }
            };
            const sc = (dialog.querySelector('#deal-modal-scope')?.value || '').trim();
            if (!sc) {
                setErr('Please enter a scope summary.');
                return { ok: false };
            }
            clearErr();
            const t0 = (dialog.querySelector('#deal-modal-t0')?.value || '').trim();
            const t1 = (dialog.querySelector('#deal-modal-t1')?.value || '').trim();
            const exchangeMode = (dialog.querySelector('#deal-modal-exchange')?.value || 'cash').trim();
            const cashStr = (dialog.querySelector('#deal-modal-cash')?.value || '').trim();
            const curVal = (dialog.querySelector('#deal-modal-currency')?.value || '').trim();
            const pay = (dialog.querySelector('#deal-modal-pay')?.value || '').trim();
            const dlv = (dialog.querySelector('#deal-modal-deliv')?.value || '').trim();

            let agreedValue = vt.agreedValue;
            if (cashStr !== '') {
                const n = Number(cashStr);
                if (typeof window.validateDealTerms === 'function') {
                    const check = window.validateDealTerms({ cashAmount: n });
                    if (!check.isValid) {
                        setErr(check.errors[0] || 'Invalid cash amount.');
                        return { ok: false };
                    }
                } else if (!Number.isNaN(n) && n < 0) {
                    setErr('Cash amount cannot be negative.');
                    return { ok: false };
                }
                if (!Number.isNaN(n)) {
                    agreedValue = {
                        ...(typeof agreed === 'object' ? agreed : {}),
                        cash: n,
                        currency: curVal || (agreed && agreed.currency) || 'SAR'
                    };
                }
            } else if (curVal && agreed && typeof agreed === 'object') {
                agreedValue = { ...agreed, currency: curVal };
            }

            const nextVt = {
                ...vt,
                paymentSchedule: pay,
                agreedValue: agreedValue != null ? agreedValue : vt.agreedValue
            };

            const rowEls = dialog.querySelectorAll('#deal-modal-milestone-rows .deal-modal-milestone-row');
            const fromForm = [];
            rowEls.forEach(row => {
                const title = (row.querySelector('.deal-modal-ms-title')?.value || '').trim();
                if (!title) return;
                const dueRaw = (row.querySelector('.deal-modal-ms-due')?.value || '').trim();
                const mid = row.getAttribute('data-milestone-id') || '';
                const prev = mid ? allMs.find(x => x.id === mid) : null;
                const base = prev && (prev.status || 'pending') === 'pending' ? prev : {};
                fromForm.push({
                    ...base,
                    id: mid || base.id,
                    title,
                    dueDate: dueRaw || null,
                    description: base.description || '',
                    deliverables: base.deliverables || '',
                    status: 'pending'
                });
            });
            const locked = allMs.filter(m => (m.status || 'pending') !== 'pending');
            const nextMilestones = [...locked, ...fromForm];

            return {
                ok: true,
                value: {
                    scope: sc,
                    timeline: { start: t0 || null, end: t1 || null },
                    exchangeMode: exchangeMode || 'cash',
                    valueTerms: nextVt,
                    deliverables: dlv,
                    milestones: nextMilestones
                }
            };
        }
    });

    if (result === false) return null;
    return result;
}

function getDealStatusLabel(s) {
    const ui = typeof window !== 'undefined' ? window.DealContractFlowUi : null;
    if (ui && typeof ui.getDealStatusDisplayLabel === 'function') return ui.getDealStatusDisplayLabel(s);
    const map = {
        negotiating: 'Negotiating',
        draft: 'Draft',
        review: 'In Review',
        signing: 'Waiting for Signatures',
        active: 'Active Deal',
        execution: 'In Execution',
        delivery: 'In Delivery',
        completed: 'Completed',
        closed: 'Closed',
        cancelled: 'Cancelled'
    };
    return map[s] || s;
}

function getDealStatusBadgeClass(s) {
    return window.statusBadgeSystem ? window.statusBadgeSystem.getStatusBadgeClass(s, 'deal') : 'badge--neutral';
}

function renderDealStepper(deal) {
    const ui = window.DealContractFlowUi;
    const keys = (ui && ui.STEPPER_KEYS) || ['draft', 'review', 'signing', 'active', 'execution', 'delivery', 'completed'];
    const labels = {
        draft: 'Draft',
        review: 'Review',
        signing: 'Waiting for Signatures',
        active: 'Active Deal',
        execution: 'Execution',
        delivery: 'Delivery',
        completed: 'Completed'
    };
    const st = deal.status || '';
    const cur = ui && typeof ui.dealStepIndex === 'function' ? ui.dealStepIndex(st) : keys.indexOf(st);
    const parts = keys.map((key, i) => {
        let cls = 'deal-stepper__step';
        if (cur >= 0 && i < cur) cls += ' deal-stepper__step--done';
        else if (cur >= 0 && i === cur) cls += ' deal-stepper__step--current';
        else cls += ' deal-stepper__step--upcoming';
        return '<span class="' + cls + '"><span class="deal-stepper__dot"></span><span class="deal-stepper__label">' + escapeHtml(labels[key] || key) + '</span></span>';
    });
    return (
        '<div class="deal-stepper" role="list" aria-label="Deal workspace lifecycle">' +
        '<p class="deal-stepper__title">Deal Workspace</p>' +
        '<div class="deal-stepper__track">' +
        parts.join('<span class="deal-stepper__sep" aria-hidden="true"></span>') +
        '</div></div>'
    );
}

async function finalizeDealDetailRender(dealId, userId) {
    const deal = await dataService.getDealById(dealId);
    if (!deal) return;
    const statusBadge = document.getElementById('deal-status-badge');
    if (statusBadge) {
        statusBadge.textContent = getDealStatusLabel(deal.status);
        statusBadge.className = 'badge ' + getDealStatusBadgeClass(deal.status);
    }
    const contractPill = document.getElementById('deal-contract-pill');
    if (contractPill) {
        if (deal.contractId) {
            const c = await dataService.getContractById(deal.contractId);
            const cs =
                c && window.DealContractFlowUi && typeof window.DealContractFlowUi.getContractStatusDisplayLabel === 'function'
                    ? window.DealContractFlowUi.getContractStatusDisplayLabel(c.status)
                    : c
                      ? c.status
                      : '—';
            contractPill.innerHTML =
                '<span class="deal-detail-pill deal-detail-pill--contract"><a href="#" data-route="/contracts/' +
                escapeHtml(deal.contractId) +
                '">Contract Agreement</a> · <span class="deal-detail-pill--muted">' +
                escapeHtml(cs) +
                '</span></span>';
        } else {
            contractPill.innerHTML = '<span class="deal-detail-pill--muted">No contract yet</span>';
        }
    }
    const stepperEl = document.getElementById('deal-lifecycle-stepper');
    if (stepperEl) stepperEl.innerHTML = renderDealStepper(deal);
    const nextEl = document.getElementById('deal-next-action');
    if (nextEl) {
        const c = deal.contractId ? await dataService.getContractById(deal.contractId) : null;
        const hint =
            window.DealContractFlowUi && typeof window.DealContractFlowUi.getDealNextActionHint === 'function'
                ? window.DealContractFlowUi.getDealNextActionHint(deal, c, userId)
                : '';
        nextEl.textContent = hint || '';
        nextEl.style.display = hint ? 'block' : 'none';
    }
    const stageEl = document.getElementById('deal-stage-content');
    if (stageEl) {
        stageEl.innerHTML = await renderStageContent(deal, userId);
        stageEl.dataset.dealId = dealId;
        stageEl.dataset.actorUserId = userId;
    }

    const rateLink = document.getElementById('deal-link-rate');
    if (rateLink && (deal.status || '').toLowerCase() === 'completed') {
        const reviews = typeof dataService.getReviews === 'function' ? await dataService.getReviews() : [];
        const pendingReviewees = (deal.participants || []).filter(
            p =>
                p.userId !== userId &&
                !reviews.some(r => r.dealId === dealId && r.reviewerId === userId && r.revieweeId === p.userId)
        );
        if (pendingReviewees.length === 0) {
            rateLink.remove();
        }
    }
}

function getMilestoneStatusBadgeClass(status) {
    const map = { pending: 'secondary', in_progress: 'warning', submitted: 'info', approved: 'success', completed: 'success', rejected: 'danger' };
    return map[status] || 'secondary';
}

function getMilestoneStatusDisplayLabel(status) {
    const s = status || 'pending';
    if (s === 'approved') return 'completed';
    return s;
}

function getMatchTypeLabel(matchType) {
    const map = { one_way: 'One Way', two_way: 'Two Way (Barter)', consortium: 'Consortium', circular: 'Circular Exchange' };
    return map[matchType] || matchType;
}

function formatDealDetailDate(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

function collectLinkedOpportunityIds(deal) {
    const primary = deal.opportunityId || null;
    const set = new Set();
    if (primary) set.add(primary);
    (deal.opportunityIds || []).forEach((id) => {
        if (id) set.add(id);
    });
    (deal.roleSlots || []).forEach((slot) => {
        if (slot && slot.opportunityId) set.add(slot.opportunityId);
    });
    const ordered = [...set];
    ordered.sort((a, b) => {
        if (a === primary) return -1;
        if (b === primary) return 1;
        return String(a).localeCompare(String(b));
    });
    return { orderedIds: ordered, primaryId: primary };
}

function buildOpportunityRoleHints(deal) {
    /** @type {Record<string, string[]>} */
    const hints = {};
    const slots = deal.roleSlots;
    if (!Array.isArray(slots)) return hints;
    for (const slot of slots) {
        if (!slot || !slot.opportunityId) continue;
        const role = typeof formatParticipantRole === 'function'
            ? formatParticipantRole(slot.role, 'Participant')
            : (slot.role || 'Participant').trim();
        if (!hints[slot.opportunityId]) hints[slot.opportunityId] = [];
        if (!hints[slot.opportunityId].includes(role)) hints[slot.opportunityId].push(role);
    }
    return hints;
}

function getOpportunityIntentLabel(intent) {
    if (intent === 'offer') return 'Offer';
    if (intent === 'request') return 'Need';
    return intent || '—';
}

function getOpportunityStatusLabel(status) {
    const s = status || '';
    if (!s) return '—';
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

function formatOpportunityBudget(ex) {
    if (!ex || !ex.budgetRange) return '';
    const br = ex.budgetRange;
    const cur = br.currency || ex.currency || '';
    if (typeof br.min === 'number' && typeof br.max === 'number') {
        return (br.min === br.max ? String(br.min) : br.min + ' – ' + br.max) + (cur ? ' ' + cur : '');
    }
    if (typeof br.min === 'number') return String(br.min) + (cur ? ' ' + cur : '');
    if (typeof br.max === 'number') return String(br.max) + (cur ? ' ' + cur : '');
    return '';
}

function truncateOneLine(str, max) {
    if (str == null || str === '') return '';
    const t = String(str).replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    return t.slice(0, max - 1).trim() + '…';
}

function opportunityDetailRoute(id) {
    const tpl = (typeof CONFIG !== 'undefined' && CONFIG.ROUTES && CONFIG.ROUTES.OPPORTUNITY_DETAIL) ? CONFIG.ROUTES.OPPORTUNITY_DETAIL : '/opportunities/:id';
    return tpl.replace(':id', id);
}

async function loadAndRenderLinkedOpportunities(deal) {
    const mount = document.getElementById('deal-opportunities-list');
    if (!mount) return;

    const { orderedIds, primaryId } = collectLinkedOpportunityIds(deal);
    const roleHints = buildOpportunityRoleHints(deal);

    if (orderedIds.length === 0) {
        mount.innerHTML = '<p class="deal-opportunities-empty">No opportunities are linked to this deal in the workspace data.</p>';
        return;
    }

    const pairs = await Promise.all(
        orderedIds.map(async (id) => {
            const opp = await dataService.getOpportunityById(id);
            return { id, opp };
        })
    );

    const parts = [];
    for (const { id, opp } of pairs) {
        const isPrimary = id === primaryId;
        const route = opportunityDetailRoute(id);
        const roles = roleHints[id];
        const roleLine =
            roles && roles.length
                ? '<p class="deal-opp-card__role">' + escapeHtml(roles.join(' · ')) + '</p>'
                : isPrimary && orderedIds.length > 1
                    ? '<p class="deal-opp-card__role">' +
                      escapeHtml((deal.matchType || '') === 'consortium' ? 'Lead / packaged slot' : 'Primary opportunity') +
                      '</p>'
                    : '';

        if (!opp) {
            parts.push(
                '<div class="deal-opp-card' +
                    (isPrimary ? ' deal-opp-card--primary' : '') +
                    '">' +
                    '<div class="deal-opp-card__top"><h3 class="deal-opp-card__title">' +
                    escapeHtml(id) +
                    '</h3><div class="deal-opp-card__badges"><span class="badge badge-secondary">Not loaded</span></div></div>' +
                    roleLine +
                    '<p class="deal-opportunities-empty">This ID is on the deal record but no matching opportunity was found in local data.</p>' +
                    '<div class="deal-opp-card__actions"><span class="deal-detail-pill deal-detail-pill--muted">ID: ' +
                    escapeHtml(id) +
                    '</span></div></div>'
            );
            continue;
        }

        const intent = opp.intent || 'request';
        const intentBadge = intent === 'offer' ? 'info' : 'primary';
        const budget = formatOpportunityBudget(opp.exchangeData || {});
        const loc = opp.location || opp.attributes?.locationRequirement || '';
        const industry = opp.industry || '';
        const model = [opp.modelType, opp.subModelType].filter(Boolean).join(' · ');
        const attrs = opp.attributes || {};
        const dateLine =
            attrs.startDate || attrs.endDate
                ? (attrs.startDate || '—') + ' → ' + (attrs.endDate || '—')
                : '';
        const skills = (opp.scope && Array.isArray(opp.scope.requiredSkills) && opp.scope.requiredSkills.length)
            ? opp.scope.requiredSkills.slice(0, 6).join(', ') + (opp.scope.requiredSkills.length > 6 ? '…' : '')
            : '';

        const desc = truncateOneLine(opp.description || opp.scope?.scopeOfWork || '', 220);

        let dl = '';
        if (loc) dl += '<dt>Location</dt><dd>' + escapeHtml(loc) + '</dd>';
        if (industry) dl += '<dt>Industry</dt><dd>' + escapeHtml(industry) + '</dd>';
        if (model) dl += '<dt>Model</dt><dd>' + escapeHtml(model) + '</dd>';
        if (budget) dl += '<dt>Budget</dt><dd>' + escapeHtml(budget) + '</dd>';
        if (dateLine) dl += '<dt>Window</dt><dd>' + escapeHtml(dateLine) + '</dd>';

        const skillsHtml = skills
            ? '<p class="deal-opp-card__skills"><strong>Skills</strong> · ' + escapeHtml(skills) + '</p>'
            : '';

        parts.push(
            '<article class="deal-opp-card' +
                (isPrimary ? ' deal-opp-card--primary' : '') +
                '">' +
                '<div class="deal-opp-card__top">' +
                '<h3 class="deal-opp-card__title">' +
                escapeHtml(opp.title || id) +
                '</h3>' +
                '<div class="deal-opp-card__badges">' +
                '<span class="badge badge-' +
                intentBadge +
                '">' +
                escapeHtml(getOpportunityIntentLabel(intent)) +
                '</span>' +
                '<span class="badge badge-secondary">' +
                escapeHtml(getOpportunityStatusLabel(opp.status)) +
                '</span>' +
                '</div></div>' +
                roleLine +
                (desc ? '<p class="deal-opp-card__desc">' + escapeHtml(desc) + '</p>' : '') +
                (dl ? '<dl class="deal-opp-card__dl">' + dl + '</dl>' : '') +
                skillsHtml +
                '<div class="deal-opp-card__actions">' +
                '<a href="#" data-route="' +
                escapeHtml(route) +
                '" class="btn btn-primary btn-sm">View opportunity</a>' +
                '</div></article>'
        );
    }

    mount.innerHTML = parts.join('');
}

async function initDealDetail(params) {
    const dealId = params?.id;
    const loadingEl = document.getElementById('deal-loading');
    const errorEl = document.getElementById('deal-error');
    const contentEl = document.getElementById('deal-content');

    if (!dealId) {
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        if (contentEl) contentEl.style.display = 'none';
        return;
    }

    const user = authService.getCurrentUser();
    if (!user) {
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        if (contentEl) contentEl.style.display = 'none';
        return;
    }

    try {
        let deal = await dataService.getDealById(dealId);
        if (!deal) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'block';
            if (contentEl) contentEl.style.display = 'none';
            return;
        }

        if (deal.status === CONFIG.DEAL_STATUS.SIGNING && !deal.contractId && typeof dataService.repairSigningDealMissingContract === 'function') {
            await dataService.repairSigningDealMissingContract(dealId);
            deal = await dataService.getDealById(dealId);
        }

        const isParticipant = (deal.participants || []).some(p => p.userId === user.id);
        const isAdminView = authService.canAccessAdmin && authService.canAccessAdmin();
        if (!isParticipant && !isAdminView) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'block';
            if (contentEl) contentEl.style.display = 'none';
            return;
        }

        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';

        const flashEl = document.getElementById('deal-flash-banner');
        if (flashEl) {
            try {
                const raw = sessionStorage.getItem('pmtwin_deal_flash');
                if (raw) {
                    sessionStorage.removeItem('pmtwin_deal_flash');
                    const m = JSON.parse(raw);
                    const tone = escapeHtml(m.tone || 'success');
                    flashEl.innerHTML =
                        '<div class="deal-flash deal-flash--' +
                        tone +
                        '" role="status">' +
                        escapeHtml(m.message || '') +
                        '</div>';
                    flashEl.style.display = 'block';
                } else {
                    flashEl.innerHTML = '';
                    flashEl.style.display = 'none';
                }
            } catch {
                flashEl.innerHTML = '';
                flashEl.style.display = 'none';
            }
        }

        if (contentEl && !contentEl._dealDetailContentClickBound) {
            contentEl._dealDetailContentClickBound = true;
            contentEl.addEventListener('click', async ev => {
                const link = ev.target.closest('a[data-route]');
                if (link) {
                    const route = link.getAttribute('data-route');
                    if (route && route !== '#' && typeof router !== 'undefined' && router.navigate) {
                        ev.preventDefault();
                        router.navigate(route);
                        return;
                    }
                }
                await handleDealStageContentClick(ev);
            });
        }

        const backLink = contentEl.querySelector('.deal-detail-back');
        if (backLink && isAdminView && typeof router !== 'undefined' && router.getCurrentPath && router.getCurrentPath().startsWith('/admin/deals')) {
            backLink.setAttribute('data-route', (window.CONFIG && window.CONFIG.ROUTES && window.CONFIG.ROUTES.ADMIN_DEALS) ? window.CONFIG.ROUTES.ADMIN_DEALS : '/admin/deals');
            backLink.innerHTML = '<i class="ph-duotone ph-arrow-left" aria-hidden="true"></i> Back to admin deals';
        }

        document.getElementById('deal-title').textContent = deal.title || 'Deal';

        const scopeEl = document.getElementById('deal-hero-scope');
        const scopeText = (deal.scope || '').trim();
        if (scopeEl) {
            if (scopeText) {
                scopeEl.textContent = truncateOneLine(scopeText, 280);
                scopeEl.removeAttribute('hidden');
            } else {
                scopeEl.textContent = '';
                scopeEl.setAttribute('hidden', 'hidden');
            }
        }

        document.getElementById('deal-type-label').textContent = getMatchTypeLabel(deal.matchType);

        const matchLink = document.getElementById('deal-match-link');
        if (deal.matchId) {
            matchLink.innerHTML = '<a href="#" data-route="/matches/' + escapeHtml(deal.matchId) + '">View match</a>';
        } else {
            matchLink.innerHTML = '';
        }

        const updatedPill = document.getElementById('deal-updated-pill');
        if (updatedPill) {
            const u = formatDealDetailDate(deal.updatedAt);
            updatedPill.textContent = u ? 'Updated ' + u : '';
        }

        await loadAndRenderLinkedOpportunities(deal);

        await finalizeDealDetailRender(dealId, user.id);
    } catch (e) {
        console.error('Deal detail error:', e);
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        if (contentEl) contentEl.style.display = 'none';
    }
}

function getParticipantRoleLabel(deal, participant) {
    if (deal.roleSlots && deal.roleSlots[participant.userId]) {
        const slot = deal.roleSlots[participant.userId];
        return typeof formatParticipantRole === 'function'
            ? formatParticipantRole(slot, slot)
            : slot;
    }
    const roles = (deal.payload && deal.payload.roles) || [];
    const r = roles.find(x => x.userId === participant.userId);
    if (r && r.role) {
        return typeof formatParticipantRole === 'function'
            ? formatParticipantRole(r.role, r.role)
            : r.role;
    }
    const pr = participant.role || '';
    if (typeof formatParticipantRole === 'function') {
        return formatParticipantRole(pr, 'Participant');
    }
    return pr ? pr.charAt(0).toUpperCase() + pr.slice(1) : 'Participant';
}

/** Display name for deal participant rows (user or company). Prefers profile.name over email. */
function entityDisplayName(entity) {
    if (!entity) return '';
    const profile = entity.profile && typeof entity.profile === 'object' ? entity.profile : null;
    const fromProfileName = profile && profile.name != null ? String(profile.name).trim() : '';
    if (entity.name != null && String(entity.name).trim() !== '') return String(entity.name).trim();
    if (fromProfileName) return fromProfileName;
    if (entity.companyName != null && String(entity.companyName).trim() !== '') return String(entity.companyName).trim();
    const fnRoot = [entity.firstName, entity.lastName].filter(Boolean).join(' ').trim();
    if (fnRoot) return fnRoot;
    const fnProf = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() : '';
    if (fnProf) return fnProf;
    if (entity.id != null && String(entity.id).trim() !== '') return String(entity.id).trim();
    if (entity.email != null && String(entity.email).trim() !== '') return String(entity.email).trim();
    return '';
}

async function renderConsortiumParticipantsBlock(deal, currentUserId) {
    const participants = deal.participants || [];
    const replacementMatches = dataService.getPostMatchesByReplacementDealId(deal.id) || [];
    const pendingInvites = replacementMatches.filter(m => (m.status || '') === 'pending');
    const resolveName = async (userId) => {
        if (!userId) return '';
        let entity = null;
        try {
            entity = await dataService.getUserOrCompanyById(userId);
        } catch (e) {
            entity = null;
        }
        return entityDisplayName(entity) || userId;
    };
    let rows = (await Promise.all(participants.map(async p => {
        const roleLabel = getParticipantRoleLabel(deal, p);
        const isDropped = (p.status || 'active') === 'dropped';
        const displayName = await resolveName(p.userId);
        const replacedBy = p.replacedByUserId ? ' (replaced by ' + escapeHtml(await resolveName(p.replacedByUserId)) + ')' : '';
        const badge = isDropped ? '<span class="badge badge-danger">Dropped' + replacedBy + '</span>' : (p.signedAt ? '<span class="badge badge-success">Signed</span>' : (p.approvalStatus === 'approved' ? '<span class="badge badge-info">Approved</span>' : '<span class="badge badge-secondary">Pending</span>'));
        return '<li class="deal-participant-list__row"><span class="deal-participant-list__name">' + escapeHtml(displayName) + ' <span class="deal-participant-list__meta">(' + escapeHtml(roleLabel) + ')</span></span>' + badge + '</li>';
    }))).join('');
    let replacementHtml = '';
    if (pendingInvites.length > 0) {
        const invitedId = pendingInvites[0].participants && pendingInvites[0].participants[0] ? pendingInvites[0].participants[0].userId : '';
        const invited = invitedId ? await resolveName(invitedId) : '—';
        replacementHtml = '<p class="deal-work-card__note">Replacement invitation sent to <strong>' + escapeHtml(invited) + '</strong>.</p>';
    }
    const isLead = participants.some(p => p.userId === currentUserId && (p.role || '') === 'consortium_lead');
    void isLead;
    const isDroppedMember = participants.some(p => p.userId === currentUserId && (p.status || 'active') === 'dropped');
    void isDroppedMember;
    const canDropOut = participants.some(p => p.userId === currentUserId && (p.role || '') === 'consortium_member' && (p.status || 'active') !== 'dropped');
    const hasDropped = participants.some(p => (p.status || 'active') === 'dropped');
    void hasDropped;
    const viable = dataService.isConsortiumDealViable(deal);
    const dropOutBtn = canDropOut && viable ? '<button type="button" class="btn btn-outline btn-sm" id="deal-btn-drop-out">Drop out</button>' : '';
    return dealWorkCard(
        '<i class="ph-duotone ph-users-three" aria-hidden="true"></i> Role slots',
        'Consortium participants and replacement state.',
        '<ul class="deal-participant-list">' + rows + '</ul>' + replacementHtml,
        dropOutBtn
    );
}

async function renderStageContent(deal, currentUserId) {
    const status = deal.status || 'negotiating';
    const participants = deal.participants || [];
    const firstOther = participants.find(p => p.userId !== currentUserId && (p.status || 'active') !== 'dropped');
    const messageRoute = firstOther ? '/messages/' + firstOther.userId : '#';
    const hasMsgPeer = !!firstOther;
    const consortiumBlock = (deal.matchType || '') === 'consortium' ? await renderConsortiumParticipantsBlock(deal, currentUserId) : '';

    if (status === 'negotiating') {
        const negotiation = deal.negotiationId ? await dataService.getNegotiationById(deal.negotiationId) : null;
        void negotiation;
        const actions =
            renderMessagePrimaryButton(messageRoute, hasMsgPeer) +
            '<button type="button" class="btn btn-outline btn-sm" id="deal-btn-propose-terms">Propose Terms</button>' +
            '<button type="button" class="btn btn-outline btn-sm" id="deal-btn-accept-proposal">Accept Proposal & Create Draft</button>' +
            '<button type="button" class="btn btn-outline btn-sm" id="deal-btn-cancel-negotiation">Cancel Negotiation</button>';
        return (
            consortiumBlock +
            dealWorkCard(
                '<i class="ph-duotone ph-chats-circle" aria-hidden="true"></i> Negotiation',
                'Discuss scope, timeline, value, and deliverables with participants. When terms are agreed, open the draft workspace.',
                '',
                actions
            )
        );
    }

    if (status === 'draft') {
        const scope = escapeHtml(deal.scope || '—');
        const timeline =
            deal.timeline && (deal.timeline.start || deal.timeline.end)
                ? (deal.timeline.start || '') + ' – ' + (deal.timeline.end || '')
                : '—';
        const avLine =
            deal.valueTerms && deal.valueTerms.agreedValue ? formatAgreedValueSummary(deal.valueTerms.agreedValue) : '';
        const payLine =
            deal.valueTerms && deal.valueTerms.paymentSchedule ? String(deal.valueTerms.paymentSchedule).trim() : '';
        const valueTerms = avLine || payLine ? [avLine, payLine].filter(Boolean).join(' · ') : '—';
        const exchangeLabel = formatExchangeModeLabel(deal.exchangeMode);
        const delivRaw = (deal.deliverables || '').trim();
        const delivDisplay = delivRaw ? escapeHtml(delivRaw) : '—';
        const milestones = deal.milestones || [];
        let milestoneHtml = '';
        if (!milestones.length) {
            milestoneHtml =
                '<span class="deal-draft-muted">None yet — open <strong class="deal-draft-muted__strong">Edit Draft</strong> to add milestones.</span>';
        } else {
            milestoneHtml =
                '<ol class="deal-draft-milestone-list">' +
                milestones
                    .map(m => {
                        const due =
                            m.dueDate != null && String(m.dueDate).trim() !== ''
                                ? ' <span class="deal-draft-muted">(' + escapeHtml(String(m.dueDate).slice(0, 10)) + ')</span>'
                                : '';
                        return '<li><span class="deal-draft-milestone-title">' + escapeHtml(m.title || 'Untitled') + '</span>' + due + '</li>';
                    })
                    .join('') +
                '</ol>';
        }
        const body =
            '<dl class="deal-draft-dl deal-draft-dl--card">' +
            '<div class="deal-draft-dl__row deal-draft-dl__row--scope"><dt>Scope</dt><dd class="deal-draft-dl__scope">' +
            scope +
            '</dd></div>' +
            '<div class="deal-draft-dl__row"><dt>Timeline</dt><dd>' +
            escapeHtml(timeline) +
            '</dd></div>' +
            '<div class="deal-draft-dl__row"><dt>Exchange</dt><dd><span class="deal-draft-pill">' +
            escapeHtml(exchangeLabel) +
            '</span></dd></div>' +
            '<div class="deal-draft-dl__row"><dt>Value</dt><dd class="deal-draft-dl__value">' +
            escapeHtml(valueTerms) +
            '</dd></div>' +
            '<div class="deal-draft-dl__row"><dt>Deliverables</dt><dd class="deal-draft-dl__deliv">' +
            delivDisplay +
            '</dd></div>' +
            '<div class="deal-draft-dl__row deal-draft-dl__row--milestones"><dt>Milestones</dt><dd>' +
            milestoneHtml +
            '</dd></div>' +
            '</dl>';
        const actions =
            '<div class="deal-work-actions__draft-bar">' +
            '<button type="button" class="btn btn-outline btn-sm" id="deal-btn-edit-draft">Edit Draft</button>' +
            '<button type="button" class="btn btn-outline btn-sm" id="deal-btn-cancel-deal">Cancel Deal</button>' +
            '<button type="button" class="btn btn-primary btn-sm deal-work-actions__primary-end" id="deal-btn-approve-draft">Send for Review</button>' +
            '</div>';
        return (
            consortiumBlock +
            dealWorkCard(
                '<i class="ph-duotone ph-note-pencil" aria-hidden="true"></i> Draft workspace',
                'Review terms before sending for participant approval.',
                body,
                actions,
                'deal-work-card--draft'
            )
        );
    }

    if (status === 'review') {
        let contract = null;
        if (deal.contractId) {
            try {
                contract = await dataService.getContractById(deal.contractId);
            } catch (e) {
                contract = null;
            }
        }
        const activeParts = participants.filter(p => (p.status || 'active') !== 'dropped');
        const approvedCount = activeParts.filter(p => (p.approvalStatus || 'pending') === 'approved').length;
        const totalActive = Math.max(activeParts.length, 1);
        const pct = Math.min(100, Math.round((approvedCount / totalActive) * 100));

        const partRows = await Promise.all(
            activeParts.map(async p => {
                let entity = null;
                try {
                    entity = await dataService.getUserOrCompanyById(p.userId);
                } catch (e) {
                    entity = null;
                }
                const display = entityDisplayName(entity) || p.userId;
                const roleLbl = getParticipantRoleLabel(deal, p);
                const isYou = p.userId === currentUserId;
                const st = p.approvalStatus || 'pending';
                const badgeClass = st === 'approved' ? 'success' : 'secondary';
                const stLabel = st === 'approved' ? 'Approved' : 'Pending';
                return (
                    '<li class="deal-participant-list__row deal-participant-list__row--review">' +
                    '<span class="deal-participant-list__name">' +
                    escapeHtml(display) +
                    (isYou ? '<span class="deal-review-you">You</span>' : '') +
                    '<span class="deal-participant-list__meta"> · ' +
                    escapeHtml(roleLbl) +
                    ' · <code class="deal-participant-list__id">' +
                    escapeHtml(p.userId) +
                    '</code></span></span>' +
                    '<span class="badge badge-' +
                    badgeClass +
                    '">' +
                    escapeHtml(stLabel) +
                    '</span></li>'
                );
            })
        );

        const cLabel =
            contract && window.DealContractFlowUi && typeof window.DealContractFlowUi.getContractStatusDisplayLabel === 'function'
                ? window.DealContractFlowUi.getContractStatusDisplayLabel(contract.status)
                : contract
                  ? contract.status
                  : '';

        const contractStrip =
            deal.contractId && contract
                ? '<div class="deal-review-contract-strip">' +
                  '<p class="deal-review-contract-strip__text"><i class="ph-duotone ph-file-text" aria-hidden="true"></i> Contract Agreement draft is <strong>' +
                  escapeHtml(cLabel || '—') +
                  '</strong>. Signing opens in the next step after everyone approves this workspace.</p>' +
                  '<a href="#" data-route="/contracts/' +
                  escapeHtml(deal.contractId) +
                  '" class="btn btn-outline btn-sm">Preview contract</a>' +
                  '</div>'
                : '';

        const scope = escapeHtml(deal.scope || '—');
        const timeline =
            deal.timeline && (deal.timeline.start || deal.timeline.end)
                ? (deal.timeline.start || '') + ' – ' + (deal.timeline.end || '')
                : '—';
        const avLine =
            deal.valueTerms && deal.valueTerms.agreedValue ? formatAgreedValueSummary(deal.valueTerms.agreedValue) : '';
        const payLine =
            deal.valueTerms && deal.valueTerms.paymentSchedule ? String(deal.valueTerms.paymentSchedule).trim() : '';
        const valueTerms = avLine || payLine ? [avLine, payLine].filter(Boolean).join(' · ') : '—';
        const exchangeLabel = formatExchangeModeLabel(deal.exchangeMode);
        const delivRaw = (deal.deliverables || '').trim();
        const delivDisplay = delivRaw ? escapeHtml(delivRaw) : '—';
        const milestones = deal.milestones || [];
        let milestoneHtml = '';
        if (!milestones.length) {
            milestoneHtml = '<span class="deal-draft-muted">None listed — can be refined after approval.</span>';
        } else {
            milestoneHtml =
                '<ol class="deal-draft-milestone-list">' +
                milestones
                    .map(m => {
                        const due =
                            m.dueDate != null && String(m.dueDate).trim() !== ''
                                ? ' <span class="deal-draft-muted">(' + escapeHtml(String(m.dueDate).slice(0, 10)) + ')</span>'
                                : '';
                        return '<li><span class="deal-draft-milestone-title">' + escapeHtml(m.title || 'Untitled') + '</span>' + due + '</li>';
                    })
                    .join('') +
                '</ol>';
        }

        const summary =
            '<dl class="deal-draft-dl deal-draft-dl--card deal-review-summary">' +
            '<div class="deal-draft-dl__row deal-draft-dl__row--scope"><dt>Scope</dt><dd class="deal-draft-dl__scope">' +
            scope +
            '</dd></div>' +
            '<div class="deal-draft-dl__row"><dt>Timeline</dt><dd>' +
            escapeHtml(timeline) +
            '</dd></div>' +
            '<div class="deal-draft-dl__row"><dt>Exchange</dt><dd><span class="deal-draft-pill">' +
            escapeHtml(exchangeLabel) +
            '</span></dd></div>' +
            '<div class="deal-draft-dl__row"><dt>Value</dt><dd class="deal-draft-dl__value">' +
            escapeHtml(valueTerms) +
            '</dd></div>' +
            '<div class="deal-draft-dl__row"><dt>Deliverables</dt><dd class="deal-draft-dl__deliv">' +
            delivDisplay +
            '</dd></div>' +
            '<div class="deal-draft-dl__row deal-draft-dl__row--milestones"><dt>Milestones</dt><dd>' +
            milestoneHtml +
            '</dd></div>' +
            '</dl>';

        const progress =
            '<div class="deal-review-progress" role="group" aria-label="Deal workspace approvals">' +
            '<div class="deal-review-progress__head">' +
            '<span class="deal-review-progress__label">Workspace approvals</span>' +
            '<span class="deal-review-progress__ratio">' +
            approvedCount +
            ' / ' +
            totalActive +
            '</span></div>' +
            '<div class="deal-review-progress__bar" role="progressbar" aria-valuemin="0" aria-valuemax="' +
            totalActive +
            '" aria-valuenow="' +
            approvedCount +
            '">' +
            '<span class="deal-review-progress__fill" style="width:' +
            pct +
            '%"></span></div></div>';

        const body =
            contractStrip +
            summary +
            progress +
            '<h3 class="deal-review-participants-heading">Participants</h3>' +
            '<ul class="deal-participant-list deal-participant-list--review">' +
            partRows.join('') +
            '</ul>';

        const lead = deal.contractId
            ? 'Review the agreed terms below. When every participant approves, the deal advances to signing the Contract Agreement.'
            : 'All participants must approve this deal workspace before a contract is generated for signature.';

        const actions =
            '<div class="deal-work-actions__review-bar">' +
            '<button type="button" class="btn btn-outline btn-sm" id="deal-btn-request-changes">Request Changes</button>' +
            '<button type="button" class="btn btn-outline btn-sm" id="deal-btn-reject-deal">Reject Deal</button>' +
            '<button type="button" class="btn btn-primary btn-sm deal-work-actions__primary-end" id="deal-btn-approve-review">Approve Deal</button>' +
            '</div>';

        return (
            consortiumBlock +
            dealWorkCard(
                '<i class="ph-duotone ph-eye" aria-hidden="true"></i> In review',
                lead,
                body,
                actions,
                'deal-work-card--review'
            )
        );
    }

    if (status === 'signing') {
        let contract = null;
        if (deal.contractId) {
            contract = await dataService.getContractById(deal.contractId);
        }
        const parties = contract ? dataService.getContractParties(contract) : [];
        const signedCount = parties.filter(p => p.signedAt).length;
        const totalParties = parties.length;
        const cLabel =
            contract && window.DealContractFlowUi && typeof window.DealContractFlowUi.getContractStatusDisplayLabel === 'function'
                ? window.DealContractFlowUi.getContractStatusDisplayLabel(contract.status)
                : contract
                  ? contract.status
                  : '—';
        const contractBody =
            '<p class="deal-work-card__note">' +
            '<span class="badge badge-' +
            (contract && contract.status === 'pending' ? 'secondary' : contract && contract.status === 'active' ? 'primary' : 'secondary') +
            '">' +
            escapeHtml(cLabel) +
            '</span>' +
            (totalParties ? ' · Signatures: ' + signedCount + '/' + totalParties : '') +
            '</p>' +
            (deal.contractId
                ? '<div class="deal-work-actions deal-work-actions--tight"><a href="#" data-route="/contracts/' +
                  escapeHtml(deal.contractId) +
                  '" class="btn btn-outline btn-sm">Review Contract</a></div>'
                : '<p class="deal-work-card__warn">Preparing contract…</p>');
        const contractCard =
            '<section class="deal-work-card deal-work-card--contract">' +
            '<header class="deal-work-card__head"><h2 class="deal-work-card__title"><i class="ph-duotone ph-file-text" aria-hidden="true"></i> Contract Agreement</h2>' +
            '<p class="deal-work-card__lead">Legal and commercial terms for this collaboration.</p></header>' +
            '<div class="deal-work-card__body">' +
            contractBody +
            '</div></section>';
        const partList = participants
            .filter(p => (p.status || 'active') !== 'dropped')
            .map(
                p =>
                    '<li class="deal-participant-list__row"><span class="deal-participant-list__name">' +
                    escapeHtml(p.userId) +
                    '</span><span class="badge ' +
                    (p.signedAt ? 'badge-success' : 'badge-warning') +
                    '">' +
                    (p.signedAt ? 'Signed' : 'Pending') +
                    '</span></li>'
            )
            .join('');
        const signBody = '<ul class="deal-participant-list">' + partList + '</ul>';
        const myParty = parties.find(p => p.userId === currentUserId);
        const mySigned = !!(myParty && myParty.signedAt);
        const signActions =
            (mySigned
                ? '<p class="text-muted mb-2">You have signed this agreement.</p>'
                : '<button type="button" class="btn btn-primary btn-sm" id="deal-btn-sign">Sign Agreement</button>') +
            '<button type="button" class="btn btn-outline btn-sm" id="deal-btn-cancel-deal">Cancel Deal</button>';
        return (
            consortiumBlock +
            contractCard +
            dealWorkCard(
                '<i class="ph-duotone ph-signature" aria-hidden="true"></i> Waiting for signatures',
                'Each party signs the Contract Agreement. The deal becomes active when everyone has signed.',
                signBody,
                signActions
            )
        );
    }

    if (status === 'active') {
        const msgPara = hasMsgPeer
            ? '<p class="deal-work-card__lead deal-work-card__lead--tight">' + renderMessageInlineLink(messageRoute, true) + ' when you need alignment before execution.</p>'
            : '<p class="deal-work-card__lead deal-work-card__lead--tight"><button type="button" class="deal-work-card__inline-link deal-btn-message-unavailable">Message participants</button> — no other active participant in this workspace.</p>';
        return (
            consortiumBlock +
            dealWorkCard(
                '<i class="ph-duotone ph-lightning" aria-hidden="true"></i> Active deal',
                'The Contract Agreement is active. Start execution to track milestones and deliverables.',
                msgPara,
                hasMsgPeer
                    ? '<a href="#" data-route="' + escapeHtml(messageRoute) + '" class="btn btn-outline btn-sm">Message participants</a><button type="button" class="btn btn-primary btn-sm" id="deal-btn-start-execution">Start Execution</button>'
                    : '<button type="button" class="btn btn-outline btn-sm deal-btn-message-unavailable">Message participants</button><button type="button" class="btn btn-primary btn-sm" id="deal-btn-start-execution">Start Execution</button>'
            )
        );
    }

    if (status === 'execution') {
        const milestones = deal.milestones || [];
        const msStatus = m => m.status || 'pending';
        const completedCount = milestones.filter(m => msStatus(m) === 'approved' || msStatus(m) === 'completed').length;
        const progressText = milestones.length ? 'Completion: ' + completedCount + '/' + milestones.length : '';
        const msList = milestones.length
            ? milestones
                  .map(m => {
                      const raw = msStatus(m);
                      const badge = getMilestoneStatusBadgeClass(raw);
                      const label = getMilestoneStatusDisplayLabel(raw).replace('_', ' ');
                      let actions = '';
                      if (raw === 'pending') {
                          actions =
                              '<button type="button" class="btn btn-outline btn-xs deal-milestone-start" data-milestone-id="' +
                              escapeHtml(m.id) +
                              '">Start</button>';
                      } else if (raw === 'in_progress') {
                          actions =
                              '<button type="button" class="btn btn-outline btn-xs deal-milestone-submit" data-milestone-id="' +
                              escapeHtml(m.id) +
                              '">Submit deliverable</button>';
                      } else if (raw === 'submitted') {
                          actions =
                              '<button type="button" class="btn btn-primary btn-xs deal-milestone-approve" data-milestone-id="' +
                              escapeHtml(m.id) +
                              '">Approve</button><button type="button" class="btn btn-outline btn-xs deal-milestone-reject" data-milestone-id="' +
                              escapeHtml(m.id) +
                              '">Request revision</button>';
                      }
                      return (
                          '<li class="deal-milestone-row"><span class="deal-milestone-row__main"><strong>' +
                          escapeHtml(m.title || m.name || 'Milestone') +
                          '</strong>' +
                          (m.dueDate ? ' <span class="deal-milestone-row__due">(' + escapeHtml(m.dueDate) + ')</span>' : '') +
                          '</span><span class="deal-milestone-row__meta"><span class="badge badge-' +
                          badge +
                          '">' +
                          escapeHtml(label) +
                          '</span>' +
                          actions +
                          '</span></li>'
                      );
                  })
                  .join('')
            : '<li class="deal-milestone-row deal-milestone-row--empty">No milestones yet.</li>';
        const allApproved = milestones.length > 0 && milestones.every(m => msStatus(m) === 'approved' || msStatus(m) === 'completed');
        const readyBtn = allApproved || milestones.length === 0 ? '<button type="button" class="btn btn-primary btn-sm" id="deal-btn-ready-for-delivery">Ready for delivery</button>' : '';
        const topLine =
            '<p class="deal-work-card__lead deal-work-card__lead--tight">' +
            renderMessageInlineLink(messageRoute, hasMsgPeer) +
            (hasMsgPeer ? ' · Work through milestones below.' : ' — add milestones and track delivery.') +
            '</p>';
        const actions =
            '<button type="button" class="btn btn-outline btn-sm" id="deal-btn-add-milestone">Add Milestone</button>' + readyBtn;
        return (
            consortiumBlock +
            dealWorkCard(
                '<i class="ph-duotone ph-check-square" aria-hidden="true"></i> Execution workspace',
                (progressText ? '<span class="deal-work-card__progress">' + escapeHtml(progressText) + '</span> · ' : '') + 'Submit deliverables for approval.',
                topLine + '<h3 class="deal-work-subheading">Milestones</h3><ul class="deal-milestone-list">' + msList + '</ul>',
                actions
            )
        );
    }

    if (status === 'delivery') {
        const actions =
            '<button type="button" class="btn btn-primary btn-sm" id="deal-btn-approve-completion">Approve completion</button>' +
            '<button type="button" class="btn btn-outline btn-sm" id="deal-btn-request-revisions">Request revisions</button>';
        return (
            consortiumBlock +
            dealWorkCard(
                '<i class="ph-duotone ph-package" aria-hidden="true"></i> Delivery review',
                'Review final deliverables. Approve completion to close the deal.',
                '',
                actions
            )
        );
    }

    if (status === 'completed' || status === 'closed') {
        const actions =
            status === 'completed'
                ? '<a href="#" data-route="/deals/' +
                  escapeHtml(deal.id) +
                  '/rate" class="btn btn-primary btn-sm" id="deal-link-rate">Rate & Review</a><button type="button" class="btn btn-outline btn-sm" id="deal-btn-close-deal">Close Deal</button>'
                : '';
        const body = '<p class="deal-work-card__scope">Scope: ' + escapeHtml(deal.scope || '—') + '</p>';
        return (
            consortiumBlock +
            dealWorkCard(
                status === 'completed'
                    ? '<i class="ph-duotone ph-check-circle" aria-hidden="true"></i> Deal completed'
                    : '<i class="ph-duotone ph-archive" aria-hidden="true"></i> Deal closed',
                status === 'completed' ? 'Thank you for completing this collaboration.' : 'This workspace is closed.',
                body,
                actions
            )
        );
    }

    if (status === 'cancelled') {
        return consortiumBlock + dealWorkCard('<i class="ph-duotone ph-x-circle" aria-hidden="true"></i> Deal cancelled', 'This collaboration workspace was cancelled.', '', '');
    }

    return consortiumBlock + dealWorkCard('Unknown stage', '', '<p class="deal-work-card__note">No workflow content for this status.</p>', '');
}

async function handleDealStageContentClick(e) {
    const stage = e.target.closest('#deal-stage-content');
    if (!stage) return;

    const dealId = stage.dataset.dealId;
    const userId = stage.dataset.actorUserId;
    if (!dealId || !userId) return;

    const target =
        e.target.closest(
            '[id^="deal-btn-"], [id^="deal-link-"], .deal-milestone-start, .deal-milestone-submit, .deal-milestone-approve, .deal-milestone-reject, .deal-btn-message-unavailable'
        ) || (e.target.matches && e.target.matches('button[id^="deal-btn-"]') ? e.target : null);
    if (!target) return;

    const modal = window.modalService;

        if (target.classList && target.classList.contains('deal-btn-message-unavailable')) {
            e.preventDefault();
            if (modal && typeof modal.info === 'function') {
                await modal.info('There is no other active participant to message in this workspace yet.', 'Messages');
            }
            return;
        }

        const id = target.id || '';
        const milestoneId = target.dataset?.milestoneId;

        if (id === 'deal-btn-propose-terms' || id === 'deal-btn-edit-draft') {
            e.preventDefault();
            try {
                const deal = await dataService.getDealById(dealId);
                if (!deal) return;
                const payload = await openDealWorkspaceTermsModal(deal, {
                    title: id === 'deal-btn-edit-draft' ? 'Edit draft' : 'Propose terms',
                    submitLabel: id === 'deal-btn-edit-draft' ? 'Save draft' : 'Save proposal'
                });
                if (!payload) return;
                await dataService.updateDeal(dealId, payload);
                await finalizeDealDetailRender(dealId, userId);
            } catch (err) {
                console.error(err);
            }
            return;
        }

        if (id === 'deal-btn-drop-out') {
            e.preventDefault();
            let ok = false;
            if (modal && typeof modal.confirm === 'function') {
                ok = await modal.confirm('Drop out of this consortium deal? A replacement may be invited.', 'Drop out', {
                    confirmText: 'Drop out',
                    cancelText: 'Stay',
                    type: 'warning'
                });
            } else if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
                ok = window.confirm('Drop out of this consortium deal? A replacement may be invited.');
            }
            if (!ok) return;
            try {
                const { deal: updatedDeal, missingRole, viable } = await dataService.markDealParticipantDropped(dealId, userId);
                await dataService.logParticipantDropped(dealId, userId);
                if (viable && updatedDeal && missingRole) {
                    const matchingService = window.matchingService || (typeof matchingService !== 'undefined' ? matchingService : null);
                    if (matchingService && typeof matchingService.findReplacementCandidatesForRole === 'function') {
                        const leadNeedId = updatedDeal.opportunityId || (updatedDeal.opportunityIds && updatedDeal.opportunityIds[0]);
                        if (leadNeedId) {
                            const excludeUserIds = (updatedDeal.participants || []).map(p => p.userId);
                            const { candidates } = await matchingService.findReplacementCandidatesForRole(leadNeedId, missingRole, { excludeUserIds, topN: 1 });
                            if (candidates && candidates[0]) {
                                await dataService.createReplacementPostMatch(dealId, candidates[0], missingRole, userId);
                            }
                        }
                    }
                }
                await finalizeDealDetailRender(dealId, userId);
            } catch (err) {
                console.error(err);
            }
            return;
        }
        if (id === 'deal-btn-accept-proposal') {
            e.preventDefault();
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.DRAFT });
                await finalizeDealDetailRender(dealId, userId);
            } catch (err) {
                console.error(err);
            }
            return;
        }
        if (id === 'deal-btn-cancel-negotiation' || id === 'deal-btn-cancel-deal') {
            e.preventDefault();
            let ok = false;
            if (modal && typeof modal.confirm === 'function') {
                ok = await modal.confirm('Cancel this deal? This cannot be undone.', 'Cancel deal', {
                    confirmText: 'Cancel deal',
                    type: 'warning'
                });
            } else if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
                ok = window.confirm('Cancel this deal? This cannot be undone.');
            }
            if (!ok) return;
            try {
                const dealBefore = await dataService.getDealById(dealId);
                const cancelledStatus = CONFIG.DEAL_STATUS && CONFIG.DEAL_STATUS.CANCELLED ? CONFIG.DEAL_STATUS.CANCELLED : CONFIG.DEAL_STATUS.CLOSED;
                await dataService.updateDeal(dealId, { status: cancelledStatus, closedAt: new Date().toISOString() });
                if (dealBefore && dealBefore.contractId && typeof dataService.terminateLinkedContractForCancelledDeal === 'function') {
                    await dataService.terminateLinkedContractForCancelledDeal(dealId, dealBefore.contractId, userId, 'deal_cancelled');
                }
                if (dataService.createAuditLog && userId) {
                    dataService.createAuditLog({ userId, action: 'deal_closed', entityType: 'deal', entityId: dealId, details: { reason: 'cancelled' } }).catch(() => {});
                }
                if (window.router) window.router.navigate('/deals');
            } catch (err) {
                console.error(err);
            }
            return;
        }
        if (id === 'deal-btn-approve-draft') {
            e.preventDefault();
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.REVIEW });
                if (dataService.createAuditLog && userId) {
                    await dataService.createAuditLog({ userId, action: 'deal_sent_for_review', entityType: 'deal', entityId: dealId, details: {} }).catch(() => {});
                }
                const dealAfter = await dataService.getDealById(dealId);
                const parts = (dealAfter.participants || []).filter(p => (p.status || 'active') !== 'dropped');
                for (const p of parts) {
                    if (p.userId && p.userId !== userId) {
                        await dataService
                            .createNotification({
                                userId: p.userId,
                                type: 'deal_ready_for_review',
                                title: 'Deal ready for review',
                                message: 'The Deal Workspace was sent for review. Approve when ready.',
                                link: '/deals/' + dealId,
                                read: false
                            })
                            .catch(() => {});
                    }
                }
                await finalizeDealDetailRender(dealId, userId);
            } catch (err) {
                console.error(err);
            }
            return;
        }
        if (id === 'deal-btn-approve-review') {
            e.preventDefault();
            try {
                const deal = await dataService.getDealById(dealId);
                const participants = (deal.participants || []).map(p => (p.userId === userId ? { ...p, approvalStatus: 'approved' } : p));
                await dataService.updateDeal(dealId, { participants });
                const updated = await dataService.getDealById(dealId);
                const activeParts = (updated.participants || []).filter(p => (p.status || 'active') !== 'dropped');
                const allApproved = activeParts.length > 0 && activeParts.every(p => p.approvalStatus === 'approved');
                if (allApproved && typeof dataService.transitionDealToSigningWithContract === 'function') {
                    await dataService.transitionDealToSigningWithContract(dealId, userId);
                }
                await finalizeDealDetailRender(dealId, userId);
            } catch (err) {
                console.error(err);
            }
            return;
        }
        if (id === 'deal-btn-request-changes') {
            e.preventDefault();
            let ok = false;
            if (modal && typeof modal.confirm === 'function') {
                ok = await modal.confirm(
                    'Return this deal to draft? Participants will need to review again after edits.',
                    'Request changes',
                    { confirmText: 'Return to draft', cancelText: 'Cancel', type: 'warning' }
                );
            } else if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
                ok = window.confirm('Return this deal to draft? Participants will need to review again after edits.');
            }
            if (!ok) return;
            try {
                const deal = await dataService.getDealById(dealId);
                const participants = (deal.participants || []).map(p =>
                    (p.status || 'active') === 'dropped' ? p : { ...p, approvalStatus: 'pending' }
                );
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.DRAFT, participants });
                if (dataService.createAuditLog && userId) {
                    dataService
                        .createAuditLog({
                            userId,
                            action: 'deal_returned_to_draft',
                            entityType: 'deal',
                            entityId: dealId,
                            details: { from: 'review' }
                        })
                        .catch(() => {});
                }
                try {
                    sessionStorage.setItem(
                        'pmtwin_deal_flash',
                        JSON.stringify({ tone: 'info', message: 'Deal returned to draft. Edit terms, then send for review again.' })
                    );
                } catch {
                    /* ignore storage quota */
                }
                await finalizeDealDetailRender(dealId, userId);
                const flashEl = document.getElementById('deal-flash-banner');
                if (flashEl) {
                    flashEl.innerHTML =
                        '<div class="deal-flash deal-flash--info" role="status">Deal returned to draft. Edit terms, then send for review again.</div>';
                    flashEl.style.display = 'block';
                }
            } catch (err) {
                console.error(err);
                if (modal && typeof modal.error === 'function') {
                    await modal.error('Could not return the deal to draft. Please try again.', 'Request changes');
                }
            }
            return;
        }
        if (id === 'deal-btn-reject-deal') {
            e.preventDefault();
            let ok = false;
            if (modal && typeof modal.confirm === 'function') {
                ok = await modal.confirm('Reject this deal? It will be cancelled.', 'Reject deal', { confirmText: 'Reject', type: 'warning' });
            } else if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
                ok = window.confirm('Reject this deal? It will be cancelled.');
            }
            if (!ok) return;
            try {
                const dealBefore = await dataService.getDealById(dealId);
                const cancelledStatus = CONFIG.DEAL_STATUS && CONFIG.DEAL_STATUS.CANCELLED ? CONFIG.DEAL_STATUS.CANCELLED : CONFIG.DEAL_STATUS.CLOSED;
                await dataService.updateDeal(dealId, { status: cancelledStatus, closedAt: new Date().toISOString() });
                if (dealBefore && dealBefore.contractId && typeof dataService.terminateLinkedContractForCancelledDeal === 'function') {
                    await dataService.terminateLinkedContractForCancelledDeal(dealId, dealBefore.contractId, userId, 'deal_rejected');
                }
                if (dataService.createAuditLog && userId) {
                    dataService.createAuditLog({ userId, action: 'deal_closed', entityType: 'deal', entityId: dealId, details: { reason: 'rejected' } }).catch(() => {});
                }
                if (window.router) window.router.navigate('/deals');
            } catch (err) {
                console.error(err);
            }
            return;
        }
        if (id === 'deal-btn-sign') {
            e.preventDefault();
            try {
                let deal = await dataService.getDealById(dealId);
                if (deal.status === CONFIG.DEAL_STATUS.SIGNING && !deal.contractId && typeof dataService.repairSigningDealMissingContract === 'function') {
                    await dataService.repairSigningDealMissingContract(dealId);
                    deal = await dataService.getDealById(dealId);
                }
                const contractId = deal.contractId;
                if (!contractId) {
                    if (modal && typeof modal.error === 'function') {
                        await modal.error('The Contract Agreement is not available yet. Please refresh the page.', 'Contract');
                    }
                    return;
                }
                const contract = await dataService.getContractById(contractId);
                if (!contract) return;
                const beforeParties = dataService.getContractParties(contract);
                const alreadySigned = beforeParties.some(p => p.userId === userId && p.signedAt);
                if (alreadySigned) {
                    await finalizeDealDetailRender(dealId, userId);
                    return;
                }
                if (typeof dataService.signContractParty === 'function') {
                    await dataService.signContractParty(contractId, userId);
                } else {
                    const parties = beforeParties.map(p =>
                        (p.userId === userId ? { ...p, signedAt: new Date().toISOString() } : p)
                    );
                    await dataService.updateContract(contractId, { parties });
                }
                const dealParticipants = (deal.participants || []).map(p =>
                    (p.userId === userId ? { ...p, signedAt: new Date().toISOString() } : p)
                );
                await dataService.updateDeal(dealId, { participants: dealParticipants });
                await finalizeDealDetailRender(dealId, userId);
            } catch (err) {
                console.error(err);
            }
            return;
        }
        if (id === 'deal-btn-start-execution') {
            e.preventDefault();
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.EXECUTION });
                if (dataService.createAuditLog && userId) {
                    await dataService.createAuditLog({ userId, action: 'deal_execution_started', entityType: 'deal', entityId: dealId, details: {} }).catch(() => {});
                }
                const d = await dataService.getDealById(dealId);
                const pts = (d.participants || []).filter(p => (p.status || 'active') !== 'dropped');
                for (const p of pts) {
                    if (p.userId) {
                        await dataService
                            .createNotification({
                                userId: p.userId,
                                type: 'deal_execution_started',
                                title: 'Execution started',
                                message: 'Milestone tracking is now active for your deal.',
                                link: '/deals/' + dealId,
                                read: false
                            })
                            .catch(() => {});
                    }
                }
                await finalizeDealDetailRender(dealId, userId);
            } catch (err) {
                console.error(err);
            }
            return;
        }
        if (id === 'deal-btn-ready-for-delivery') {
            e.preventDefault();
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.DELIVERY });
                if (dataService.createAuditLog && userId) {
                    await dataService.createAuditLog({ userId, action: 'deal_delivery_submitted', entityType: 'deal', entityId: dealId, details: {} }).catch(() => {});
                }
                await finalizeDealDetailRender(dealId, userId);
            } catch (err) {
                console.error(err);
            }
            return;
        }
        if (id === 'deal-btn-approve-completion') {
            e.preventDefault();
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.COMPLETED, completedAt: new Date().toISOString() });
                if (dataService.createAuditLog && userId) {
                    await dataService.createAuditLog({ userId, action: 'deal_completed', entityType: 'deal', entityId: dealId, details: {} }).catch(() => {});
                }
                const d = await dataService.getDealById(dealId);
                const pts = (d.participants || []).filter(p => (p.status || 'active') !== 'dropped');
                for (const p of pts) {
                    if (p.userId) {
                        await dataService
                            .createNotification({
                                userId: p.userId,
                                type: 'deal_completed',
                                title: 'Deal completed',
                                message: 'This collaboration deal is marked complete.',
                                link: '/deals/' + dealId,
                                read: false
                            })
                            .catch(() => {});
                    }
                }
                await finalizeDealDetailRender(dealId, userId);
            } catch (err) {
                console.error(err);
            }
            return;
        }
        if (id === 'deal-btn-request-revisions') {
            e.preventDefault();
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.EXECUTION });
                await finalizeDealDetailRender(dealId, userId);
            } catch (err) {
                console.error(err);
            }
            return;
        }
        if (id === 'deal-btn-close-deal') {
            e.preventDefault();
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.CLOSED, closedAt: new Date().toISOString() });
                if (dataService.createAuditLog && userId) {
                    dataService.createAuditLog({ userId, action: 'deal_closed', entityType: 'deal', entityId: dealId, details: { reason: 'closed_after_completed' } }).catch(() => {});
                }
                await finalizeDealDetailRender(dealId, userId);
            } catch (err) {
                console.error(err);
            }
            return;
        }
        if (id === 'deal-btn-add-milestone') {
            e.preventDefault();
            let title = '';
            if (modal && typeof modal.prompt === 'function') {
                title = await modal.prompt('Enter a short title for this milestone.', {
                    title: 'Add milestone',
                    confirmText: 'Add',
                    required: true,
                    multiline: false,
                    placeholder: 'e.g. Mobilization complete',
                    type: 'info'
                });
            }
            if (title == null || !String(title).trim()) return;
            try {
                await dataService.addDealMilestone(dealId, { title: String(title).trim(), description: '', deliverables: '', status: 'pending' });
                await finalizeDealDetailRender(dealId, userId);
            } catch (err) {
                console.error(err);
            }
            return;
        }
        if (
            milestoneId &&
            target.classList &&
            (target.classList.contains('deal-milestone-start') ||
                target.classList.contains('deal-milestone-submit') ||
                target.classList.contains('deal-milestone-approve') ||
                target.classList.contains('deal-milestone-reject'))
        ) {
            e.preventDefault();
            try {
                let updates = {};
                if (target.classList.contains('deal-milestone-start')) updates = { status: 'in_progress' };
                else if (target.classList.contains('deal-milestone-submit')) {
                    updates = { status: 'submitted', submittedAt: new Date().toISOString() };
                } else if (target.classList.contains('deal-milestone-approve')) {
                    updates = { status: 'approved', approvedAt: new Date().toISOString(), approvedBy: userId };
                } else if (target.classList.contains('deal-milestone-reject')) updates = { status: 'rejected' };
                await dataService.updateDealMilestone(dealId, milestoneId, updates);
                if (target.classList.contains('deal-milestone-approve') && dataService.createAuditLog && userId) {
                    await dataService.createAuditLog({ userId, action: 'milestone_completed', entityType: 'deal', entityId: dealId, details: { milestoneId } }).catch(() => {});
                }
                await finalizeDealDetailRender(dealId, userId);
            } catch (err) {
                console.error(err);
            }
        }
}
