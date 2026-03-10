/**
 * Validate and optionally migrate exchange mode and payment modes on opportunities.
 * - Validates exchangeMode is one of: cash, equity, profit_sharing, barter, hybrid.
 * - Validates paymentModes (if present): non-empty, each value in set, should contain exchangeMode.
 * - With --migrate: backfill paymentModes from exchangeMode when missing/empty; ensure exchangeMode in paymentModes.
 *
 * Usage (from repo root):
 *   node POC/scripts/validate-exchange-payment.js [--migrate] [file...]
 *   If no file given, runs on data/opportunities.json and data/demo-40-opportunities.json.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const VALID_EXCHANGE_MODES = ['cash', 'equity', 'profit_sharing', 'barter', 'hybrid'];

function loadJson(filePath) {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJson(filePath, obj) {
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf8');
}

/**
 * @param {Object} o - opportunity
 * @returns {{ valid: boolean, errors: string[], fixed?: Object }}
 */
function validateOpportunity(o, migrate = false) {
    const errors = [];
    let fixed = null;
    const primary = o.exchangeMode ?? o.exchangeData?.exchangeMode ?? null;

    if (primary && !VALID_EXCHANGE_MODES.includes(primary)) {
        errors.push(`exchangeMode "${primary}" not in allowed set`);
    }

    const rawPaymentModes = o.paymentModes;
    const hasPaymentModes = Array.isArray(rawPaymentModes) && rawPaymentModes.length > 0;

    if (hasPaymentModes) {
        const invalid = rawPaymentModes.filter(m => !VALID_EXCHANGE_MODES.includes(m));
        if (invalid.length) errors.push(`paymentModes contains invalid: ${invalid.join(', ')}`);
        if (primary && !rawPaymentModes.includes(primary)) {
            errors.push('paymentModes should contain primary exchangeMode');
            if (migrate) {
                fixed = { ...o, paymentModes: [primary, ...rawPaymentModes.filter(m => m !== primary)] };
            }
        }
    } else {
        if (primary && migrate) {
            fixed = { ...o, paymentModes: [primary] };
        }
        if (primary && !migrate) {
            errors.push('paymentModes missing (legacy); run with --migrate to backfill');
        }
    }

    return { valid: errors.length === 0, errors, fixed: fixed || undefined };
}

/**
 * Process a file: expect either { data: [...] } or array.
 * @returns {{ total: number, validated: number, migrated: number, errors: Array<{ id, errors }> }}
 */
function processFile(filePath, migrate = false) {
    const content = loadJson(filePath);
    if (!content) return { total: 0, validated: 0, migrated: 0, errors: [] };
    const list = Array.isArray(content) ? content : (content.data || []);
    const isWrapped = !Array.isArray(content) && content.data;
    let validated = 0;
    let migrated = 0;
    const errors = [];

    for (let i = 0; i < list.length; i++) {
        const o = list[i];
        const id = o.id || o.title || `#${i}`;
        const result = validateOpportunity(o, migrate);
        if (result.valid) validated++;
        if (result.errors.length) errors.push({ id, errors: result.errors });
        if (result.fixed) {
            list[i] = result.fixed;
            migrated++;
        }
    }

    if (migrate && migrated > 0 && isWrapped) {
        content.data = list;
        saveJson(filePath, content);
    } else if (migrate && migrated > 0 && Array.isArray(content)) {
        saveJson(filePath, list);
    }

    return { total: list.length, validated, migrated, errors };
}

function main() {
    const args = process.argv.slice(2);
    const migrate = args.includes('--migrate');
    const files = args.filter(a => a !== '--migrate');
    const toProcess = files.length > 0
        ? files.map(f => path.isAbsolute(f) ? f : path.join(process.cwd(), f))
        : [
            path.join(DATA_DIR, 'opportunities.json'),
            path.join(DATA_DIR, 'demo-40-opportunities.json')
        ].filter(p => fs.existsSync(p));

    if (toProcess.length === 0) {
        console.log('No opportunity files found.');
        process.exit(0);
    }

    console.log(migrate ? 'Validate + migrate (--migrate)' : 'Validate only');
    let totalOpps = 0;
    let totalValid = 0;
    let totalMigrated = 0;
    const allErrors = [];

    toProcess.forEach(filePath => {
        const rel = path.relative(process.cwd(), filePath);
        const result = processFile(filePath, migrate);
        totalOpps += result.total;
        totalValid += result.validated;
        totalMigrated += result.migrated;
        result.errors.forEach(e => allErrors.push({ file: rel, ...e }));
        console.log(`${rel}: ${result.total} opportunities, ${result.validated} valid, ${result.migrated} migrated`);
    });

    if (allErrors.length > 0) {
        console.log('\nValidation issues:');
        allErrors.forEach(({ file, id, errors }) => console.log(`  ${file} ${id}: ${errors.join('; ')}`));
    }
    console.log(`\nTotal: ${totalOpps} opportunities, ${totalValid} valid, ${totalMigrated} migrated`);
}

main();
