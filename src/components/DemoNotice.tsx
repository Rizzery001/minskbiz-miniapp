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
        aria-hidden="true"
        className="shrink-0"
        style={{ fontSize: 16, lineHeight: '20px' }}
      >
        ℹ️
      </span>
      <p
        style={{
          fontSize: 13,
          color: 'var(--tg-hint)',
          lineHeight: 1.4,
          margin: 0,
        }}
      >
        {text}
      </p>
    </div>
  )
}
