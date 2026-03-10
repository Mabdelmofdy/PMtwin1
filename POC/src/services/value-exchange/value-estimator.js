/**
 * Value Estimator
 * Computes estimated_value (SAR) and builds value_offered from opportunity exchangeData.
 * Used on opportunity create/edit and for value compatibility.
 */

(function (global) {
    'use strict';

    function valueEstimator() {
        /**
         * Parse numeric value from string (e.g. "50,000" or "50K SAR")
         */
        function parseNumeric(val) {
            if (val == null) return null;
            if (typeof val === 'number' && !isNaN(val)) return val;
            const s = String(val).replace(/,/g, '').replace(/\s/g, '');
            const match = s.match(/[\d.]+/);
            return match ? parseFloat(match[0]) : null;
        }

        /**
         * Build value_offered and estimated_value from exchangeData and mode.
         * @param {Object} exchangeData - opportunity.exchangeData
         * @param {string} mode - exchange mode
         * @returns {{ value_offered: Object, estimated_value: number|null, currency: string }}
         */
        function estimateFromExchangeData(exchangeData, mode) {
            const ed = exchangeData || {};
            const currency = ed.currency || ed.budgetRange?.currency || 'SAR';

            const result = {
                value_offered: null,
                estimated_value: null,
                currency
            };

            switch (mode) {
                case 'cash': {
                    const amount = ed.cashAmount != null ? Number(ed.cashAmount) : null;
                    result.value_offered = {
                        type: 'cash',
                        amount,
                        currency,
                        paymentTerms: ed.cashPaymentTerms || ''
                    };
                    result.estimated_value = amount != null && !isNaN(amount) ? amount : null;
                    break;
                }
                case 'equity': {
                    const percentage = ed.equityPercentage != null ? parseFloat(ed.equityPercentage) : null;
                    const companyValuation = ed.companyValuation != null ? parseNumeric(ed.companyValuation) : null;
                    result.value_offered = {
                        type: 'equity',
                        percentage,
                        companyValuation,
                        vesting: ed.equityVesting || ''
                    };
                    if (percentage != null && companyValuation != null && !isNaN(percentage) && !isNaN(companyValuation)) {
                        result.estimated_value = (percentage / 100) * companyValuation;
                    } else {
                        result.estimated_value = null;
                    }
                    break;
                }
                case 'profit_sharing': {
                    const sharePct = ed.profitSharePercentage != null ? parseFloat(ed.profitSharePercentage)
                        : parseFirstShareFromSplit(ed.profitSplit);
                    const expectedProfit = ed.expectedProfit != null ? parseNumeric(ed.expectedProfit) : null;
                    result.value_offered = {
                        type: 'profit_share',
                        percentage: sharePct,
                        expectedProfit,
                        basis: ed.profitBasis || 'profit',
                        distribution: ed.profitDistribution || ''
                    };
                    if (sharePct != null && expectedProfit != null && !isNaN(sharePct) && !isNaN(expectedProfit)) {
                        result.estimated_value = (sharePct / 100) * expectedProfit;
                    } else {
                        result.estimated_value = null;
                    }
                    break;
                }
                case 'barter': {
                    const barterVal = ed.barterValue != null ? parseNumeric(ed.barterValue) : null;
                    const budget = ed.budgetRange;
                    const mid = budget && (budget.min != null || budget.max != null)
                        ? ((Number(budget.min) || 0) + (Number(budget.max) || 0)) / 2
                        : null;
                    result.value_offered = {
                        type: 'barter',
                        offer: ed.barterOffer || '',
                        need: ed.barterNeed || '',
                        estimatedValue: barterVal
                    };
                    result.estimated_value = barterVal != null && !isNaN(barterVal) ? barterVal
                        : (mid != null && !isNaN(mid) && mid > 0 ? mid : null);
                    break;
                }
                case 'hybrid': {
                    const cashPct = ed.hybridCash != null ? parseFloat(ed.hybridCash) : 0;
                    const equityPct = ed.hybridEquity != null ? parseFloat(ed.hybridEquity) : 0;
                    const barterPct = ed.hybridBarter != null ? parseFloat(ed.hybridBarter) : 0;
                    const totalBudget = ed.budgetRange && (ed.budgetRange.min != null || ed.budgetRange.max != null)
                        ? ((Number(ed.budgetRange.min) || 0) + (Number(ed.budgetRange.max) || 0)) / 2
                        : null;
                    result.value_offered = {
                        type: 'hybrid',
                        cashPercentage: cashPct,
                        equityPercentage: equityPct,
                        barterPercentage: barterPct,
                        cashDetails: ed.hybridCashDetails || '',
                        equityDetails: ed.hybridEquityDetails || '',
                        barterDetails: ed.hybridBarterDetails || ''
                    };
                    let sum = 0;
                    if (totalBudget != null && !isNaN(totalBudget) && totalBudget > 0) {
                        if (cashPct > 0) sum += (cashPct / 100) * (ed.hybridCashAmount != null ? parseNumeric(ed.hybridCashAmount) : totalBudget);
                        if (equityPct > 0 && ed.hybridCompanyValuation != null) {
                            const eqVal = (equityPct / 100) * parseNumeric(ed.hybridCompanyValuation);
                            sum += eqVal;
                        }
                        if (barterPct > 0) sum += (barterPct / 100) * totalBudget;
                        if (sum === 0) sum = totalBudget;
                    }
                    result.estimated_value = sum > 0 ? sum : null;
                    break;
                }
                default:
                    result.value_offered = { type: mode || 'unknown' };
                    const budget = ed.budgetRange;
                    if (budget && (budget.min != null || budget.max != null)) {
                        const min = Number(budget.min) || 0;
                        const max = Number(budget.max) || 0;
                        result.estimated_value = (min + max) / 2;
                    }
            }

            return result;
        }

        function parseFirstShareFromSplit(profitSplit) {
            if (!profitSplit || typeof profitSplit !== 'string') return null;
            const m = profitSplit.trim().match(/^(\d+(?:\.\d+)?)/);
            return m ? parseFloat(m[1]) : null;
        }

        /**
         * Build value_offered and estimated_value from itemized value items.
         * @param {Array} valueItems - [{ category, amount?, currency?, percentage?, companyValuation?, estimatedValue?, quantity?, unitRate?, ... }]
         * @param {string} currency
         * @returns {{ value_offered: Object, estimated_value: number|null }}
         */
        function buildFromItemizedItems(valueItems, currency) {
            if (!Array.isArray(valueItems) || valueItems.length === 0) {
                return { value_offered: null, estimated_value: null };
            }
            const items = valueItems.map(function (item) {
                const cat = (item.category || item.type || 'cash').toLowerCase();
                let val = null;
                if (cat === 'cash') val = item.amount != null ? parseNumeric(item.amount) : null;
                else if (cat === 'equity' && item.percentage != null && item.companyValuation != null)
                    val = (parseFloat(item.percentage) / 100) * parseNumeric(item.companyValuation);
                else if (cat === 'service' || cat === 'equipment' || cat === 'resource' || cat === 'knowledge')
                    val = item.estimatedValue != null ? parseNumeric(item.estimatedValue) : (item.quantity != null && item.unitRate != null ? parseNumeric(item.quantity) * parseNumeric(item.unitRate) : null);
                else if (cat === 'barter' || cat === 'profit_share' || cat === 'profit_sharing')
                    val = item.estimatedValue != null ? parseNumeric(item.estimatedValue) : null;
                else val = item.estimatedValue != null ? parseNumeric(item.estimatedValue) : item.amount != null ? parseNumeric(item.amount) : null;
                return Object.assign({}, item, { category: cat, _computedValue: val != null && !isNaN(val) ? val : null });
            });
            const total = items.reduce(function (sum, i) { return sum + (i._computedValue || 0); }, 0);
            const value_offered = {
                type: 'itemized',
                items: items.map(function (i) {
                    const o = { category: i.category };
                    if (i.amount != null) o.amount = i.amount;
                    if (i.currency) o.currency = i.currency;
                    if (i.percentage != null) o.percentage = i.percentage;
                    if (i.companyValuation != null) o.companyValuation = i.companyValuation;
                    if (i.estimatedValue != null) o.estimatedValue = i.estimatedValue;
                    if (i.quantity != null) o.quantity = i.quantity;
                    if (i.unitRate != null) o.unitRate = i.unitRate;
                    if (i.description) o.description = i.description;
                    return o;
                }),
                total_estimated: total
            };
            return { value_offered, estimated_value: total > 0 ? total : null };
        }

        /**
         * Build full value_exchange for an opportunity (mode, value_offered, value_expected, estimated_value, currency).
         * Supports legacy exchangeData or itemized valueItems. Attaches _normalized when valueNormalizer is available.
         * @param {Object} exchangeData - opportunity.exchangeData; may include valueItems (array) for itemized
         * @param {string} mode
         * @param {Array} value_expected - optional array of { label, category?, estimatedValue? } or { type, description }
         * @param {Object} options - optional { accepted_modes: [], flexibility: {} }
         * @returns {Object} value_exchange
         */
        function buildValueExchange(exchangeData, mode, value_expected, options) {
            const ed = exchangeData || {};
            const currency = ed.currency || ed.budgetRange?.currency || 'SAR';
            let value_offered;
            let estimated_value;

            if (Array.isArray(ed.valueItems) && ed.valueItems.length > 0) {
                const fromItems = buildFromItemizedItems(ed.valueItems, currency);
                value_offered = fromItems.value_offered;
                estimated_value = fromItems.estimated_value;
            } else {
                const fromEd = estimateFromExchangeData(ed, mode);
                value_offered = fromEd.value_offered;
                estimated_value = fromEd.estimated_value;
            }

            const value_expected_arr = Array.isArray(value_expected) ? value_expected : [];
            const value_exchange = {
                mode: mode || ed.exchangeMode,
                value_offered,
                value_expected: value_expected_arr,
                estimated_value,
                currency
            };
            if (options && options.accepted_modes) value_exchange.accepted_modes = options.accepted_modes;
            if (options && options.flexibility) value_exchange.flexibility = options.flexibility;

            if (typeof global !== 'undefined' && global.valueNormalizer && global.valueNormalizer.buildNormalized) {
                value_exchange._normalized = global.valueNormalizer.buildNormalized(value_exchange);
            }
            if (typeof window !== 'undefined' && window.valueNormalizer && window.valueNormalizer.buildNormalized) {
                value_exchange._normalized = window.valueNormalizer.buildNormalized(value_exchange);
            }

            return value_exchange;
        }

        /**
         * Validate hybrid: at least 2 value types with non-zero values.
         */
        function validateHybrid(exchangeData) {
            const ed = exchangeData || {};
            const c = (ed.hybridCash != null ? parseFloat(ed.hybridCash) : 0) || 0;
            const e = (ed.hybridEquity != null ? parseFloat(ed.hybridEquity) : 0) || 0;
            const b = (ed.hybridBarter != null ? parseFloat(ed.hybridBarter) : 0) || 0;
            const count = [c, e, b].filter(x => x > 0).length;
            return count >= 2;
        }

        /**
         * Validate estimated value is within budget range (soft: warn only).
         */
        function isWithinBudgetRange(estimated_value, budgetRange) {
            if (estimated_value == null || !budgetRange) return true;
            const min = Number(budgetRange.min);
            const max = Number(budgetRange.max);
            if (isNaN(min) && isNaN(max)) return true;
            if (!isNaN(min) && estimated_value < min) return false;
            if (!isNaN(max) && estimated_value > max) return false;
            return true;
        }

        return {
            estimateFromExchangeData,
            buildValueExchange,
            buildFromItemizedItems,
            validateHybrid,
            isWithinBudgetRange,
            parseNumeric
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = valueEstimator();
    } else {
        global.valueEstimator = valueEstimator();
    }
})(typeof window !== 'undefined' ? window : this);
