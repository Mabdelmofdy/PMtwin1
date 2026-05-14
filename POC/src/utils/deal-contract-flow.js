/**
 * Shared labels and hints for Deal Workspace + Contract Agreement (POC).
 * Loaded after CONFIG; exposes window.DealContractFlowUi.
 */
(function () {
    const DEAL_LABELS = {
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

    const CONTRACT_LABELS = {
        pending: 'Pending Signature',
        active: 'Active Contract',
        completed: 'Completed',
        terminated: 'Terminated'
    };

    const STEPPER_KEYS = ['draft', 'review', 'signing', 'active', 'execution', 'delivery', 'completed'];

    function getDealStatusDisplayLabel(status) {
        const ui = typeof window !== 'undefined' ? window.statusBadgeSystem : null;
        if (ui && typeof ui.getStatusLabel === 'function') return ui.getStatusLabel(status, 'deal');
        const s = status || '';
        return DEAL_LABELS[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
    }

    function getContractStatusDisplayLabel(status) {
        const ui = typeof window !== 'undefined' ? window.statusBadgeSystem : null;
        if (ui && typeof ui.getStatusLabel === 'function') return ui.getStatusLabel(status, 'contract');
        const s = status || '';
        return CONTRACT_LABELS[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
    }

    function dealStepIndex(status) {
        const s = status || '';
        if (s === 'negotiating') return -1;
        if (s === 'cancelled' || s === 'closed') return STEPPER_KEYS.length;
        const i = STEPPER_KEYS.indexOf(s);
        return i >= 0 ? i : 0;
    }

    function formatMoneyAmount(num, currencyCode) {
        const n = Number(num);
        if (Number.isNaN(n)) return String(num);
        const code = currencyCode && String(currencyCode).trim() ? String(currencyCode).trim().toUpperCase() : 'SAR';
        try {
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: code,
                maximumFractionDigits: n % 1 === 0 ? 0 : 2
            }).format(n);
        } catch {
            return n.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' ' + code;
        }
    }

    function formatAgreedValueSummary(agreedValue) {
        if (agreedValue == null) return '';
        if (typeof agreedValue === 'number' || typeof agreedValue === 'string') return String(agreedValue);
        if (typeof agreedValue !== 'object') return String(agreedValue);
        const o = agreedValue;
        if (o.cash != null && o.currency) return formatMoneyAmount(o.cash, o.currency);
        if (o.cash != null) return formatMoneyAmount(o.cash, o.currency || 'SAR');
        const creditH = o.creditHours != null ? o.creditHours : o.credit_hours;
        if (creditH != null) return String(creditH) + ' credit hours';
        if (o.description) return String(o.description).slice(0, 80);
        try {
            return JSON.stringify(o);
        } catch {
            return '—';
        }
    }

    function formatValueSummary(deal) {
        if (!deal || !deal.valueTerms) return '—';
        const vt = deal.valueTerms;
        if (vt.agreedValue != null) {
            try {
                if (typeof vt.agreedValue === 'object') {
                    const s = formatAgreedValueSummary(vt.agreedValue);
                    return s || '—';
                }
                return String(vt.agreedValue);
            } catch {
                return '—';
            }
        }
        if (vt.paymentSchedule) return String(vt.paymentSchedule).slice(0, 80);
        if (vt.barterDescription) return String(vt.barterDescription).slice(0, 80);
        return '—';
    }

    /**
     * @param {object} deal
     * @param {object|null} contract — loaded contract or null
     * @param {string} userId
     */
    function getDealNextActionHint(deal, contract, userId) {
        if (!deal) return '';
        const st = deal.status || '';
        const parts = deal.participants || [];
        const active = parts.filter(function (p) {
            return (p.status || 'active') !== 'dropped';
        });
        const me = active.find(function (p) {
            return p.userId === userId;
        });

        if (st === 'negotiating') return 'Agree terms, then accept proposal to open the Deal Workspace draft.';
        if (st === 'draft') return 'Review the Deal Workspace draft, then send it for review when ready.';
        if (st === 'review') {
            if (me && me.approvalStatus !== 'approved') return 'Approve the deal workspace to move toward contract signing.';
            if (contract && contract.id) return 'Waiting for others to approve. The Contract Agreement draft is ready when everyone approves.';
            return 'Wait for all participants to approve the deal.';
        }
        if (st === 'signing') {
            if (contract && contract.status === 'pending') {
                if (me && !me.signedAt) return 'Review the Contract Agreement and sign.';
                return 'Waiting for other parties to sign the contract.';
            }
            return 'Contract is being prepared for signature.';
        }
        if (st === 'active') return 'Start execution to track milestones and deliverables.';
        if (st === 'execution') return 'Work through milestones; submit deliverables for approval.';
        if (st === 'delivery') return 'Review final delivery and approve completion when satisfied.';
        if (st === 'completed') return 'Rate participants or close the deal when wrap-up is done.';
        if (st === 'closed' || st === 'cancelled') return 'No further actions.';
        return '';
    }

    window.DealContractFlowUi = {
        DEAL_LABELS: DEAL_LABELS,
        CONTRACT_LABELS: CONTRACT_LABELS,
        STEPPER_KEYS: STEPPER_KEYS,
        getDealStatusDisplayLabel: getDealStatusDisplayLabel,
        getContractStatusDisplayLabel: getContractStatusDisplayLabel,
        dealStepIndex: dealStepIndex,
        formatValueSummary: formatValueSummary,
        formatAgreedValueSummary: formatAgreedValueSummary,
        getDealNextActionHint: getDealNextActionHint
    };
})();
