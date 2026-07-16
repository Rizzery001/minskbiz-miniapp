import type { CSSProperties } from 'react'
import { PALETTE } from './branding'

/**
 * Scoped --tg-* overrides so shared mini-app components (booking
 * tickets, confirm modal) render in the site's dark craft palette
 * outside Telegram, where index.css defaults are light.
 */
export const TG_DARK_VARS = {
  '--tg-bg': PALETTE.bg,
  '--tg-secondary-bg': PALETTE.bgElevated,
  '--tg-text': PALETTE.text,
  '--tg-hint': PALETTE.textMuted,
  '--tg-link': PALETTE.gold,
  '--tg-button': PALETTE.gold,
  '--tg-button-text': '#171310',
  '--tg-accent-text': PALETTE.gold,
  '--tg-destructive-text': '#ff6b5e',
  '--tg-hairline': PALETTE.hairline,
} as CSSProperties
