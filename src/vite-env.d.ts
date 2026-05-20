/// <reference types="vite/client" />

interface TelegramHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
  notificationOccurred(type: 'error' | 'success' | 'warning'): void
  selectionChanged(): void
}

interface TelegramMainButton {
  show(): void
  hide(): void
  setText(text: string): void
  onClick(handler: () => void): void
  offClick(handler: () => void): void
  showProgress?: (leaveActive?: boolean) => void
  hideProgress?: () => void
}

interface TelegramBackButton {
  show(): void
  hide(): void
  onClick(handler: () => void): void
  offClick(handler: () => void): void
}

interface TelegramThemeParams {
  bg_color?: string
  text_color?: string
  hint_color?: string
  link_color?: string
  button_color?: string
  button_text_color?: string
  secondary_bg_color?: string
  section_bg_color?: string
  header_bg_color?: string
  accent_text_color?: string
  destructive_text_color?: string
  subtitle_text_color?: string
  bottom_bar_bg_color?: string
  section_header_text_color?: string
  section_separator_color?: string
}

type TelegramEvent =
  | 'themeChanged'
  | 'viewportChanged'
  | 'mainButtonClicked'
  | 'backButtonClicked'

interface TelegramWebApp {
  initData: string
  themeParams: TelegramThemeParams
  colorScheme: 'light' | 'dark'
  ready(): void
  expand(): void
  close(): void
  sendData(data: string): void
  onEvent(event: TelegramEvent, handler: () => void): void
  offEvent(event: TelegramEvent, handler: () => void): void
  MainButton: TelegramMainButton
  BackButton: TelegramBackButton
  HapticFeedback: TelegramHapticFeedback
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp
  }
}

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_DEV_INIT_DATA?: string
  readonly VITE_YANDEX_MAPS_API_KEY?: string
  readonly VITE_YANDEX_SUGGEST_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface YMapsEventTarget {
  geometry: { getCoordinates(): [number, number] }
}

interface YMapsEvent {
  get(key: 'target'): YMapsEventTarget
  get(key: 'coords'): [number, number]
  get(key: string): unknown
}

interface YMapsPlacemark {
  geometry: { setCoordinates(coords: [number, number]): void }
  events: {
    add(event: string, handler: (e: YMapsEvent) => void): void
    remove(event: string, handler: (e: YMapsEvent) => void): void
  }
}

interface YMapsMap {
  geoObjects: {
    add(obj: YMapsPlacemark): void
    remove(obj: YMapsPlacemark): void
  }
  events: {
    add(event: string, handler: (e: YMapsEvent) => void): void
    remove(event: string, handler: (e: YMapsEvent) => void): void
  }
  setCenter(
    coords: [number, number],
    zoom?: number,
    options?: { duration?: number; checkZoomRange?: boolean },
  ): void
  panTo(
    coords: [number, number],
    options?: { flying?: boolean; duration?: number },
  ): Promise<void>
  getCenter(): [number, number]
  getZoom(): number
  getBounds(): [[number, number], [number, number]]
  destroy(): void
  container: {
    fitToViewport(): void
  }
}

interface YMapsApi {
  ready(handler: () => void): void
  Map: new (
    container: HTMLElement | string,
    state: {
      center: [number, number]
      zoom: number
      controls?: string[]
      behaviors?: string[]
    },
    options?: Record<string, unknown>,
  ) => YMapsMap
  Placemark: new (
    coords: [number, number],
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => YMapsPlacemark
  // Distance between two geographic coordinates, in meters.
  coordSystem: {
    geo: {
      getDistance(a: [number, number], b: [number, number]): number
    }
  }
  // Factory for HTML-templated marker layouts. We pass the class result
  // as `iconLayout` on Placemark options.
  templateLayoutFactory: {
    createClass(template: string): unknown
  }
}

interface Window {
  ymaps?: YMapsApi
}
