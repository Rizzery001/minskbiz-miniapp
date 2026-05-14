import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function ChartCard({ title, subtitle, children }: Props) {
  return (
    <section
      className="tg-shadow-sm rounded-xl"
      style={{
        backgroundColor: 'var(--tg-section-bg, var(--tg-bg))',
        padding: 16,
      }}
    >
      <header className="mb-3">
        <h2 className="font-medium" style={{ fontSize: 15 }}>
          {title}
        </h2>
        {subtitle && (
          <p
            className="mt-0.5"
            style={{ fontSize: 12, color: 'var(--tg-hint)' }}
          >
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </section>
  )
}
