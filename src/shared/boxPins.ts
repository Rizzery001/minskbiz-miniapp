/**
 * Shared Yandex-map pin layout for chef boxes — used by the consumer
 * MapScreen and the public storefront so the two maps stay visually
 * identical. Dark pill, chef emoji, price in rubles, gold scarcity dot
 * when the box is almost gone.
 */

export function escapeHtml(input: string): string {
  return input.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case '"':
        return '&quot;'
      case "'":
        return '&#39;'
      default:
        return c
    }
  })
}

export function makeBoxIconLayout(
  api: YMapsApi,
  priceByn: number,
  slotsLeft: number,
  active: boolean,
): unknown {
  const priceLabel = escapeHtml(`${priceByn.toFixed(0)} р.`)
  const ring = active
    ? '0 0 0 3px var(--tg-link, #f5a623), 0 3px 8px rgba(0,0,0,0.45)'
    : '0 2px 6px rgba(0,0,0,0.35)'
  const scale = active ? 1.1 : 1
  // Scarcity accent: a small gold dot when the box is almost gone.
  const scarcityDot =
    slotsLeft <= 1
      ? '<span style="width:7px;height:7px;border-radius:50%;background:#f5a623;box-shadow:0 0 4px rgba(245,166,35,0.9);"></span>'
      : ''
  const html = `
    <div style="position:relative;width:0;height:0;">
      <div style="position:absolute;left:0;top:0;transform:translate(-50%,-50%) scale(${scale});padding:6px 11px;border-radius:15px;background:#1a1a1a;color:#ffffff;border:1.5px solid rgba(255,255,255,0.85);box-shadow:${ring};font-size:13px;font-weight:600;line-height:1;white-space:nowrap;display:inline-flex;gap:5px;align-items:center;user-select:none;">
        <span>👨‍🍳</span>
        <span>${priceLabel}</span>
        ${scarcityDot}
      </div>
    </div>
  `
  return api.templateLayoutFactory.createClass(html)
}
