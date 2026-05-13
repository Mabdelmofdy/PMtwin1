/**
 * Builds a lowercase search string from a user/company profile so Find / People
 * can match name, skills, domains, classifications, experience entries, etc.
 */
(function (global) {
    function normalizeToStrings(val) {
        if (val == null) return [];
        if (Array.isArray(val)) {
            return val.flatMap(v => {
                if (typeof v === 'string') return [v];
                if (v && typeof v === 'object') {
                    const n = v.name || v.label || v.title || v.domain || v.role || v.field;
                    return n ? [String(n)] : [];
                }
                return [String(v)];
            });
        }
        return String(val).split(/[,;]/).map(s => s.trim()).filter(Boolean);
    }

    function buildProfileSearchHaystack(profile) {
        if (!profile || typeof profile !== 'object') return '';
        const chunks = [];
        const add = x => {
            if (x != null && String(x).trim()) chunks.push(String(x));
        };

        add(profile.name);
        add(profile.headline);
        add(profile.title);
        add(profile.bio);
        add(profile.description);
        add(profile.location);
        add(profile.address);
        add(profile.city);
        add(profile.country);
        add(profile.primaryDomain);
        add(profile.companyRole);
        add(profile.companySubType);
        add(profile.education);
        add(profile.experience);
        add(profile.yearsExperience);
        add(profile.crNumber);
        add(profile.registrationNumber);
        add(profile.employeeCount);

        normalizeToStrings(profile.skills).forEach(add);
        normalizeToStrings(profile.specializations).forEach(add);
        normalizeToStrings(profile.services).forEach(add);
        normalizeToStrings(profile.sectors).forEach(add);
        normalizeToStrings(profile.industry).forEach(add);
        normalizeToStrings(profile.interests).forEach(add);
        normalizeToStrings(profile.classifications).forEach(add);
        normalizeToStrings(profile.languages).forEach(add);
        normalizeToStrings(profile.expertiseAreas).forEach(add);

        const certs = profile.certifications || [];
        certs.forEach(c => {
            if (typeof c === 'string') add(c);
            else if (c && typeof c === 'object') add(c.name || c.title || c.type);
        });

        (profile.experienceEntries || []).forEach(e => {
            add(e.role);
            add(e.company);
            add(e.startDate);
            add(e.endDate);
        });

        (profile.caseStudies || []).forEach(cs => {
            add(cs.title);
            add(cs.description);
        });

        (profile.portfolio || []).forEach(p => {
            if (typeof p === 'string') add(p);
            else if (p && typeof p === 'object') {
                add(p.title);
                add(p.description);
                add(p.role);
            }
        });

        return chunks.join(' ').toLowerCase();
    }

    /**
     * Every whitespace-separated token must appear somewhere in the haystack (order-independent).
     */
    function profileMatchesSearch(profile, searchTerm) {
        const hay = buildProfileSearchHaystack(profile);
        const q = (searchTerm || '').trim().toLowerCase();
        if (!q) return true;
        const tokens = q.split(/\s+/).filter(Boolean);
        return tokens.every(t => hay.includes(t));
    }

    global.ProfileSearchText = {
        buildProfileSearchHaystack,
        profileMatchesSearch
    };
})(typeof window !== 'undefined' ? window : globalThis);
