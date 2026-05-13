/**
 * People Module - Explore Network
 */

let allPeople = [];
let filteredPeople = [];
let selectedSkills = new Set();

function isCompanyProfile(person) {
    return (person.profile || {}).type === 'company';
}

/** Individual (non-company) profiles shown under "Professionals" — mirrors find.js */
function isProfessionalOrConsultantProfile(person) {
    const profile = person.profile || {};
    const pt = profile.type;
    if (pt === 'professional' || pt === 'consultant') return true;
    if (pt === 'company') return false;
    const role = person.role;
    return role === 'professional' || role === 'consultant';
}

function isTypeFilterActive() {
    const boxes = document.querySelectorAll('input[name="type"]');
    if (!boxes.length) return false;
    const checked = document.querySelectorAll('input[name="type"]:checked').length;
    return checked > 0 && checked < boxes.length;
}

function escapeAttr(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

function escapeHTML(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function setResultsCountLoading() {
    const el = document.getElementById('results-count');
    if (!el) return;
    el.innerHTML = '<span class="people-count__loading">Loading…</span>';
}

function setResultsCount(n) {
    const el = document.getElementById('results-count');
    if (!el) return;
    const num = Math.max(0, Number(n) || 0);
    const val = document.createElement('span');
    val.className = 'people-count__value';
    val.textContent = String(num);
    const lab = document.createElement('span');
    lab.className = 'people-count__label';
    lab.textContent = num === 1 ? 'profile' : 'profiles';
    el.replaceChildren(val, lab);
}

function setResultsCountDash() {
    const el = document.getElementById('results-count');
    if (!el) return;
    el.innerHTML = '<span class="people-count__loading">—</span>';
}

function updateFilterSummary() {
    const el = document.getElementById('people-filter-summary');
    if (!el) return;
    let n = 0;
    const q = document.getElementById('search-people')?.value?.trim();
    if (q) n++;
    if (document.getElementById('filter-location')?.value) n++;
    if (document.getElementById('filter-availability')?.value) n++;
    n += selectedSkills.size;
    if (isTypeFilterActive()) n++;
    if (n === 0) {
        el.textContent = 'No filters applied';
        el.classList.remove('is-active');
    } else {
        el.textContent = n === 1 ? '1 filter active' : `${n} filters active`;
        el.classList.add('is-active');
    }
}

function updateSkillsSelectionBadge() {
    const el = document.getElementById('people-skills-selected');
    if (!el) return;
    const n = selectedSkills.size;
    if (n === 0) {
        el.setAttribute('hidden', '');
        el.textContent = '';
        return;
    }
    el.removeAttribute('hidden');
    el.textContent = `Selected: ${n}`;
}

function filterSkillTagsVisibility() {
    const qEl = document.getElementById('skills-query');
    const q = (qEl?.value || '').trim().toLowerCase();
    document.querySelectorAll('#skills-filter .skill-check-item').forEach(item => {
        const t = (item.dataset.skill || '').trim().toLowerCase();
        item.style.display = !q || t.includes(q) ? '' : 'none';
    });
}

function setupSkillsQuery() {
    const q = document.getElementById('skills-query');
    if (!q || q.dataset.bound === '1') return;
    q.dataset.bound = '1';
    q.addEventListener('input', filterSkillTagsVisibility);
}

function setupSkillsFilterHost() {
    const root = document.getElementById('skills-filter');
    if (!root || root.dataset.delegationBound === '1') return;
    root.dataset.delegationBound = '1';
    root.addEventListener('change', (e) => {
        const input = e.target.closest('.skill-check-input');
        if (!input || !root.contains(input)) return;
        const skill = input.value;
        if (!skill) return;
        if (input.checked) selectedSkills.add(skill);
        else selectedSkills.delete(skill);
        const item = input.closest('.skill-check-item');
        if (item) item.classList.toggle('is-active', input.checked);
        applyFilters();
    });
}

function renderSkillCheckItem(skill) {
    const active = selectedSkills.has(skill);
    const checked = active ? ' checked' : '';
    const activeClass = active ? 'skill-check-item is-active' : 'skill-check-item';
    const skillAttr = escapeAttr(skill);
    const skillText = escapeHTML(skill);
    return `<label class="${activeClass}" data-skill="${skillAttr}"><input type="checkbox" class="skill-check-input" value="${skillAttr}"${checked}><span class="skill-check-label">${skillText}</span></label>`;
}

function syncSkillChecklistUI() {
    document.querySelectorAll('#skills-filter .skill-check-item').forEach(item => {
        const input = item.querySelector('.skill-check-input');
        const skill = input?.value || '';
        const active = selectedSkills.has(skill);
        if (input) input.checked = active;
        item.classList.toggle('is-active', active);
    });
}

function applySkillsSearchAndSelectionUI() {
    syncSkillChecklistUI();
    updateSkillsSelectionBadge();
    filterSkillTagsVisibility();
}

async function initPeople() {
    const headerMount = document.getElementById('page-context-header-mount');
    if (headerMount && window.pageContextHeader && window.pageContextHeader.PRESETS) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.people);
    }
    document.getElementById('page-cta-people-invite')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('people-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('page-cta-people-filter')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('search-people')?.focus();
    });

    setupSkillsFilterHost();
    setupSkillsQuery();
    await loadPeople();
    setupFilters();
    setupSearch();
    setupSort();
}

async function loadPeople() {
    const container = document.getElementById('people-list');
    if (!container) return;

    setResultsCountLoading();
    
    container.innerHTML = '<div class="people-list__loading"><div class="spinner" aria-label="Loading"></div></div>';
    
    try {
        // Get all people (users + companies) from storage
        const people = await dataService.getAllPeople();
        console.log('Total people loaded:', people.length);
        
        // Filter to only public profiles (professionals and companies)
        // Default to showing if isPublic is not set (for backward compatibility)
        allPeople = people.filter(user => {
            const isPublic = user.isPublic !== false; // Default to true if not set
            const isActive = user.status === 'active';
            const isNotAdmin = user.profile?.type !== 'admin';
            const hasValidProfile = user.profile && (isCompanyProfile(user) || isProfessionalOrConsultantProfile(user));
            
            return isPublic && isActive && isNotAdmin && hasValidProfile;
        });
        
        console.log('Filtered public people:', allPeople.length);
        
        if (allPeople.length === 0) {
            setResultsCount(0);
            updateFilterSummary();
            container.innerHTML = [
                '<div class="people-empty" role="status">',
                '<div class="people-empty-icon" aria-hidden="true"><i class="ph-duotone ph-identification-badge"></i></div>',
                '<h2 class="empty-state-title">Directory is empty</h2>',
                '<p class="empty-state-description">There are no public profiles to show yet. You can go back to your dashboard or reload demo data from the console.</p>',
                '<div class="people-empty-actions"><a href="#" data-route="/dashboard" class="btn btn-primary">Go to dashboard</a></div>',
                '</div>'
            ].join('');
            return;
        }
        
        // Extract all skills for filter
        populateSkillsFilter();
        
        // Initial display
        applyFilters();
        
    } catch (error) {
        console.error('Error loading people:', error);
        setResultsCountDash();
        container.innerHTML = [
            '<div class="people-empty" role="alert">',
            '<div class="people-empty-icon" aria-hidden="true"><i class="ph-duotone ph-warning-circle"></i></div>',
            '<h2 class="empty-state-title">Could not load results</h2>',
            '<p class="empty-state-description">Something went wrong. Check your connection and try opening this page again.</p>',
            '</div>'
        ].join('');
    }
}

function populateSkillsFilter() {
    const skillsContainer = document.getElementById('skills-filter');
    if (!skillsContainer) return;
    
    // Collect all unique skills
    const skillsSet = new Set();
    allPeople.forEach(person => {
        const skills = person.profile?.skills || [];
        skills.forEach(skill => skillsSet.add(skill));
    });
    
    // Sort and limit to top 20
    const sortedSkills = Array.from(skillsSet).sort().slice(0, 20);
    
    skillsContainer.innerHTML = sortedSkills.map(skill => renderSkillCheckItem(skill)).join('');
    applySkillsSearchAndSelectionUI();
}

function setupFilters() {
    const sidebar = document.querySelector('.people-sidebar');
    const toggleBtn = document.getElementById('toggle-filters');
    if (sidebar && toggleBtn) {
        const setCollapsed = (collapsed) => {
            sidebar.classList.toggle('is-collapsed', collapsed);
            toggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            toggleBtn.textContent = collapsed ? 'Show filters' : 'Hide filters';
        };
        const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
        setCollapsed(isMobile);
        toggleBtn.addEventListener('click', () => {
            setCollapsed(!sidebar.classList.contains('is-collapsed'));
        });
    }

    const clearSkillsBtn = document.getElementById('clear-skills');
    if (clearSkillsBtn) {
        clearSkillsBtn.addEventListener('click', clearSkillsOnly);
    }
    const resetFiltersBtn = document.getElementById('reset-filters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', clearFilters);
    }

    const onFilterChange = () => applyFilters();
    document.getElementById('filter-location')?.addEventListener('change', onFilterChange);
    document.getElementById('filter-availability')?.addEventListener('change', onFilterChange);
    document.querySelectorAll('input[name="type"]').forEach(cb => {
        cb.addEventListener('change', onFilterChange);
    });
}

function setupSearch() {
    const searchInput = document.getElementById('search-people');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            updateFilterSummary();
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyFilters, 300);
        });
    }
}

function setupSort() {
    const sortSelect = document.getElementById('sort-people');
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }
}

function applyFilters() {
    // Get filter values
    const searchTerm = document.getElementById('search-people')?.value.toLowerCase() || '';
    const locationFilter = document.getElementById('filter-location')?.value || '';
    const availabilityFilter = document.getElementById('filter-availability')?.value || '';
    const sortBy = document.getElementById('sort-people')?.value || 'connections';
    
    // Get selected types (checkbox value "professional" includes consultants)
    const typeCheckboxes = document.querySelectorAll('input[name="type"]:checked');
    const selectedTypes = Array.from(typeCheckboxes).map(cb => cb.value);
    
    // Filter people
    filteredPeople = allPeople.filter(person => {
        const profile = person.profile || {};
        
        // Type filter
        if (selectedTypes.length > 0) {
            const okPro = selectedTypes.includes('professional') && isProfessionalOrConsultantProfile(person);
            const okCo = selectedTypes.includes('company') && isCompanyProfile(person);
            if (!okPro && !okCo) {
                return false;
            }
        }
        
        // Search filter (skills, bio, domains, classifications, experience, case studies, etc.)
        if (searchTerm) {
            const match = window.ProfileSearchText && typeof ProfileSearchText.profileMatchesSearch === 'function'
                ? ProfileSearchText.profileMatchesSearch(profile, searchTerm)
                : [
                    profile.name,
                    profile.headline,
                    profile.title,
                    profile.bio,
                    profile.description,
                    ...(profile.skills || []),
                    ...(profile.services || []),
                    ...(profile.sectors || [])
                ].filter(Boolean).join(' ').toLowerCase().includes(searchTerm);
            if (!match) return false;
        }
        
        // Location filter
        if (locationFilter) {
            const location = profile.location || profile.address || '';
            if (!location.includes(locationFilter)) {
                return false;
            }
        }
        
        // Availability filter (individuals only)
        if (availabilityFilter && isProfessionalOrConsultantProfile(person)) {
            if (profile.availability !== availabilityFilter) {
                return false;
            }
        }
        
        // Skills filter
        if (selectedSkills.size > 0) {
            const personSkills = new Set(profile.skills || []);
            let hasMatchingSkill = false;
            for (const skill of selectedSkills) {
                if (personSkills.has(skill)) {
                    hasMatchingSkill = true;
                    break;
                }
            }
            if (!hasMatchingSkill) {
                return false;
            }
        }
        
        return true;
    });
    
    // Sort
    filteredPeople.sort((a, b) => {
        switch (sortBy) {
            case 'connections':
                return (b.connectionCount || 0) - (a.connectionCount || 0);
            case 'name':
                return (a.profile?.name || '').localeCompare(b.profile?.name || '');
            case 'experience':
                return (b.profile?.experience || 0) - (a.profile?.experience || 0);
            case 'recent':
                return new Date(b.createdAt) - new Date(a.createdAt);
            default:
                return 0;
        }
    });
    
    updateFilterSummary();
    updateSkillsSelectionBadge();
    displayPeople();
}

function clearFilters() {
    // Reset search
    const searchInput = document.getElementById('search-people');
    if (searchInput) searchInput.value = '';
    
    // Reset location
    const locationSelect = document.getElementById('filter-location');
    if (locationSelect) locationSelect.value = '';
    
    // Reset availability
    const availabilitySelect = document.getElementById('filter-availability');
    if (availabilitySelect) availabilitySelect.value = '';
    
    // Reset type checkboxes: unchecked = no type restriction (same as both unchecked in applyFilters)
    document.querySelectorAll('input[name="type"]').forEach(cb => { cb.checked = false; });
    
    // Reset skills
    selectedSkills.clear();
    applySkillsSearchAndSelectionUI();

    const skillsQuery = document.getElementById('skills-query');
    if (skillsQuery) {
        skillsQuery.value = '';
        filterSkillTagsVisibility();
    }
    
    // Reset sort
    const sortSelect = document.getElementById('sort-people');
    if (sortSelect) sortSelect.value = 'connections';
    
    applyFilters();
}

function clearSkillsOnly() {
    selectedSkills.clear();
    applySkillsSearchAndSelectionUI();

    const skillsQuery = document.getElementById('skills-query');
    if (skillsQuery) {
        skillsQuery.value = '';
        filterSkillTagsVisibility();
    }

    applyFilters();
}

async function displayPeople() {
    const container = document.getElementById('people-list');
    
    if (!container) return;
    
    setResultsCount(filteredPeople.length);
    
    if (filteredPeople.length === 0) {
        // Check if any filters are active
        const searchInput = document.getElementById('search-people')?.value || '';
        const locationSelect = document.getElementById('filter-location')?.value || '';
        const availabilitySelect = document.getElementById('filter-availability')?.value || '';
        const hasFilters = Boolean(searchInput || locationSelect || availabilitySelect || selectedSkills.size > 0 || isTypeFilterActive());
        
        if (hasFilters) {
            container.innerHTML = [
                '<div class="people-empty" role="status">',
                '<div class="people-empty-icon" aria-hidden="true"><i class="ph-duotone ph-magnifying-glass"></i></div>',
                '<h2 class="empty-state-title">No matches</h2>',
                '<p class="empty-state-description">Relax one or more filters, or reset everything to see the full directory again.</p>',
                '<div class="people-empty-actions">',
                '<button type="button" class="btn btn-primary" id="people-empty-reset">Clear all</button>',
                '</div></div>'
            ].join('');
            document.getElementById('people-empty-reset')?.addEventListener('click', clearFilters);
        } else {
            container.innerHTML = [
                '<div class="people-empty" role="status">',
                '<div class="people-empty-icon" aria-hidden="true"><i class="ph-duotone ph-users-three"></i></div>',
                '<h2 class="empty-state-title">No one to show yet</h2>',
                '<p class="empty-state-description">The directory is empty. Refresh the page or run <code>window.resetAppData()</code> in the browser console to reload demo data.</p>',
                '</div>'
            ].join('');
        }
        return;
    }
    
    // Load template
    const template = await templateLoader.load('person-card');
    const currentUser = authService.getCurrentUser();
    
    // Render people cards (with connection status when logged in)
    const html = await Promise.all(filteredPeople.map(async (person) => {
        const profile = person.profile || {};
        const isCompany = isCompanyProfile(person);
        
        let connectionStatusAccepted = false;
        let connectionStatusPending = false;
        if (currentUser && currentUser.id !== person.id) {
            const status = await dataService.getConnectionStatus(currentUser.id, person.id);
            connectionStatusAccepted = status === 'accepted';
            connectionStatusPending = status === 'pending_sent';
        }
        
        const name = profile.name || 'Unknown';
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const skills = (profile.skills || []).slice(0, 5);
        const skillsHtml = skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('');
        const availabilityRaw = (profile.availability || '').trim();
        const availability =
            availabilityRaw && availabilityRaw.toUpperCase() !== 'N/A' ? availabilityRaw : '';
        const experience = Number(profile.experience) || 0;
        const connectionCount = Number(person.connectionCount) || 0;
        const showExperience = experience > 0;
        const showConnections = connectionCount > 0;
        const showPersonMeta = showExperience || showConnections;

        const data = {
            id: person.id,
            name: profile.name || 'Unknown',
            headline: profile.headline || profile.title || profile.description?.substring(0, 100) || '',
            location: profile.location || profile.address || 'Location not specified',
            avatarInitials: initials,
            isCompany: isCompany,
            availability,
            experience,
            connectionCount,
            showExperience,
            showConnections,
            showPersonMeta,
            employeeCount: profile.employeeCount || 'N/A',
            yearEstablished: profile.yearEstablished || 'N/A',
            skills: skills.length > 0,
            skillsHtml: skillsHtml,
            connectionStatusAccepted,
            connectionStatusPending
        };
        
        return templateRenderer.render(template, data);
    })).then(rendered => rendered.join(''));
    
    container.innerHTML = html;
    
    container.querySelectorAll('.btn-connect').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleConnect(btn.dataset.userId);
        });
    });
    
    container.querySelectorAll('.person-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.btn')) {
                router.navigate(`/people/${card.dataset.id}`);
            }
        });
    });
}

async function handleConnect(userId) {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
        router.navigate('/login');
        return;
    }
    
    try {
        const conn = await dataService.createConnection(currentUser.id, userId);
        await dataService.createNotification({
            userId: userId,
            type: 'connection_request',
            title: 'Connection request',
            message: `${currentUser.profile?.name || currentUser.email} wants to connect with you.`,
            connectionId: conn.id,
            link: '/people/' + currentUser.id
        });
        await window.modalService.success('Connection request sent!', 'Success');
        applyFilters(); // refresh list to show Pending
        if (typeof layoutService !== 'undefined' && typeof layoutService.updateNavigation === 'function') {
            void layoutService.updateNavigation();
        }
    } catch (err) {
        console.error('Error sending connection request:', err);
        await window.modalService.error('Failed to send request. Try again.', 'Error');
    }
}
