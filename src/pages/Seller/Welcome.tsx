import { useNavigate } from 'react-router-dom'
import { hapticFeedback } from '../../lib/telegram'

export default function SellerWelcome() {
  const navigate = useNavigate()

  const go = (to: string) => {
    hapticFeedback.light()
    navigate(to)
  }

  return (
    <div className="p-4 flex flex-col" style={{ minHeight: '100%' }}>
      <header className="pt-6 pb-8 text-center">
        <div className="text-5xl mb-3" aria-hidden="true">
          🌾
        </div>
        <h1
          className="font-semibold mb-3"
          style={{ fontSize: 22, lineHeight: 1.2 }}
        >
          Krana для фермеров
        </h1>
        <p
          className="mx-auto"
          style={{
            fontSize: 14,
            lineHeight: 1.45,
            color: 'var(--tg-hint)',
            maxWidth: 320,
          }}
        >
          Зарегистрируйте свою ферму на маркетплейсе Krana, чтобы начать
          получать заказы от кофеен и пекарен Минска.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => go('/seller/register')}
          className="w-full py-4 rounded-xl font-medium active:opacity-80 active:scale-[0.98] transition"
          style={{
            backgroundColor: 'var(--tg-button)',
            color: 'var(--tg-button-text)',
            fontSize: 16,
            transitionDuration: '150ms',
          }}
        >
          <span className="mr-2" aria-hidden="true">🆕</span>
          Создать ферму
        </button>
        <button
          type="button"
          onClick={() => go('/seller/login')}
          className="w-full py-4 rounded-xl font-medium active:opacity-70 active:scale-[0.98] transition"
          style={{
            backgroundColor: 'var(--tg-secondary-bg)',
            color: 'var(--tg-text)',
            fontSize: 16,
            transitionDuration: '150ms',
          }}
        >
          <span className="mr-2" aria-hidden="true">📞</span>
          У меня уже есть ферма
        </button>
      </div>
    </div>
  )
}
