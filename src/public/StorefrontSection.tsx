import { CONSUMER_BOT_URL, PALETTE } from './branding'

/** Placeholder — the live storefront lands in the next commit. */
export default function StorefrontSection() {
  return (
    <section id="boxes" className="px-5 py-12 mx-auto" style={{ maxWidth: 680 }}>
      <h2 className="font-bold text-center" style={{ fontSize: 24 }}>
        Боксы сегодня
      </h2>
      <p
        className="mt-4 text-center"
        style={{ fontSize: 15, color: PALETTE.textMuted }}
      >
        Боксы появляются к вечеру.{' '}
        <a href={CONSUMER_BOT_URL} style={{ color: PALETTE.gold }}>
          Открыть в Telegram
        </a>
      </p>
    </section>
  )
}
