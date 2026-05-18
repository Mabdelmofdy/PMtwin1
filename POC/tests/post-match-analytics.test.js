/**
 * Post-match analytics helpers (confirmed / legacy accepted).
 */
import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { isConfirmedLikeMatch, countConfirmedLikeMatches } = require(path.join(
    __dirname,
    '..',
    'src',
    'utils',
    'post-match-analytics.js'
));

describe('isConfirmedLikeMatch', () => {
    it('includes status confirmed', () => {
        expect(isConfirmedLikeMatch({ status: 'confirmed' })).toBe(true);
    });

    it('includes legacy accepted', () => {
        expect(isConfirmedLikeMatch({ status: 'accepted' })).toBe(true);
    });

    it('excludes pending and declined', () => {
        expect(isConfirmedLikeMatch({ status: 'pending' })).toBe(false);
        expect(isConfirmedLikeMatch({ status: 'declined' })).toBe(false);
    });
});

describe('countConfirmedLikeMatches', () => {
    it('counts only confirmed-like statuses', () => {
        const n = countConfirmedLikeMatches([
            { status: 'confirmed' },
            { status: 'accepted' },
            { status: 'pending' },
            { status: 'declined' }
        ]);
        expect(n).toBe(2);
    });
});
