/**
 * Hard Constraints — mandatory pre-score gates for post-to-post matching.
 * Stage 1: strict role compatibility matrix.
 * Stage 2: 100% coreSkills + minimum required-service overlap.
 */

(function (global) {
    const CONFIG = global.CONFIG || {};

    const ROLE_COMPATIBILITY = {
        'Architect': ['Architect', 'Interior Designer'],
        'Architectural Design': ['Architect', 'Interior Designer', 'Architectural Design'],
        'Interior Designer': ['Interior Designer', 'Architect'],
        'Civil Engineer': ['Civil Engineer', 'Structural Engineer'],
        'Civil Engineering': ['Civil Engineer', 'Structural Engineer', 'Civil Engineering'],
        'Structural Engineer': ['Structural Engineer', 'Civil Engineer'],
        'Structural Engineering': ['Structural Engineer', 'Civil Engineer', 'Structural Engineering']
    };

    const ROLE_ALIASES = {
        'architectural design': 'Architect',
        'interior design': 'Interior Designer',
        'civil engineering': 'Civil Engineer',
        'structural engineering': 'Structural Engineer'
    };

    function normalizeRoleLabel(role) {
        if (!role) return '';
        const trimmed = String(role).trim();
        const alias = ROLE_ALIASES[trimmed.toLowerCase()];
        return alias || trimmed;
    }

    function getNeedRole(needPost, needNorm) {
        const fromNorm = needNorm?.role;
        if (fromNorm) return normalizeRoleLabel(fromNorm);
        const att = needPost?.attributes || {};
        const explicit = att.targetRole || att.professionalRole;
        if (explicit) {
            return normalizeRoleLabel(typeof explicit === 'string' ? explicit : (explicit.label || explicit.role || ''));
        }
        return '';
    }

    function getOfferRole(offerPost, offerNorm) {
        const fromNorm = offerNorm?.role;
        if (fromNorm) return normalizeRoleLabel(fromNorm);
        const att = offerPost?.attributes || {};
        const explicit = att.targetRole || att.professionalRole;
        if (explicit) {
            return normalizeRoleLabel(typeof explicit === 'string' ? explicit : (explicit.label || explicit.role || ''));
        }
        return '';
    }

    function rolesCompatible(needRole, offerRole) {
        const need = normalizeRoleLabel(needRole);
        const offer = normalizeRoleLabel(offerRole);
        if (!need || !offer) return false;
        if (need.toLowerCase() === offer.toLowerCase()) return true;

        const allowed = ROLE_COMPATIBILITY[need]
            || ROLE_COMPATIBILITY[needRole]
            || ROLE_COMPATIBILITY[normalizeRoleLabel(needRole)];

        if (!allowed) {
            return need.toLowerCase() === offer.toLowerCase();
        }

        return allowed.some(a => a.toLowerCase() === offer.toLowerCase());
    }

    function serviceOverlapScore(needServices, offerServices) {
        const needList = (needServices || []).filter(Boolean);
        if (!needList.length) return 1;

        const offerSet = new Set((offerServices || []).map(s => String(s).toLowerCase()));
        let matched = 0;
        needList.forEach(s => {
            if (offerSet.has(String(s).toLowerCase())) matched++;
        });
        return matched / needList.length;
    }

    function passesCoreSkills(needNorm, offerNorm) {
        const needCore = needNorm?.coreSkills || [];
        if (!needCore.length) return { ok: true };

        const offerPool = [].concat(
            offerNorm?.coreSkills || [],
            offerNorm?.offeredServices || [],
            offerNorm?.skills || []
        );
        const offerSet = new Set(offerPool.map(s => String(s).toLowerCase()));

        const missing = needCore.filter(skill => !offerSet.has(String(skill).toLowerCase()));
        if (missing.length) {
            return { ok: false, reason: 'core_skill_missing', missing };
        }
        return { ok: true };
    }

    function passesServiceOverlap(needNorm, offerNorm) {
        const needServices = needNorm?.requiredServices || [];
        if (!needServices.length) return { ok: true };

        const offerServices = offerNorm?.offeredServices || offerNorm?.skills || [];
        const overlap = serviceOverlapScore(needServices, offerServices);
        const minOverlap = CONFIG.MATCHING?.MIN_REQUIRED_SERVICE_OVERLAP ?? 0.50;

        if (overlap < minOverlap) {
            return { ok: false, reason: 'service_overlap_low', overlap, minOverlap };
        }
        return { ok: true, overlap };
    }

    function passesPair(needPost, offerPost, ctx = {}) {
        if (CONFIG.MATCHING?.HARD_CONSTRAINTS_ENABLED === false) {
            return { ok: true };
        }

        const needNorm = ctx.needNorm || needPost?.normalized || {};
        const offerNorm = ctx.offerNorm || offerPost?.normalized || {};

        const needRole = getNeedRole(needPost, needNorm);
        const offerRole = getOfferRole(offerPost, offerNorm);

        if (!needRole) return { ok: false, reason: 'role_missing', side: 'need' };
        if (!offerRole) return { ok: false, reason: 'role_missing', side: 'offer' };
        if (!rolesCompatible(needRole, offerRole)) {
            return { ok: false, reason: 'role_incompatible', needRole, offerRole };
        }

        const coreCheck = passesCoreSkills(needNorm, offerNorm);
        if (!coreCheck.ok) return coreCheck;

        const serviceCheck = passesServiceOverlap(needNorm, offerNorm);
        if (!serviceCheck.ok) return serviceCheck;

        return { ok: true, needRole, offerRole, overlap: serviceCheck.overlap };
    }

    const hardConstraints = {
        ROLE_COMPATIBILITY,
        ROLE_ALIASES,
        normalizeRoleLabel,
        getNeedRole,
        getOfferRole,
        rolesCompatible,
        serviceOverlapScore,
        passesCoreSkills,
        passesServiceOverlap,
        passesPair
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = hardConstraints;
    } else {
        global.hardConstraints = hardConstraints;
    }
})(typeof window !== 'undefined' ? window : globalThis);
