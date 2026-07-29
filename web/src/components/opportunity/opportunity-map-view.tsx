import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { Opportunity } from '@/types/domain.ts'
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  type GeoCoordinate,
} from '@/services/geospatial/location-coordinates.ts'
import { formatLocation } from '@/domain/locations'
import 'leaflet/dist/leaflet.css'

export type OpportunityMapPoint = {
  readonly opportunity: Opportunity
  readonly coordinates: GeoCoordinate
}

type OpportunityMapViewProps = {
  readonly points: readonly OpportunityMapPoint[]
  readonly selectedId?: string | null
  readonly onSelect?: (opportunityId: string) => void
  readonly className?: string
}

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
const SELECTED_ZOOM = 12

function createMarkerIcon(color: string, size = 32): L.DivIcon {
  return L.divIcon({
    className: 'pmtwin-marker',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256" fill="${color}"><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z"/></svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

function buildPopupContent(opportunity: Opportunity): string {
  const intentLabel =
    opportunity.intent === 'offer' ? 'Offer' : opportunity.intent === 'need' ? 'Need' : 'Opportunity'
  const location =
    formatLocation(opportunity.location) ||
    opportunity.city ||
    'Location unavailable'
  const href = `/opportunities/${opportunity.id}`

  return `
    <div style="min-width:200px;font-family:system-ui,sans-serif;">
      <div style="font-weight:600;font-size:14px;margin-bottom:6px;line-height:1.3;">${escapeHtml(opportunity.title)}</div>
      <div style="margin-bottom:6px;">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:#dbeafe;color:#1d4ed8;">${intentLabel}</span>
      </div>
      <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">${escapeHtml(location)}</div>
      <a href="${href}" style="display:inline-block;padding:4px 12px;background:#2563eb;color:white;border-radius:4px;font-size:12px;text-decoration:none;font-weight:500;">View details</a>
    </div>
  `
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function OpportunityMapView({
  points,
  selectedId,
  onSelect,
  className,
}: OpportunityMapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const onSelectRef = useRef(onSelect)
  const hasFitBoundsRef = useRef(false)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(
      [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
      DEFAULT_MAP_ZOOM,
    )
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map)
    mapRef.current = map

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 150)

    return () => {
      window.clearTimeout(resizeTimer)
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
      hasFitBoundsRef.current = false
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const defaultIcon = createMarkerIcon('#2563eb')
    const highlightIcon = createMarkerIcon('#ef4444', 40)
    const nextIds = new Set(points.map((point) => point.opportunity.id))

    for (const [id, marker] of markersRef.current.entries()) {
      if (!nextIds.has(id)) {
        map.removeLayer(marker)
        markersRef.current.delete(id)
      }
    }

    for (const point of points) {
      const { opportunity, coordinates } = point
      const isSelected = opportunity.id === selectedId
      const icon = isSelected ? highlightIcon : defaultIcon
      const existing = markersRef.current.get(opportunity.id)

      if (existing) {
        existing.setLatLng([coordinates.lat, coordinates.lng])
        existing.setIcon(icon)
        existing.setZIndexOffset(isSelected ? 1000 : 0)
        existing.setPopupContent(buildPopupContent(opportunity))
      } else {
        const marker = L.marker([coordinates.lat, coordinates.lng], { icon })
          .bindPopup(buildPopupContent(opportunity), { maxWidth: 320 })
          .addTo(map)
        marker.on('click', () => onSelectRef.current?.(opportunity.id))
        markersRef.current.set(opportunity.id, marker)
      }
    }

    if (points.length === 0) {
      map.setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng], DEFAULT_MAP_ZOOM)
      hasFitBoundsRef.current = false
    }
  }, [points, selectedId])

  useEffect(() => {
    const map = mapRef.current
    if (!map || points.length === 0) return

    if (selectedId) {
      const selected = points.find((point) => point.opportunity.id === selectedId)
      if (selected) {
        map.flyTo(
          [selected.coordinates.lat, selected.coordinates.lng],
          Math.max(map.getZoom(), SELECTED_ZOOM),
          { duration: 0.75 },
        )
        window.setTimeout(() => {
          markersRef.current.get(selectedId)?.openPopup()
        }, 300)
        return
      }
    }

    if (!hasFitBoundsRef.current) {
      const group = L.featureGroup([...markersRef.current.values()])
      map.fitBounds(group.getBounds().pad(0.12))
      hasFitBoundsRef.current = true
    }
  }, [points, selectedId])

  return (
    <div
      ref={containerRef}
      className={className}
      aria-label="Opportunity map"
      role="region"
    />
  )
}
