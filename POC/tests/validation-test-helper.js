import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const ROOT = resolve(process.cwd(), 'src');

export function loadValidationSandbox(extraFiles = []) {
    const sandbox = { globalThis: {}, window: null, CONFIG: { STORAGE_KEYS: { SYSTEM_SETTINGS: 'system_settings' } } };
    sandbox.window = sandbox.globalThis;
    const files = [
        'core/validation/validation-primitives.js',
        'business-logic/models/opportunity-models.js',
        'core/validation/model-field-validator.js',
        'core/validation/opportunity-validator.js',
        'core/validation/auth-validator.js',
        'core/validation/profile-validator.js',
        'core/validation/application-validator.js',
        'core/validation/deal-validator.js',
        'core/validation/contract-validator.js',
        'core/validation/negotiation-validator.js',
        'core/validation/admin-validator.js',
        ...extraFiles
    ];
    vm.createContext(sandbox);
    files.forEach((rel) => {
        const code = readFileSync(resolve(ROOT, rel), 'utf8');
        vm.runInContext(code, sandbox);
    });
    return sandbox.globalThis;
}
