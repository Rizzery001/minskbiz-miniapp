/**
 * Design system for the public plenty.by site — one injected stylesheet,
 * zero dependencies. Poster-grade display typography on the system
 * stack (weight 900, tight tracking, uppercase), gold-on-craft palette,
 * reveal-on-scroll and float animations with prefers-reduced-motion
 * respected.
 */
export default function PublicStyles() {
  return (
    <style>{`
      .plenty-site {
        --p-bg: #121110;
        --p-bg2: #1c1917;
        --p-text: #f5f0e8;
        --p-muted: rgba(245, 240, 232, 0.62);
        --p-gold: #f5a623;
        --p-gold-deep: #d97706;
        --p-line: rgba(245, 240, 232, 0.12);
        background-color: var(--p-bg);
        color: var(--p-text);
        font-feature-settings: 'ss01' on;
      }
      .plenty-site ::selection {
        background: rgba(245, 166, 35, 0.35);
      }

      /* Poster display type */
      .p-display {
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: -0.02em;
        line-height: 0.98;
      }
      .p-display .gold {
        background: linear-gradient(115deg, #f6c453 15%, #f5a623 45%, #d97706 85%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .p-kicker {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--p-gold);
      }

      /* Pills */
      .p-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 999px;
        font-weight: 700;
        transition: transform 150ms ease, opacity 150ms ease, box-shadow 150ms ease;
        will-change: transform;
      }
      .p-pill:active { transform: scale(0.97); }
      .p-pill-gold {
        background: linear-gradient(180deg, #f6b83e, #ef9d0e);
        color: #171310;
        box-shadow: 0 8px 24px rgba(245, 166, 35, 0.28);
      }
      .p-pill-gold:hover { box-shadow: 0 10px 32px rgba(245, 166, 35, 0.4); transform: translateY(-1px); }
      .p-pill-ghost {
        border: 1px solid var(--p-line);
        color: var(--p-text);
      }
      .p-pill-ghost:hover { border-color: rgba(245, 240, 232, 0.35); }

      /* Cards */
      .p-card {
        background: var(--p-bg2);
        border: 1px solid var(--p-line);
        border-radius: 20px;
        transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
      }
      @media (hover: hover) {
        .p-card:hover {
          transform: translateY(-3px);
          border-color: rgba(245, 166, 35, 0.35);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
        }
      }

      /* Grain over covers so gradients feel like art, not CSS */
      .p-grain::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.5;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.06'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");
      }

      /* Scarcity bar */
      .p-meter {
        height: 4px;
        border-radius: 999px;
        background: rgba(245, 240, 232, 0.12);
        overflow: hidden;
      }
      .p-meter > span {
        display: block;
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #f6c453, #f5a623);
      }

      /* Live dot */
      .p-live {
        width: 8px; height: 8px; border-radius: 999px;
        background: #f5a623;
        box-shadow: 0 0 0 0 rgba(245, 166, 35, 0.6);
        animation: p-pulse 2s infinite;
      }
      @keyframes p-pulse {
        0% { box-shadow: 0 0 0 0 rgba(245, 166, 35, 0.55); }
        70% { box-shadow: 0 0 0 9px rgba(245, 166, 35, 0); }
        100% { box-shadow: 0 0 0 0 rgba(245, 166, 35, 0); }
      }

      /* Floating hero cards */
      @keyframes p-float {
        0%, 100% { transform: translateY(0) rotate(var(--tilt, 0deg)); }
        50% { transform: translateY(-10px) rotate(var(--tilt, 0deg)); }
      }
      .p-float { animation: p-float 7s ease-in-out infinite; }
      .p-float-slow { animation: p-float 9s ease-in-out infinite; }

      /* Marquee */
      .p-marquee { overflow: hidden; white-space: nowrap; }
      .p-marquee-track {
        display: inline-block;
        animation: p-marquee 28s linear infinite;
      }
      @keyframes p-marquee {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }

      /* Reveal on scroll */
      .p-reveal {
        opacity: 0;
        transform: translateY(18px);
        transition: opacity 600ms ease, transform 600ms ease;
      }
      .p-reveal.is-in {
        opacity: 1;
        transform: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .p-float, .p-float-slow, .p-marquee-track, .p-live { animation: none; }
        .p-reveal { opacity: 1; transform: none; transition: none; }
        .p-pill, .p-card { transition: none; }
      }
    `}</style>
  )
}
