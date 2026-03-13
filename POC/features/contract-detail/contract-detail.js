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
    const map = {
        pending: 'secondary',
        active: 'primary',
        completed: 'success',
        terminated: 'danger'
    };
    return map[status] || 'secondary';
}

function getContractStatusLabel(status) {
    const map = {
        pending: 'Pending',
        active: 'Active',
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

async function initContractDetail(params) {
    const contractId = params?.id;
    const loadingEl = document.getElementById('contract-loading');
    const errorEl = document.getElementById('contract-error');
    const contentEl = document.getElementById('contract-content');

    if (!contractId) {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        contentEl.style.display = 'none';
        wireBackLink(errorEl);
        return;
    }

    const user = authService.getCurrentUser();
    if (!user) {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        contentEl.style.display = 'none';
        wireBackLink(errorEl);
        return;
    }

    try {
        const contract = await dataService.getContractById(contractId);
        if (!contract) {
            loadingEl.style.display = 'none';
            errorEl.style.display = 'block';
            contentEl.style.display = 'none';
            wireBackLink(errorEl);
            return;
        }

        const parties = dataService.getContractParties(contract);
        const isParty = parties.some(p => p.userId === user.id);
        const isAdminView = authService.canAccessAdmin && authService.canAccessAdmin();
        if (!isParty && !isAdminView) {
            loadingEl.style.display = 'none';
            errorEl.style.display = 'block';
            contentEl.style.display = 'none';
            wireBackLink(errorEl);
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
        document.getElementById('contract-status-badge').className = 'badge badge-' + getContractStatusBadgeClass(contract.status);
        document.getElementById('contract-role-badge').textContent = 'Your role: ' + myRole;

        const partiesHtml = parties.map((p, i) => {
            const u = partyUsers[i];
            const name = u?.profile?.name || u?.email || p.userId;
            const email = u?.email || '—';
            const roleLabel = (p.role || 'participant').charAt(0).toUpperCase() + (p.role || 'participant').slice(1);
            const signed = p.signedAt ? formatDate(p.signedAt) : 'Pending';
            return `<p><strong>${escapeHtml(roleLabel)}</strong><br/>${escapeHtml(name)}<br/><span class="text-muted">${escapeHtml(email)}</span><br/><span class="text-muted small">Signed: ${signed}</span></p>`;
        }).join('');
        document.getElementById('contract-parties').innerHTML = partiesHtml;

        const paymentMode = contract.paymentMode || (opportunity && opportunity.exchangeMode) || '—';
        const duration = contract.duration || '—';
        const paymentSchedule = contract.paymentSchedule || (opportunity && opportunity.exchangeData && opportunity.exchangeData.cashMilestones) || '';
        const equityVesting = contract.equityVesting;
        const profitShare = contract.profitShare;
        let termsHtml = `
            <p><strong>Scope</strong><br/>${escapeHtml(scopeDisplay)}</p>
            <p><strong>Payment mode</strong><br/>${escapeHtml(paymentMode)}</p>
            <p><strong>Duration</strong><br/>${escapeHtml(duration)}</p>
        `;
        if (paymentSchedule) {
            termsHtml += `<p><strong>Payment schedule</strong><br/>${escapeHtml(typeof paymentSchedule === 'string' ? paymentSchedule : JSON.stringify(paymentSchedule))}</p>`;
        }
        if (equityVesting) {
            const eqStr = typeof equityVesting === 'string' ? equityVesting : (equityVesting.period || equityVesting.percentage != null ? (equityVesting.percentage != null ? equityVesting.percentage + '% ' : '') + (equityVesting.period || '') : '');
            if (eqStr) termsHtml += `<p><strong>Equity vesting</strong><br/>${escapeHtml(eqStr)}</p>`;
        }
        if (profitShare) {
            if (typeof profitShare === 'string') {
                termsHtml += `<p><strong>Profit share agreement</strong><br/>${escapeHtml(profitShare)}</p>`;
            } else if (profitShare.percentage != null || profitShare.split) {
                termsHtml += `<p><strong>Profit share agreement</strong><br/>${profitShare.percentage != null ? profitShare.percentage + '%' : ''} ${profitShare.split ? escapeHtml(profitShare.split) : ''}${profitShare.basis ? ' · ' + escapeHtml(profitShare.basis) : ''}${profitShare.distribution ? '<br/><span class="text-muted">' + escapeHtml(profitShare.distribution) + '</span>' : ''}</p>`;
            }
        }
        document.getElementById('contract-scope-terms').innerHTML = termsHtml;

        const dealId = contract.dealId;
        const executionHtml = dealId
            ? `<p class="text-muted">Execution (milestones, delivery) is managed by the linked Deal.</p><a href="#" data-route="/deals/${escapeHtml(dealId)}" class="btn btn-primary btn-sm">View Deal</a>`
            : '<p class="text-muted">Execution is managed by the linked Deal. No deal linked.</p>';
        const milestonesEl = document.getElementById('contract-milestones');
        if (milestonesEl) milestonesEl.innerHTML = executionHtml;

        document.getElementById('contract-dates').innerHTML = `
            <p><strong>Created</strong><br/>${formatDate(contract.createdAt)}</p>
            <p><strong>Last updated</strong><br/>${formatDate(contract.updatedAt)}</p>
            ${contract.signedAt ? '<p><strong>Signed</strong><br/>' + formatDate(contract.signedAt) + '</p>' : ''}
        `;

        const oppTitle = (opportunity && opportunity.title) || scopeDisplay;
        const oppId = contract.opportunityId;
        let opportunityLinkHtml = '';
        if (dealId) {
            opportunityLinkHtml += `<p><a href="#" data-route="/deals/${escapeHtml(dealId)}" class="text-primary font-medium">View Deal (execution)</a></p>`;
        }
        if (oppId) {
            opportunityLinkHtml += `<p><a href="#" data-route="/opportunities/${escapeHtml(oppId)}" class="contract-opportunity-link text-primary font-medium">${escapeHtml(oppTitle)}</a></p><a href="#" data-route="/opportunities/${escapeHtml(oppId)}" class="btn btn-primary btn-sm">View opportunity</a>`;
        }
        document.getElementById('contract-opportunity-link').innerHTML = opportunityLinkHtml || '<p class="text-muted">—</p>';

        const isLead = parties.length > 0 && parties[0].userId === user.id;
        const canEditContract = isLead && (contract.status === 'pending' || contract.status === 'active');
        const canCloseContract = isLead && contract.status === 'active';
        const oppStatus = opportunity ? opportunity.status : '';
        const actionsEl = document.getElementById('contract-detail-actions');
        if (actionsEl) {
            let actionsHtml = '';
            if (canEditContract) {
                actionsHtml += `<button type="button" id="contract-edit-btn" class="btn btn-secondary no-print" data-contract-id="${escapeHtml(contract.id)}">Edit contract</button>`;
            }
            if (canCloseContract) {
                actionsHtml += `<button type="button" id="contract-close-btn" class="btn btn-primary no-print">Close contract</button>`;
            }
            if (dealId) {
                actionsHtml += `<a href="#" data-route="/deals/${escapeHtml(dealId)}" class="btn btn-primary">Manage execution</a>`;
            }
            actionsHtml += `<button type="button" id="contract-print-btn" class="btn btn-secondary">Print contract</button>`;
            actionsEl.innerHTML = actionsHtml;
        }

        document.getElementById('contract-close-btn')?.addEventListener('click', () => closeContract(contractId, contract.opportunityId, oppStatus));

        document.getElementById('contract-edit-btn')?.addEventListener('click', () => {
            showEditContractModal(contractId, {
                scope: contract.scope || '',
                duration: contract.duration || '',
                paymentSchedule: typeof contract.paymentSchedule === 'string' ? contract.paymentSchedule : (contract.paymentSchedule ? JSON.stringify(contract.paymentSchedule) : ''),
                equityVesting: contract.equityVesting ? (typeof contract.equityVesting === 'string' ? contract.equityVesting : JSON.stringify(contract.equityVesting)) : '',
                profitShare: contract.profitShare ? (typeof contract.profitShare === 'string' ? contract.profitShare : JSON.stringify(contract.profitShare)) : ''
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

        wireBackLink(contentEl);
        contentEl.querySelectorAll('a[data-route]').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                if (route && typeof router !== 'undefined') router.navigate(route);
            });
        });
    } catch (err) {
        console.error('Error loading contract:', err);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        contentEl.style.display = 'none';
        wireBackLink(errorEl);
    }
}

function showEditContractModal(contractId, current) {
    const opts = typeof current === 'object' && current !== null ? current : { scope: current || '', duration: '' };
    const scope = opts.scope || '';
    const duration = opts.duration || '';
    const paymentSchedule = opts.paymentSchedule || '';
    const equityVesting = opts.equityVesting || '';
    const profitShare = opts.profitShare || '';
    const contentHTML = `
        <form id="contract-edit-form" class="space-y-3">
            <div>
                <label for="edit-contract-scope" class="block text-sm font-medium text-gray-700 mb-1">Scope <span class="text-red-500">*</span></label>
                <input type="text" id="edit-contract-scope" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value="${escapeHtml(scope)}" required placeholder="Contract scope / title" />
            </div>
            <div>
                <label for="edit-contract-duration" class="block text-sm font-medium text-gray-700 mb-1">Duration (optional)</label>
                <input type="text" id="edit-contract-duration" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value="${escapeHtml(duration)}" placeholder="e.g. 3 months, Q2 2026" />
            </div>
            <div>
                <label for="edit-contract-payment-schedule" class="block text-sm font-medium text-gray-700 mb-1">Payment schedule (optional)</label>
                <textarea id="edit-contract-payment-schedule" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" rows="2" placeholder="e.g. 30% upfront, 70% on completion">${escapeHtml(paymentSchedule)}</textarea>
            </div>
            <div>
                <label for="edit-contract-equity-vesting" class="block text-sm font-medium text-gray-700 mb-1">Equity vesting (optional)</label>
                <input type="text" id="edit-contract-equity-vesting" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value="${escapeHtml(equityVesting)}" placeholder="e.g. 2 years, 25% per year" />
            </div>
            <div>
                <label for="edit-contract-profit-share" class="block text-sm font-medium text-gray-700 mb-1">Profit share agreement (optional)</label>
                <textarea id="edit-contract-profit-share" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" rows="2" placeholder="e.g. 10% of net profit, quarterly">${escapeHtml(profitShare)}</textarea>
            </div>
            <div class="flex gap-2 pt-2">
                <button type="button" id="contract-edit-save" class="btn btn-primary">Save</button>
                <button type="button" id="contract-edit-cancel" class="btn btn-secondary">Cancel</button>
            </div>
        </form>
    `;

    if (typeof modalService === 'undefined') {
        const scopeVal = prompt('Scope (required):', scope);
        if (scopeVal === null) return;
        if (!scopeVal.trim()) {
            alert('Scope is required.');
            return;
        }
        const durationVal = prompt('Duration (optional):', duration) || '';
        saveContractEdit(contractId, { scope: scopeVal.trim(), duration: durationVal.trim() });
        return;
    }

    modalService.showCustom(contentHTML, 'Edit contract', { confirmText: 'Close' }).then(() => {});

    const modalEl = document.getElementById('modal-container');
    if (!modalEl) return;

    const saveBtn = modalEl.querySelector('#contract-edit-save');
    const cancelBtn = modalEl.querySelector('#contract-edit-cancel');
    const scopeInput = modalEl.querySelector('#edit-contract-scope');
    const durationInput = modalEl.querySelector('#edit-contract-duration');
    const paymentScheduleInput = modalEl.querySelector('#edit-contract-payment-schedule');
    const equityVestingInput = modalEl.querySelector('#edit-contract-equity-vesting');
    const profitShareInput = modalEl.querySelector('#edit-contract-profit-share');

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const scopeVal = scopeInput?.value != null ? String(scopeInput.value).trim() : '';
            const durationVal = durationInput?.value != null ? String(durationInput.value).trim() : '';
            if (!scopeVal) {
                alert('Scope is required.');
                if (scopeInput) scopeInput.focus();
                return;
            }
            const paymentScheduleVal = paymentScheduleInput?.value != null ? String(paymentScheduleInput.value).trim() : '';
            const equityVestingVal = equityVestingInput?.value != null ? String(equityVestingInput.value).trim() : '';
            const profitShareVal = profitShareInput?.value != null ? String(profitShareInput.value).trim() : '';
            modalService.close();
            await saveContractEdit(contractId, { scope: scopeVal, duration: durationVal, paymentSchedule: paymentScheduleVal || undefined, equityVesting: equityVestingVal || undefined, profitShare: profitShareVal || undefined });
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => modalService.close());
    }
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

function wireBackLink(container) {
    if (!container) return;
    const back = container.querySelector('a[data-route="/contracts"]');
    if (back && typeof router !== 'undefined') {
        back.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate('/contracts');
        });
    }
}
