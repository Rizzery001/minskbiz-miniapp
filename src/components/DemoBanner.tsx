export default function DemoBanner() {
  return (
    <div
      role="note"
      aria-label="Демо-режим"
      className="w-full flex items-center justify-center select-none"
      style={{
        position: 'relative',
        height: 28,
        flexShrink: 0,
        backgroundColor: '#fef3c7',
        color: '#92400e',
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '28px',
      }}
    >
      🧪 Демо-режим · данные тестовые
    </div>
  )
}
