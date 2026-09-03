import Link from 'next/link';
import { Plus, Clock, Users } from 'lucide-react';
import { exigirSessao } from '@/lib/sessao';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ds/Button';
import { Vazio } from '@/components/Widget';

const dinheiro = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default async function ProcedimentosPage() {
  const sessao = await exigirSessao();
  const supabase = await createClient();

  const { data: procedimentos } = await supabase
    .from('procedimento')
    .select('id, nome, categoria, duracao_min, valor_tabela, intervalo_retorno_dias, ativo')
    .order('nome');

  // Quantos profissionais estão habilitados em cada procedimento. Vem separado
  // porque é contagem, não detalhe — a ficha do procedimento mostra quem são.
  const { data: habilitacoes } = await supabase
    .from('procedimento_profissional')
    .select('procedimento_id');

  const porProcedimento = new Map<string, number>();
  for (const h of habilitacoes ?? []) {
    porProcedimento.set(h.procedimento_id, (porProcedimento.get(h.procedimento_id) ?? 0) + 1);
  }

  const lista = procedimentos ?? [];

  return (
    <AppShell sessao={sessao}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-4)',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Procedimentos</h1>
        <Link href="/procedimentos/novo">
          <Button variant="primary" icon={<Plus size={15} />}>
            Novo procedimento
          </Button>
        </Link>
      </div>

      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {lista.length === 0 ? (
          <Vazio>Nenhum procedimento cadastrado ainda.</Vazio>
        ) : (
          lista.map((p, i) => {
            const habilitados = porProcedimento.get(p.id) ?? 0;
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  padding: '13px var(--space-5)',
                  borderBottom: i < lista.length - 1 ? '1px solid var(--border-default)' : 'none',
                  opacity: p.ativo ? 1 : 0.55,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {p.nome}
                    {!p.ativo && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        · Inativo
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 14,
                      marginTop: 4,
                      fontSize: 12.5,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {p.categoria && <span>{p.categoria}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      {p.duracao_min} min
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        // Zero habilitado é bloqueio de agenda: o banco recusa
                        // agendar com profissional não habilitado.
                        color: habilitados === 0 ? 'var(--color-danger)' : undefined,
                        fontWeight: habilitados === 0 ? 700 : 400,
                      }}
                    >
                      <Users size={12} />
                      {habilitados === 0 ? 'Sem profissional habilitado' : `${habilitados} habilitado${habilitados > 1 ? 's' : ''}`}
                    </span>
                    {p.intervalo_retorno_dias && <span>Retorno em {p.intervalo_retorno_dias}d</span>}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {dinheiro(Number(p.valor_tabela))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
