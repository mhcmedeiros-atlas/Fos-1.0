import { Layers, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { exigirSessao } from '@/lib/sessao';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/AppShell';
import { BalanceRing } from '@/components/ds/BalanceRing';
import { Vazio } from '@/components/Widget';

const dinheiro = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function Cartao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <h2
        style={{
          fontSize: 13,
          fontWeight: 700,
          padding: '12px var(--space-5)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export default async function PacotesPage() {
  const sessao = await exigirSessao();
  const supabase = await createClient();

  const [{ data: catalogo }, { data: itens }, { data: vendidos }] = await Promise.all([
    supabase
      .from('pacote')
      .select('id, nome, valor_total, validade_dias, condicao_parcelamento, ativo')
      .order('nome'),
    supabase.from('pacote_item').select('pacote_id, quantidade_sessoes, procedimento_id'),
    supabase
      .from('pacote_paciente')
      .select('id, nome, paciente_id, valor_pago, comprado_em, validade_em, status')
      .order('comprado_em', { ascending: false })
      .limit(20),
  ]);

  // Nomes de procedimento e paciente vêm em consultas próprias: `pacote_item` e
  // `pacote_paciente` têm mais de um caminho até as tabelas de destino, e o
  // embed do PostgREST fica ambíguo.
  const idsProcedimentos = [...new Set((itens ?? []).map((i) => i.procedimento_id))];
  const { data: procedimentos } = idsProcedimentos.length
    ? await supabase.from('procedimento').select('id, nome').in('id', idsProcedimentos)
    : { data: [] };
  const nomeProcedimento = new Map((procedimentos ?? []).map((p) => [p.id, p.nome]));

  const idsPacientes = [...new Set((vendidos ?? []).map((v) => v.paciente_id))];
  const { data: pacientes } = idsPacientes.length
    ? await supabase.from('pessoa').select('id, nome').in('id', idsPacientes)
    : { data: [] };
  const nomePaciente = new Map((pacientes ?? []).map((p) => [p.id, p.nome]));

  const { data: saldos } = await supabase
    .from('pacote_paciente_item')
    .select('pacote_paciente_id, sessoes_total, sessoes_usadas');

  const saldoPorPacote = new Map<string, { total: number; usadas: number }>();
  for (const s of saldos ?? []) {
    const atual = saldoPorPacote.get(s.pacote_paciente_id) ?? { total: 0, usadas: 0 };
    atual.total += s.sessoes_total;
    atual.usadas += s.sessoes_usadas;
    saldoPorPacote.set(s.pacote_paciente_id, atual);
  }

  const itensPorPacote = new Map<string, typeof itens>();
  for (const i of itens ?? []) {
    const atual = itensPorPacote.get(i.pacote_id) ?? [];
    atual.push(i);
    itensPorPacote.set(i.pacote_id, atual);
  }

  return (
    <AppShell sessao={sessao}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 'var(--space-4)' }}>
        Pacotes
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Cartao titulo="Catálogo">
          {(catalogo ?? []).length === 0 ? (
            <Vazio>Nenhum pacote no catálogo.</Vazio>
          ) : (
            (catalogo ?? []).map((p, i) => {
              const doPacote = itensPorPacote.get(p.id) ?? [];
              const sessoes = doPacote.reduce((s, x) => s + x.quantidade_sessoes, 0);
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: '13px var(--space-5)',
                    borderBottom:
                      i < (catalogo ?? []).length - 1 ? '1px solid var(--border-default)' : 'none',
                    opacity: p.ativo ? 1 : 0.55,
                  }}
                >
                  <Layers size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{p.nome}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3 }}>
                      {sessoes} {sessoes === 1 ? 'sessão' : 'sessões'} ·{' '}
                      {doPacote
                        .map((x) => nomeProcedimento.get(x.procedimento_id) ?? '—')
                        .join(', ') || 'sem itens'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Válido {p.validade_dias} dias
                      {p.condicao_parcelamento ? ` · ${p.condicao_parcelamento}` : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    {dinheiro(Number(p.valor_total))}
                  </div>
                </div>
              );
            })
          )}
        </Cartao>

        <Cartao titulo="Pacotes vendidos">
          {(vendidos ?? []).length === 0 ? (
            <Vazio>Nenhum pacote vendido ainda.</Vazio>
          ) : (
            (vendidos ?? []).map((v, i) => {
              const saldo = saldoPorPacote.get(v.id) ?? { total: 0, usadas: 0 };
              const vencido = new Date(v.validade_em) < new Date(new Date().toDateString());
              return (
                <div
                  key={v.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: '13px var(--space-5)',
                    borderBottom:
                      i < (vendidos ?? []).length - 1 ? '1px solid var(--border-default)' : 'none',
                  }}
                >
                  <BalanceRing filled={saldo.usadas} total={saldo.total} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      <Link
                        href={`/pacientes/${v.paciente_id}`}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        {nomePaciente.get(v.paciente_id) ?? 'Paciente'}
                      </Link>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3 }}>
                      {v.nome} · {saldo.usadas}/{saldo.total} sessões
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        marginTop: 2,
                        // Vencido com saldo é dinheiro parado e conversa a ter
                        // com a paciente: precisa saltar aos olhos.
                        color:
                          vencido && saldo.usadas < saldo.total
                            ? 'var(--color-danger)'
                            : 'var(--text-secondary)',
                        fontWeight: vencido && saldo.usadas < saldo.total ? 700 : 400,
                      }}
                    >
                      <CalendarClock size={12} />
                      {vencido ? 'Venceu' : 'Vence'} em{' '}
                      {new Date(v.validade_em).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    {dinheiro(Number(v.valor_pago))}
                  </div>
                </div>
              );
            })
          )}
        </Cartao>
      </div>
    </AppShell>
  );
}
