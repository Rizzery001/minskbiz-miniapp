import { Pause, Play, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError, apiPatch, apiPost } from '../../api/client'
import type {
  ListingCreatePayload,
  ListingStatus,
  ListingUpdatePayload,
  MyListing,
  SellerCategory,
} from '../../api/types'
import { backButton, hapticFeedback } from '../../lib/telegram'
import { SELLER_CATEGORIES } from './categories'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (saved: MyListing) => void
  initial?: MyListing | null
}

const UNIT_SUGGESTIONS = [
  'кг',
  'г',
  'л',
  'мл',
  'шт',
  'упаковка',
  'буханка',
  'корзинка',
  'ящик',
  'банка',
]

const DEFAULT_CURRENCY = 'BYN'
const UNIT_DATALIST_ID = 'krana-listing-units'

function todayDateString(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function toDateInputValue(raw: string | null | undefined): string {
  if (!raw) return ''
  // Backend may send full ISO "2026-05-25T00:00:00Z" or plain "2026-05-25".
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(raw)
  return m ? m[1]! : ''
}

function emojiForCategory(cat: string): string {
  return SELLER_CATEGORIES.find((c) => c.value === cat)?.emoji ?? ''
}

interface ParsedNumber {
  ok: boolean
  value: number
}

function parsePositive(raw: string): ParsedNumber {
  const normalized = raw.replace(',', '.').trim()
  if (normalized === '') return { ok: false, value: NaN }
  const n = Number(normalized)
  if (!Number.isFinite(n)) return { ok: false, value: NaN }
  return { ok: true, value: n }
}

const ERROR_TEXTS: Record<string, string> = {
  invalid_title: 'Название слишком короткое или слишком длинное',
  invalid_category: 'Неизвестная категория',
  invalid_quantity: 'Неверное количество',
  invalid_unit: 'Не указана единица измерения',
  invalid_price: 'Неверная цена',
  invalid_currency: 'Неверная валюта',
  invalid_available_until: 'Неверная дата срока годности',
  invalid_status: 'Неверный статус',
  forbidden: 'У вас нет доступа к этому товару',
  not_found: 'Товар не найден',
  not_found_or_not_owned: 'Товар не найден',
}

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.code && ERROR_TEXTS[err.code]) return ERROR_TEXTS[err.code]!
    if (err.message) {
      return err.code ? `${err.message} (${err.code})` : err.message
    }
  }
  return fallback
}

export default function ListingFormModal({
  open,
  onClose,
  onSaved,
  initial,
}: Props) {
  const isEdit = !!initial

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<string>('')
  const [emoji, setEmoji] = useState('')
  // Tracks whether the user manually edited the emoji; used to decide
  // whether to auto-fill from category. Doubles as the “don't override”
  // flag during the create flow.
  const emojiTouchedRef = useRef(false)
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [price, setPrice] = useState('')
  const [availableUntil, setAvailableUntil] = useState('')
  const [status, setStatus] = useState<ListingStatus>('active')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form whenever the modal opens or switches between create/edit.
  useEffect(() => {
    if (!open) return
    if (initial) {
      setTitle(initial.title ?? '')
      setCategory(initial.category ?? '')
      setEmoji(initial.emoji ?? '')
      emojiTouchedRef.current = true
      setQuantity(
        Number.isFinite(initial.quantity) ? String(initial.quantity) : '',
      )
      setUnit(initial.unit ?? '')
      setPrice(
        Number.isFinite(initial.price_per_unit)
          ? String(initial.price_per_unit)
          : '',
      )
      setAvailableUntil(toDateInputValue(initial.available_until))
      setStatus(initial.status ?? 'active')
    } else {
      setTitle('')
      setCategory('')
      setEmoji('')
      emojiTouchedRef.current = false
      setQuantity('')
      setUnit('')
      setPrice('')
      setAvailableUntil('')
      setStatus('active')
    }
    setError(null)
    setSubmitting(false)
  }, [open, initial])

  const close = useCallback(() => {
    if (submitting) return
    onClose()
  }, [onClose, submitting])

  // Telegram BackButton — close the modal first instead of leaving Cabinet.
  useEffect(() => {
    if (!open) return
    backButton.show()
    backButton.onClick(close)
    return () => {
      backButton.offClick(close)
      backButton.hide()
    }
  }, [open, close])

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const handlePickCategory = (value: SellerCategory) => {
    hapticFeedback.light()
    setCategory(value)
    if (!emojiTouchedRef.current) {
      setEmoji(emojiForCategory(value))
    }
  }

  const handleEmojiChange = (value: string) => {
    emojiTouchedRef.current = true
    setEmoji(value)
  }

  const trimmedTitle = title.trim()
  const titleValid = trimmedTitle.length >= 2 && trimmedTitle.length <= 100
  const categoryValid = category.trim().length > 0
  const qtyParsed = parsePositive(quantity)
  const quantityValid = qtyParsed.ok && qtyParsed.value > 0
  const unitValid = unit.trim().length > 0 && unit.trim().length <= 20
  const priceParsed = parsePositive(price)
  const priceValid = priceParsed.ok && priceParsed.value >= 0

  const canSubmit =
    titleValid &&
    categoryValid &&
    quantityValid &&
    unitValid &&
    priceValid &&
    !submitting

  const disabledReason = useMemo(() => {
    if (submitting) return null
    if (!titleValid) return 'Укажите название (2–100 символов)'
    if (!categoryValid) return 'Выберите категорию'
    if (!quantityValid) return 'Укажите количество больше нуля'
    if (!unitValid) return 'Укажите единицу измерения'
    if (!priceValid) return 'Укажите цену'
    return null
  }, [submitting, titleValid, categoryValid, quantityValid, unitValid, priceValid])

  const today = useMemo(todayDateString, [])

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    hapticFeedback.medium()

    const trimmedEmoji = emoji.trim()
    const trimmedUnit = unit.trim()
    const trimmedAvailable = availableUntil.trim()

    try {
      let saved: MyListing
      if (isEdit && initial) {
        const patch: ListingUpdatePayload = {
          title: trimmedTitle,
          category,
          emoji: trimmedEmoji ? trimmedEmoji : null,
          quantity: qtyParsed.value,
          unit: trimmedUnit,
          price_per_unit: priceParsed.value,
          currency: initial.currency || DEFAULT_CURRENCY,
          available_until: trimmedAvailable ? trimmedAvailable : null,
          status,
        }
        saved = await apiPatch<MyListing>(
          `/me/listings/${encodeURIComponent(initial.id)}`,
          patch,
        )
      } else {
        const payload: ListingCreatePayload = {
          title: trimmedTitle,
          category,
          quantity: qtyParsed.value,
          unit: trimmedUnit,
          price_per_unit: priceParsed.value,
          currency: DEFAULT_CURRENCY,
        }
        if (trimmedEmoji) payload.emoji = trimmedEmoji
        if (trimmedAvailable) payload.available_until = trimmedAvailable
        saved = await apiPost<MyListing>('/me/listings', payload)
      }
      hapticFeedback.success()
      onSaved(saved)
    } catch (err: unknown) {
      hapticFeedback.error()
      setError(
        describeError(
          err,
          isEdit
            ? 'Не удалось сохранить изменения. Попробуйте ещё раз.'
            : 'Не удалось добавить товар. Попробуйте ещё раз.',
        ),
      )
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div
        onClick={close}
        className="fixed inset-0 z-[1700]"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Редактировать товар' : 'Добавить товар'}
        className="fixed inset-x-0 bottom-0 z-[1800] flex flex-col tg-shadow-lg"
        style={{
          backgroundColor: 'var(--tg-bg)',
          color: 'var(--tg-text)',
          maxHeight: '92vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <header className="flex items-center justify-between px-4 pt-4 pb-3">
          <h2 className="font-semibold" style={{ fontSize: 17 }}>
            {isEdit ? 'Редактировать товар' : 'Добавить товар'}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Закрыть"
            disabled={submitting}
            className="shrink-0 rounded-full flex items-center justify-center active:opacity-60 disabled:opacity-40 transition"
            style={{
              width: 32,
              height: 32,
              backgroundColor: 'var(--tg-secondary-bg)',
              color: 'var(--tg-text)',
              transitionDuration: '150ms',
            }}
          >
            <X size={18} />
          </button>
        </header>

        <div
          className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <Field label="Категория">
            <div className="grid grid-cols-2 gap-2">
              {SELLER_CATEGORIES.map((opt) => {
                const active = category === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handlePickCategory(opt.value)}
                    className="flex items-center gap-2 px-3 py-3 rounded-lg active:opacity-80 active:scale-[0.97] transition"
                    style={{
                      backgroundColor: active
                        ? 'var(--tg-link)'
                        : 'var(--tg-secondary-bg)',
                      color: active ? '#ffffff' : 'var(--tg-text)',
                      border: '1px solid var(--tg-hairline)',
                      fontSize: 14,
                      transitionDuration: '150ms',
                    }}
                  >
                    <span
                      style={{ fontSize: 18, lineHeight: 1 }}
                      aria-hidden="true"
                    >
                      {opt.emoji}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </Field>

          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <Field label="Название">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="Молоко домашнее"
                  className="w-full rounded-lg px-3 py-3 outline-none"
                  style={{
                    backgroundColor: 'var(--tg-secondary-bg)',
                    color: 'var(--tg-text)',
                    fontSize: 15,
                    border: '1px solid var(--tg-hairline)',
                  }}
                />
              </Field>
            </div>
            <div style={{ width: 88 }}>
              <Field label="Эмодзи">
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => handleEmojiChange(e.target.value)}
                  maxLength={8}
                  placeholder="🥛"
                  className="w-full rounded-lg px-3 py-3 outline-none text-center"
                  style={{
                    backgroundColor: 'var(--tg-secondary-bg)',
                    color: 'var(--tg-text)',
                    fontSize: 18,
                    border: '1px solid var(--tg-hairline)',
                  }}
                />
              </Field>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <Field label="Количество">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  inputMode="decimal"
                  step="0.1"
                  min="0.1"
                  placeholder="5"
                  className="w-full rounded-lg px-3 py-3 outline-none tabular-nums"
                  style={{
                    backgroundColor: 'var(--tg-secondary-bg)',
                    color: 'var(--tg-text)',
                    fontSize: 15,
                    border: '1px solid var(--tg-hairline)',
                  }}
                />
              </Field>
            </div>
            <div className="flex-1 min-w-0">
              <Field label="Единица измерения">
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  list={UNIT_DATALIST_ID}
                  maxLength={20}
                  placeholder="кг"
                  className="w-full rounded-lg px-3 py-3 outline-none"
                  style={{
                    backgroundColor: 'var(--tg-secondary-bg)',
                    color: 'var(--tg-text)',
                    fontSize: 15,
                    border: '1px solid var(--tg-hairline)',
                  }}
                />
                <datalist id={UNIT_DATALIST_ID}>
                  {UNIT_SUGGESTIONS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </Field>
            </div>
          </div>

          <Field label="Цена за единицу">
            <div className="flex items-stretch gap-2">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="10.50"
                className="flex-1 min-w-0 rounded-lg px-3 py-3 outline-none tabular-nums"
                style={{
                  backgroundColor: 'var(--tg-secondary-bg)',
                  color: 'var(--tg-text)',
                  fontSize: 15,
                  border: '1px solid var(--tg-hairline)',
                }}
              />
              <span
                className="shrink-0 flex items-center justify-center rounded-lg font-medium"
                style={{
                  padding: '0 14px',
                  backgroundColor: 'var(--tg-secondary-bg)',
                  color: 'var(--tg-hint)',
                  fontSize: 14,
                  border: '1px solid var(--tg-hairline)',
                }}
              >
                {DEFAULT_CURRENCY}
              </span>
            </div>
          </Field>

          <Field label="Доступно до (необязательно)">
            <input
              type="date"
              value={availableUntil}
              min={today}
              onChange={(e) => setAvailableUntil(e.target.value)}
              className="w-full rounded-lg px-3 py-3 outline-none"
              style={{
                backgroundColor: 'var(--tg-secondary-bg)',
                color: 'var(--tg-text)',
                fontSize: 15,
                border: '1px solid var(--tg-hairline)',
              }}
            />
            <p
              className="mt-1"
              style={{ fontSize: 12, color: 'var(--tg-hint)' }}
            >
              Если оставить пустым — товар доступен бессрочно.
            </p>
          </Field>

          {isEdit && (
            <Field label="Статус">
              <div className="grid grid-cols-3 gap-2">
                <StatusOption
                  value="active"
                  current={status}
                  label="В продаже"
                  icon={<Play size={14} strokeWidth={2} aria-hidden="true" />}
                  onPick={setStatus}
                />
                <StatusOption
                  value="paused"
                  current={status}
                  label="На паузе"
                  icon={<Pause size={14} strokeWidth={2} aria-hidden="true" />}
                  onPick={setStatus}
                />
                <StatusOption
                  value="sold"
                  current={status}
                  label="Продано"
                  onPick={setStatus}
                />
              </div>
            </Field>
          )}

          {error && (
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                color: 'var(--tg-destructive-text, #ff3b30)',
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          className="px-4 pt-3 pb-4"
          style={{ borderTop: '1px solid var(--tg-hairline)' }}
        >
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-4 rounded-xl font-medium active:opacity-80 active:scale-[0.98] disabled:opacity-50 transition"
            style={{
              backgroundColor: 'var(--tg-button)',
              color: 'var(--tg-button-text)',
              fontSize: 16,
              transitionDuration: '150ms',
            }}
          >
            {submitting
              ? isEdit
                ? 'Сохраняем…'
                : 'Создаём…'
              : isEdit
                ? 'Сохранить'
                : 'Добавить товар'}
          </button>
          {disabledReason && (
            <p
              className="text-center mt-2"
              style={{ fontSize: 12, color: 'var(--tg-hint)' }}
            >
              {disabledReason}
            </p>
          )}
        </div>
      </div>
    </>
  )
}

interface StatusOptionProps {
  value: ListingStatus
  current: ListingStatus
  label: string
  icon?: React.ReactNode
  onPick: (next: ListingStatus) => void
}

function StatusOption({
  value,
  current,
  label,
  icon,
  onPick,
}: StatusOptionProps) {
  const active = current === value
  return (
    <button
      type="button"
      onClick={() => {
        hapticFeedback.light()
        onPick(value)
      }}
      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg active:opacity-80 active:scale-[0.97] transition"
      style={{
        backgroundColor: active ? 'var(--tg-link)' : 'var(--tg-secondary-bg)',
        color: active ? '#ffffff' : 'var(--tg-text)',
        border: '1px solid var(--tg-hairline)',
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        transitionDuration: '150ms',
      }}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        className="block mb-1 font-medium"
        style={{ fontSize: 13, color: 'var(--tg-hint)' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
