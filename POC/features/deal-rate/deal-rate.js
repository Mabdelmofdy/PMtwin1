/**
 * Deal Rating – rate other participants after deal completion (criteria: communication, quality, professionalism, timeliness)
 */

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showDealRateError(errorEl, formEl, loadingEl, message, options = {}) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (formEl) formEl.style.display = 'none';
    if (errorEl) {
        const msgEl = errorEl.querySelector('[data-deal-rate-error-message]') || errorEl.querySelector('p');
        if (msgEl) msgEl.textContent = message;
        const dealLink = errorEl.querySelector('[data-deal-rate-deal-link]');
        if (dealLink && options.dealId) {
            dealLink.setAttribute('data-route', '/deals/' + options.dealId);
            dealLink.style.display = '';
        } else if (dealLink) {
            dealLink.style.display = 'none';
        }
        errorEl.style.display = 'block';
    }
}

async function resolveParticipantLabel(userId) {
    if (!userId || !dataService || typeof dataService.getUserOrCompanyById !== 'function') {
        return userId || 'Participant';
    }
    const entity = await dataService.getUserOrCompanyById(userId);
    return entity?.profile?.name || entity?.email || userId;
}

async function initDealRate(params) {
    const dealId = params?.id;
    const loadingEl = document.getElementById('deal-rate-loading');
    const errorEl = document.getElementById('deal-rate-error');
    const formEl = document.getElementById('deal-rate-form');

    try {
        if (!dealId) {
            showDealRateError(errorEl, formEl, loadingEl, 'Missing deal id in the URL.');
            return;
        }

        const user = authService.getCurrentUser();
        if (!user) {
            showDealRateError(errorEl, formEl, loadingEl, 'Please sign in as a deal participant to leave a review.');
            return;
        }

        const deal = await dataService.getDealById(dealId);
        if (!deal) {
            showDealRateError(errorEl, formEl, loadingEl, 'Deal not found. It may have been removed or your demo data needs reseeding.');
            return;
        }

        const isParticipant = (deal.participants || []).some(p => p.userId === user.id);
        if (!isParticipant) {
            showDealRateError(
                errorEl,
                formEl,
                loadingEl,
                'Only participants in this deal can leave a review. Open the deal from your Deals list or sign in with a participant account.'
            );
            return;
        }

        const status = (deal.status || '').toLowerCase();
        if (status !== 'completed' && status !== 'closed') {
            showDealRateError(
                errorEl,
                formEl,
                loadingEl,
                'Reviews are available after the deal is completed. Finish delivery and mark the deal complete first.'
            );
            return;
        }

        const reviews = typeof dataService.getReviews === 'function' ? await dataService.getReviews() : [];
        const alreadyReviewedIds = new Set(
            reviews
                .filter(r => r && r.dealId === dealId && r.reviewerId === user.id)
                .map(r => r.revieweeId)
                .filter(Boolean)
        );

        const reviewees = (deal.participants || []).filter(
            p => p.userId !== user.id && !alreadyReviewedIds.has(p.userId)
        );

        if (reviewees.length === 0) {
            const hadReviewees = (deal.participants || []).some(p => p.userId !== user.id);
            showDealRateError(
                errorEl,
                formEl,
                loadingEl,
                hadReviewees
                    ? 'You have already submitted reviews for everyone on this deal.'
                    : 'There is no one else on this deal to review.',
                { dealId }
            );
            return;
        }

        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
        if (formEl) formEl.style.display = 'block';

        document.getElementById('deal-id').value = dealId;
        document.getElementById('contract-id').value = deal.contractId || '';

        const criteria = ['communication', 'quality', 'professionalism', 'timeliness'];
        const criteriaLabels = {
            communication: 'Communication',
            quality: 'Quality of work',
            professionalism: 'Professionalism',
            timeliness: 'Timeliness'
        };

        const revieweeLabels = await Promise.all(reviewees.map(p => resolveParticipantLabel(p.userId)));

        const revieweesHtml = reviewees.map((p, idx) => {
            const inputs = criteria.map(c =>
                '<label class="block text-sm text-gray-600">' + escapeHtml(criteriaLabels[c]) +
                '</label><select name="' + c + '" class="border rounded px-2 py-1">' +
                '<option value="1">1</option><option value="2">2</option><option value="3" selected>3</option>' +
                '<option value="4">4</option><option value="5">5</option></select>'
            ).join('');
            return (
                '<div class="border border-gray-200 rounded-lg p-4 mb-4" data-reviewee-index="' + idx + '">' +
                '<h3 class="font-medium mb-2">Rate: ' + escapeHtml(revieweeLabels[idx] || p.userId) + '</h3>' +
                '<div class="rate-criteria grid grid-cols-2 gap-2">' + inputs + '</div></div>'
            );
        }).join('');
        document.getElementById('rate-reviewees').innerHTML = revieweesHtml;

        const form = document.getElementById('rating-form');
        if (form && !form.dataset.dealRateBound) {
            form.dataset.dealRateBound = '1';
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const contractId = document.getElementById('contract-id').value;
                const comment = (document.getElementById('rating-comment') || {}).value || '';

                for (let i = 0; i < reviewees.length; i++) {
                    const p = reviewees[i];
                    const block = document.querySelector('[data-reviewee-index="' + i + '"]');
                    if (!block) continue;
                    const communication = parseInt(block.querySelector('select[name="communication"]')?.value || '3', 10);
                    const quality = parseInt(block.querySelector('select[name="quality"]')?.value || '3', 10);
                    const professionalism = parseInt(block.querySelector('select[name="professionalism"]')?.value || '3', 10);
                    const timeliness = parseInt(block.querySelector('select[name="timeliness"]')?.value || '3', 10);

                    await dataService.createReview({
                        contractId: contractId || null,
                        dealId: dealId,
                        reviewerId: user.id,
                        revieweeId: p.userId,
                        comment: comment,
                        criteria: { communication, quality, professionalism, timeliness },
                        overallScore: (communication + quality + professionalism + timeliness) / 4
                    });
                }

                if (window.router) window.router.navigate('/deals/' + dealId);
            });
        }
    } catch (e) {
        console.error('Deal rate error:', e);
        showDealRateError(errorEl, formEl, loadingEl, 'Something went wrong loading this review form. Please try again.');
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

window.initDealRate = initDealRate;
