/**
 * Map Service - Reusable Leaflet map utilities for PMTwin
 * Provides map pickers, geocoding, marker management, and distance calculations.
 */

const mapService = (() => {
    const DEFAULT_CENTER = [24.7136, 46.6753]; // Saudi Arabia (Riyadh)
    const DEFAULT_ZOOM = 6;
    const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

    const instances = {};

    function _createIcon(color = '#2563eb', size = 32) {
        return L.divIcon({
            className: 'pmtwin-marker',
            html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256" fill="${color}"><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z"/></svg>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size],
            popupAnchor: [0, -size]
        });
    }

    function _createHighlightIcon() {
        return _createIcon('#ef4444', 40);
    }

    function _createSearchCenterIcon() {
        return L.divIcon({
            className: 'pmtwin-search-center',
            html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="#f59e0b"><path d="M232,120H208.84A81,81,0,0,0,136,47.16V24a8,8,0,0,0-16,0V47.16A81,81,0,0,0,47.16,120H24a8,8,0,0,0,0,16H47.16A81,81,0,0,0,120,208.84V232a8,8,0,0,0,16,0V208.84A81,81,0,0,0,208.84,136H232a8,8,0,0,0,0-16Zm-104,72a64,64,0,1,1,64-64A64.07,64.07,0,0,1,128,192Z"/></svg>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14]
        });
    }

    /**
     * Initialize a map picker (for create/edit forms).
     * Returns an instance object with control methods.
     */
    function initMapPicker(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container || typeof L === 'undefined') return null;

        const {
            center = DEFAULT_CENTER,
            zoom = DEFAULT_ZOOM,
            draggableMarker = true,
            onClick = null,
            onMarkerMove = null,
            initialMarker = null
        } = options;

        const map = L.map(containerId, { scrollWheelZoom: true }).setView(center, zoom);
        L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

        let marker = null;
        const icon = _createIcon();

        function setMarker(lat, lng, flyTo = true) {
            if (marker) {
                marker.setLatLng([lat, lng]);
            } else {
                marker = L.marker([lat, lng], { icon, draggable: draggableMarker }).addTo(map);
                if (draggableMarker) {
                    marker.on('dragend', () => {
                        const pos = marker.getLatLng();
                        if (onMarkerMove) onMarkerMove(pos.lat, pos.lng);
                    });
                }
            }
            if (flyTo) map.flyTo([lat, lng], Math.max(map.getZoom(), 12));
            if (onMarkerMove) onMarkerMove(lat, lng);
        }

        if (initialMarker) {
            setMarker(initialMarker[0], initialMarker[1], true);
        }

        map.on('click', (e) => {
            setMarker(e.latlng.lat, e.latlng.lng, false);
            if (onClick) onClick(e.latlng.lat, e.latlng.lng);
        });

        const instance = {
            map,
            setMarker,
            getCoordinates() {
                if (!marker) return null;
                const pos = marker.getLatLng();
                return { lat: pos.lat, lng: pos.lng };
            },
            panTo(lat, lng, zoom) {
                map.flyTo([lat, lng], zoom || Math.max(map.getZoom(), 12));
            },
            invalidateSize() {
                setTimeout(() => map.invalidateSize(), 100);
            },
            destroy() {
                map.remove();
                delete instances[containerId];
            }
        };

        instances[containerId] = instance;
        return instance;
    }

    /**
     * Initialize a display-only map (for detail pages).
     */
    function initStaticMap(containerId, lat, lng, zoom = 14) {
        const container = document.getElementById(containerId);
        if (!container || typeof L === 'undefined') return null;

        const map = L.map(containerId, { scrollWheelZoom: false, dragging: true, zoomControl: true }).setView([lat, lng], zoom);
        L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
        L.marker([lat, lng], { icon: _createIcon() }).addTo(map);

        const instance = { map, invalidateSize() { setTimeout(() => map.invalidateSize(), 100); }, destroy() { map.remove(); delete instances[containerId]; } };
        instances[containerId] = instance;
        return instance;
    }

    /**
     * Initialize a multi-marker search map (for map search page / find page).
     */
    function initSearchMap(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container || typeof L === 'undefined') return null;

        const {
            center = DEFAULT_CENTER,
            zoom = DEFAULT_ZOOM,
            onBoundsChange = null,
            onSearchCenterSet = null
        } = options;

        const map = L.map(containerId, { scrollWheelZoom: true }).setView(center, zoom);
        L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

        const markers = {};
        let searchCenterMarker = null;
        const defaultIcon = _createIcon();
        const highlightIcon = _createHighlightIcon();
        const searchCenterIcon = _createSearchCenterIcon();

        function addMarker(id, lat, lng, popupHtml) {
            if (markers[id]) {
                markers[id].setLatLng([lat, lng]);
                if (popupHtml) markers[id].bindPopup(popupHtml, { maxWidth: 300 });
                return markers[id];
            }
            const m = L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
            if (popupHtml) m.bindPopup(popupHtml, { maxWidth: 300 });
            markers[id] = m;
            return m;
        }

        function removeMarker(id) {
            if (markers[id]) {
                map.removeLayer(markers[id]);
                delete markers[id];
            }
        }

        function clearMarkers() {
            Object.keys(markers).forEach(id => {
                map.removeLayer(markers[id]);
                delete markers[id];
            });
        }

        function highlightMarker(id) {
            Object.entries(markers).forEach(([key, m]) => {
                m.setIcon(key === id ? highlightIcon : defaultIcon);
                if (key === id) m.setZIndexOffset(1000);
                else m.setZIndexOffset(0);
            });
        }

        function resetHighlight() {
            Object.values(markers).forEach(m => {
                m.setIcon(defaultIcon);
                m.setZIndexOffset(0);
            });
        }

        function fitToMarkers() {
            const markerList = Object.values(markers);
            if (markerList.length === 0) return;
            const group = L.featureGroup(markerList);
            map.fitBounds(group.getBounds().pad(0.1));
        }

        function setSearchCenter(lat, lng) {
            if (searchCenterMarker) {
                searchCenterMarker.setLatLng([lat, lng]);
            } else {
                searchCenterMarker = L.marker([lat, lng], { icon: searchCenterIcon, draggable: true }).addTo(map);
                searchCenterMarker.bindPopup('Search center - drag to move').openPopup();
                searchCenterMarker.on('dragend', () => {
                    const pos = searchCenterMarker.getLatLng();
                    if (onSearchCenterSet) onSearchCenterSet(pos.lat, pos.lng);
                });
            }
            if (onSearchCenterSet) onSearchCenterSet(lat, lng);
        }

        function clearSearchCenter() {
            if (searchCenterMarker) {
                map.removeLayer(searchCenterMarker);
                searchCenterMarker = null;
            }
        }

        if (onBoundsChange) {
            map.on('moveend', () => {
                const bounds = map.getBounds();
                onBoundsChange(bounds);
            });
        }

        map.on('contextmenu', (e) => {
            setSearchCenter(e.latlng.lat, e.latlng.lng);
        });

        const instance = {
            map,
            addMarker,
            removeMarker,
            clearMarkers,
            highlightMarker,
            resetHighlight,
            fitToMarkers,
            setSearchCenter,
            clearSearchCenter,
            getMarker(id) { return markers[id]; },
            getBounds() { return map.getBounds(); },
            panTo(lat, lng, zoom) { map.flyTo([lat, lng], zoom || 12); },
            invalidateSize() { setTimeout(() => map.invalidateSize(), 100); },
            destroy() { map.remove(); delete instances[containerId]; }
        };

        instances[containerId] = instance;
        return instance;
    }

    /**
     * Forward geocode: address string -> { lat, lng, displayName }
     */
    async function geocodeAddress(address) {
        try {
            const params = new URLSearchParams({
                q: address,
                format: 'json',
                limit: '1',
                addressdetails: '1'
            });
            const response = await fetch(`${NOMINATIM_URL}/search?${params}`, {
                headers: {
                    'Accept-Language': 'en',
                    'User-Agent': 'PMTwin-POC/1.0'
                }
            });
            const results = await response.json();
            if (results.length === 0) return null;
            const hit = results[0];
            return {
                lat: parseFloat(hit.lat),
                lng: parseFloat(hit.lon),
                displayName: hit.display_name,
                address: hit.address || {}
            };
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    /**
     * Reverse geocode: coordinates -> display line + structured address (for form auto-fill).
     */
    async function reverseGeocode(lat, lng) {
        try {
            const params = new URLSearchParams({
                lat: lat.toString(),
                lon: lng.toString(),
                format: 'json',
                addressdetails: '1'
            });
            const response = await fetch(`${NOMINATIM_URL}/reverse?${params}`, {
                headers: {
                    'Accept-Language': 'en',
                    'User-Agent': 'PMTwin-POC/1.0'
                }
            });
            const result = await response.json();
            if (result.error) return null;
            return {
                displayName: result.display_name || '',
                address: result.address || {},
                lat,
                lng
            };
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    }

    /**
     * Calculate distance (km) between two coordinates using Haversine formula.
     */
    function getDistanceKm(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Build popup HTML for an opportunity marker.
     */
    function buildOpportunityPopup(opp) {
        const intentClass = opp.intent === 'offer' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
        const intentLabel = opp.intent === 'offer' ? 'OFFER' : 'NEED';
        const locationText = opp.locationCity || opp.location || 'Unknown';
        const statusColors = {
            published: '#16a34a', in_execution: '#ca8a04', contracted: '#9333ea',
            completed: '#0369a1', draft: '#6b7280', cancelled: '#dc2626'
        };
        const statusLabel = (opp.status || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const statusColor = statusColors[opp.status] || '#6b7280';
        return `
            <div style="min-width:200px;font-family:system-ui,sans-serif;">
                <div style="font-weight:600;font-size:14px;margin-bottom:6px;line-height:1.3;">${_escapeHtml(opp.title)}</div>
                <div style="margin-bottom:6px;display:flex;gap:4px;flex-wrap:wrap;">
                    <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;" class="${intentClass}">${intentLabel}</span>
                    <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:500;color:${statusColor};border:1px solid ${statusColor};">${statusLabel}</span>
                </div>
                <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">
                    <i class="ph-duotone ph-map-pin" style="font-size:14px;"></i> ${_escapeHtml(locationText)}
                </div>
                <a href="#" data-route="/opportunities/${opp.id}" 
                   style="display:inline-block;padding:4px 12px;background:#2563eb;color:white;border-radius:4px;font-size:12px;text-decoration:none;font-weight:500;"
                   onclick="event.preventDefault();if(typeof router!=='undefined')router.navigate('/opportunities/${opp.id}');">
                    View Details
                </a>
            </div>
        `;
    }

    function _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function getInstance(containerId) {
        return instances[containerId] || null;
    }

    return {
        initMapPicker,
        initStaticMap,
        initSearchMap,
        geocodeAddress,
        reverseGeocode,
        getDistanceKm,
        buildOpportunityPopup,
        getInstance,
        DEFAULT_CENTER,
        DEFAULT_ZOOM
    };
})();

if (typeof window !== 'undefined') {
    window.mapService = mapService;
}
