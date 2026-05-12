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
}

interface TelegramWebApp {
  initData: string
  themeParams: TelegramThemeParams
  colorScheme: 'light' | 'dark'
  ready(): void
  expand(): void
  close(): void
  sendData(data: string): void
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
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
