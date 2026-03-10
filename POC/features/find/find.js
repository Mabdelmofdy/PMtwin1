/**
 * Find Module - Public Search Page
 * Search for People, Companies, and Opportunities
 * Shows limited info for non-authenticated users, full details for logged-in users
 */

let findPeople = [];
let findCompanies = [];
let findOpportunities = [];
let findFilteredPeople = [];
let findFilteredCompanies = [];
let findFilteredOpportunities = [];
let currentTab = 'people';
let isAuthenticated = false;

async function initFind() {
    // Check authentication status
    isAuthenticated = await authService.checkAuth();
    
    // Show/hide login banner
    updateLoginBanner();
    
    // Load all data
    await Promise.all([
        loadPeople(),
        loadCompanies(),
        loadOpportunities()
    ]);
    
    // Setup event handlers
    setupTabs();
    setupSearch();
    setupFilters();
    setupFindMiniMap();
    
    // Initial render
    applyFilters();
}

function updateLoginBanner() {
    const banner = document.getElementById('login-banner');
    if (banner) {
        banner.style.display = isAuthenticated ? 'none' : 'block';
    }
}

async function loadPeople() {
    try {
        const people = await dataService.getAllPeople();
        
        // Filter to only public profiles
        findPeople = people.filter(user => {
            const isPublic = user.isPublic !== false;
            const isActive = user.status === 'active';
            const isNotAdmin = user.profile?.type !== 'admin';
            const isProfessional = user.profile?.type === 'professional' || user.profile?.type === 'consultant';
            
            return isPublic && isActive && isNotAdmin && isProfessional;
        });
        
        findFilteredPeople = [...findPeople];
        updateTabCount('people', findPeople.length);
    } catch (error) {
        console.error('Error loading people:', error);
        findPeople = [];
        findFilteredPeople = [];
    }
}

async function loadCompanies() {
    try {
        const companies = await dataService.getCompanies();
        
        // Filter to only public and active companies
        findCompanies = companies.filter(company => {
            const isPublic = company.isPublic !== false;
            const isActive = company.status === 'active';
            
            return isPublic && isActive;
        });
        
        findFilteredCompanies = [...findCompanies];
        updateTabCount('companies', findCompanies.length);
    } catch (error) {
        console.error('Error loading companies:', error);
        findCompanies = [];
        findFilteredCompanies = [];
    }
}

async function loadOpportunities() {
    try {
        const opportunities = await dataService.getOpportunities();
        
        // Filter to only published opportunities
        findOpportunities = opportunities.filter(opp => {
            return opp.status === 'published';
        });
        
        findFilteredOpportunities = [...findOpportunities];
        updateTabCount('opportunities', findOpportunities.length);
    } catch (error) {
        console.error('Error loading opportunities:', error);
        findOpportunities = [];
        findFilteredOpportunities = [];
    }
}

function updateTabCount(tab, count) {
    const countEl = document.getElementById(`${tab}-count`);
    if (countEl) {
        countEl.textContent = count;
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll('.find-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding content
            currentTab = tab.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`tab-${currentTab}`).classList.add('active');
            
            // Update filter visibility
            updateFilterVisibility();
            
            // Re-apply filters for new tab
            applyFilters();
        });
    });
}

function updateFilterVisibility() {
    const sectorFilter = document.getElementById('sector-filter-group');
    const oppTypeFilter = document.getElementById('opportunity-type-filter');
    const modelFilter = document.getElementById('model-filter');
    
    const mapLink = document.getElementById('find-map-link');

    if (currentTab === 'opportunities') {
        if (sectorFilter) sectorFilter.style.display = 'none';
        if (oppTypeFilter) oppTypeFilter.style.display = 'block';
        if (modelFilter) modelFilter.style.display = 'block';
        if (mapLink) mapLink.style.display = 'block';
    } else {
        if (sectorFilter) sectorFilter.style.display = 'block';
        if (oppTypeFilter) oppTypeFilter.style.display = 'none';
        if (modelFilter) modelFilter.style.display = 'none';
        if (mapLink) mapLink.style.display = 'none';
    }
}

function setupSearch() {
    const searchInput = document.getElementById('find-search-input');
    const searchBtn = document.getElementById('find-search-btn');
    
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyFilters, 300);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(debounceTimer);
                applyFilters();
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', applyFilters);
    }
}

function setupFilters() {
    const locationFilter = document.getElementById('filter-location');
    const sectorFilter = document.getElementById('filter-sector');
    const oppTypeFilter = document.getElementById('filter-opp-type');
    const modelFilter = document.getElementById('filter-model');
    
    [locationFilter, sectorFilter, oppTypeFilter, modelFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', applyFilters);
        }
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('find-search-input')?.value.toLowerCase() || '';
    const locationFilter = document.getElementById('filter-location')?.value || '';
    const sectorFilter = document.getElementById('filter-sector')?.value || '';
    const oppTypeFilter = document.getElementById('filter-opp-type')?.value || '';
    const modelFilter = document.getElementById('filter-model')?.value || '';
    
    // Filter People
    findFilteredPeople = findPeople.filter(person => {
        const profile = person.profile || {};
        
        // Search filter
        if (searchTerm) {
            const searchFields = [
                profile.name,
                profile.headline,
                profile.title,
                profile.bio,
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
            const location = profile.location || '';
            if (!location.toLowerCase().includes(locationFilter.toLowerCase())) {
                return false;
            }
        }
        
        // Sector filter
        if (sectorFilter) {
            const sectors = profile.sectors || [];
            if (!sectors.some(s => s.toLowerCase().includes(sectorFilter.toLowerCase()))) {
                return false;
            }
        }
        
        return true;
    });
    
    // Filter Companies
    findFilteredCompanies = findCompanies.filter(company => {
        const profile = company.profile || {};
        
        // Search filter
        if (searchTerm) {
            const searchFields = [
                profile.name,
                profile.headline,
                profile.description,
                ...(profile.services || []),
                ...(profile.sectors || []),
                ...(profile.industry || [])
            ].filter(Boolean).join(' ').toLowerCase();
            
            if (!searchFields.includes(searchTerm)) {
                return false;
            }
        }
        
        // Location filter
        if (locationFilter) {
            const location = profile.location || profile.address || '';
            if (!location.toLowerCase().includes(locationFilter.toLowerCase())) {
                return false;
            }
        }
        
        // Sector filter
        if (sectorFilter) {
            const sectors = profile.sectors || profile.industry || [];
            if (!sectors.some(s => s.toLowerCase().includes(sectorFilter.toLowerCase()))) {
                return false;
            }
        }
        
        return true;
    });
    
    // Filter Opportunities
    findFilteredOpportunities = findOpportunities.filter(opp => {
        // Search filter
        if (searchTerm) {
            const searchFields = [
                opp.title,
                opp.description,
                ...(opp.scope?.requiredSkills || []),
                ...(opp.scope?.offeredSkills || []),
                ...(opp.scope?.sectors || [])
            ].filter(Boolean).join(' ').toLowerCase();
            
            if (!searchFields.includes(searchTerm)) {
                return false;
            }
        }
        
        // Location filter
        if (locationFilter) {
            const location = opp.location || opp.locationCity || '';
            if (!location.toLowerCase().includes(locationFilter.toLowerCase())) {
                return false;
            }
        }
        
        // Opportunity type filter (need/offer)
        if (oppTypeFilter) {
            if (opp.intent !== oppTypeFilter) {
                return false;
            }
        }
        
        // Model filter
        if (modelFilter) {
            if (opp.modelType !== modelFilter) {
                return false;
            }
        }
        
        return true;
    });
    
    // Update counts
    updateTabCount('people', findFilteredPeople.length);
    updateTabCount('companies', findFilteredCompanies.length);
    updateTabCount('opportunities', findFilteredOpportunities.length);
    
    // Render current tab
    renderResults();
}

function renderResults() {
    switch (currentTab) {
        case 'people':
            renderPeople();
            break;
        case 'companies':
            renderCompanies();
            break;
        case 'opportunities':
            renderOpportunities();
            updateFindMiniMapMarkers();
            break;
    }
}

function renderPeople() {
    const container = document.getElementById('people-results');
    const emptyState = document.getElementById('people-empty');
    
    if (!container) return;
    
    if (findFilteredPeople.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    const html = findFilteredPeople.map(person => {
        const profile = person.profile || {};
        const name = profile.name || 'Unknown';
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        if (isAuthenticated) {
            return renderFullPersonCard(person, profile, initials);
        } else {
            return renderPreviewPersonCard(person, profile, initials);
        }
    }).join('');
    
    container.innerHTML = html;
    
    // Add click handlers for authenticated users
    if (isAuthenticated) {
        container.querySelectorAll('.full-card[data-id]').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn')) {
                    router.navigate(`/people/${card.dataset.id}`);
                }
            });
            card.style.cursor = 'pointer';
        });
    }
}

function renderPreviewPersonCard(person, profile, initials) {
    const skills = (profile.skills || []).slice(0, 3);
    
    return `
        <div class="preview-card">
            <div class="preview-card-header">
                <div class="preview-avatar">${initials}</div>
                <div class="preview-info">
                    <div class="preview-name">${profile.name || 'Professional'}</div>
                    <div class="preview-headline">${profile.headline || profile.title || 'Construction Professional'}</div>
                    <div class="preview-location">
                        <i class="ph-duotone ph-map-pin"></i>
                        ${profile.location || 'Saudi Arabia'}
                    </div>
                </div>
            </div>
            <div class="preview-badges">
                <span class="badge badge-secondary">${profile.type === 'consultant' ? 'Consultant' : 'Professional'}</span>
                ${profile.verificationStatus === 'professional_verified' ? '<span class="badge badge-success verification-badge">Verified Professional</span>' : profile.verificationStatus === 'consultant_verified' ? '<span class="badge badge-success verification-badge">Verified Consultant</span>' : ''}
                ${profile.availability ? `<span class="badge badge-outline">${profile.availability}</span>` : ''}
            </div>
            ${skills.length > 0 ? `
                <div class="preview-meta">
                    ${skills.map(s => `<span>${s}</span>`).join(' • ')}
                </div>
            ` : ''}
            <div class="preview-footer">
                <a href="#" data-route="/login" class="btn btn-secondary btn-sm">
                    <i class="ph-duotone ph-lock-simple"></i> Login to View
                </a>
            </div>
        </div>
    `;
}

function renderFullPersonCard(person, profile, initials) {
    const skills = (profile.skills || []).slice(0, 5);
    
    return `
        <div class="full-card" data-id="${person.id}">
            <div class="preview-card-header">
                <div class="preview-avatar">${initials}</div>
                <div class="preview-info">
                    <div class="preview-name">${profile.name || 'Professional'}</div>
                    <div class="preview-headline">${profile.headline || profile.title || 'Construction Professional'}</div>
                    <div class="preview-location">
                        <i class="ph-duotone ph-map-pin"></i>
                        ${profile.location || 'Saudi Arabia'}
                    </div>
                </div>
            </div>
            <div class="preview-badges">
                <span class="badge badge-secondary">${profile.type === 'consultant' ? 'Consultant' : 'Professional'}</span>
                ${profile.verificationStatus === 'professional_verified' ? '<span class="badge badge-success verification-badge">Verified Professional</span>' : profile.verificationStatus === 'consultant_verified' ? '<span class="badge badge-success verification-badge">Verified Consultant</span>' : ''}
                ${profile.availability ? `<span class="badge badge-outline">${profile.availability}</span>` : ''}
                ${profile.experience ? `<span class="badge badge-info">${profile.experience} yrs exp.</span>` : ''}
            </div>
            ${skills.length > 0 ? `
                <div class="full-card-skills">
                    ${skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                </div>
            ` : ''}
            <div class="preview-meta">
                <span><i class="ph-duotone ph-users"></i> ${person.connectionCount || 0} connections</span>
            </div>
            <div class="preview-footer">
                <a href="#" data-route="/people/${person.id}" class="btn btn-primary btn-sm">View Profile</a>
            </div>
        </div>
    `;
}

function renderCompanies() {
    const container = document.getElementById('companies-results');
    const emptyState = document.getElementById('companies-empty');
    
    if (!container) return;
    
    if (findFilteredCompanies.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    const html = findFilteredCompanies.map(company => {
        const profile = company.profile || {};
        const name = profile.name || 'Unknown Company';
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        if (isAuthenticated) {
            return renderFullCompanyCard(company, profile, initials);
        } else {
            return renderPreviewCompanyCard(company, profile, initials);
        }
    }).join('');
    
    container.innerHTML = html;
    
    // Add click handlers for authenticated users
    if (isAuthenticated) {
        container.querySelectorAll('.full-card[data-id]').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn')) {
                    router.navigate(`/people/${card.dataset.id}`);
                }
            });
            card.style.cursor = 'pointer';
        });
    }
}

function renderPreviewCompanyCard(company, profile, initials) {
    const sectors = (profile.sectors || profile.industry || []).slice(0, 3);
    
    return `
        <div class="preview-card">
            <div class="preview-card-header">
                <div class="preview-avatar" style="background: var(--info-light); color: var(--info-color);">${initials}</div>
                <div class="preview-info">
                    <div class="preview-name">${profile.name || 'Company'}</div>
                    <div class="preview-headline">${profile.headline || profile.companyType || 'Construction Company'}</div>
                    <div class="preview-location">
                        <i class="ph-duotone ph-map-pin"></i>
                        ${profile.location || profile.address || 'Saudi Arabia'}
                    </div>
                </div>
            </div>
            <div class="preview-badges">
                <span class="badge badge-primary">Company</span>
                ${profile.verificationStatus === 'company_verified' ? '<span class="badge badge-success verification-badge">Verified Company</span>' : ''}
                ${profile.employeeCount ? `<span class="badge badge-outline">${profile.employeeCount} employees</span>` : ''}
            </div>
            ${sectors.length > 0 ? `
                <div class="preview-meta">
                    ${sectors.map(s => `<span>${s}</span>`).join(' • ')}
                </div>
            ` : ''}
            <div class="preview-footer">
                <a href="#" data-route="/login" class="btn btn-secondary btn-sm">
                    <i class="ph-duotone ph-lock-simple"></i> Login to View
                </a>
            </div>
        </div>
    `;
}

function renderFullCompanyCard(company, profile, initials) {
    const sectors = (profile.sectors || profile.industry || []).slice(0, 5);
    
    return `
        <div class="full-card" data-id="${company.id}">
            <div class="preview-card-header">
                <div class="preview-avatar" style="background: var(--info-light); color: var(--info-color);">${initials}</div>
                <div class="preview-info">
                    <div class="preview-name">${profile.name || 'Company'}</div>
                    <div class="preview-headline">${profile.headline || profile.companyType || 'Construction Company'}</div>
                    <div class="preview-location">
                        <i class="ph-duotone ph-map-pin"></i>
                        ${profile.location || profile.address || 'Saudi Arabia'}
                    </div>
                </div>
            </div>
            <div class="preview-badges">
                <span class="badge badge-primary">Company</span>
                ${profile.verificationStatus === 'company_verified' ? '<span class="badge badge-success verification-badge">Verified Company</span>' : ''}
                ${profile.employeeCount ? `<span class="badge badge-outline">${profile.employeeCount} employees</span>` : ''}
                ${profile.yearEstablished ? `<span class="badge badge-info">Est. ${profile.yearEstablished}</span>` : ''}
            </div>
            ${sectors.length > 0 ? `
                <div class="full-card-skills">
                    ${sectors.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                </div>
            ` : ''}
            <div class="preview-meta">
                <span><i class="ph-duotone ph-users"></i> ${company.connectionCount || 0} connections</span>
            </div>
            <div class="preview-footer">
                <a href="#" data-route="/people/${company.id}" class="btn btn-primary btn-sm">View Company</a>
            </div>
        </div>
    `;
}

function renderOpportunities() {
    const sampleSection = document.getElementById('sample-opportunities-section');
    const sampleList = document.getElementById('sample-opportunities-list');
    const sampleOpps = (findOpportunities || []).filter(o => o.isSample === true);
    if (sampleSection && sampleList) {
        if (sampleOpps.length > 0) {
            sampleSection.style.display = 'block';
            sampleList.innerHTML = sampleOpps.map(opp => `
                <a href="#" data-route="/opportunities/${opp.id}" class="inline-flex items-center px-4 py-2 rounded-md border border-primary text-primary hover:bg-primary hover:text-white transition-colors">${(opp.title || 'Opportunity').substring(0, 50)}${(opp.title || '').length > 50 ? '…' : ''}</a>
            `).join('');
        } else {
            sampleSection.style.display = 'none';
        }
    }

    const container = document.getElementById('opportunities-results');
    const emptyState = document.getElementById('opportunities-empty');
    
    if (!container) return;
    
    if (findFilteredOpportunities.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    const html = findFilteredOpportunities.map(opp => {
        if (isAuthenticated) {
            return renderFullOpportunityCard(opp);
        } else {
            return renderPreviewOpportunityCard(opp);
        }
    }).join('');
    
    container.innerHTML = html;
    
    // Add click handlers for authenticated users
    if (isAuthenticated) {
        container.querySelectorAll('.full-card[data-id]').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn')) {
                    router.navigate(`/opportunities/${card.dataset.id}`);
                }
            });
            card.style.cursor = 'pointer';
        });
    }
}

function renderPreviewOpportunityCard(opp) {
    const modelTypeLabels = {
        'project_based': 'Project Based',
        'strategic_partnership': 'Strategic Partnership',
        'resource_pooling': 'Resource Pooling',
        'hiring': 'Hiring',
        'competition': 'Competition'
    };
    
    const intentLabel = opp.intent === 'request' ? 'Need' : 'Offer';
    const intentClass = opp.intent === 'request' ? 'badge-warning' : 'badge-success';
    
    return `
        <div class="preview-card">
            <div class="preview-info" style="padding: 0;">
                <div class="preview-name">${opp.title || 'Opportunity'}</div>
                <div class="preview-headline">${(opp.description || '').substring(0, 100)}${opp.description?.length > 100 ? '...' : ''}</div>
                <div class="preview-location">
                    <i class="ph-duotone ph-map-pin"></i>
                    ${opp.location || opp.locationCity || 'Saudi Arabia'}
                </div>
            </div>
            <div class="preview-badges" style="margin-top: var(--spacing-md);">
                <span class="badge ${intentClass}">${intentLabel}</span>
                <span class="badge badge-primary">${modelTypeLabels[opp.modelType] || opp.modelType}</span>
            </div>
            <div class="preview-meta">
                <span>Posted ${formatDate(opp.createdAt)}</span>
            </div>
            <div class="preview-footer">
                <a href="#" data-route="/login" class="btn btn-secondary btn-sm">
                    <i class="ph-duotone ph-lock-simple"></i> Login to View
                </a>
            </div>
        </div>
    `;
}

function renderFullOpportunityCard(opp) {
    const modelTypeLabels = {
        'project_based': 'Project Based',
        'strategic_partnership': 'Strategic Partnership',
        'resource_pooling': 'Resource Pooling',
        'hiring': 'Hiring',
        'competition': 'Competition'
    };
    
    const intentLabel = opp.intent === 'request' ? 'Need' : 'Offer';
    const intentClass = opp.intent === 'request' ? 'badge-warning' : 'badge-success';
    
    const skills = [...(opp.scope?.requiredSkills || []), ...(opp.scope?.offeredSkills || [])].slice(0, 5);
    
    return `
        <div class="full-card" data-id="${opp.id}">
            <div class="preview-info" style="padding: 0;">
                <div class="preview-name">${opp.title || 'Opportunity'}</div>
                <div class="preview-headline">${(opp.description || '').substring(0, 150)}${opp.description?.length > 150 ? '...' : ''}</div>
                <div class="preview-location">
                    <i class="ph-duotone ph-map-pin"></i>
                    ${opp.location || opp.locationCity || 'Saudi Arabia'}
                </div>
            </div>
            <div class="preview-badges" style="margin-top: var(--spacing-md);">
                <span class="badge ${intentClass}">${intentLabel}</span>
                <span class="badge badge-primary">${modelTypeLabels[opp.modelType] || opp.modelType}</span>
                ${opp.subModelType ? `<span class="badge badge-outline">${opp.subModelType.replace(/_/g, ' ')}</span>` : ''}
            </div>
            ${skills.length > 0 ? `
                <div class="full-card-skills">
                    ${skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                </div>
            ` : ''}
            <div class="preview-meta">
                <span>Posted ${formatDate(opp.createdAt)}</span>
                ${opp.exchangeMode ? `<span>${opp.exchangeMode.charAt(0).toUpperCase() + opp.exchangeMode.slice(1)}</span>` : ''}
            </div>
            <div class="preview-footer">
                <a href="#" data-route="/opportunities/${opp.id}" class="btn btn-primary btn-sm">View & Apply</a>
            </div>
        </div>
    `;
}

let findMiniMapInstance = null;
let findMiniMapVisible = false;

function setupFindMiniMap() {
    const toggleBtn = document.getElementById('find-toggle-mini-map');
    const toggleText = document.getElementById('find-mini-map-toggle-text');
    const container = document.getElementById('find-mini-map-container');
    if (!toggleBtn || !container) return;

    toggleBtn.addEventListener('click', () => {
        findMiniMapVisible = !findMiniMapVisible;
        container.style.display = findMiniMapVisible ? 'block' : 'none';
        toggleText.textContent = findMiniMapVisible ? 'Hide Map' : 'Show Map';

        if (findMiniMapVisible && !findMiniMapInstance && typeof mapService !== 'undefined') {
            findMiniMapInstance = mapService.initSearchMap('find-mini-map', {
                center: mapService.DEFAULT_CENTER,
                zoom: mapService.DEFAULT_ZOOM
            });
            updateFindMiniMapMarkers();
        }
        if (findMiniMapInstance) findMiniMapInstance.invalidateSize();
    });
}

function updateFindMiniMapMarkers() {
    if (!findMiniMapInstance || !findMiniMapVisible) return;
    findMiniMapInstance.clearMarkers();

    const opps = findFilteredOpportunities.filter(o => o.latitude && o.longitude);
    opps.forEach(opp => {
        const popup = typeof mapService !== 'undefined' ? mapService.buildOpportunityPopup(opp) : opp.title;
        findMiniMapInstance.addMarker(opp.id, opp.latitude, opp.longitude, popup);
    });

    if (opps.length > 0) {
        findMiniMapInstance.fitToMarkers();
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}
