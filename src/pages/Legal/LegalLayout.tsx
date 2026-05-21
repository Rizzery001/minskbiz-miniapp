import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { backButton } from '../../lib/telegram'

interface Props {
  title: string
  meta?: string
  children: ReactNode
}

/**
 * Shared chrome for public legal pages (Privacy, Terms).
 *
 * Renders without BottomNav or DemoBanner so the pages work as plain
 * URLs in any browser (linked from the App Store, About modal, etc.).
 * If opened inside Telegram WebApp we additionally wire the native
 * BackButton — outside Telegram the visible header button is the
 * primary way back.
 */
export default function LegalLayout({ title, meta, children }: Props) {
  useEffect(() => {
    backButton.show()
    backButton.onClick(handleBack)
    return () => {
      backButton.offClick(handleBack)
      backButton.hide()
    }
  }, [])

  return (
    <div
      className="min-h-full"
      style={{
        backgroundColor: 'var(--tg-bg)',
        color: 'var(--tg-text)',
      }}
    >
      <LegalProseStyles />
      <header
        className="sticky top-0 z-10 flex items-center gap-2"
        style={{
          backgroundColor: 'var(--tg-bg)',
          borderBottom: '1px solid var(--tg-hairline)',
          padding: '12px 16px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          aria-label="Назад"
          className="shrink-0 rounded-full flex items-center justify-center active:opacity-70 transition"
          style={{
            width: 36,
            height: 36,
            backgroundColor: 'var(--tg-secondary-bg)',
            color: 'var(--tg-text)',
            transitionDuration: '150ms',
          }}
        >
          <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <h1
          className="font-semibold truncate"
          style={{ fontSize: 17, lineHeight: 1.2 }}
        >
          {title}
        </h1>
      </header>
      <main
        className="krana-legal-prose"
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '24px 20px 48px',
        }}
      >
        {meta && <p className="krana-legal-meta">{meta}</p>}
        {children}
      </main>
    </div>
  )
}

function handleBack(): void {
  if (typeof window === 'undefined') return
  if (window.history.length > 1) {
    window.history.back()
    return
  }
  // No history (deep-linked from external) — go home.
  window.location.href = '/'
}

/**
 * Inline <style> for the legal prose. Co-located here so the legal
 * pages stay self-contained — index.css doesn't need to know about
 * them.
 */
function LegalProseStyles() {
  return (
    <style>{`
      .krana-legal-prose {
        font-size: 15px;
        line-height: 1.6;
        color: var(--tg-text);
      }
      .krana-legal-prose h2 {
        font-size: 17px;
        font-weight: 600;
        line-height: 1.3;
        margin-top: 28px;
        margin-bottom: 8px;
        color: var(--tg-text);
      }
      .krana-legal-prose h2:first-child {
        margin-top: 8px;
      }
      .krana-legal-prose p {
        margin: 0 0 12px 0;
      }
      .krana-legal-prose ul {
        margin: 0 0 12px 0;
        padding-left: 20px;
        list-style: disc outside;
      }
      .krana-legal-prose li {
        margin-bottom: 4px;
      }
      .krana-legal-prose a {
        color: var(--tg-link);
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .krana-legal-prose strong {
        color: var(--tg-text);
        font-weight: 600;
      }
      .krana-legal-prose .krana-legal-meta {
        margin: 0 0 24px 0;
        font-size: 13px;
        color: var(--tg-hint);
      }
      .krana-legal-prose .krana-legal-footer {
        margin-top: 32px;
        padding-top: 16px;
        border-top: 1px solid var(--tg-hairline);
        font-size: 13px;
        color: var(--tg-hint);
      }
      .krana-legal-prose table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0 16px 0;
        font-size: 14px;
      }
      .krana-legal-prose th,
      .krana-legal-prose td {
        text-align: left;
        padding: 8px 10px;
        border-bottom: 1px solid var(--tg-hairline);
        vertical-align: top;
      }
      .krana-legal-prose th {
        font-weight: 600;
        color: var(--tg-text);
        background-color: var(--tg-secondary-bg);
      }
      .krana-legal-prose td {
        color: var(--tg-text);
      }
    `}</style>
  )
}
