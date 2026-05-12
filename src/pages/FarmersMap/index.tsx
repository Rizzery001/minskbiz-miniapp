import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import ErrorState from '../../components/ErrorState'
import { useListings, useUserMe } from '../../api/hooks'
import type { Coordinates } from '../../api/types'
import { applyTheme, init as tgInit } from '../../lib/telegram'
import FilterBar from './FilterBar'
import ListingPopup from './ListingPopup'
import LocationPrompt from './LocationPrompt'
import { getCategoryStyle, normalizeCategory } from './categoryColors'

const MINSK_CENTER: Coordinates = { lat: 53.9, lng: 27.5667 }
const DEFAULT_RADIUS_KM = 10
const GEO_TIMEOUT_MS = 5000

function makeMarkerIcon(color: string): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="9" fill="${color}" stroke="white" stroke-width="3"/></svg>`
  return L.divIcon({
    html: svg,
    className: 'farmer-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -10],
  })
}

function MapCenterUpdater({ center }: { center: Coordinates }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng])
  }, [center.lat, center.lng, map])
  return null
}

type LocationState =
  | { status: 'loading' }
  | { status: 'resolved'; center: Coordinates }
  | { status: 'prompt' }

export default function FarmersMap() {
  const [locationState, setLocationState] = useState<LocationState>({
    status: 'loading',
  })
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  )

  const { data: user, loading: userLoading, error: userError } = useUserMe()

  useEffect(() => {
    tgInit()
    applyTheme()
  }, [])

  // Resolve location: user.location → geolocation → prompt
  useEffect(() => {
    if (userLoading) return
    if (userError?.code === 'unauthorized') return // handled by render branch

    if (user?.location) {
      setLocationState({ status: 'resolved', center: user.location })
      return
    }

    if (!('geolocation' in navigator)) {
      setLocationState({ status: 'prompt' })
      return
    }

    let settled = false
    const timeoutId = window.setTimeout(() => {
      if (settled) return
      settled = true
      setLocationState({ status: 'prompt' })
    }, GEO_TIMEOUT_MS)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return
        settled = true
        window.clearTimeout(timeoutId)
        setLocationState({
          status: 'resolved',
          center: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        })
      },
      () => {
        if (settled) return
        settled = true
        window.clearTimeout(timeoutId)
        setLocationState({ status: 'prompt' })
      },
      { timeout: GEO_TIMEOUT_MS, maximumAge: 60_000 },
    )

    return () => {
      settled = true
      window.clearTimeout(timeoutId)
    }
  }, [user, userLoading, userError])

  const resolvedCenter =
    locationState.status === 'resolved' ? locationState.center : null

  const {
    data: listings,
    loading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useListings(
    resolvedCenter
      ? { lat: resolvedCenter.lat, lng: resolvedCenter.lng, radius_km: radiusKm }
      : null,
  )

  const availableCategories = useMemo<string[]>(() => {
    if (!listings) return []
    const set = new Set<string>()
    for (const l of listings) set.add(normalizeCategory(l.category))
    return Array.from(set).sort()
  }, [listings])

  const visibleListings = useMemo(() => {
    if (!listings) return []
    if (selectedCategories.size === 0) return listings
    return listings.filter((l) =>
      selectedCategories.has(normalizeCategory(l.category)),
    )
  }, [listings, selectedCategories])

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
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--tg-bg)' }}
      >
        <ErrorState
          title="Откройте через Telegram"
          message="Для доступа к карте нужно открыть приложение из Telegram."
        />
      </div>
    )
  }

  const mapCenter = resolvedCenter ?? MINSK_CENTER

  return (
    <div
      className="relative w-full h-full"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={12}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {resolvedCenter && <MapCenterUpdater center={resolvedCenter} />}
        {visibleListings.map((listing) => {
          const style = getCategoryStyle(listing.category)
          return (
            <Marker
              key={listing.id}
              position={[listing.location.lat, listing.location.lng]}
              icon={makeMarkerIcon(style.color)}
            >
              <Popup>
                <ListingPopup listing={listing} />
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {locationState.status === 'resolved' && (
        <FilterBar
          availableCategories={availableCategories}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
        />
      )}

      {locationState.status === 'prompt' && (
        <LocationPrompt
          onUseMinsk={() =>
            setLocationState({ status: 'resolved', center: MINSK_CENTER })
          }
        />
      )}

      {(userLoading || locationState.status === 'loading' || listingsLoading) &&
        !listingsError && (
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
        <div
          className="absolute bottom-4 inset-x-4 z-[1000] rounded-xl shadow-2xl"
          style={{ backgroundColor: 'var(--tg-bg)' }}
        >
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
