import { useEffect, useRef } from 'react'
import { completeLogin } from './auth'
import type { TelegramWidgetUser } from './webApi'

const BOT_USERNAME = 'plentybox_bot'

declare global {
  interface Window {
    __plentyOnTelegramAuth?: (user: TelegramWidgetUser) => void
  }
}

/**
 * Official Telegram Login Widget. Requires /setdomain plenty.by on
 * @plentybox_bot — on other hosts (localhost, vercel previews) Telegram
 * renders its own "domain invalid" notice inside the iframe.
 */
export default function TelegramLoginButton({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (message: string) => void
}) {
  const holderRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    window.__plentyOnTelegramAuth = (user) => {
      completeLogin(user)
        .then(() => onSuccess?.())
        .catch(() => onError?.('Не получилось войти, попробуй ещё раз'))
    }
    const holder = holderRef.current
    if (!holder) return
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', BOT_USERNAME)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-radius', '12')
    script.setAttribute('data-userpic', 'false')
    script.setAttribute('data-request-access', 'write')
    script.setAttribute('data-onauth', '__plentyOnTelegramAuth(user)')
    holder.appendChild(script)
    return () => {
      holder.innerHTML = ''
    }
    // onSuccess/onError are stored on window handler above; re-mounting
    // the widget script on their identity change would flicker the iframe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={holderRef} className="flex justify-center" />
}
