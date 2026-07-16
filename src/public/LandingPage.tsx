import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import StorefrontSection from './StorefrontSection'
import { CONSUMER_BOT_URL, PALETTE, VENUE_BOT_URL } from './branding'

/**
 * Public landing at plenty.by — hero, how-it-works, live storefront
 * (#boxes anchor; /boxes deep-links here too), venue pitch, legal
 * footer. Fixed dark craft palette (no Telegram theme vars), system
 * typography, no dependencies. Booking happens in Telegram — every CTA
 * is a t.me link.
 */
export default function LandingPage() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/boxes' || location.hash === '#boxes') {
      document
        .getElementById('boxes')
        ?.scrollIntoView({ behavior: 'auto', block: 'start' })
    }
  }, [location.pathname, location.hash])

  const scrollToBoxes = () => {
    document
      .getElementById('boxes')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div
      className="min-h-full"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      {/* Hero */}
      <section
        className="px-5 pb-14 text-center"
        style={{
          paddingTop: 48,
          background:
            'radial-gradient(ellipse 120% 70% at 50% -10%, rgba(245, 166, 35, 0.22) 0%, rgba(146, 64, 14, 0.10) 45%, transparent 75%)',
        }}
      >
        <div style={{ fontSize: 56 }} aria-hidden="true">
          👨‍🍳
        </div>
        <h1
          className="mx-auto mt-4 font-bold"
          style={{ fontSize: 32, lineHeight: 1.15, maxWidth: 560 }}
        >
          Вечерние Шеф-боксы от заведений Минска
        </h1>
        <p
          className="mx-auto mt-4"
          style={{
            fontSize: 16,
            lineHeight: 1.5,
            maxWidth: 440,
            color: PALETTE.textMuted,
          }}
        >
          Каждый вечер — лимитированные боксы-сюрпризы. Что внутри, узнаешь
          при получении.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={scrollToBoxes}
            className="w-full max-w-xs py-3.5 rounded-xl font-semibold active:opacity-80 transition"
            style={{
              backgroundColor: PALETTE.gold,
              color: '#171310',
              fontSize: 16,
              transitionDuration: '150ms',
            }}
          >
            Смотреть боксы
          </button>
          <a
            href={CONSUMER_BOT_URL}
            className="w-full max-w-xs py-3.5 rounded-xl font-semibold text-center active:opacity-80 transition"
            style={{
              border: `1px solid ${PALETTE.hairline}`,
              color: PALETTE.text,
              fontSize: 16,
              transitionDuration: '150ms',
            }}
          >
            Открыть в Telegram
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-12 mx-auto" style={{ maxWidth: 680 }}>
        <h2 className="font-bold text-center" style={{ fontSize: 24 }}>
          Как это работает
        </h2>
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:gap-4">
          <Step
            emoji="🗺"
            title="Выбери бокс на карте"
            text="Смотри, какие заведения собрали боксы сегодня вечером."
          />
          <Step
            emoji="📲"
            title="Забронируй в Telegram"
            text="Пара тапов в боте — и бокс твой. Получишь 6-значный код."
          />
          <Step
            emoji="🎁"
            title="Покажи код и забери"
            text="Приходи в окно выдачи, называй код — и наслаждайся."
          />
        </div>
      </section>

      {/* Live storefront */}
      <StorefrontSection />

      {/* For venues */}
      <section
        id="partners"
        className="px-5 py-12 mx-auto"
        style={{ maxWidth: 680, scrollMarginTop: 64 }}
      >
        <div
          className="rounded-2xl px-6 py-8 text-center"
          style={{
            backgroundColor: PALETTE.bgElevated,
            border: `1px solid ${PALETTE.hairline}`,
          }}
        >
          <h2 className="font-bold" style={{ fontSize: 22 }}>
            Ваше заведение на Plenty
          </h2>
          <p
            className="mx-auto mt-3"
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              maxWidth: 460,
              color: PALETTE.textMuted,
            }}
          >
            Новый канал вечерней выручки без скидочных войн. Публикация
            бокса занимает минуту — прямо из Telegram.
          </p>
          <a
            href={VENUE_BOT_URL}
            className="inline-block mt-6 px-8 py-3 rounded-xl font-semibold active:opacity-80 transition"
            style={{
              border: `1px solid ${PALETTE.gold}`,
              color: PALETTE.gold,
              fontSize: 15,
              transitionDuration: '150ms',
            }}
          >
            Стать партнёром
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-5 pt-10 text-center"
        style={{
          paddingBottom: 'max(40px, env(safe-area-inset-bottom, 0px))',
          borderTop: `1px solid ${PALETTE.hairline}`,
        }}
      >
        <p style={{ fontSize: 13, color: PALETTE.textMuted, lineHeight: 1.6 }}>
          © 2026 Glitchlab Ltd. Plenty is a product of Glitchlab Ltd.
          <br />
          Companies House: SC870130. Registered in Scotland.
        </p>
        <p className="mt-3" style={{ fontSize: 13 }}>
          <a
            href="/privacy"
            style={{ color: PALETTE.textMuted, textDecoration: 'underline' }}
          >
            Политика конфиденциальности
          </a>
          {' · '}
          <a
            href="/terms"
            style={{ color: PALETTE.textMuted, textDecoration: 'underline' }}
          >
            Условия сервиса
          </a>
        </p>
      </footer>
    </div>
  )
}

function Step({
  emoji,
  title,
  text,
}: {
  emoji: string
  title: string
  text: string
}) {
  return (
    <div className="flex-1 text-center">
      <div style={{ fontSize: 36 }} aria-hidden="true">
        {emoji}
      </div>
      <h3 className="mt-2 font-semibold" style={{ fontSize: 16 }}>
        {title}
      </h3>
      <p
        className="mt-1 mx-auto"
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          maxWidth: 260,
          color: PALETTE.textMuted,
        }}
      >
        {text}
      </p>
    </div>
  )
}
