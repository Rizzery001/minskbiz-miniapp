import { useEffect, useState } from 'react'

const SCRIPT_ID = 'yandex-maps-script'

let loaderPromise: Promise<YMapsApi> | null = null

export function loadYandexMaps(): Promise<YMapsApi> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window is not available'))
  }
  if (window.ymaps) {
    return Promise.resolve(window.ymaps)
  }
  if (loaderPromise) return loaderPromise

  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY
  if (!apiKey) {
    return Promise.reject(new Error('VITE_YANDEX_MAPS_API_KEY is not configured'))
  }

  loaderPromise = new Promise<YMapsApi>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', onLoad)
      existing.addEventListener('error', onError)
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(
      apiKey,
    )}&lang=ru_RU`
    script.async = true
    script.addEventListener('load', onLoad)
    script.addEventListener('error', onError)
    document.head.appendChild(script)

    function onLoad() {
      const api = window.ymaps
      if (!api) {
        reject(new Error('Yandex Maps API не доступен после загрузки'))
        return
      }
      api.ready(() => resolve(api))
    }

    function onError() {
      loaderPromise = null
      reject(new Error('Не удалось загрузить Yandex Maps'))
    }
  })

  return loaderPromise
}

export interface YandexMapsLoaderState {
  api: YMapsApi | null
  loading: boolean
  error: Error | null
}

export function useYandexMapsLoader(): YandexMapsLoaderState {
  const [api, setApi] = useState<YMapsApi | null>(() =>
    typeof window !== 'undefined' && window.ymaps ? window.ymaps : null,
  )
  const [loading, setLoading] = useState(!api)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (api) return
    let cancelled = false
    setLoading(true)
    setError(null)
    loadYandexMaps()
      .then((res) => {
        if (cancelled) return
        setApi(res)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err : new Error('Unknown error'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api])

  return { api, loading, error }
}
