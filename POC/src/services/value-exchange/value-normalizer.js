/**
 * Value Normalizer
 * Normalizes value items (cash, equity, service, equipment, resource, knowledge) to comparable SAR amounts
 * and applies risk-adjusted value for matching and compatibility.
 */

(function (global) {
    'use strict';

    // Simple currency conversion to SAR (POC: static rates; replace with API in production)
    const CURRENCY_TO_SAR = {
        SAR: 1,
        USD: 3.75,
        EUR: 4.10,
        GBP: 4.75,
        AED: 1.02,
        KWD: 12.25,
        BHD: 9.95,
        OMR: 9.73,
        QAR: 1.03,
        EGP: 0.12,
        JOD: 5.29
    };

    const RISK_FACTORS = {
        cash: 1.0,
        equity: 0.6,
        profit_share: 0.5,
        profit_sharing: 0.5,
        service: 0.85,
        equipment: 0.9,
        resource: 0.85,
        knowledge: 0.7,
        barter: 0.75,
        hybrid: 0.8
    };

    function parseNumeric(val) {
        if (val == null) return null;
        if (typeof val === 'number' && !isNaN(val)) return val;
        const s = String(val).replace(/,/g, '').replace(/\s/g, '');
        const match = s.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
    }

    /**
     * Convert amount from source currency to SAR.
     * @param {number} amount
     * @param {string} fromCurrency - e.g. 'SAR', 'USD'
     * @param {string} toCurrency - default 'SAR'
     * @returns {number|null}
     */
    function convertCurrency(amount, fromCurrency, toCurrency) {
        if (amount == null || isNaN(Number(amount))) return null;
        const amt = Number(amount);
        if (toCurrency !== 'SAR') {
            const toRate = CURRENCY_TO_SAR[toCurrency] || 1;
            const fromRate = CURRENCY_TO_SAR[fromCurrency] || CURRENCY_TO_SAR.SAR;
            return (amt / fromRate) * toRate;
        }
        const rate = CURRENCY_TO_SAR[(fromCurrency || 'SAR').toUpperCase()] || 1;
        return amt * rate;
    }

    /**
     * Estimate service value from item (hourlyRate * hours, or use estimatedValue).
     * @param {Object} valueItem - { category: 'service', estimatedValue?, hourlyRate?, estimatedHours?, description? }
     * @param {Object} context - optional context (e.g. market rates)
     * @returns {number|null}
     */
    function estimateServiceValue(valueItem, context) {
        const ev = valueItem.estimatedValue != null ? parseNumeric(valueItem.estimatedValue) : null;
        if (ev != null && !isNaN(ev)) return ev;
        const rate = valueItem.hourlyRate != null ? parseNumeric(valueItem.hourlyRate) : null;
        const hours = valueItem.estimatedHours != null ? parseNumeric(valueItem.estimatedHours) : null;
        if (rate != null && hours != null && !isNaN(rate) && !isNaN(hours)) return rate * hours;
        return null;
    }

    /**
     * Lookup or use declared equipment value.
     * @param {Object} valueItem - { category: 'equipment', estimatedValue?, description? }
     * @returns {number|null}
     */
    function lookupEquipmentValue(valueItem) {
        const ev = valueItem.estimatedValue != null ? parseNumeric(valueItem.estimatedValue) : null;
        return ev != null && !isNaN(ev) ? ev : null;
    }

    /**
     * Normalize a single value item to SAR.
     * @param {Object} valueItem - { category, amount?, currency?, percentage?, companyValuation?, estimatedValue?, quantity?, unitRate?, ... }
     * @param {Object} context - optional context for estimation
     * @returns {{ normalized: number|null, category: string, raw: number|null }}
     */
    function normalizeToSAR(valueItem, context) {
        if (!valueItem || !valueItem.category) return { normalized: null, category: (valueItem && valueItem.category) || 'unknown', raw: null };
        const cat = String(valueItem.category).toLowerCase();
        let raw = null;
        let normalized = null;

        switch (cat) {
            case 'cash':
                raw = valueItem.amount != null ? Number(valueItem.amount) : parseNumeric(valueItem.amount);
                normalized = raw != null && !isNaN(raw)
                    ? convertCurrency(raw, valueItem.currency || 'SAR', 'SAR')
                    : null;
                break;
            case 'equity':
                const pct = valueItem.percentage != null ? parseFloat(valueItem.percentage) : null;
                const val = valueItem.companyValuation != null ? parseNumeric(valueItem.companyValuation) : null;
                if (pct != null && val != null && !isNaN(pct) && !isNaN(val)) {
                    raw = (pct / 100) * val;
                    normalized = raw;
                }
                break;
            case 'service':
                raw = estimateServiceValue(valueItem, context);
                normalized = raw;
                break;
            case 'equipment':
                raw = lookupEquipmentValue(valueItem);
                normalized = raw;
                break;
            case 'resource':
                raw = valueItem.estimatedValue != null ? parseNumeric(valueItem.estimatedValue) : null;
                if (raw == null && valueItem.quantity != null && valueItem.unitRate != null) {
                    const q = parseNumeric(valueItem.quantity);
                    const r = parseNumeric(valueItem.unitRate);
                    raw = (q != null && r != null && !isNaN(q) && !isNaN(r)) ? q * r : null;
                }
                normalized = raw;
                break;
            case 'knowledge':
                raw = valueItem.estimatedValue != null ? parseNumeric(valueItem.estimatedValue) : 0;
                normalized = raw != null && !isNaN(raw) ? raw : 0;
                break;
            case 'profit_share':
            case 'profit_sharing':
                const sharePct = valueItem.percentage != null ? parseFloat(valueItem.percentage) : null;
                const expectedProfit = valueItem.expectedProfit != null ? parseNumeric(valueItem.expectedProfit) : null;
                if (sharePct != null && expectedProfit != null && !isNaN(sharePct) && !isNaN(expectedProfit)) {
                    raw = (sharePct / 100) * expectedProfit;
                    normalized = raw;
                }
                break;
            case 'barter':
                raw = valueItem.estimatedValue != null ? parseNumeric(valueItem.estimatedValue) : null;
                normalized = raw;
                break;
            default:
                raw = valueItem.estimatedValue != null ? parseNumeric(valueItem.estimatedValue) : valueItem.amount != null ? parseNumeric(valueItem.amount) : null;
                normalized = raw;
        }

        return {
            normalized: normalized != null && !isNaN(normalized) ? normalized : null,
            category: cat,
            raw: raw != null && !isNaN(raw) ? raw : null
        };
    }

    /**
     * Risk-adjusted value: apply uncertainty discount by category.
     * @param {number} normalizedSAR
     * @param {string} category - cash, equity, service, equipment, resource, knowledge, barter, profit_share, hybrid
     * @returns {number}
     */
    function riskAdjustedValue(normalizedSAR, category) {
        if (normalizedSAR == null || isNaN(normalizedSAR)) return 0;
        const factor = RISK_FACTORS[String(category || '').toLowerCase()] ?? 0.7;
        return normalizedSAR * factor;
    }

    /**
     * Build _normalized block for value_exchange from raw value_offered and value_expected.
     * Supports both legacy (single value_offered object) and itemized (value_offered.items) shapes.
     * @param {Object} value_exchange - opportunity.value_exchange
     * @returns {Object} _normalized - { totalOffered, totalExpected, riskAdjustedOffered, riskAdjustedExpected, valueItems }
     */
    function buildNormalized(value_exchange) {
        const ve = value_exchange || {};
        const valueItems = [];
        let totalOffered = 0;
        let totalExpected = 0;
        let riskAdjustedOffered = 0;
        let riskAdjustedExpected = 0;

        // Offered: itemized or legacy single object
        const offered = ve.value_offered;
        if (offered && Array.isArray(offered.items) && offered.items.length > 0) {
            offered.items.forEach(function (item) {
                const r = normalizeToSAR(item, {});
                const norm = r.normalized != null ? r.normalized : 0;
                const riskAdj = riskAdjustedValue(norm, r.category);
                totalOffered += norm;
                riskAdjustedOffered += riskAdj;
                valueItems.push({
                    category: r.category,
                    raw: r.raw,
                    normalized: norm,
                    riskAdjusted: riskAdj,
                    direction: 'offered'
                });
            });
        } else if (offered) {
            const single = {
                category: offered.type || ve.mode || 'cash',
                amount: offered.amount,
                currency: offered.currency || ve.currency,
                percentage: offered.percentage,
                companyValuation: offered.companyValuation,
                estimatedValue: offered.estimatedValue,
                expectedProfit: offered.expectedProfit
            };
            const r = normalizeToSAR(single, {});
            const norm = r.normalized != null ? r.normalized : 0;
            const riskAdj = riskAdjustedValue(norm, r.category);
            totalOffered = norm;
            riskAdjustedOffered = riskAdj;
            valueItems.push({
                category: r.category,
                raw: r.raw,
                normalized: norm,
                riskAdjusted: riskAdj,
                direction: 'offered'
            });
        }

        // Expected: array of { label, category?, estimatedValue? }
        const expected = ve.value_expected;
        if (Array.isArray(expected) && expected.length > 0) {
            expected.forEach(function (exp) {
                const item = {
                    category: exp.category || 'service',
                    estimatedValue: exp.estimatedValue,
                    label: exp.label
                };
                const r = normalizeToSAR(item, {});
                const norm = r.normalized != null ? r.normalized : 0;
                const riskAdj = riskAdjustedValue(norm, r.category);
                totalExpected += norm;
                riskAdjustedExpected += riskAdj;
                valueItems.push({
                    category: r.category,
                    raw: r.raw,
                    normalized: norm,
                    riskAdjusted: riskAdj,
                    direction: 'expected',
                    label: exp.label
                });
            });
        }

        // If no itemized expected, use estimated_value as total expected (legacy)
        if (totalExpected === 0 && ve.estimated_value != null) {
            const ev = Number(ve.estimated_value);
            if (!isNaN(ev)) {
                totalExpected = ev;
                riskAdjustedExpected = ev * (RISK_FACTORS[String(ve.mode || 'cash').toLowerCase()] ?? 0.7);
            }
        }

        return {
            totalOffered,
            totalExpected,
            riskAdjustedOffered,
            riskAdjustedExpected,
            valueItems
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            normalizeToSAR,
            riskAdjustedValue,
            convertCurrency,
            buildNormalized,
            RISK_FACTORS,
            CURRENCY_TO_SAR,
            parseNumeric,
            estimateServiceValue,
            lookupEquipmentValue
        };
    } else {
        global.valueNormalizer = {
            normalizeToSAR,
            riskAdjustedValue,
            convertCurrency,
            buildNormalized,
            RISK_FACTORS,
            CURRENCY_TO_SAR,
            parseNumeric,
            estimateServiceValue,
            lookupEquipmentValue
        };
    }
})(typeof window !== 'undefined' ? window : this);
