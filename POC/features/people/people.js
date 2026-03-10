/**
 * People Module - Explore Network
 */

let allPeople = [];
let filteredPeople = [];
let selectedSkills = new Set();

async function initPeople() {
    await loadPeople();
    setupFilters();
    setupSearch();
    setupSort();
}

async function loadPeople() {
    const container = document.getElementById('people-list');
    if (!container) return;
    
    container.innerHTML = '<div class="spinner"></div>';
    
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
            const hasValidProfile = user.profile && (user.profile.type === 'professional' || user.profile.type === 'company');
            
            return isPublic && isActive && isNotAdmin && hasValidProfile;
        });
        
        console.log('Filtered public people:', allPeople.length);
        
        if (allPeople.length === 0) {
            container.innerHTML = '<div class="empty-state">No people found. <a href="#" data-route="/dashboard">Go to Dashboard</a></div>';
            return;
        }
        
        // Extract all skills for filter
        populateSkillsFilter();
        
        // Initial display
        applyFilters();
        
    } catch (error) {
        console.error('Error loading people:', error);
        container.innerHTML = '<div class="empty-state">Error loading people. Please try again.</div>';
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
    
    skillsContainer.innerHTML = sortedSkills.map(skill => `
        <span class="skill-filter-tag" data-skill="${skill}">${skill}</span>
    `).join('');
    
    // Add click handlers
    skillsContainer.querySelectorAll('.skill-filter-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const skill = tag.dataset.skill;
            if (selectedSkills.has(skill)) {
                selectedSkills.delete(skill);
                tag.classList.remove('active');
            } else {
                selectedSkills.add(skill);
                tag.classList.add('active');
            }
        });
    });
}

function setupFilters() {
    const applyBtn = document.getElementById('apply-filters');
    const clearBtn = document.getElementById('clear-filters');
    
    if (applyBtn) {
        applyBtn.addEventListener('click', applyFilters);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFilters);
    }
}

function setupSearch() {
    const searchInput = document.getElementById('search-people');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
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
    
    // Get selected types
    const typeCheckboxes = document.querySelectorAll('input[name="type"]:checked');
    const selectedTypes = Array.from(typeCheckboxes).map(cb => cb.value);
    
    // Filter people
    filteredPeople = allPeople.filter(person => {
        const profile = person.profile || {};
        
        // Type filter
        if (selectedTypes.length > 0 && !selectedTypes.includes(profile.type)) {
            return false;
        }
        
        // Search filter
        if (searchTerm) {
            const searchFields = [
                profile.name,
                profile.headline,
                profile.title,
                profile.bio,
                profile.description,
                ...(profile.skills || []),
                ...(profile.services || []),
                ...(profile.sectors || [])
            ].filter(Boolean).join(' ').toLowerCase();
            
            if (!searchFields.includes(searchTerm)) {
                return false;
            }
        }
        
        // Location filter
        if (locationFilter) {
            const location = profile.location || profile.address || '';
            if (!location.includes(locationFilter)) {
                return false;
            }
        }
        
        // Availability filter (for professionals)
        if (availabilityFilter && profile.type === 'professional') {
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
    
    // Reset type checkboxes
    document.querySelectorAll('input[name="type"]').forEach(cb => cb.checked = true);
    
    // Reset skills
    selectedSkills.clear();
    document.querySelectorAll('.skill-filter-tag').forEach(tag => tag.classList.remove('active'));
    
    // Reset sort
    const sortSelect = document.getElementById('sort-people');
    if (sortSelect) sortSelect.value = 'connections';
    
    applyFilters();
}

async function displayPeople() {
    const container = document.getElementById('people-list');
    const countEl = document.getElementById('results-count');
    
    if (!container) return;
    
    // Update count
    if (countEl) {
        countEl.textContent = `${filteredPeople.length} ${filteredPeople.length === 1 ? 'result' : 'results'} found`;
    }
    
    if (filteredPeople.length === 0) {
        // Check if any filters are active
        const searchInput = document.getElementById('search-people')?.value || '';
        const locationSelect = document.getElementById('filter-location')?.value || '';
        const availabilitySelect = document.getElementById('filter-availability')?.value || '';
        const hasFilters = searchInput || locationSelect || availabilitySelect || selectedSkills.size > 0;
        
        if (hasFilters) {
            container.innerHTML = '<div class="empty-state">No people found matching your criteria. <button class="btn btn-primary btn-sm" onclick="document.getElementById(\'clear-filters\')?.click()">Clear Filters</button></div>';
        } else {
            container.innerHTML = '<div class="empty-state"><p>No people found. The data may need to be refreshed.</p><p>Try refreshing the page or run <code>window.resetAppData()</code> in the console to reload data.</p></div>';
        }
        return;
    }
    
    // Load template
    const template = await templateLoader.load('person-card');
    const currentUser = authService.getCurrentUser();
    
    // Render people cards (with connection status when logged in)
    const html = await Promise.all(filteredPeople.map(async (person) => {
        const profile = person.profile || {};
        const isCompany = profile.type === 'company';
        
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
        
        const data = {
            id: person.id,
            name: profile.name || 'Unknown',
            headline: profile.headline || profile.title || profile.description?.substring(0, 100) || '',
            location: profile.location || profile.address || 'Location not specified',
            avatarInitials: initials,
            isCompany: isCompany,
            availability: profile.availability || 'N/A',
            experience: profile.experience || 0,
            connectionCount: person.connectionCount || 0,
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
    } catch (err) {
        console.error('Error sending connection request:', err);
        await window.modalService.error('Failed to send request. Try again.', 'Error');
    }
}
