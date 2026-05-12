import L from 'leaflet'
import { Component, useEffect, useMemo, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import ErrorState from '../../components/ErrorState'
import { useListings, useUserMe } from '../../api/hooks'
import { applyTheme, init as tgInit } from '../../lib/telegram'
import FilterBar from './FilterBar'
import ListingPopup from './ListingPopup'
import { getCategoryStyle, normalizeCategory } from './categoryColors'

const MINSK_CENTER: [number, number] = [53.9, 27.5667]
const DEFAULT_ZOOM = 11
const DEFAULT_RADIUS_KM = 10

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function makeMarkerIcon(color: string, emoji: string): L.DivIcon {
  const html = `<div style="width:32px;height:32px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;">${escapeHtml(emoji)}</div>`
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
  const [lat, lng] = center
  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    map.setView([lat, lng])
  }, [lat, lng, map])
  return null
}

interface BoundaryProps {
  children: ReactNode
  onReload: () => void
}

interface BoundaryState {
  hasError: boolean
  error: Error | null
}

class MapErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[FarmersMap] MapErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--tg-bg)' }}
        >
          <ErrorState
            title="Не удалось загрузить карту"
            message={this.state.error?.message ?? 'Неизвестная ошибка'}
            onRetry={this.props.onReload}
          />
        </div>
      )
    }
    return this.props.children
  }
}

export default function FarmersMap() {
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  )

  const { data: userMe, loading: userLoading, error: userError } = useUserMe()

  useEffect(() => {
    tgInit()
    applyTheme()
  }, [])

  const userLocation = useMemo(() => {
    const loc = userMe?.location
    if (!loc) return null
    if (!Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return null
    return loc
  }, [userMe])

  const center = useMemo<[number, number]>(
    () => (userLocation ? [userLocation.lat, userLocation.lng] : MINSK_CENTER),
    [userLocation],
  )

  const listingsParams = useMemo(
    () =>
      userLocation
        ? { lat: userLocation.lat, lng: userLocation.lng, radius_km: radiusKm }
        : { radius_km: radiusKm },
    [userLocation, radiusKm],
  )

  const {
    data: listings,
    loading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useListings(listingsParams)

  useEffect(() => {
    console.log('[FarmersMap] userMe:', userMe)
    console.log('[FarmersMap] userLocation:', userLocation)
    console.log('[FarmersMap] center:', center)
    console.log('[FarmersMap] listings count:', listings?.length)
  }, [userMe, userLocation, center, listings])

  const availableCategories = useMemo<string[]>(() => {
    if (!listings) return []
    const set = new Set<string>()
    for (const l of listings) set.add(normalizeCategory(l.category))
    return Array.from(set).sort()
  }, [listings])

  const visibleListings = useMemo(() => {
    if (!listings) return []
    const withCoords = listings.filter(
      (l) => Number.isFinite(l.location_lat) && Number.isFinite(l.location_lng),
    )
    if (selectedCategories.size === 0) return withCoords
    return withCoords.filter((l) =>
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

  return (
    <div
      className="relative w-full h-full"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <MapErrorBoundary onReload={() => window.location.reload()}>
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterUpdater center={center} />
          {visibleListings.map((listing) => {
            const style = getCategoryStyle(listing.category)
            const emoji = listing.emoji ?? style.emoji
            return (
              <Marker
                key={listing.id}
                position={
                  [listing.location_lat, listing.location_lng] as [
                    number,
                    number,
                  ]
                }
                icon={makeMarkerIcon(style.color, emoji)}
              >
                <Popup>
                  <ListingPopup listing={listing} />
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </MapErrorBoundary>

      <FilterBar
        availableCategories={availableCategories}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
      />

      {(userLoading || listingsLoading) && !listingsError && (
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
