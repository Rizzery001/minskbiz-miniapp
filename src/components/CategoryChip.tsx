interface Props {
  label: string
  color: string
  emoji: string
  active: boolean
  onClick: () => void
}

export default function CategoryChip({ label, color, emoji, active, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors active:opacity-70"
      style={{
        backgroundColor: active ? color : 'var(--tg-secondary-bg)',
        borderColor: active ? color : 'transparent',
        color: active ? '#ffffff' : 'var(--tg-text)',
      }}
    >
      <span aria-hidden="true">{emoji}</span>
      <span>{label}</span>
    </button>
  )
}
