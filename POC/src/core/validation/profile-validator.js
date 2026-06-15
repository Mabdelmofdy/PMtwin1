/**
 * Profile field validation.
 */
(function (global) {
    const P = () => global.validationPrimitives;

    const PROFILE_PHOTO_MAX_BYTES = 2.5 * 1024 * 1024;
    const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    function validateProfile(data, options = {}) {
        const ctx = P().createResult();
        const d = data || {};

        if (d.yearsExperience !== undefined && d.yearsExperience !== '') {
            P().assertNonNegative(P().toNumber(d.yearsExperience), 'yearsExperience', 'Years of experience', ctx);
        }
        if (d.hourlyRate !== undefined && d.hourlyRate !== '') {
            P().assertNonNegative(P().toNumber(d.hourlyRate), 'hourlyRate', 'Hourly rate', ctx);
        }
        if (d.financialCapacity !== undefined && d.financialCapacity !== '') {
            P().assertNonNegative(P().toNumber(d.financialCapacity), 'financialCapacity', 'Financial capacity', ctx);
        }
        if (d.matchingMinScore !== undefined && d.matchingMinScore !== '') {
            const score = P().toNumber(d.matchingMinScore);
            P().assertMin(score, 70, 'matchingMinScore', 'Matching minimum score', ctx);
            P().assertMax(score, 100, 'matchingMinScore', 'Matching minimum score', ctx);
        }
        if (d.inviteEmail !== undefined) {
            P().assertEmail(d.inviteEmail, 'inviteEmail', ctx);
        }
        if (options.photoFile) {
            const file = options.photoFile;
            if (file.type && !ALLOWED_PHOTO_TYPES.includes(file.type)) {
                ctx.addFieldError('photo', 'Profile photo must be JPG, PNG, WebP, or GIF.');
            }
            P().assertFileSize(file.size, PROFILE_PHOTO_MAX_BYTES, 'photo', 'Profile photo', ctx);
        }

        return ctx.toResult();
    }

    global.validateProfile = validateProfile;
    global.PROFILE_PHOTO_MAX_BYTES = PROFILE_PHOTO_MAX_BYTES;
})(typeof window !== 'undefined' ? window : globalThis);
