/**
 * Full-screen "consumer bot is not connected" state. Rendered whenever
 * the backend returns 503 (BOX_BOT_TOKEN missing). Same component is
 * used across screens so the message stays consistent.
 */
export default function BotNotConfiguredScreen() {
  return (
    <div
      className="h-full flex flex-col items-center justify-center text-center px-6"
      style={{ backgroundColor: 'var(--tg-bg)', color: 'var(--tg-text)' }}
    >
      <div style={{ fontSize: 56 }} aria-hidden="true">
        🤖
      </div>
      <h2
        className="mt-3 font-semibold"
        style={{ fontSize: 18, lineHeight: 1.3 }}
      >
        Mini-app пока не подключён к боту
      </h2>
      <p
        className="mt-2"
        style={{
          fontSize: 14,
          color: 'var(--tg-hint)',
          lineHeight: 1.45,
          maxWidth: 280,
        }}
      >
        Открой <span style={{ color: 'var(--tg-link)' }}>@plentybox_bot</span>{' '}
        в Telegram — оттуда mini-app запустится с правильной авторизацией.
      </p>
    </div>
  )
}
