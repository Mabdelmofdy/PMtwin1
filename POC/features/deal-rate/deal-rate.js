/**
 * Deal Rating – rate other participants after deal completion (criteria: communication, quality, professionalism, timeliness)
 */

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function initDealRate(params) {
    const dealId = params?.id;
    const loadingEl = document.getElementById('deal-rate-loading');
    const errorEl = document.getElementById('deal-rate-error');
    const formEl = document.getElementById('deal-rate-form');

    if (!dealId) {
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        if (formEl) formEl.style.display = 'none';
        return;
    }

    const user = authService.getCurrentUser();
    if (!user) {
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        if (formEl) formEl.style.display = 'none';
        return;
    }

    try {
        const deal = await dataService.getDealById(dealId);
        if (!deal) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'block';
            if (formEl) formEl.style.display = 'none';
            return;
        }

        const isParticipant = (deal.participants || []).some(p => p.userId === user.id);
        if (!isParticipant) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'block';
            if (formEl) formEl.style.display = 'none';
            return;
        }

        const reviewees = (deal.participants || []).filter(p => p.userId !== user.id);
        if (reviewees.length === 0) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'block';
            if (formEl) formEl.style.display = 'none';
            return;
        }

        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
        if (formEl) formEl.style.display = 'block';

        document.getElementById('deal-id').value = dealId;
        document.getElementById('contract-id').value = deal.contractId || '';

        const criteria = ['communication', 'quality', 'professionalism', 'timeliness'];
        const criteriaLabels = { communication: 'Communication', quality: 'Quality of work', professionalism: 'Professionalism', timeliness: 'Timeliness' };
        const revieweesHtml = reviewees.map((p, idx) => {
            const inputs = criteria.map(c => '<label class="block text-sm text-gray-600">' + escapeHtml(criteriaLabels[c]) + '</label><select name="' + c + '" class="border rounded px-2 py-1"><option value="1">1</option><option value="2">2</option><option value="3" selected>3</option><option value="4">4</option><option value="5">5</option></select>').join('');
            return '<div class="border border-gray-200 rounded-lg p-4 mb-4" data-reviewee-index="' + idx + '"><h3 class="font-medium mb-2">Rate: ' + escapeHtml(p.userId) + '</h3><div class="rate-criteria grid grid-cols-2 gap-2">' + inputs + '</div></div>';
        }).join('');
        document.getElementById('rate-reviewees').innerHTML = revieweesHtml;

        document.getElementById('rating-form').addEventListener('submit', async (e) => {
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

            if (window.router) window.router.navigate('/deals');
        });
    } catch (e) {
        console.error('Deal rate error:', e);
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        if (formEl) formEl.style.display = 'none';
    }
}
