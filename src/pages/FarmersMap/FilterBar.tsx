import { useEffect, useRef, useState } from 'react'
import CategoryChip from '../../components/CategoryChip'
import { getCategoryStyle } from './categoryColors'

interface Props {
  availableCategories: string[]
  selectedCategories: Set<string>
  onToggleCategory: (category: string) => void
  radiusKm: number
  onRadiusChange: (radius: number) => void
}

export default function FilterBar({
  availableCategories,
  selectedCategories,
  onToggleCategory,
  radiusKm,
  onRadiusChange,
}: Props) {
  const [localRadius, setLocalRadius] = useState(radiusKm)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    setLocalRadius(radiusKm)
  }, [radiusKm])

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  const handleSliderChange = (value: number) => {
    setLocalRadius(value)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      onRadiusChange(value)
    }, 300)
  }

  return (
    <div
      className="absolute top-0 inset-x-0 z-[1000] px-3 pb-3"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        background:
          'linear-gradient(to bottom, var(--tg-bg) 0%, var(--tg-bg) 75%, transparent 100%)',
      }}
    >
      {availableCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
          {availableCategories.map((cat) => {
            const style = getCategoryStyle(cat)
            return (
              <CategoryChip
                key={cat}
                label={style.label}
                color={style.color}
                emoji={style.emoji}
                active={selectedCategories.has(cat)}
                onClick={() => onToggleCategory(cat)}
              />
            )
          })}
        </div>
      )}
      <div className="flex items-center gap-3 px-1">
        <span
          className="text-xs whitespace-nowrap tabular-nums"
          style={{ color: 'var(--tg-hint)' }}
        >
          Радиус: {localRadius} км
        </span>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={localRadius}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: 'var(--tg-link)' }}
          aria-label="Радиус поиска"
        />
      </div>
    </div>
  )
}
