import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { coverGradient } from '../consumer/covers'
import Reveal from './Reveal'
import StorefrontSection from './StorefrontSection'
import { CONSUMER_BOT_URL, PALETTE, VENUE_BOT_URL } from './branding'

/**
 * Public landing at plenty.by. Poster-typography hero with floating
 * cover-art cards, ticker, three-step how-it-works, the live
 * storefront (#boxes), a venue pitch and the legal footer.
 */
export default function LandingPage() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/boxes' || location.hash === '#boxes') {
      document
        .getElementById('boxes')
        ?.scrollIntoView({ behavior: 'auto', block: 'start' })
    }
    if (location.hash === '#partners') {
      document
        .getElementById('partners')
        ?.scrollIntoView({ behavior: 'auto', block: 'start' })
    }
  }, [location.pathname, location.hash])

  const scrollToBoxes = () => {
    document
      .getElementById('boxes')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      {/* ===== Hero ===== */}
      <section
        className="relative overflow-hidden px-5"
        style={{
          paddingTop: 64,
          paddingBottom: 72,
          background:
            'radial-gradient(ellipse 90% 60% at 70% -10%, rgba(245, 166, 35, 0.16) 0%, transparent 60%), ' +
            'radial-gradient(ellipse 70% 50% at 10% 110%, rgba(146, 64, 14, 0.22) 0%, transparent 65%)',
        }}
      >
        {/* floating cover cards — desktop decoration */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden lg:block"
          style={{ width: 460 }}
          aria-hidden="true"
        >
          <FloatCard cover="glow" price="45 р." top={70} right={220} tilt={-7} slow />
          <FloatCard cover="morning" price="18 р." top={210} right={40} tilt={5} />
          <FloatCard cover="classic" price="60 р." top={340} right={250} tilt={-3} slow />
        </div>

        <div className="mx-auto" style={{ maxWidth: 1080 }}>
          <Reveal>
            <p className="p-kicker">Минск · каждый вечер</p>
          </Reveal>
          <Reveal delay={80}>
            <h1
              className="p-display mt-4"
              style={{ fontSize: 'clamp(40px, 8vw, 84px)', maxWidth: 760 }}
            >
              Вечерние{' '}
              <span className="gold">Шеф-боксы</span>
              <br />
              от заведений города
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p
              className="mt-5"
              style={{
                fontSize: 'clamp(16px, 2.2vw, 19px)',
                lineHeight: 1.55,
                maxWidth: 470,
                color: PALETTE.textMuted,
              }}
            >
              Лимитированные боксы-сюрпризы, собранные шефами под конец дня.
              Что внутри — узнаешь при получении.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={scrollToBoxes}
                className="p-pill p-pill-gold px-8"
                style={{ height: 54, fontSize: 16 }}
              >
                Смотреть боксы
                <span aria-hidden="true">→</span>
              </button>
              <a
                href={CONSUMER_BOT_URL}
                className="p-pill p-pill-ghost px-7"
                style={{ height: 54, fontSize: 16 }}
              >
                Открыть в Telegram
              </a>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <div
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2"
              style={{ fontSize: 13, color: PALETTE.textMuted }}
            >
              <span className="inline-flex items-center gap-2">
                <span className="p-live" aria-hidden="true" />
                Выдача сегодня 19:00–22:00
              </span>
              <span>Бронь за пару тапов</span>
              <span>Оплата при получении</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Ticker ===== */}
      <div
        className="p-marquee py-3"
        style={{
          borderTop: `1px solid ${PALETTE.hairline}`,
          borderBottom: `1px solid ${PALETTE.hairline}`,
        }}
        aria-hidden="true"
      >
        <div
          className="p-marquee-track"
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(245, 240, 232, 0.4)',
          }}
        >
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i}>
              {[
                'Сюрприз от шефа',
                'Лимитированно',
                'Забирай вечером',
                'Покажи код',
                'Минск',
              ].map((t) => (
                <span key={t} className="mx-5">
                  {t} <span style={{ color: PALETTE.gold }}>✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ===== How it works ===== */}
      <section className="px-5 py-16 mx-auto" style={{ maxWidth: 1080 }}>
        <Reveal>
          <p className="p-kicker">Как это работает</p>
          <h2
            className="p-display mt-3"
            style={{ fontSize: 'clamp(28px, 4.5vw, 44px)' }}
          >
            Три шага до сюрприза
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Step
            n="01"
            title="Выбери бокс"
            text="Карта города показывает, какие заведения собрали боксы сегодня вечером."
            delay={0}
          />
          <Step
            n="02"
            title="Забронируй"
            text="На сайте или в Telegram — пара тапов, и бокс твой. Получишь 6-значный код."
            delay={100}
          />
          <Step
            n="03"
            title="Забери и наслаждайся"
            text="Приходи в окно выдачи, называй код. Оплата на месте — наличными или картой."
            delay={200}
          />
        </div>
      </section>

      {/* ===== Live storefront ===== */}
      <StorefrontSection />

      {/* ===== For venues ===== */}
      <section
        id="partners"
        className="px-5 py-16 mx-auto"
        style={{ maxWidth: 1080, scrollMarginTop: 64 }}
      >
        <Reveal>
          <div
            className="relative overflow-hidden rounded-3xl px-6 py-10 sm:px-12 sm:py-14"
            style={{
              background:
                'linear-gradient(135deg, rgba(146,64,14,0.35) 0%, rgba(28,25,23,0.9) 55%), ' +
                PALETTE.bgElevated,
              border: `1px solid rgba(245, 166, 35, 0.25)`,
            }}
          >
            <p className="p-kicker">Заведениям</p>
            <h2
              className="p-display mt-3"
              style={{ fontSize: 'clamp(26px, 4vw, 40px)', maxWidth: 560 }}
            >
              Ваше заведение
              <br />
              на <span className="gold">Plenty</span>
            </h2>
            <p
              className="mt-4"
              style={{
                fontSize: 16,
                lineHeight: 1.55,
                maxWidth: 480,
                color: PALETTE.textMuted,
              }}
            >
              Новый канал вечерней выручки без скидочных войн. Публикация
              бокса занимает минуту — прямо из Telegram.
            </p>
            <ul
              className="mt-5 flex flex-col gap-2"
              style={{ fontSize: 14, color: PALETTE.text }}
            >
              {[
                'Без комиссии на бета-этапе',
                'Сами решаете, что в боксе и сколько их',
                'Брони и коды выдачи — в одном чате',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span style={{ color: PALETTE.gold }} aria-hidden="true">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <a
              href={VENUE_BOT_URL}
              className="p-pill p-pill-gold mt-7 px-8"
              style={{ height: 52, fontSize: 15 }}
            >
              Стать партнёром
            </a>
          </div>
        </Reveal>
      </section>

      {/* ===== Footer ===== */}
      <footer
        className="px-5 pt-12"
        style={{
          paddingBottom: 'max(40px, env(safe-area-inset-bottom, 0px))',
          borderTop: `1px solid ${PALETTE.hairline}`,
        }}
      >
        <div
          className="mx-auto flex flex-col gap-8 sm:flex-row sm:justify-between"
          style={{ maxWidth: 1080 }}
        >
          <div>
            <div className="font-bold flex items-center gap-2" style={{ fontSize: 18 }}>
              <span aria-hidden="true">👨‍🍳</span> Plenty
            </div>
            <p
              className="mt-2"
              style={{ fontSize: 13, color: PALETTE.textMuted, maxWidth: 260, lineHeight: 1.5 }}
            >
              Вечерние Шеф-боксы от заведений Минска.
            </p>
          </div>
          <div className="flex gap-12" style={{ fontSize: 14 }}>
            <div className="flex flex-col gap-2">
              <span className="p-kicker" style={{ fontSize: 11 }}>Сервис</span>
              <a href="/#boxes" style={{ color: PALETTE.textMuted }}>Боксы</a>
              <a href="/account" style={{ color: PALETTE.textMuted }}>Кабинет</a>
              <a href={CONSUMER_BOT_URL} style={{ color: PALETTE.textMuted }}>Telegram-бот</a>
            </div>
            <div className="flex flex-col gap-2">
              <span className="p-kicker" style={{ fontSize: 11 }}>Компания</span>
              <a href="/#partners" style={{ color: PALETTE.textMuted }}>Заведениям</a>
              <a href="/privacy" style={{ color: PALETTE.textMuted }}>Конфиденциальность</a>
              <a href="/terms" style={{ color: PALETTE.textMuted }}>Условия</a>
            </div>
          </div>
        </div>
        <p
          className="mx-auto mt-10 pt-5 text-center"
          style={{
            maxWidth: 1080,
            fontSize: 12,
            color: PALETTE.textMuted,
            borderTop: `1px solid ${PALETTE.hairline}`,
            lineHeight: 1.6,
          }}
        >
          © 2026 Glitchlab Ltd. Plenty is a product of Glitchlab Ltd. ·
          Companies House: SC870130 · Registered in Scotland
        </p>
      </footer>
    </div>
  )
}

function FloatCard({
  cover,
  price,
  top,
  right,
  tilt,
  slow,
}: {
  cover: string
  price: string
  top: number
  right: number
  tilt: number
  slow?: boolean
}) {
  return (
    <div
      className={`absolute p-grain overflow-hidden rounded-2xl ${slow ? 'p-float-slow' : 'p-float'}`}
      style={
        {
          top,
          right,
          width: 190,
          height: 122,
          background: coverGradient(cover),
          border: '1px solid rgba(245, 240, 232, 0.18)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
          '--tilt': `${tilt}deg`,
        } as React.CSSProperties
      }
    >
      <span
        className="absolute flex items-center justify-center"
        style={{ inset: 0, fontSize: 34 }}
        aria-hidden="true"
      >
        👨‍🍳
      </span>
      <span
        className="absolute rounded-full px-2.5 py-1 font-bold"
        style={{
          top: 8,
          right: 8,
          fontSize: 12,
          backgroundColor: 'rgba(18, 17, 16, 0.75)',
          color: '#f5f0e8',
        }}
      >
        {price}
      </span>
    </div>
  )
}

function Step({
  n,
  title,
  text,
  delay,
}: {
  n: string
  title: string
  text: string
  delay: number
}) {
  return (
    <Reveal delay={delay}>
      <div className="p-card h-full px-6 py-7">
        <div
          className="p-display"
          style={{ fontSize: 40, color: 'rgba(245, 166, 35, 0.35)' }}
          aria-hidden="true"
        >
          {n}
        </div>
        <h3 className="mt-3 font-bold" style={{ fontSize: 18 }}>
          {title}
        </h3>
        <p
          className="mt-2"
          style={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(245,240,232,0.62)' }}
        >
          {text}
        </p>
      </div>
    </Reveal>
  )
}
