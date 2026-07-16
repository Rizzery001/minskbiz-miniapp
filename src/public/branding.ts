/**
 * Public-site constants. The public pages render outside Telegram, so
 * they use a fixed dark "craft" palette instead of --tg-* theme vars.
 */

export const CONSUMER_BOT_URL = 'https://t.me/plentybox_bot'
export const VENUE_BOT_URL = 'https://t.me/plenty_fb_bot'

export function boxDeepLink(boxId: string): string {
  // ?start=box_<id> — the bot opens gracefully today (payload reserved
  // for the box auto-open flow, Phase 2).
  return `${CONSUMER_BOT_URL}?start=box_${boxId}`
}

export const PALETTE = {
  bg: '#121110',
  bgElevated: '#1c1917',
  text: '#f5f0e8',
  textMuted: 'rgba(245, 240, 232, 0.62)',
  gold: '#f5a623',
  hairline: 'rgba(245, 240, 232, 0.12)',
} as const
