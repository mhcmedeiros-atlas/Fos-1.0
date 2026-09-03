import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { exigirSessao } from '@/lib/sessao';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/AppShell';
import { Aviso } from '@/components/ds/Campo';
import { FormularioPacote } from './FormularioPacote';

export default async function NovoPacotePage() {
  const sessao = await exigirSessao();
  const supabase = await createClient();

  const { data: procedimentos } = await supabase
    .from('procedimento')
    .select('id, nome, valor_tabela')
    .eq('ativo', true)
    .order('nome');

  return (
    <AppShell sessao={sessao}>
      <div style={{ maxWidth: 640 }}>
        <Link
          href="/pacotes"
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

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 'var(--space-5)' }}>
          Novo pacote
        </h1>

        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
          }}
        >
          {(procedimentos ?? []).length === 0 ? (
            <Aviso tipo="erro">
              Não há procedimentos ativos. Cadastre procedimentos antes de montar um
              pacote — é deles que sai o saldo de sessões.
            </Aviso>
          ) : (
            <FormularioPacote
              procedimentos={(procedimentos ?? []).map((p) => ({
                id: p.id,
                nome: p.nome,
                valor_tabela: Number(p.valor_tabela),
              }))}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
