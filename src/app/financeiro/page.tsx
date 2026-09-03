import { exigirSessao } from '@/lib/sessao';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/AppShell';
import { Vazio } from '@/components/Widget';

const dinheiro = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function Metrica({
  rotulo,
  valor,
  destaque = false,
  ajuda,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
  ajuda?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {rotulo}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: destaque ? 26 : 20,
          fontWeight: 600,
          marginTop: 8,
          color: destaque ? 'var(--sage-dark)' : 'var(--text-primary)',
        }}
      >
        {valor}
      </div>
      {ajuda && (
        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>{ajuda}</div>
      )}
    </div>
  );
}

export default async function FinanceiroPage() {
  const sessao = await exigirSessao();
  const supabase = await createClient();

  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();

  const [{ data: recebimentos }, { data: vendas }] = await Promise.all([
    supabase
      .from('recebimento')
      .select('id, venda_id, valor_bruto, taxa, valor_liquido, forma, recebido_em')
      .gte('recebido_em', inicioMes)
      .order('recebido_em', { ascending: false }),
    supabase
      .from('venda')
      .select('id, paciente_id, descricao, valor_total, forma_pagamento, parcelas, criado_em')
      .gte('criado_em', inicioMes)
      .order('criado_em', { ascending: false }),
  ]);

  const idsPacientes = [...new Set((vendas ?? []).map((v) => v.paciente_id))];
  const { data: pacientes } = idsPacientes.length
    ? await supabase.from('pessoa').select('id, nome').in('id', idsPacientes)
    : { data: [] };
  const nomePaciente = new Map((pacientes ?? []).map((p) => [p.id, p.nome]));

  const bruto = (recebimentos ?? []).reduce((s, r) => s + Number(r.valor_bruto), 0);
  const taxas = (recebimentos ?? []).reduce((s, r) => s + Number(r.taxa), 0);
  // valor_liquido é coluna gerada no banco: soma o que já vem calculado em vez
  // de repetir a conta aqui e arriscar divergir.
  const liquido = (recebimentos ?? []).reduce((s, r) => s + Number(r.valor_liquido ?? 0), 0);
  const vendido = (vendas ?? []).reduce((s, v) => s + Number(v.valor_total), 0);

  const mes = agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <AppShell sessao={sessao}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Financeiro</h1>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{mes}</span>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <Metrica rotulo="Recebido líquido" valor={dinheiro(liquido)} destaque />
        <Metrica rotulo="Bruto" valor={dinheiro(bruto)} />
        <Metrica
          rotulo="Taxas"
          valor={dinheiro(taxas)}
          ajuda={bruto > 0 ? `${((taxas / bruto) * 100).toFixed(1)}% do bruto` : undefined}
        />
        <Metrica rotulo="Vendido no mês" valor={dinheiro(vendido)} ajuda="Inclui o que ainda não entrou" />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        <section
          style={{
            flex: 1,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <h2 style={{ fontSize: 13, fontWeight: 700, padding: '12px var(--space-5)', borderBottom: '1px solid var(--border-default)' }}>
            Recebimentos
          </h2>
          {(recebimentos ?? []).length === 0 ? (
            <Vazio>Nenhum recebimento neste mês.</Vazio>
          ) : (
            (recebimentos ?? []).map((r, i) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: '11px var(--space-5)',
                  borderBottom: i < (recebimentos ?? []).length - 1 ? '1px solid var(--border-default)' : 'none',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.forma}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {new Date(r.recebido_em).toLocaleDateString('pt-BR')}
                    {Number(r.taxa) > 0 && ` · taxa ${dinheiro(Number(r.taxa))}`}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 600 }}>
                  {dinheiro(Number(r.valor_liquido ?? 0))}
                </div>
              </div>
            ))
          )}
        </section>

        <section
          style={{
            flex: 1,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <h2 style={{ fontSize: 13, fontWeight: 700, padding: '12px var(--space-5)', borderBottom: '1px solid var(--border-default)' }}>
            Vendas
          </h2>
          {(vendas ?? []).length === 0 ? (
            <Vazio>Nenhuma venda neste mês.</Vazio>
          ) : (
            (vendas ?? []).map((v, i) => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: '11px var(--space-5)',
                  borderBottom: i < (vendas ?? []).length - 1 ? '1px solid var(--border-default)' : 'none',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {nomePaciente.get(v.paciente_id) ?? 'Paciente'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {v.descricao ?? '—'} · {v.forma_pagamento}
                    {v.parcelas > 1 && ` ${v.parcelas}x`}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 600 }}>
                  {dinheiro(Number(v.valor_total))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}
