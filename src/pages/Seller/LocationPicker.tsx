import { useEffect, useRef } from 'react'
import { hapticFeedback } from '../../lib/telegram'
import { useYandexMapsLoader } from '../../lib/yandexMaps'

interface Props {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
}

const MAP_HEIGHT = 320

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const { api, loading, error } = useYandexMapsLoader()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<YMapsMap | null>(null)
  const placemarkRef = useRef<YMapsPlacemark | null>(null)
  // Keep the latest onChange in a ref so we don't have to re-bind the
  // dragend listener (which would also remount the map).
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Create the map exactly once, after the API is loaded.
  useEffect(() => {
    if (!api) return
    const container = containerRef.current
    if (!container) return

    const map = new api.Map(
      container,
      { center: [lat, lng], zoom: 14, controls: ['zoomControl'] },
      { suppressMapOpenBlock: true },
    )
    const placemark = new api.Placemark(
      [lat, lng],
      {},
      { draggable: true, preset: 'islands#redDotIcon' },
    )

    const handleDragEnd = (e: YMapsEvent) => {
      const target = e.get('target')
      const coords = target.geometry.getCoordinates()
      const newLat = coords[0]
      const newLng = coords[1]
      hapticFeedback.light()
      onChangeRef.current(newLat, newLng)
    }

    const handleMapClick = (e: YMapsEvent) => {
      const coords = e.get('coords')
      if (!Array.isArray(coords) || coords.length < 2) return
      const newLat = coords[0]
      const newLng = coords[1]
      placemark.geometry.setCoordinates([newLat, newLng])
      hapticFeedback.light()
      onChangeRef.current(newLat, newLng)
    }

    placemark.events.add('dragend', handleDragEnd)
    map.events.add('click', handleMapClick)
    map.geoObjects.add(placemark)

    mapRef.current = map
    placemarkRef.current = placemark

    return () => {
      placemark.events.remove('dragend', handleDragEnd)
      map.events.remove('click', handleMapClick)
      map.destroy()
      mapRef.current = null
      placemarkRef.current = null
    }
    // We intentionally exclude lat/lng — they are syncing via the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api])

  // Keep map/placemark in sync if the parent updates coords (e.g. after
  // a geocoder pick). We avoid feedback loops by comparing values.
  useEffect(() => {
    const placemark = placemarkRef.current
    const map = mapRef.current
    if (!placemark || !map) return
    const current = placemark.geometry as { getCoordinates?: () => [number, number] }
    const cur = current.getCoordinates?.()
    if (cur && cur[0] === lat && cur[1] === lng) return
    placemark.geometry.setCoordinates([lat, lng])
    map.setCenter([lat, lng])
  }, [lat, lng])

  if (error) {
    return (
      <div
        className="rounded-xl flex items-center justify-center p-4 text-center"
        style={{
          height: MAP_HEIGHT,
          backgroundColor: 'var(--tg-secondary-bg)',
          border: '1px solid var(--tg-hairline)',
          color: 'var(--tg-hint)',
          fontSize: 13,
        }}
      >
        Не удалось загрузить карту, проверьте подключение.
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden relative"
      style={{
        height: MAP_HEIGHT,
        border: '1px solid var(--tg-hairline)',
        backgroundColor: 'var(--tg-secondary-bg)',
      }}
    >
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: 'var(--tg-hint)', fontSize: 13 }}
        >
          Загружаем карту…
        </div>
      )}
    </div>
  )
}
