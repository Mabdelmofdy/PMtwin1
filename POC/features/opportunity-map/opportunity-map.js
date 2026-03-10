/**
 * Opportunity Map - Booking.com-style map view for browsing opportunities
 */

let mapSearchInstance = null;
let allMapOpportunities = [];
let filteredMapOpportunities = [];
let searchCenter = null;

async function initOpportunityMap() {
    await loadMapOpportunities();
    initSearchMapView();
    setupMapFilters();
    renderMapCards();
    placeMapMarkers();

    if (mapSearchInstance && filteredMapOpportunities.length > 0) {
        setTimeout(() => mapSearchInstance.fitToMarkers(), 400);
    }
}

/** Build city id -> { lat, lng } from locations.json for resolving missing coordinates */
async function getCityCoordinatesMap() {
    const base = (window.CONFIG && window.CONFIG.BASE_PATH) || '';
    try {
        const res = await fetch(base + 'data/locations.json');
        const data = await res.json();
        const map = {};
        (data.countries || []).forEach(c => {
            (c.regions || []).forEach(r => {
                (r.cities || []).forEach(city => {
                    if (city.id != null && city.lat != null && city.lng != null) {
                        map[city.id] = { lat: city.lat, lng: city.lng };
                    }
                });
            });
        });
        return map;
    } catch (e) {
        return {};
    }
}

/** Build country:region id -> { lat, lng } from locations.json (regions have lat/lng) */
async function getRegionCoordinatesMap() {
    const base = (window.CONFIG && window.CONFIG.BASE_PATH) || '';
    try {
        const res = await fetch(base + 'data/locations.json');
        const data = await res.json();
        const map = {};
        (data.countries || []).forEach(c => {
            const countryId = (c.id || '').toLowerCase();
            (c.regions || []).forEach(r => {
                if (r.lat != null && r.lng != null) {
                    const regionId = (r.id || '').toLowerCase();
                    map[`${countryId}:${regionId}`] = { lat: r.lat, lng: r.lng };
                }
            });
        });
        return map;
    } catch (e) {
        return {};
    }
}

/** Resolve region id from demo data (e.g. "eastern" -> "eastern-province") */
function normalizeRegionId(regionId) {
    if (!regionId) return regionId;
    const s = (regionId || '').toLowerCase();
    if (s === 'eastern') return 'eastern-province';
    return s;
}

async function loadMapOpportunities() {
    try {
        const raw = await dataService.getOpportunities();
        const publishedOnly = (raw || []).filter(opp => (opp.status || '').toLowerCase() === 'published');
        const cityCoords = await getCityCoordinatesMap();
        const regionCoords = await getRegionCoordinatesMap();
        const withCoords = publishedOnly.map(opp => {
            let lat = opp.latitude;
            let lng = opp.longitude;
            if (lat != null && lng != null) {
                return { ...opp, latitude: lat, longitude: lng };
            }
            if (opp.locationCity && cityCoords[opp.locationCity]) {
                lat = cityCoords[opp.locationCity].lat;
                lng = cityCoords[opp.locationCity].lng;
            }
            if ((lat == null || lng == null) && opp.locationCountry && opp.locationRegion) {
                const countryId = (opp.locationCountry || '').toLowerCase();
                const regionId = normalizeRegionId(opp.locationRegion);
                const key = `${countryId}:${regionId}`;
                if (regionCoords[key]) {
                    lat = regionCoords[key].lat;
                    lng = regionCoords[key].lng;
                }
            }
            return { ...opp, latitude: lat, longitude: lng };
        }).filter(opp => opp.latitude != null && opp.longitude != null);
        allMapOpportunities = withCoords;
        filteredMapOpportunities = [...allMapOpportunities];
    } catch (error) {
        console.error('Error loading opportunities for map:', error);
        allMapOpportunities = [];
        filteredMapOpportunities = [];
    }
}

function initSearchMapView() {
    if (typeof mapService === 'undefined') return;

    mapSearchInstance = mapService.initSearchMap('search-map', {
        center: mapService.DEFAULT_CENTER,
        zoom: mapService.DEFAULT_ZOOM,
        onBoundsChange: (bounds) => {
            applyMapFilters();
        },
        onSearchCenterSet: (lat, lng) => {
            searchCenter = { lat, lng };
            applyMapFilters();
        }
    });

    if (allMapOpportunities.length > 0) {
        setTimeout(() => mapSearchInstance.fitToMarkers(), 300);
    }
}

function setupMapFilters() {
    const intentFilter = document.getElementById('map-filter-intent');
    const modelFilter = document.getElementById('map-filter-model');
    const distanceSlider = document.getElementById('map-filter-distance');
    const distanceLabel = document.getElementById('distance-label');
    const fitAllBtn = document.getElementById('map-fit-all');

    if (intentFilter) intentFilter.addEventListener('change', applyMapFilters);
    if (modelFilter) modelFilter.addEventListener('change', applyMapFilters);

    if (distanceSlider) {
        distanceSlider.addEventListener('input', () => {
            const val = parseInt(distanceSlider.value);
            distanceLabel.textContent = val >= 500 ? 'All distances' : `${val} km`;
            applyMapFilters();
        });
    }

    if (fitAllBtn) {
        fitAllBtn.addEventListener('click', () => {
            if (mapSearchInstance) mapSearchInstance.fitToMarkers();
        });
    }
}

function applyMapFilters() {
    const intentVal = document.getElementById('map-filter-intent')?.value || '';
    const modelVal = document.getElementById('map-filter-model')?.value || '';
    const distanceVal = parseInt(document.getElementById('map-filter-distance')?.value || 500);

    filteredMapOpportunities = allMapOpportunities.filter(opp => {
        if (intentVal && opp.intent !== intentVal) {
            const defaultIntent = opp.intent || 'request';
            if (defaultIntent !== intentVal) return false;
        }
        if (modelVal && opp.modelType !== modelVal) return false;

        if (searchCenter && distanceVal < 500) {
            const dist = mapService.getDistanceKm(
                searchCenter.lat, searchCenter.lng,
                opp.latitude, opp.longitude
            );
            if (dist > distanceVal) return false;
        }

        return true;
    });

    renderMapCards();
    placeMapMarkers();
}

function renderMapCards() {
    const container = document.getElementById('map-card-list');
    const countEl = document.getElementById('map-results-count');
    if (!container) return;

    if (countEl) {
        countEl.textContent = `${filteredMapOpportunities.length} opportunit${filteredMapOpportunities.length === 1 ? 'y' : 'ies'}`;
    }

    if (filteredMapOpportunities.length === 0) {
        container.innerHTML = `
            <div class="map-empty-state">
                <i class="ph-duotone ph-map-trifold"></i>
                <h3>No opportunities in this area</h3>
                <p>Try zooming out or adjusting your filters.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredMapOpportunities.map(opp => {
        const intentLabel = (opp.intent === 'offer') ? 'OFFER' : 'NEED';
        const intentClass = (opp.intent === 'offer')
            ? 'bg-green-100 text-green-800'
            : 'bg-blue-100 text-blue-800';
        const statusBadge = getMapStatusBadge(opp.status);
        const locationText = opp.locationCity
            ? getMapCityName(opp.locationCity)
            : (opp.location || 'Unknown');
        const modelLabel = getMapModelLabel(opp.modelType);

        let distanceText = '';
        if (searchCenter && opp.latitude && opp.longitude) {
            const dist = mapService.getDistanceKm(
                searchCenter.lat, searchCenter.lng,
                opp.latitude, opp.longitude
            );
            distanceText = `<span class="map-opp-card-distance">${dist.toFixed(0)} km away</span>`;
        }

        return `
            <div class="map-opp-card" data-opp-id="${opp.id}"
                 onmouseenter="highlightMapMarker('${opp.id}')"
                 onmouseleave="resetMapHighlight()">
                <div class="map-opp-card-title">${escapeMapHtml(opp.title)}</div>
                <div class="map-opp-card-badges">
                    <span class="badge ${intentClass}" style="font-size:0.7rem;padding:2px 6px;border-radius:4px;font-weight:600;">${intentLabel}</span>
                    <span class="badge bg-gray-100 text-gray-700" style="font-size:0.7rem;padding:2px 6px;border-radius:4px;">${modelLabel}</span>
                    ${statusBadge}
                </div>
                <div class="map-opp-card-location">
                    <i class="ph-duotone ph-map-pin" style="font-size:14px;"></i> ${escapeMapHtml(locationText)}
                </div>
                ${distanceText}
                <div class="map-opp-card-footer">
                    <span style="font-size:0.75rem;color:#6b7280;">${formatMapDate(opp.createdAt)}</span>
                    <a href="#" data-route="/opportunities/${opp.id}" class="btn btn-sm btn-primary"
                       style="font-size:0.75rem;padding:4px 10px;" onclick="event.stopPropagation();">View</a>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.map-opp-card').forEach(card => {
        card.addEventListener('click', () => {
            const oppId = card.dataset.oppId;
            if (mapSearchInstance) {
                const opp = filteredMapOpportunities.find(o => o.id === oppId);
                if (opp) {
                    mapSearchInstance.panTo(opp.latitude, opp.longitude, 14);
                    const marker = mapSearchInstance.getMarker(oppId);
                    if (marker) marker.openPopup();
                }
            }
        });
    });
}

function placeMapMarkers() {
    if (!mapSearchInstance) return;
    mapSearchInstance.clearMarkers();

    filteredMapOpportunities.forEach(opp => {
        const popupHtml = mapService.buildOpportunityPopup(opp);
        const marker = mapSearchInstance.addMarker(opp.id, opp.latitude, opp.longitude, popupHtml);

        marker.on('mouseover', () => {
            const card = document.querySelector(`.map-opp-card[data-opp-id="${opp.id}"]`);
            if (card) {
                card.classList.add('highlighted');
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });

        marker.on('mouseout', () => {
            const card = document.querySelector(`.map-opp-card[data-opp-id="${opp.id}"]`);
            if (card) card.classList.remove('highlighted');
        });
    });
}

function highlightMapMarker(oppId) {
    if (mapSearchInstance) mapSearchInstance.highlightMarker(oppId);
}

function resetMapHighlight() {
    if (mapSearchInstance) mapSearchInstance.resetHighlight();
}

function getMapCityName(cityId) {
    const cityNames = {
        'riyadh-city': 'Riyadh', 'diriyah': 'Diriyah', 'al-kharj': 'Al Kharj',
        'makkah-city': 'Makkah', 'jeddah': 'Jeddah', 'taif': 'Taif',
        'dammam': 'Dammam', 'khobar': 'Al Khobar', 'dhahran': 'Dhahran', 'jubail': 'Jubail',
        'buraydah': 'Buraydah', 'unayzah': 'Unaizah',
        'tabuk-city': 'Tabuk', 'neom': 'NEOM',
        'abha': 'Abha', 'khamis-mushait': 'Khamis Mushait',
        'hail-city': 'Hail', 'arar': 'Arar', 'jazan-city': 'Jazan',
        'najran-city': 'Najran', 'al-bahah-city': 'Al Bahah', 'sakaka': 'Sakaka',
        'dubai': 'Dubai', 'abu-dhabi': 'Abu Dhabi', 'sharjah': 'Sharjah',
        'doha': 'Doha', 'kuwait-city': 'Kuwait City', 'manama': 'Manama', 'muscat': 'Muscat'
    };
    return cityNames[cityId] || cityId;
}

function getMapStatusBadge(status) {
    const map = {
        'published': { label: 'Published', cls: 'bg-green-50 text-green-700' },
        'draft': { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
        'in_execution': { label: 'In Execution', cls: 'bg-yellow-50 text-yellow-700' },
        'contracted': { label: 'Contracted', cls: 'bg-purple-50 text-purple-700' },
        'completed': { label: 'Completed', cls: 'bg-teal-50 text-teal-700' },
        'cancelled': { label: 'Cancelled', cls: 'bg-red-50 text-red-700' }
    };
    const info = map[status] || { label: status || 'Unknown', cls: 'bg-gray-100 text-gray-600' };
    return `<span class="badge ${info.cls}" style="font-size:0.65rem;padding:1px 5px;border-radius:4px;">${info.label}</span>`;
}

function getMapModelLabel(modelType) {
    const labels = {
        'project_based': 'Project-Based',
        'strategic_partnership': 'Strategic Partnership',
        'resource_pooling': 'Resource Pooling',
        'hiring': 'Hiring',
        'competition': 'Competition'
    };
    return labels[modelType] || modelType;
}

function formatMapDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeMapHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
