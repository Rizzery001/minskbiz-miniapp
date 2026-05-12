import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import ErrorState from '../../components/ErrorState'
import { useListings, useUserMe } from '../../api/hooks'
import { applyTheme, init as tgInit } from '../../lib/telegram'
import ListingPopup from './ListingPopup'
import { getCategoryStyle, normalizeCategory } from './categoryColors'

const MINSK_CENTER: [number, number] = [53.9, 27.5667]
const INITIAL_ZOOM = 10
const MIN_RADIUS_KM = 1
const MAX_RADIUS_KM = 200
const DEBOUNCE_MS = 400

function isValidLatLng(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' && Number.isFinite(lat) &&
    typeof lng === 'number' && Number.isFinite(lng)
  )
}

function makeMarkerIcon(color: string, emoji: string): L.DivIcon {
  const safe = emoji.replace(/[<>&"']/g, '')
  const html = `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;">${safe}</div>`
  return L.divIcon({
    html,
    className: 'farmer-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  })
}

interface ViewState {
  lat: number
  lng: number
  radius_km: number
}

interface ViewportTrackerProps {
  onChange: (v: ViewState) => void
}

function ViewportTracker({ onChange }: ViewportTrackerProps) {
  const map = useMap()

  const compute = () => {
    const c = map.getCenter()
    const bounds = map.getBounds()
    const ne = bounds.getNorthEast()
    // distance from center to NE corner = half-diagonal in meters
    const halfDiag = c.distanceTo(ne) / 1000
    const radius = Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, Math.round(halfDiag)))
    if (isValidLatLng(c.lat, c.lng)) {
      onChange({ lat: c.lat, lng: c.lng, radius_km: radius })
    }
  }

  useEffect(() => {
    // initial fire
    compute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMapEvents({
    moveend: compute,
    zoomend: compute,
  })

  return null
}

export default function FarmersMap() {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [view, setView] = useState<ViewState | null>(null)
  const [debouncedView, setDebouncedView] = useState<ViewState | null>(null)

  const { data: user, error: userError } = useUserMe()

  useEffect(() => {
    tgInit()
    applyTheme()
  }, [])

  const userLocation = useMemo(() => {
    const loc = user?.location
    if (!loc) return null
    if (!isValidLatLng(loc.lat, loc.lng)) return null
    return { lat: loc.lat, lng: loc.lng }
  }, [user])

  const initialCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : MINSK_CENTER

  // Debounce view → debouncedView
  useEffect(() => {
    if (!view) return
    const t = window.setTimeout(() => setDebouncedView(view), DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [view])

  const {
    data: listings,
    loading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useListings(
    debouncedView
      ? { lat: debouncedView.lat, lng: debouncedView.lng, radius_km: debouncedView.radius_km }
      : null,
  )

  useEffect(() => {
    console.log('[FarmersMap] view:', view)
    console.log('[FarmersMap] debouncedView:', debouncedView)
    console.log('[FarmersMap] listings count:', listings?.length)
  }, [view, debouncedView, listings])

  const visibleListings = useMemo(() => {
    if (!listings) return []
    return listings.filter((l) => {
      if (!isValidLatLng(l.location_lat, l.location_lng)) return false
      if (selectedCategories.size === 0) return true
      return selectedCategories.has(normalizeCategory(l.category))
    })
  }, [listings, selectedCategories])

  const availableCategories = useMemo<string[]>(() => {
    if (!listings) return []
    const set = new Set<string>()
    for (const l of listings) set.add(normalizeCategory(l.category))
    return Array.from(set).sort()
  }, [listings])

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  if (userError?.code === 'unauthorized') {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--tg-bg)' }}>
        <ErrorState
          title="Откройте через Telegram"
          message="Для доступа к карте нужно открыть приложение из Telegram."
        />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <MapContainer
        center={initialCenter}
        zoom={INITIAL_ZOOM}
        minZoom={6}
        maxZoom={18}
        scrollWheelZoom
        doubleClickZoom
        touchZoom
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ViewportTracker onChange={setView} />
        {visibleListings.map((listing) => {
          const style = getCategoryStyle(listing.category)
          const emoji = listing.emoji ?? style.emoji
          return (
            <Marker
              key={listing.id}
              position={[listing.location_lat, listing.location_lng]}
              icon={makeMarkerIcon(style.color, emoji)}
            >
              <Popup>
                <ListingPopup listing={listing} />
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Top status bar */}
      <div
        className="absolute top-0 inset-x-0 z-[1000] px-3"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
          background: 'linear-gradient(to bottom, var(--tg-bg) 0%, var(--tg-bg) 70%, transparent 100%)',
          paddingBottom: 16,
        }}
      >
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs" style={{ color: 'var(--tg-hint)' }}>
            {debouncedView ? `${debouncedView.radius_km} км` : '...'}
          </span>
          <span className="text-xs" style={{ color: 'var(--tg-hint)' }}>
            {visibleListings.length} предложений
          </span>
        </div>
        {availableCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto -mx-3 px-3 scrollbar-hide">
            {availableCategories.map((cat) => {
              const style = getCategoryStyle(cat)
              const active = selectedCategories.has(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition"
                  style={{
                    backgroundColor: active ? style.color : 'var(--tg-secondary-bg)',
                    color: active ? '#fff' : 'var(--tg-text)',
                    border: active ? 'none' : '1px solid transparent',
                  }}
                >
                  <span>{style.emoji}</span>
                  <span>{style.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {listingsLoading && !listingsError && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[900] px-4 py-2 rounded-full text-sm shadow-md"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 100px)',
            backgroundColor: 'var(--tg-bg)',
            color: 'var(--tg-text)',
          }}
        >
          Загрузка…
        </div>
      )}

      {listingsError && listingsError.code !== 'unauthorized' && (
        <div className="absolute bottom-4 inset-x-4 z-[1000] rounded-xl shadow-2xl" style={{ backgroundColor: 'var(--tg-bg)' }}>
          <ErrorState
            title="Не удалось загрузить"
            message={listingsError.message}
            onRetry={refetchListings}
          />
        </div>
      )}
    </div>
  )
}
