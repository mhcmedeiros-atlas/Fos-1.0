import type { ReactNode } from 'react';

/** Moldura das telas de autenticação: marca Fós + cartão centralizado. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-h1)',
              fontWeight: 'var(--weight-display)',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            Fós
          </h1>
          <p style={{ marginTop: 6, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            ERP para clínicas de estética avançada
          </p>
        </div>

        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
          }}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
