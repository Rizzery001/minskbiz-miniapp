import L from 'leaflet'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import ErrorState from '../../components/ErrorState'
import { useListings, useUserMe } from '../../api/hooks'
import { applyTheme, init as tgInit } from '../../lib/telegram'
import FilterBar from './FilterBar'
import ListingPopup from './ListingPopup'
import { getCategoryStyle, normalizeCategory } from './categoryColors'

const MINSK_CENTER: [number, number] = [53.9, 27.5667]
const DEFAULT_RADIUS_KM = 10

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

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  const prevRef = useRef<[number, number] | null>(null)
  useEffect(() => {
    if (!isValidLatLng(center[0], center[1])) return
    const prev = prevRef.current
    if (prev && prev[0] === center[0] && prev[1] === center[1]) return
    prevRef.current = center
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export default function FarmersMap() {
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())

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

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : MINSK_CENTER

  const queryLat = userLocation ? userLocation.lat : MINSK_CENTER[0]
  const queryLng = userLocation ? userLocation.lng : MINSK_CENTER[1]

  const {
    data: listings,
    loading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useListings({
    lat: queryLat,
    lng: queryLng,
    radius_km: radiusKm,
  })

  useEffect(() => {
    console.log('[FarmersMap] user:', user)
    console.log('[FarmersMap] userLocation:', userLocation)
    console.log('[FarmersMap] center:', center)
    console.log('[FarmersMap] radiusKm:', radiusKm)
    console.log('[FarmersMap] listings count:', listings?.length)
  }, [user, userLocation, listings, radiusKm])

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
        center={center}
        zoom={10}
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
        <MapCenterUpdater center={center} />
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

      <FilterBar
        availableCategories={availableCategories}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
      />

      {listingsLoading && !listingsError && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[900] px-4 py-2 rounded-full text-sm shadow-md"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 80px)',
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
