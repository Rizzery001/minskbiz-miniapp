export interface CategoryStyle {
  color: string
  emoji: string
  label: string
}

export const FALLBACK_STYLE: CategoryStyle = {
  color: '#9ca3af',
  emoji: '🌾',
  label: 'Другое',
}

const STYLES: Record<string, CategoryStyle> = {
  dairy: { color: '#3b82f6', emoji: '🥛', label: 'Молочка' },
  молочка: { color: '#3b82f6', emoji: '🥛', label: 'Молочка' },
  meat: { color: '#ef4444', emoji: '🥩', label: 'Мясо' },
  мясо: { color: '#ef4444', emoji: '🥩', label: 'Мясо' },
  bakery: { color: '#f97316', emoji: '🥖', label: 'Выпечка' },
  выпечка: { color: '#f97316', emoji: '🥖', label: 'Выпечка' },
  vegetables: { color: '#22c55e', emoji: '🥬', label: 'Овощи' },
  овощи: { color: '#22c55e', emoji: '🥬', label: 'Овощи' },
  fruits: { color: '#eab308', emoji: '🍎', label: 'Фрукты' },
  фрукты: { color: '#eab308', emoji: '🍎', label: 'Фрукты' },
  honey: { color: '#f59e0b', emoji: '🍯', label: 'Мёд' },
  мёд: { color: '#f59e0b', emoji: '🍯', label: 'Мёд' },
  мед: { color: '#f59e0b', emoji: '🍯', label: 'Мёд' },
  berries: { color: '#a855f7', emoji: '🫐', label: 'Ягоды' },
  ягоды: { color: '#a855f7', emoji: '🫐', label: 'Ягоды' },
  eggs: { color: '#facc15', emoji: '🥚', label: 'Яйца' },
  яйца: { color: '#facc15', emoji: '🥚', label: 'Яйца' },
  fish: { color: '#06b6d4', emoji: '🐟', label: 'Рыба' },
  рыба: { color: '#06b6d4', emoji: '🐟', label: 'Рыба' },
  other: FALLBACK_STYLE,
  неизвестное: FALLBACK_STYLE,
}

export function normalizeCategory(category: string): string {
  return category.toLowerCase().trim()
}

export function getCategoryStyle(category: string): CategoryStyle {
  return STYLES[normalizeCategory(category)] ?? FALLBACK_STYLE
}
