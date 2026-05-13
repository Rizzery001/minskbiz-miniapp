import L from 'leaflet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import ErrorState from '../../components/ErrorState'
import { useListings, useUserMe } from '../../api/hooks'
import {
  getColorScheme,
  hapticFeedback,
  onThemeChanged,
} from '../../lib/telegram'
import FarmerSheet from './FarmerSheet'
import LocateMeButton from './LocateMeButton'
import SearchInput from './SearchInput'
import { getCategoryStyle, normalizeCategory } from './categoryColors'

const MINSK_CENTER: [number, number] = [53.9, 27.5667]
const INITIAL_ZOOM = 10
const RECENTER_ZOOM = 11
const LOCATE_ZOOM = 14
const MIN_RADIUS_KM = 1
const MAX_RADIUS_KM = 200
const DEBOUNCE_MS = 400

const TILE_URLS: Record<'light' | 'dark', string> = {
  light: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?lang=ru',
  dark: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?lang=ru',
}
const TILE_ATTRIBUTION =
  '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'

function isValidLatLng(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' && Number.isFinite(lat) &&
    typeof lng === 'number' && Number.isFinite(lng)
  )
}

function makeMarkerIcon(
  color: string,
  emoji: string,
  active: boolean,
  theme: 'light' | 'dark',
): L.DivIcon {
  const safe = emoji.replace(/[<>&"']/g, '')
  const size = active ? 44 : 36
  const fontSize = active ? 22 : 18
  const borderColor = theme === 'dark' ? 'var(--tg-bg)' : '#ffffff'
  const outline = active
    ? 'box-shadow:0 0 0 3px var(--tg-link), 0 2px 6px rgba(0,0,0,0.25);'
    : 'box-shadow:0 2px 4px rgba(0,0,0,0.15);'
  const html = `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid ${borderColor};${outline}display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;line-height:1;">${safe}</div>`
  return L.divIcon({
    html,
    className: 'farmer-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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
    const halfDiag = c.distanceTo(ne) / 1000
    const radius = Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, Math.round(halfDiag)))
    if (isValidLatLng(c.lat, c.lng)) {
      onChange({ lat: c.lat, lng: c.lng, radius_km: radius })
    }
  }

  useEffect(() => {
    compute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMapEvents({
    moveend: compute,
    zoomend: compute,
  })

  return null
}

interface MapInstanceCaptureProps {
  onReady: (map: L.Map) => void
}

function MapInstanceCapture({ onReady }: MapInstanceCaptureProps) {
  const map = useMap()
  useEffect(() => {
    onReady(map)
  }, [map, onReady])
  return null
}

interface MapSizeFixerProps {
  initialCenter: [number, number]
  recenterZoom: number
}

function MapSizeFixer({ initialCenter, recenterZoom }: MapSizeFixerProps) {
  const map = useMap()
  const initRef = useRef({ center: initialCenter, zoom: recenterZoom })
  initRef.current = { center: initialCenter, zoom: recenterZoom }
  const didInitRef = useRef(false)

  useEffect(() => {
    const container = map.getContainer()
    const handleResize = () => map.invalidateSize()
    const handleDblClick = (e: L.LeafletMouseEvent) => {
      map.flyTo(e.latlng, map.getZoom() + 1.5, { duration: 0.3 })
    }

    const rafId = window.requestAnimationFrame(() => {
      map.invalidateSize()
      if (!didInitRef.current) {
        didInitRef.current = true
        const { center, zoom } = initRef.current
        map.flyTo(center, zoom)
      }
    })

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(handleResize)
      observer.observe(container)
    }
    window.addEventListener('resize', handleResize)

    map.doubleClickZoom.disable()
    map.on('dblclick', handleDblClick)

    return () => {
      window.cancelAnimationFrame(rafId)
      observer?.disconnect()
      window.removeEventListener('resize', handleResize)
      map.off('dblclick', handleDblClick)
      map.doubleClickZoom.enable()
    }
  }, [map])

  return null
}

const FOCUS_ZOOM = 14

export default function FarmersMap() {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [view, setView] = useState<ViewState | null>(null)
  const [debouncedView, setDebouncedView] = useState<ViewState | null>(null)
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null)
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(getColorScheme)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [focusedOfferId, setFocusedOfferId] = useState<string | null>(null)
  const focusHandledRef = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const targetOfferId = params.get('offer')
    if (targetOfferId) {
      setFocusedOfferId(targetOfferId)
    }
  }, [])

  const { data: user } = useUserMe()

  useEffect(() => {
    return onThemeChanged(() => setColorScheme(getColorScheme()))
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

  useEffect(() => {
    if (!view) return
    const t = window.setTimeout(() => setDebouncedView(view), DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [view])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(searchQuery), 200)
    return () => window.clearTimeout(t)
  }, [searchQuery])

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

  const visibleListings = useMemo(() => {
    if (!listings) return []
    const q = debouncedQuery.trim().toLowerCase()
    return listings.filter((l) => {
      if (!isValidLatLng(l.location_lat, l.location_lng)) return false
      if (
        selectedCategories.size > 0 &&
        !selectedCategories.has(normalizeCategory(l.category))
      ) {
        return false
      }
      if (q) {
        const hit =
          l.title.toLowerCase().includes(q) ||
          l.seller_name.toLowerCase().includes(q)
        if (!hit) return false
      }
      return true
    })
  }, [listings, selectedCategories, debouncedQuery])

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

  const handleLocate = useCallback(
    (coords: [number, number]) => {
      if (!mapInstance) return
      mapInstance.flyTo(coords, LOCATE_ZOOM)
    },
    [mapInstance],
  )

  const closeSheet = useCallback(() => setSelectedSellerId(null), [])

  useEffect(() => {
    if (focusHandledRef.current) return
    if (!focusedOfferId) return
    if (!listings || listings.length === 0) return
    const target = listings.find((l) => l.id === focusedOfferId)
    if (!target) return
    focusHandledRef.current = true
    if (mapInstance && isValidLatLng(target.location_lat, target.location_lng)) {
      mapInstance.flyTo([target.location_lat, target.location_lng], FOCUS_ZOOM)
    }
    setSelectedSellerId(target.seller_id)
    const url = new URL(window.location.href)
    url.searchParams.delete('offer')
    window.history.replaceState({}, '', url.toString())
  }, [focusedOfferId, listings, mapInstance])

  const clearFocusedOffer = useCallback(() => setFocusedOfferId(null), [])

  return (
    <div className="relative w-full h-full" style={{ minHeight: 0 }}>
      <MapContainer
        center={initialCenter}
        zoom={INITIAL_ZOOM}
        minZoom={6}
        maxZoom={18}
        zoomSnap={0}
        wheelPxPerZoomLevel={60}
        zoomAnimationThreshold={4}
        fadeAnimation={true}
        markerZoomAnimation={true}
        scrollWheelZoom
        touchZoom
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          key={colorScheme}
          attribution={TILE_ATTRIBUTION}
          url={TILE_URLS[colorScheme]}
        />
        <ViewportTracker onChange={setView} />
        <MapInstanceCapture onReady={setMapInstance} />
        <MapSizeFixer initialCenter={initialCenter} recenterZoom={RECENTER_ZOOM} />
        {visibleListings.map((listing) => {
          const style = getCategoryStyle(listing.category)
          const emoji = listing.emoji ?? style.emoji
          const isActive = listing.seller_id === selectedSellerId
          return (
            <Marker
              key={listing.id}
              position={[listing.location_lat, listing.location_lng]}
              icon={makeMarkerIcon(style.color, emoji, isActive, colorScheme)}
              zIndexOffset={isActive ? 1000 : 0}
              eventHandlers={{
                click: () => {
                  hapticFeedback.light()
                  setSelectedSellerId(listing.seller_id)
                },
              }}
            />
          )
        })}
      </MapContainer>

      {/* Floating status panel */}
      <div
        className="tg-shadow-md absolute z-[1000] left-3 right-3 rounded-xl"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          backgroundColor: 'var(--tg-bg)',
          padding: 12,
        }}
      >
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Найти товар..."
        />
        <div className="mt-2 flex items-center justify-between gap-2 px-1">
          <h2
            className="font-medium"
            style={{ fontSize: 15, color: 'var(--tg-text)' }}
          >
            Фермеры рядом
          </h2>
          <span
            className="inline-flex items-center justify-center tabular-nums"
            style={{
              minWidth: 20,
              height: 20,
              padding: '0 6px',
              borderRadius: 10,
              backgroundColor: 'var(--tg-link)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            {visibleListings.length}
          </span>
        </div>
        {availableCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto -mx-3 px-3 mt-2 scrollbar-hide">
            {availableCategories.map((cat) => {
              const style = getCategoryStyle(cat)
              const active = selectedCategories.has(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className="flex items-center gap-1.5 rounded-full whitespace-nowrap active:opacity-70 active:scale-[0.97] transition"
                  style={{
                    padding: '6px 12px',
                    backgroundColor: active ? 'var(--tg-link)' : 'var(--tg-secondary-bg)',
                    color: active ? '#ffffff' : 'var(--tg-text)',
                    fontSize: 13,
                    transitionDuration: '150ms',
                  }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1 }} aria-hidden="true">
                    {style.emoji}
                  </span>
                  <span>{style.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {debouncedQuery.trim() !== '' &&
        visibleListings.length === 0 &&
        !listingsLoading &&
        !listingsError && (
          <div
            className="tg-shadow-sm absolute left-1/2 -translate-x-1/2 z-[900] px-4 py-2 rounded-full text-center"
            style={{
              top: 'calc(env(safe-area-inset-top, 0px) + 200px)',
              maxWidth: 'calc(100% - 24px)',
              backgroundColor: 'var(--tg-bg)',
              color: 'var(--tg-text)',
              fontSize: 13,
              border: '1px solid var(--tg-hairline)',
            }}
          >
            Ничего не найдено по запросу «{debouncedQuery.trim()}»
          </div>
        )}

      <LocateMeButton onLocate={handleLocate} />

      {listingsLoading && !listingsError && (
        <div
          className="tg-shadow-sm absolute left-1/2 -translate-x-1/2 z-[900] px-4 py-2 rounded-full"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 120px)',
            backgroundColor: 'var(--tg-bg)',
            color: 'var(--tg-text)',
            fontSize: 13,
            border: '1px solid var(--tg-hairline)',
          }}
        >
          Загрузка…
        </div>
      )}

      {listingsError && listingsError.code !== 'unauthorized' && (
        <div
          className="tg-shadow-lg absolute bottom-4 inset-x-4 z-[1000] rounded-xl"
          style={{ backgroundColor: 'var(--tg-bg)' }}
        >
          <ErrorState
            title="Не удалось загрузить"
            message={listingsError.message}
            onRetry={refetchListings}
          />
        </div>
      )}

      {selectedSellerId !== null && (
        <FarmerSheet
          sellerId={selectedSellerId}
          listings={listings ?? []}
          onClose={closeSheet}
          focusedOfferId={focusedOfferId}
          onFocusHandled={clearFocusedOffer}
        />
      )}
    </div>
  )
}
