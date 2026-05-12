import { FlaskConical } from 'lucide-react'

export default function DemoBanner() {
  return (
    <div
      role="note"
      aria-label="Демо-режим"
      className="demo-banner w-full flex items-center justify-center gap-1.5 select-none"
      style={{
        position: 'relative',
        height: 28,
        flexShrink: 0,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '28px',
      }}
    >
      <FlaskConical size={14} aria-hidden="true" />
      <span>Демо-режим · данные тестовые</span>
    </div>
  )
}
