function tg(): TelegramWebApp | undefined {
  if (typeof window === 'undefined') return undefined
  return window.Telegram?.WebApp
}

export function init(): void {
  const wa = tg()
  if (!wa) return
  wa.ready()
  wa.expand()
}

export function getInitData(): string {
  const wa = tg()
  if (wa?.initData) return wa.initData
  return import.meta.env.VITE_DEV_INIT_DATA ?? ''
}

export interface TelegramUser {
  id: number
  firstName?: string
  lastName?: string
  username?: string
  photoUrl?: string
  languageCode?: string
}

/**
 * Returns the Telegram user from initDataUnsafe — first_name, photo,
 * etc. Frontend-side only (initDataUnsafe is not signed); for auth use
 * the raw initData via getInitData() and verify on the backend.
 */
export function getTelegramUser(): TelegramUser | null {
  const u = tg()?.initDataUnsafe?.user
  if (!u || typeof u.id !== 'number') return null
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    username: u.username,
    photoUrl: u.photo_url,
    languageCode: u.language_code,
  }
}

const THEME_KEYS: Array<[keyof TelegramThemeParams, string]> = [
  ['bg_color', '--tg-bg'],
  ['text_color', '--tg-text'],
  ['hint_color', '--tg-hint'],
  ['link_color', '--tg-link'],
  ['button_color', '--tg-button'],
  ['button_text_color', '--tg-button-text'],
  ['secondary_bg_color', '--tg-secondary-bg'],
  ['section_bg_color', '--tg-section-bg'],
  ['header_bg_color', '--tg-header-bg'],
  ['accent_text_color', '--tg-accent-text'],
  ['destructive_text_color', '--tg-destructive-text'],
  ['subtitle_text_color', '--tg-subtitle-text'],
  ['bottom_bar_bg_color', '--tg-bottom-bar-bg'],
]

export function applyTheme(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const wa = tg()
  const scheme: 'light' | 'dark' = wa?.colorScheme ?? 'light'
  root.setAttribute('data-theme', scheme)
  if (!wa) return
  const params = wa.themeParams
  for (const [key, cssVar] of THEME_KEYS) {
    const value = params[key]
    if (value) root.style.setProperty(cssVar, value)
  }
}

export function getColorScheme(): 'light' | 'dark' {
  return tg()?.colorScheme ?? 'light'
}

export function onThemeChanged(handler: () => void): () => void {
  const wa = tg()
  if (!wa) return () => {}
  wa.onEvent('themeChanged', handler)
  return () => wa.offEvent('themeChanged', handler)
}

export const mainButton = {
  show(): void {
    tg()?.MainButton.show()
  },
  hide(): void {
    tg()?.MainButton.hide()
  },
  setText(text: string): void {
    tg()?.MainButton.setText(text)
  },
  onClick(handler: () => void): void {
    tg()?.MainButton.onClick(handler)
  },
  offClick(handler: () => void): void {
    tg()?.MainButton.offClick(handler)
  },
  showProgress(): void {
    tg()?.MainButton.showProgress?.()
  },
  hideProgress(): void {
    tg()?.MainButton.hideProgress?.()
  },
}

export const backButton = {
  show(): void {
    tg()?.BackButton.show()
  },
  hide(): void {
    tg()?.BackButton.hide()
  },
  onClick(handler: () => void): void {
    tg()?.BackButton.onClick(handler)
  },
  offClick(handler: () => void): void {
    tg()?.BackButton.offClick(handler)
  },
}

export const hapticFeedback = {
  light(): void {
    tg()?.HapticFeedback.impactOccurred('light')
  },
  medium(): void {
    tg()?.HapticFeedback.impactOccurred('medium')
  },
  heavy(): void {
    tg()?.HapticFeedback.impactOccurred('heavy')
  },
  success(): void {
    tg()?.HapticFeedback.notificationOccurred('success')
  },
  warning(): void {
    tg()?.HapticFeedback.notificationOccurred('warning')
  },
  error(): void {
    tg()?.HapticFeedback.notificationOccurred('error')
  },
}

export function sendData(data: object): void {
  tg()?.sendData(JSON.stringify(data))
}
