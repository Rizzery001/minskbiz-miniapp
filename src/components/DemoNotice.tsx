import { Info } from 'lucide-react'

interface Props {
  text: string
}

export default function DemoNotice({ text }: Props) {
  return (
    <div
      className="rounded-lg flex items-start gap-2"
      style={{
        padding: 12,
        backgroundColor: 'var(--tg-secondary-bg)',
      }}
    >
      <span
        className="shrink-0"
        style={{
          color: 'var(--tg-link)',
          lineHeight: '20px',
          display: 'inline-flex',
        }}
      >
        <Info size={16} aria-hidden="true" />
      </span>
      <p
        style={{
          fontSize: 13,
          color: 'var(--tg-text)',
          lineHeight: 1.4,
          margin: 0,
        }}
      >
        {text}
      </p>
    </div>
  )
}
