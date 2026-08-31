// Portado do design system Fós — o elemento-assinatura do sistema.
// Indicador circular fino de sessões restantes de um pacote.

export function BalanceRing({
  filled = 0,
  total = 3,
  size = 56,
  stroke = 3,
  tone = 'sage',
  centerLabel = null,
}: {
  filled?: number;
  total?: number;
  size?: number;
  stroke?: number;
  tone?: 'sage' | 'terracotta' | 'champagne';
  centerLabel?: string | null;
}) {
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = total > 0 ? filled / total : 0;

  const color =
    tone === 'terracotta' ? 'var(--color-danger)'
    : tone === 'champagne' ? 'var(--color-accent)'
    : 'var(--color-primary)';

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={stroke} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          style={{ transition: 'stroke-dashoffset var(--duration-base) var(--ease-standard)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          fontFamily: 'var(--font-mono)',
          fontSize: size < 48 ? '11px' : '13px',
          fontWeight: 500,
          color: 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {centerLabel ?? `${filled}/${total}`}
      </div>
    </div>
  );
}
