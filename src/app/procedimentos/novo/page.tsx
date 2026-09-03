import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { exigirSessao } from '@/lib/sessao';
import { AppShell } from '@/components/AppShell';
import { FormularioProcedimento } from './FormularioProcedimento';

export default async function NovoProcedimentoPage() {
  const sessao = await exigirSessao();

  return (
    <AppShell sessao={sessao}>
      <div style={{ maxWidth: 560 }}>
        <Link
          href="/procedimentos"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            marginBottom: 'var(--space-4)',
          }}
        >
          <ArrowLeft size={14} /> Voltar
        </Link>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            marginBottom: 'var(--space-5)',
          }}
        >
          Novo procedimento
        </h1>

        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
          }}
        >
          <FormularioProcedimento />
        </div>
      </div>
    </AppShell>
  );
}
