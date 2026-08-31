import { SairButton } from '@/components/SairButton';

export default function SemVinculoPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
      <div
        style={{
          maxWidth: 460,
          background: 'var(--color-danger-soft)',
          border: '1px solid var(--terracotta-16)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
        }}
      >
        <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-danger)' }}>
          Acesso ainda não vinculado a uma clínica
        </h1>
        <p style={{ marginTop: 6, fontSize: 14, color: 'var(--color-danger)', lineHeight: 1.5 }}>
          Seu login existe, mas nenhum perfil foi associado a ele. Um administrador
          precisa vincular este usuário a uma clínica antes do acesso funcionar.
        </p>
        <div style={{ marginTop: 'var(--space-5)' }}>
          <SairButton />
        </div>
      </div>
    </main>
  );
}
