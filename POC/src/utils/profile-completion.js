/**
 * Profile completion percentage for users and companies.
 * Used by dashboard, profile, and optionally matching.
 */
(function (global) {
    function parseArray(val) {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') return val.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        return [];
    }

    function getCompanyCompleteness(profile) {
        var fields = [
            !!profile && !!profile.name,
            !!(profile && (profile.crNumber || profile.registrationNumber)),
            (Array.isArray(profile && profile.sectors) ? profile.sectors.length : parseArray(profile && profile.sectors).length) > 0 ||
                (Array.isArray(profile && profile.classifications) ? profile.classifications.length : parseArray(profile && profile.classifications).length) > 0,
            profile && profile.financialCapacity != null && profile.financialCapacity !== '' && Number(profile.financialCapacity) >= 0,
            !!(profile && profile.companyRole),
            (Array.isArray(profile && profile.preferredPaymentModes) ? profile.preferredPaymentModes.length : 0) > 0,
            (Array.isArray(profile && profile.preferredCollaborationModels) ? profile.preferredCollaborationModels.length : 0) > 0,
            (Array.isArray(profile && profile.caseStudies) ? profile.caseStudies.length : 0) > 0,
            (Array.isArray(profile && profile.references) ? profile.references.length : 0) > 0,
            !!(profile && profile.primaryDomain) || (Array.isArray(profile && profile.expertiseAreas) && profile.expertiseAreas.length > 0)
        ];
        var filled = fields.filter(Boolean).length;
        return { percent: Math.round((filled / 10) * 100), total: 10, filled: filled };
    }

    /**
     * Profile completion: 6 criteria (Photo, Bio, Skills, Experience, Portfolio, Certificates).
     * Matches Profile page logic so Dashboard and Profile show the same percentage.
     * @param {Object} profile - User profile object
     * @returns {{ percent: number, filled: number, total: number }}
     */
    function getProfileCompletionSix(profile) {
        var hasPhoto = !!(profile && profile.photoUrl && String(profile.photoUrl).trim());
        var hasBio = !!(profile && profile.bio && String(profile.bio).trim());
        var hasSkills = Array.isArray(profile && profile.skills) ? profile.skills.length > 0 : !!(profile && profile.skills && String(profile.skills).trim());
        var hasExperience = (Array.isArray(profile && profile.experienceEntries) && profile.experienceEntries.length > 0) ||
            (profile && (profile.yearsExperience != null && profile.yearsExperience !== '')) ||
            (profile && (profile.experience != null && profile.experience !== ''));
        var hasPortfolio = (Array.isArray(profile && profile.caseStudies) && profile.caseStudies.length > 0) ||
            (Array.isArray(profile && profile.portfolio) && profile.portfolio.length > 0);
        var hasCertificates = Array.isArray(profile && profile.certifications) ? profile.certifications.length > 0 : !!(profile && profile.certifications && String(profile.certifications).trim());
        var filled = [hasPhoto, hasBio, hasSkills, hasExperience, hasPortfolio, hasCertificates].filter(Boolean).length;
        var total = 6;
        var percent = total === 0 ? 100 : Math.round((filled / total) * 100);
        return { percent: percent, filled: filled, total: total };
    }

    function getProfessionalCompleteness(profile) {
        var hasName = !!(profile && profile.name);
        var hasSpec = Array.isArray(profile && profile.specializations) ? profile.specializations.length > 0 : !!(profile && profile.specializations);
        var hasSkills = Array.isArray(profile && profile.skills) ? profile.skills.length > 0 : !!(profile && profile.skills);
        var hasCert = Array.isArray(profile && profile.certifications) ? profile.certifications.length > 0 : !!(profile && profile.certifications);
        var hasExp = (profile && (profile.yearsExperience != null && profile.yearsExperience !== '') || (profile.experience != null && profile.experience !== ''));
        var hasHeadline = !!(profile && profile.headline);
        var hasLocation = !!(profile && profile.location);
        var hasWorkMode = !!(profile && profile.preferredWorkMode);
        var hasPaymentModes = (Array.isArray(profile && profile.preferredPaymentModes) ? profile.preferredPaymentModes.length : 0) > 0;
        var hasPreferredModels = (Array.isArray(profile && profile.preferredCollaborationModels) ? profile.preferredCollaborationModels.length : 0) > 0;
        var hasCaseStudies = (Array.isArray(profile && profile.caseStudies) ? profile.caseStudies.length : 0) > 0;
        var hasReferences = (Array.isArray(profile && profile.references) ? profile.references.length : 0) > 0;
        var hasDomainOrExpertise = !!(profile && profile.primaryDomain) || (Array.isArray(profile && profile.expertiseAreas) && profile.expertiseAreas.length > 0);
        var fields = [hasName, hasSpec || hasSkills, hasCert, hasExp, hasHeadline, hasLocation, hasWorkMode, hasPaymentModes, hasPreferredModels, hasCaseStudies, hasReferences, hasDomainOrExpertise];
        var filled = fields.filter(Boolean).length;
        return { percent: Math.round((filled / 12) * 100), total: 12, filled: filled };
    }

    /**
     * Get profile completion for a user or company entity.
     * @param {Object} entity - User or company record (with profile)
     * @returns {{ percent: number, total: number, filled: number }}
     */
    function getProfileCompletion(entity) {
        if (!entity) return { percent: 0, total: 10, filled: 0 };
        var profile = entity.profile || {};
        var isCompany = profile.type === 'company' || entity.role === 'company_owner';
        if (isCompany) return getCompanyCompleteness(profile);
        var role = entity.role && String(entity.role).toLowerCase();
        var isPro = role === 'professional' || role === 'consultant';
        return isPro ? getProfileCompletionSix(profile) : getProfessionalCompleteness(profile);
    }

    var profileCompletion = {
        getProfileCompletion: getProfileCompletion,
        getProfileCompletionSix: getProfileCompletionSix,
        getCompanyCompleteness: getCompanyCompleteness,
        getProfessionalCompleteness: getProfessionalCompleteness
    };

    global.profileCompletion = profileCompletion;
    if (typeof module !== 'undefined' && module.exports) module.exports = profileCompletion;
})(typeof window !== 'undefined' ? window : this);
