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

const THEME_KEYS: Array<[keyof TelegramThemeParams, string]> = [
  ['bg_color', '--tg-bg'],
  ['text_color', '--tg-text'],
  ['hint_color', '--tg-hint'],
  ['link_color', '--tg-link'],
  ['button_color', '--tg-button'],
  ['button_text_color', '--tg-button-text'],
  ['secondary_bg_color', '--tg-secondary-bg'],
]

export function applyTheme(): void {
  const wa = tg()
  if (!wa) return
  const params = wa.themeParams
  const root = document.documentElement
  for (const [key, cssVar] of THEME_KEYS) {
    const value = params[key]
    if (value) root.style.setProperty(cssVar, value)
  }
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
