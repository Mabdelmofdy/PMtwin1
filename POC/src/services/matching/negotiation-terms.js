/**
 * Negotiation terms helpers — effective terms, merge, display, form fields.
 */

const TERM_LABELS = {
    value: 'Total value',
    currency: 'Currency',
    paymentSchedule: 'Payment schedule',
    duration: 'Duration',
    scope: 'Scope',
    exchangeMode: 'Exchange mode',
    equityPercentage: 'Equity %',
    profitSplit: 'Profit split',
    profitDistribution: 'Profit distribution',
    startDate: 'Start date',
    endDate: 'End date',
    message: 'Notes'
};

const EXCHANGE_MODES = ['cash', 'barter', 'equity', 'profit_sharing'];

function normalizeExchangeMode(mode) {
    const m = (mode == null ? '' : String(mode)).toLowerCase().trim();
    if (m === 'profit_sharing' || m === 'profit-sharing' || m === 'profit sharing') return 'profit_sharing';
    if (EXCHANGE_MODES.includes(m)) return m;
    if (m === 'hybrid') return 'cash';
    return m || 'cash';
}

function mergeProposalTerms(base, proposal) {
    const out = { ...(base || {}) };
    const delta = proposal || {};
    Object.keys(delta).forEach((key) => {
        const val = delta[key];
        if (val !== undefined && val !== null && val !== '') {
            out[key] = val;
        }
    });
    return out;
}

/**
 * @param {object|null} negotiation
 * @returns {object}
 */
function getEffectiveTerms(negotiation) {
    if (!negotiation) return {};
    if (negotiation.agreedTerms && typeof negotiation.agreedTerms === 'object') {
        return { ...negotiation.agreedTerms };
    }
    if (negotiation.currentTerms && typeof negotiation.currentTerms === 'object') {
        return { ...negotiation.currentTerms };
    }
    const rounds = negotiation.rounds || [];
    const last = rounds[rounds.length - 1];
    if (last && last.proposal && Object.keys(last.proposal).length) {
        return mergeProposalTerms(negotiation.initialTerms, last.proposal);
    }
    return { ...(negotiation.initialTerms || {}) };
}

function detectExchangeMode(terms, opportunity) {
    const fromTerms = normalizeExchangeMode(terms?.exchangeMode);
    if (fromTerms && fromTerms !== 'cash') return fromTerms;
    const oppMode = opportunity?.exchangeMode || opportunity?.modelData?.exchangeMode;
    if (oppMode) return normalizeExchangeMode(oppMode);
    if (terms?.equityPercentage != null) return 'equity';
    if (terms?.profitSplit) return 'profit_sharing';
    return fromTerms || 'cash';
}

/**
 * @param {string} exchangeMode
 * @returns {Array<{ key: string, label: string, type: string, placeholder?: string }>}
 */
function getProposalFieldDefs(exchangeMode) {
    const mode = normalizeExchangeMode(exchangeMode);
    const common = [
        { key: 'scope', label: TERM_LABELS.scope, type: 'textarea', placeholder: 'Describe scope or deliverables…' },
        { key: 'duration', label: TERM_LABELS.duration, type: 'text', placeholder: 'e.g. 3 months' },
        { key: 'message', label: 'Proposal message', type: 'textarea', placeholder: 'Explain your counter-offer…' }
    ];

    if (mode === 'equity') {
        return [
            { key: 'equityPercentage', label: TERM_LABELS.equityPercentage, type: 'number', placeholder: '0–100' },
            { key: 'duration', label: TERM_LABELS.duration, type: 'text', placeholder: 'e.g. 36 months' },
            { key: 'scope', label: TERM_LABELS.scope, type: 'textarea', placeholder: 'Contribution scope…' },
            { key: 'message', label: 'Proposal message', type: 'textarea', placeholder: 'Explain your terms…' }
        ];
    }
    if (mode === 'profit_sharing') {
        return [
            { key: 'profitSplit', label: TERM_LABELS.profitSplit, type: 'text', placeholder: 'e.g. 65-35' },
            { key: 'profitDistribution', label: TERM_LABELS.profitDistribution, type: 'text', placeholder: 'e.g. Annual after O&M' },
            { key: 'duration', label: TERM_LABELS.duration, type: 'text', placeholder: 'e.g. 24 months' },
            { key: 'scope', label: TERM_LABELS.scope, type: 'textarea', placeholder: 'Role and scope…' },
            { key: 'message', label: 'Proposal message', type: 'textarea', placeholder: 'Explain your terms…' }
        ];
    }
    if (mode === 'barter') {
        return [
            { key: 'value', label: 'Equivalent value (SAR)', type: 'number', placeholder: 'Amount' },
            { key: 'currency', label: TERM_LABELS.currency, type: 'text', placeholder: 'SAR' },
            { key: 'scope', label: TERM_LABELS.scope, type: 'textarea', placeholder: 'What each party delivers…' },
            { key: 'duration', label: TERM_LABELS.duration, type: 'text', placeholder: 'e.g. 6 weeks' },
            { key: 'message', label: 'Proposal message', type: 'textarea', placeholder: 'Explain your barter terms…' }
        ];
    }
    return [
        { key: 'value', label: TERM_LABELS.value, type: 'number', placeholder: 'Amount' },
        { key: 'currency', label: TERM_LABELS.currency, type: 'text', placeholder: 'SAR' },
        { key: 'paymentSchedule', label: TERM_LABELS.paymentSchedule, type: 'text', placeholder: 'e.g. 30% start, 70% completion' },
        { key: 'duration', label: TERM_LABELS.duration, type: 'text', placeholder: 'e.g. 4 months' },
        { key: 'scope', label: TERM_LABELS.scope, type: 'textarea', placeholder: 'Scope summary…' },
        ...common.filter(f => f.key === 'message')
    ];
}

function formatTermDisplay(key, value) {
    if (value === undefined || value === null || value === '') return '—';
    if (key === 'value') {
        const num = Number(value);
        if (Number.isFinite(num)) {
            return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(num);
        }
    }
    if (key === 'exchangeMode') {
        const m = normalizeExchangeMode(value);
        if (m === 'profit_sharing') return 'Profit sharing';
        if (m === 'barter') return 'Barter';
        if (m === 'equity') return 'Equity';
        return 'Cash';
    }
    if (key === 'equityPercentage') return String(value) + '%';
    return String(value);
}

function buildProposalFromForm(formData, exchangeMode) {
    const mode = normalizeExchangeMode(exchangeMode);
    const defs = getProposalFieldDefs(mode);
    const proposal = { exchangeMode: mode };
    const messageParts = [];

    defs.forEach((def) => {
        const raw = formData[def.key];
        if (raw === undefined || raw === null || String(raw).trim() === '') return;
        if (def.key === 'message') {
            messageParts.push(String(raw).trim());
            return;
        }
        if (def.type === 'number') {
            proposal[def.key] = Number(raw);
        } else {
            proposal[def.key] = String(raw).trim();
        }
    });

    if (formData.currency && !proposal.currency) {
        proposal.currency = String(formData.currency).trim();
    }

    return {
        proposal,
        message: messageParts.join('\n') || (formData.message ? String(formData.message).trim() : '')
    };
}

function getTermSheetRows(terms, exchangeMode) {
    const mode = detectExchangeMode(terms, { exchangeMode });
    const keys = getProposalFieldDefs(mode)
        .map(d => d.key)
        .filter(k => k !== 'message');
    const uniqueKeys = [...new Set(['exchangeMode', ...keys])];
    return uniqueKeys.map((key) => ({
        key,
        label: TERM_LABELS[key] || key,
        value: formatTermDisplay(key, key === 'exchangeMode' ? mode : terms?.[key])
    }));
}

function getNegotiationWorkspacePath(negotiationId) {
    return negotiationId ? '/negotiations/' + negotiationId : '/pipeline/matches';
}

function computeTermDeltas(prevTerms, nextTerms) {
    const prev = prevTerms || {};
    const next = nextTerms || {};
    const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    const deltas = [];
    keys.forEach((key) => {
        if (key === 'message') return;
        const a = prev[key];
        const b = next[key];
        if (a !== b && (a != null || b != null)) {
            deltas.push({
                key,
                label: TERM_LABELS[key] || key,
                from: formatTermDisplay(key, a),
                to: formatTermDisplay(key, b)
            });
        }
    });
    return deltas;
}

export {
    TERM_LABELS,
    EXCHANGE_MODES,
    normalizeExchangeMode,
    mergeProposalTerms,
    getEffectiveTerms,
    detectExchangeMode,
    getProposalFieldDefs,
    formatTermDisplay,
    buildProposalFromForm,
    getTermSheetRows,
    getNegotiationWorkspacePath,
    computeTermDeltas
};

if (typeof window !== 'undefined') {
    window.negotiationTerms = {
        TERM_LABELS,
        normalizeExchangeMode,
        mergeProposalTerms,
        getEffectiveTerms,
        detectExchangeMode,
        getProposalFieldDefs,
        formatTermDisplay,
        buildProposalFromForm,
        getTermSheetRows,
        getNegotiationWorkspacePath,
        computeTermDeltas
    };
}
