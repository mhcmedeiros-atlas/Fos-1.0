import type { CSSProperties, ReactNode } from 'react';

/** Card de widget do Painel do dia: superfície plana com borda fina. */
export function Widget({
  titulo,
  acao,
  children,
  style,
}: {
  titulo: string;
  acao?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        ...style,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{titulo}</h2>
        {acao}
      </header>
      <div style={{ padding: 'var(--space-2) 0', flex: 1, minWidth: 0 }}>{children}</div>
    </section>
  );
}

/** Estado vazio: direto, sem ilustração — o padrão do design system Fós. */
export function Vazio({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        padding: 'var(--space-6) var(--space-5)',
        textAlign: 'center',
        fontSize: 13.5,
        color: 'var(--text-secondary)',
      }}
    >
      {children}
    </p>
  );
}

export function Linha({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: '10px var(--space-5)',
        borderBottom: '1px solid var(--border-default)',
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
