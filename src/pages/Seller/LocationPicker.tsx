import L from 'leaflet'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { getColorScheme, hapticFeedback, onThemeChanged } from '../../lib/telegram'

const TILE_URLS: Record<'light' | 'dark', string> = {
  light: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?lang=ru',
  dark: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?lang=ru',
}
const TILE_ATTRIBUTION =
  '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'

function makeIcon(theme: 'light' | 'dark'): L.DivIcon {
  const borderColor = theme === 'dark' ? 'var(--tg-bg)' : '#ffffff'
  const html = `<div style="width:36px;height:36px;border-radius:50%;background:var(--tg-link);border:3px solid ${borderColor};box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;">📍</div>`
  return L.divIcon({
    html,
    className: 'farmer-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

interface ClickHandlerProps {
  onClick: (lat: number, lng: number) => void
}

function ClickHandler({ onClick }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function SizeFixer() {
  const map = useMap()
  useEffect(() => {
    const id = window.requestAnimationFrame(() => map.invalidateSize())
    return () => window.cancelAnimationFrame(id)
  }, [map])
  return null
}

interface Props {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
}

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(getColorScheme)

  useEffect(() => {
    return onThemeChanged(() => setColorScheme(getColorScheme()))
  }, [])

  const handleDragEnd = (e: L.LeafletEvent) => {
    const marker = e.target as L.Marker
    const pos = marker.getLatLng()
    hapticFeedback.light()
    onChange(pos.lat, pos.lng)
  }

  const handleMapClick = (newLat: number, newLng: number) => {
    hapticFeedback.light()
    onChange(newLat, newLng)
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ height: 240, border: '1px solid var(--tg-hairline)' }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        minZoom={6}
        maxZoom={18}
        scrollWheelZoom
        touchZoom
        zoomControl
        className="w-full h-full"
      >
        <TileLayer
          key={colorScheme}
          attribution={TILE_ATTRIBUTION}
          url={TILE_URLS[colorScheme]}
        />
        <SizeFixer />
        <ClickHandler onClick={handleMapClick} />
        <Marker
          position={[lat, lng]}
          draggable
          icon={makeIcon(colorScheme)}
          eventHandlers={{ dragend: handleDragEnd }}
        />
      </MapContainer>
    </div>
  )
}
