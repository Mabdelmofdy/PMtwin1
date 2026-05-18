import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            '/core/workflow/workflow-engine.js': path.resolve(__dirname, 'core/workflow/workflow-engine.js')
        }
    },
    test: {
        include: ['tests/**/*.test.js'],
        globals: true
    }
});
