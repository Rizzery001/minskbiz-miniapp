import type {
  WasteByDay,
  WasteByReason,
  WasteData,
  WasteTopItem,
} from '../pages/Waste/types'

function seededRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function generateDailyData(
  seed: number,
  days: number,
  sample: number[],
): WasteByDay[] {
  const rand = seededRng(seed)
  const result: WasteByDay[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const pick = sample[Math.floor(rand() * sample.length)] ?? 0
    const amount = Math.round((pick + rand() * 5) * 100) / 100
    result.push({
      date: d.toISOString().slice(0, 10),
      amount_byn: amount,
      count: Math.max(1, Math.round(amount / 4)),
    })
  }
  return result
}

interface Subtype {
  daySample: number[]
  totalRecords: number
  totalAmount: number
  reasons: WasteByReason[]
  topItems: WasteTopItem[]
  weekComparison: WasteData['week_comparison']
}

const COFFEE: Subtype = {
  daySample: [3, 8, 12, 5, 7, 15, 22],
  totalRecords: 47,
  totalAmount: 312.5,
  reasons: [
    { reason: 'не_продано', reason_label: 'Не продано', amount_byn: 145.3, count: 22 },
    { reason: 'просрочка', reason_label: 'Просрочка', amount_byn: 89.4, count: 12 },
    { reason: 'бой', reason_label: 'Бой', amount_byn: 42.8, count: 8 },
    { reason: 'пролив', reason_label: 'Пролив', amount_byn: 35.0, count: 5 },
  ],
  topItems: [
    { name: 'Молоко 3.2%', amount_byn: 78.4, quantity: 26, unit: 'л' },
    { name: 'Круассан', amount_byn: 64.0, quantity: 16, unit: 'шт' },
    { name: 'Капучино', amount_byn: 48.0, quantity: 12, unit: 'шт' },
    { name: 'Латте', amount_byn: 36.0, quantity: 9, unit: 'шт' },
    { name: 'Чизкейк', amount_byn: 30.0, quantity: 6, unit: 'шт' },
    { name: 'Маффин черничный', amount_byn: 24.0, quantity: 8, unit: 'шт' },
    { name: 'Сливки 33%', amount_byn: 18.5, quantity: 3, unit: 'л' },
    { name: 'Эспрессо', amount_byn: 8.0, quantity: 8, unit: 'шт' },
  ],
  weekComparison: { current_week_byn: 68.5, prev_week_byn: 79.2, delta_pct: -13.5 },
}

const BAKERY: Subtype = {
  daySample: [10, 18, 25, 14, 22, 30, 38],
  totalRecords: 84,
  totalAmount: 521.7,
  reasons: [
    { reason: 'не_продано', reason_label: 'Не продано', amount_byn: 312.4, count: 54 },
    { reason: 'просрочка', reason_label: 'Просрочка', amount_byn: 142.6, count: 22 },
    { reason: 'брак', reason_label: 'Брак', amount_byn: 41.2, count: 5 },
    { reason: 'бой', reason_label: 'Бой', amount_byn: 25.5, count: 3 },
  ],
  topItems: [
    { name: 'Багет', amount_byn: 92.4, quantity: 33, unit: 'шт' },
    { name: 'Чиабатта', amount_byn: 76.8, quantity: 24, unit: 'шт' },
    { name: 'Бородинский', amount_byn: 64.0, quantity: 20, unit: 'шт' },
    { name: 'Круассан с шоколадом', amount_byn: 58.5, quantity: 13, unit: 'шт' },
    { name: 'Синнабон', amount_byn: 48.0, quantity: 12, unit: 'шт' },
    { name: 'Эклер', amount_byn: 42.0, quantity: 14, unit: 'шт' },
    { name: 'Хлеб тостовый', amount_byn: 36.0, quantity: 12, unit: 'шт' },
    { name: 'Фокачча', amount_byn: 33.0, quantity: 11, unit: 'шт' },
    { name: 'Маффин', amount_byn: 28.0, quantity: 14, unit: 'шт' },
    { name: 'Пирожок с капустой', amount_byn: 22.0, quantity: 22, unit: 'шт' },
  ],
  weekComparison: { current_week_byn: 118.2, prev_week_byn: 134.6, delta_pct: -12.2 },
}

const BAR: Subtype = {
  daySample: [5, 7, 9, 6, 14, 28, 32],
  totalRecords: 38,
  totalAmount: 412.8,
  reasons: [
    { reason: 'пролив', reason_label: 'Пролив', amount_byn: 158.6, count: 14 },
    { reason: 'бой', reason_label: 'Бой', amount_byn: 122.4, count: 8 },
    { reason: 'не_продано', reason_label: 'Не продано', amount_byn: 86.5, count: 10 },
    { reason: 'брак', reason_label: 'Брак', amount_byn: 45.3, count: 6 },
  ],
  topItems: [
    { name: 'Просекко', amount_byn: 96.0, quantity: 8, unit: 'бут' },
    { name: 'Бокал красного', amount_byn: 64.0, quantity: 16, unit: 'шт' },
    { name: 'Афтепати-сет', amount_byn: 48.0, quantity: 4, unit: 'шт' },
    { name: 'Aperol Spritz', amount_byn: 42.0, quantity: 7, unit: 'шт' },
    { name: 'Tonic Water', amount_byn: 28.0, quantity: 14, unit: 'бут' },
    { name: 'Виски Glenmorangie', amount_byn: 84.0, quantity: 2, unit: 'бут' },
    { name: 'Бокалы (бой)', amount_byn: 35.0, quantity: 7, unit: 'шт' },
    { name: 'Оливки', amount_byn: 15.8, quantity: 4, unit: 'кг' },
  ],
  weekComparison: { current_week_byn: 92.4, prev_week_byn: 81.0, delta_pct: 14.1 },
}

const BISTRO: Subtype = {
  daySample: [8, 14, 18, 12, 16, 22, 26],
  totalRecords: 62,
  totalAmount: 456.3,
  reasons: [
    { reason: 'не_продано', reason_label: 'Не продано', amount_byn: 198.4, count: 28 },
    { reason: 'просрочка', reason_label: 'Просрочка', amount_byn: 124.6, count: 18 },
    { reason: 'брак', reason_label: 'Брак', amount_byn: 82.3, count: 11 },
    { reason: 'бой', reason_label: 'Бой', amount_byn: 51.0, count: 5 },
  ],
  topItems: [
    { name: 'Суп дня', amount_byn: 84.0, quantity: 21, unit: 'порц' },
    { name: 'Греческий салат', amount_byn: 72.0, quantity: 12, unit: 'порц' },
    { name: 'Паста карбонара', amount_byn: 66.0, quantity: 11, unit: 'порц' },
    { name: 'Котлета по-киевски', amount_byn: 54.0, quantity: 9, unit: 'порц' },
    { name: 'Тирамису', amount_byn: 36.0, quantity: 12, unit: 'шт' },
    { name: 'Куриный бульон', amount_byn: 28.5, quantity: 19, unit: 'порц' },
    { name: 'Хлеб (комплимент)', amount_byn: 22.0, quantity: 44, unit: 'шт' },
    { name: 'Сметана', amount_byn: 14.0, quantity: 7, unit: 'л' },
  ],
  weekComparison: { current_week_byn: 102.6, prev_week_byn: 98.4, delta_pct: 4.3 },
}

const FOODTRUCK: Subtype = {
  daySample: [4, 6, 9, 5, 8, 18, 24],
  totalRecords: 33,
  totalAmount: 218.4,
  reasons: [
    { reason: 'не_продано', reason_label: 'Не продано', amount_byn: 124.8, count: 18 },
    { reason: 'просрочка', reason_label: 'Просрочка', amount_byn: 56.2, count: 9 },
    { reason: 'брак', reason_label: 'Брак', amount_byn: 24.4, count: 4 },
    { reason: 'пролив', reason_label: 'Пролив', amount_byn: 13.0, count: 2 },
  ],
  topItems: [
    { name: 'Бургер-котлета', amount_byn: 56.0, quantity: 14, unit: 'шт' },
    { name: 'Картофель фри', amount_byn: 36.0, quantity: 12, unit: 'порц' },
    { name: 'Булочка для бургера', amount_byn: 28.0, quantity: 28, unit: 'шт' },
    { name: 'Сыр чеддер', amount_byn: 24.0, quantity: 2, unit: 'кг' },
    { name: 'Соус BBQ', amount_byn: 14.0, quantity: 7, unit: 'л' },
    { name: 'Луковые кольца', amount_byn: 18.0, quantity: 9, unit: 'порц' },
    { name: 'Кола', amount_byn: 12.0, quantity: 12, unit: 'шт' },
    { name: 'Салат айсберг', amount_byn: 8.4, quantity: 3, unit: 'кг' },
  ],
  weekComparison: { current_week_byn: 48.3, prev_week_byn: 56.8, delta_pct: -15.0 },
}

const SUBTYPE_TABLE: Record<string, Subtype> = {
  fb_coffee: COFFEE,
  fb_bakery: BAKERY,
  fb_bar: BAR,
  fb_bistro: BISTRO,
  fb_foodtruck: FOODTRUCK,
  fb_other: COFFEE,
}

const SUBTYPE_SEED: Record<string, number> = {
  fb_coffee: 0xc0ffee,
  fb_bakery: 0xba6e7,
  fb_bar: 0xba12,
  fb_bistro: 0xb15730,
  fb_foodtruck: 0xfd7c4,
  fb_other: 0x07e7,
}

export function getDemoForSubtype(subtype: string | undefined): WasteData {
  const key = subtype && subtype in SUBTYPE_TABLE ? subtype : 'fb_coffee'
  const data = SUBTYPE_TABLE[key] as Subtype
  const seed = SUBTYPE_SEED[key] ?? 0xc0ffee
  return {
    total_records: data.totalRecords,
    total_amount_byn: data.totalAmount,
    by_day: generateDailyData(seed, 30, data.daySample),
    by_reason: data.reasons,
    top_items: data.topItems,
    week_comparison: data.weekComparison,
  }
}
