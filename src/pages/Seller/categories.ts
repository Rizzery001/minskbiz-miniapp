import type { SellerCategory } from '../../api/types'

export interface CategoryOption {
  value: SellerCategory
  emoji: string
  label: string
}

export const SELLER_CATEGORIES: CategoryOption[] = [
  { value: 'dairy', emoji: '🥛', label: 'Молочное' },
  { value: 'bakery', emoji: '🍞', label: 'Выпечка' },
  { value: 'eggs', emoji: '🥚', label: 'Яйца, птица' },
  { value: 'flour', emoji: '🌾', label: 'Мука, крупы' },
  { value: 'meat', emoji: '🥩', label: 'Мясо' },
  { value: 'vegetables', emoji: '🥬', label: 'Овощи' },
  { value: 'fruits', emoji: '🍎', label: 'Фрукты' },
  { value: 'other', emoji: '📦', label: 'Другое' },
]
