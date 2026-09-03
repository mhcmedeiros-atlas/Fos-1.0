import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { exigirSessao } from '@/lib/sessao';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/AppShell';
import { Vazio } from '@/components/Widget';

const dinheiro = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const setaEstilo: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-default)',
  background: 'var(--surface-card)',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
};

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

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const sessao = await exigirSessao();
  const supabase = await createClient();

  // Mês navegável em vez de fixo no atual: nos primeiros dias do mês a tela
  // ficaria vazia e esconderia o movimento da semana anterior.
  const { mes } = await searchParams;
  const hoje = new Date();
  const referencia = /^\d{4}-\d{2}$/.test(mes ?? '')
    ? new Date(Number(mes!.slice(0, 4)), Number(mes!.slice(5, 7)) - 1, 1)
    : new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const agora = referencia;
  const inicioMes = referencia.toISOString();
  const fimMes = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 1).toISOString();

  const paraParam = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const anterior = paraParam(new Date(referencia.getFullYear(), referencia.getMonth() - 1, 1));
  const proximo = paraParam(new Date(referencia.getFullYear(), referencia.getMonth() + 1, 1));

  const [{ data: recebimentos }, { data: vendas }] = await Promise.all([
    supabase
      .from('recebimento')
      .select('id, venda_id, valor_bruto, taxa, valor_liquido, forma, recebido_em')
      .gte('recebido_em', inicioMes)
      .lt('recebido_em', fimMes)
      .order('recebido_em', { ascending: false }),
    supabase
      .from('venda')
      .select('id, paciente_id, descricao, valor_total, forma_pagamento, parcelas, criado_em')
      .gte('criado_em', inicioMes)
      .lt('criado_em', fimMes)
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

  const nomeMes = agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <AppShell sessao={sessao}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Financeiro</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <Link href={`/financeiro?mes=${anterior}`} aria-label="Mês anterior" style={setaEstilo}>
            <ChevronLeft size={16} />
          </Link>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 132, textAlign: 'center' }}>
            {nomeMes}
          </span>
          <Link href={`/financeiro?mes=${proximo}`} aria-label="Mês seguinte" style={setaEstilo}>
            <ChevronRight size={16} />
          </Link>
        </div>
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
