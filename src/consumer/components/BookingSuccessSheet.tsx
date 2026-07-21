import { CheckCircle2, ClipboardList, MapPin } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { backButton } from '../../lib/telegram'
import { formatPickupWindow, formatPriceByn } from '../format'
import type { ConsumerBooking } from '../types'

interface Props {
  booking: ConsumerBooking
  onClose: () => void
}

/**
 * Full-screen confirmation after a successful booking. The 6-char pickup
 * code is the centrepiece — large monospace, generous letter-spacing so
 * a barista can read it from across the counter.
 */
export default function BookingSuccessSheet({ booking, onClose }: Props) {
  const navigate = useNavigate()

  useEffect(() => {
    backButton.show()
    backButton.onClick(onClose)
    return () => {
      backButton.offClick(onClose)
      backButton.hide()
    }
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleGoToBookings = () => {
    onClose()
    navigate('/bookings')
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[1700]"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Бронь подтверждена"
        className="consumer-sheet tg-shadow-lg fixed inset-x-0 bottom-0 z-[1800] flex flex-col"
        style={{
          color: 'var(--tg-text)',
          maxHeight: '92vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'var(--tg-hint)',
              opacity: 0.3,
            }}
          />
        </div>

        <div
          className="overflow-y-auto px-5 pt-5 pb-5 flex flex-col items-center text-center"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <CheckCircle2
            size={64}
            strokeWidth={1.75}
            color="#34c759"
            aria-hidden="true"
          />
          <h2
            className="mt-3 font-bold"
            style={{ fontSize: 22, lineHeight: 1.2 }}
          >
            Забронировано!
          </h2>

          <div
            className="mt-5 w-full rounded-2xl flex flex-col items-center"
            style={{
              padding: '20px 16px',
              backgroundColor: 'var(--tg-secondary-bg)',
            }}
          >
            <span
              className="tabular-nums"
              style={{
                fontFamily:
                  '"SF Mono", ui-monospace, Menlo, Consolas, monospace',
                fontSize: 44,
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: 'var(--tg-text)',
                lineHeight: 1.05,
              }}
            >
              {booking.code}
            </span>
            <p
              className="mt-3"
              style={{
                fontSize: 13,
                color: 'var(--tg-hint)',
                lineHeight: 1.4,
              }}
            >
              Заведение подтвердит заказ к вечеру. Покажи код при получении
            </p>
          </div>

          <div className="w-full mt-5 flex flex-col gap-2 text-left">
            <DetailRow
              icon={<MapPin size={16} aria-hidden="true" />}
              primary={booking.box.business_name}
              secondary={booking.box.address}
            />
            <DetailRow
              icon={
                <span
                  aria-hidden="true"
                  style={{ fontSize: 14, lineHeight: 1 }}
                >
                  🕐
                </span>
              }
              primary={formatPickupWindow(
                booking.pickup_window_start,
                booking.pickup_window_end,
              )}
            />
            <DetailRow
              icon={
                <span
                  aria-hidden="true"
                  style={{ fontSize: 14, lineHeight: 1 }}
                >
                  💰
                </span>
              }
              primary={formatPriceByn(booking.box.price_byn)}
            />
          </div>
        </div>

        <div
          className="px-4 pt-2 pb-4"
          style={{ borderTop: '1px solid var(--tg-hairline)' }}
        >
          <button
            type="button"
            onClick={handleGoToBookings}
            className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 active:opacity-80 active:scale-[0.99] transition"
            style={{
              backgroundColor: 'var(--tg-button)',
              color: 'var(--tg-button-text)',
              fontSize: 15,
              transitionDuration: '150ms',
            }}
          >
            <ClipboardList size={18} aria-hidden="true" />
            <span>К моим броням</span>
          </button>
        </div>
      </div>
    </>
  )
}

function DetailRow({
  icon,
  primary,
  secondary,
}: {
  icon: React.ReactNode
  primary: string
  secondary?: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className="shrink-0 mt-0.5"
        style={{ color: 'var(--tg-hint)' }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className="font-medium"
          style={{ fontSize: 14, color: 'var(--tg-text)', lineHeight: 1.4 }}
        >
          {primary}
        </p>
        {secondary && (
          <p
            className="mt-0.5"
            style={{ fontSize: 12, color: 'var(--tg-hint)', lineHeight: 1.35 }}
          >
            {secondary}
          </p>
        )}
      </div>
    </div>
  )
}
