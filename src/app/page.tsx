import { Cake } from 'lucide-react';
import { exigirSessao } from '@/lib/sessao';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/AppShell';
import { Widget, Vazio, Linha } from '@/components/Widget';
import { Badge } from '@/components/ds/Badge';
import { BalanceRing } from '@/components/ds/BalanceRing';

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export default async function PainelDoDiaPage() {
  const sessao = await exigirSessao();
  const supabase = await createClient();

  const hoje = new Date();
  const inicioDia = new Date(hoje); inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(hoje);    fimDia.setHours(23, 59, 59, 999);

  // Todas as consultas passam pelo RLS — nenhuma filtra por clinica_id à mão.
  // Se uma policy estiver errada, o resultado vem vazio em vez de vazar.
  const [agendaHoje, pacotesParados, caixaHoje, aniversariantes] = await Promise.all([
    supabase
      .from('agendamento')
      .select('id, inicio, status, paciente:paciente_id (nome), procedimento:procedimento_id (nome), profissional:profissional_id (id, pessoa:pessoa_id (nome)), sala:sala_id (nome)')
      .gte('inicio', inicioDia.toISOString())
      .lte('inicio', fimDia.toISOString())
      .order('inicio'),

    supabase
      .from('pacote_paciente')
      .select('id, nome, atualizado_em, paciente:paciente_id (nome), itens:pacote_paciente_item (sessoes_total, sessoes_usadas)')
      .eq('status', 'ativo')
      .lt('atualizado_em', new Date(Date.now() - 30 * 864e5).toISOString())
      .limit(5),

    supabase
      .from('recebimento')
      .select('valor_bruto, taxa, valor_liquido')
      .gte('recebido_em', inicioDia.toISOString())
      .lte('recebido_em', fimDia.toISOString()),

    supabase
      .from('pessoa')
      .select('id, nome, data_nascimento')
      .not('data_nascimento', 'is', null)
      .eq('ativo', true),
  ]);

  const agenda = agendaHoje.data ?? [];
  const pendentes = agenda.filter((a) => a.status === 'agendado');

  const recebimentos = caixaHoje.data ?? [];
  const bruto = recebimentos.reduce((s, r) => s + Number(r.valor_bruto), 0);
  const taxas = recebimentos.reduce((s, r) => s + Number(r.taxa), 0);
  const liquido = recebimentos.reduce((s, r) => s + Number(r.valor_liquido ?? 0), 0);

  const dia = hoje.getDate();
  const mes = hoje.getMonth() + 1;
  const niver = (aniversariantes.data ?? []).filter((p) => {
    if (!p.data_nascimento) return false;
    const [, m, d] = p.data_nascimento.split('-').map(Number);
    return d === dia && m === mes;
  });

  const nomeDe = (r: unknown) => (r as { nome: string } | null)?.nome ?? '—';

  return (
    <AppShell sessao={sessao}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-5)', alignItems: 'start' }}>

        <Widget titulo="Agenda de hoje" style={{ gridColumn: 'span 2' }}>
          {agenda.length === 0 ? (
            <Vazio>Nenhum agendamento para hoje.</Vazio>
          ) : (
            agenda.map((a) => {
              const prof = a.profissional as { pessoa: { nome: string } | null } | null;
              return (
                <Linha
                  key={a.id}
                  style={a.status === 'agendado' ? { borderLeft: '3px solid var(--border-strong)' } : undefined}
                >
                  <span className="tabular" style={{ width: 52, fontSize: 13, color: 'var(--text-secondary)' }}>
                    {hora(a.inicio)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{nomeDe(a.paciente)}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      {nomeDe(a.procedimento)} · {prof?.pessoa?.nome ?? '—'}
                      {a.sala ? ` · ${nomeDe(a.sala)}` : ''}
                    </div>
                  </div>
                  <Badge status={a.status} />
                </Linha>
              );
            })
          )}
        </Widget>

        <Widget titulo="Pendentes de confirmação">
          {pendentes.length === 0 ? (
            <Vazio>Todos os agendamentos de hoje já foram confirmados.</Vazio>
          ) : (
            pendentes.map((a) => (
              <Linha key={a.id}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600 }}>
                  {nomeDe(a.paciente)}
                </div>
                <span className="tabular" style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  {hora(a.inicio)}
                </span>
              </Linha>
            ))
          )}
        </Widget>

        <Widget titulo="Follow-ups vencidos">
          <Vazio>Nenhum follow-up atrasado hoje.</Vazio>
        </Widget>

        <Widget titulo="Pacotes parados">
          {(pacotesParados.data ?? []).length === 0 ? (
            <Vazio>Nenhum pacote parado há mais de 30 dias.</Vazio>
          ) : (
            (pacotesParados.data ?? []).map((p) => {
              const itens = (p.itens ?? []) as { sessoes_total: number; sessoes_usadas: number }[];
              const total = itens.reduce((s, i) => s + i.sessoes_total, 0);
              const usadas = itens.reduce((s, i) => s + i.sessoes_usadas, 0);
              const dias = Math.floor((Date.now() - new Date(p.atualizado_em).getTime()) / 864e5);
              return (
                <Linha key={p.id}>
                  <BalanceRing filled={usadas} total={total} size={40} tone="terracotta" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{nomeDe(p.paciente)}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{p.nome}</div>
                  </div>
                  <span className="tabular" style={{ fontSize: 12.5, color: 'var(--color-danger)', whiteSpace: 'nowrap' }}>
                    {dias}d parado
                  </span>
                </Linha>
              );
            })
          )}
        </Widget>

        <Widget titulo="Aniversariantes do dia">
          {niver.length === 0 ? (
            <Vazio>Nenhum aniversariante hoje.</Vazio>
          ) : (
            niver.map((p) => (
              <Linha key={p.id}>
                <Cake size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <span style={{ fontSize: 14 }}>{p.nome}</span>
              </Linha>
            ))
          )}
        </Widget>

        <Widget titulo="Caixa parcial do dia" style={{ gridColumn: 'span 3' }}>
          <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
            <div className="tabular" style={{ fontSize: 34, fontWeight: 500 }}>{brl(liquido)}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
              bruto {brl(bruto)} · taxas {brl(taxas)}
            </div>
          </div>
        </Widget>

      </div>
    </AppShell>
  );
}
