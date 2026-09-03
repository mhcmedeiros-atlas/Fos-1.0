import Link from 'next/link';
import { Stethoscope, ArrowRight } from 'lucide-react';
import { exigirSessao } from '@/lib/sessao';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ds/Badge';
import { Vazio } from '@/components/Widget';
import { minutosDoDia, rotuloHora } from '@/lib/agenda';

/**
 * Entrada do módulo de Atendimento.
 *
 * Existe porque o menu aponta para /atendimento, e sem esta página o link
 * quebrava: só havia /atendimento/[id], que exige o id de um agendamento.
 * Aqui a pessoa escolhe QUEM vai atender.
 */
export default async function AtendimentoIndexPage() {
  const sessao = await exigirSessao();
  const supabase = await createClient();

  const hoje = new Date();
  const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();
  const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1).toISOString();

  const { data: agendamentos } = await supabase
    .from('agendamento')
    .select('id, inicio, fim, status, tipo, paciente_id, procedimento_id, profissional_id')
    .gte('inicio', inicioDia)
    .lt('inicio', fimDia)
    .order('inicio');

  const lista = agendamentos ?? [];

  const idsPacientes = [...new Set(lista.map((a) => a.paciente_id))];
  const idsProcedimentos = [...new Set(lista.map((a) => a.procedimento_id))];

  const [{ data: pacientes }, { data: procedimentos }] = await Promise.all([
    idsPacientes.length
      ? supabase.from('pessoa').select('id, nome').in('id', idsPacientes)
      : Promise.resolve({ data: [] }),
    idsProcedimentos.length
      ? supabase.from('procedimento').select('id, nome').in('id', idsProcedimentos)
      : Promise.resolve({ data: [] }),
  ]);

  const nomePaciente = new Map((pacientes ?? []).map((p) => [p.id, p.nome]));
  const nomeProcedimento = new Map((procedimentos ?? []).map((p) => [p.id, p.nome]));

  // Em andamento primeiro: é onde alguém está com a paciente na sala agora.
  const emAndamento = lista.filter((a) => a.status === 'em_atendimento');
  const aAtender = lista.filter((a) => ['agendado', 'confirmado'].includes(a.status));
  const encerrados = lista.filter((a) =>
    ['realizado', 'faltou', 'cancelado'].includes(a.status),
  );

  function Linha({ a, ultimo }: { a: (typeof lista)[number]; ultimo: boolean }) {
    return (
      <Link
        href={`/atendimento/${a.id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
          padding: '13px var(--space-5)',
          borderBottom: ultimo ? 'none' : '1px solid var(--border-default)',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <span
          className="tabular"
          style={{ fontSize: 13, color: 'var(--text-secondary)', width: 96, flexShrink: 0 }}
        >
          {rotuloHora(minutosDoDia(a.inicio))} – {rotuloHora(minutosDoDia(a.fim))}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {nomePaciente.get(a.paciente_id) ?? 'Paciente'}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
            {nomeProcedimento.get(a.procedimento_id) ?? '—'}
          </div>
        </div>
        <Badge status={a.status} />
        <ArrowRight size={15} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
      </Link>
    );
  }

  function Bloco({
    titulo,
    itens,
    vazio,
  }: {
    titulo: string;
    itens: typeof lista;
    vazio: string;
  }) {
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
        {itens.length === 0 ? (
          <Vazio>{vazio}</Vazio>
        ) : (
          itens.map((a, i) => <Linha key={a.id} a={a} ultimo={i === itens.length - 1} />)
        )}
      </section>
    );
  }

  return (
    <AppShell sessao={sessao} atendimentoAtivo={emAndamento.length > 0}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Atendimento</h1>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </span>
      </div>

      {lista.length === 0 ? (
        <section
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-7)',
            textAlign: 'center',
          }}
        >
          <Stethoscope size={30} style={{ color: 'var(--text-secondary)' }} />
          <p style={{ fontSize: 14, marginTop: 'var(--space-3)' }}>
            Nenhum agendamento para hoje.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
            O atendimento começa a partir de um agendamento —{' '}
            <Link href="/agenda" style={{ color: 'var(--sage-dark)' }}>
              abra a Agenda
            </Link>{' '}
            para marcar.
          </p>
        </section>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {emAndamento.length > 0 && (
            <Bloco titulo="Em andamento" itens={emAndamento} vazio="" />
          )}
          <Bloco
            titulo="A atender hoje"
            itens={aAtender}
            vazio="Nada pendente para hoje."
          />
          {encerrados.length > 0 && (
            <Bloco titulo="Encerrados hoje" itens={encerrados} vazio="" />
          )}
        </div>
      )}
    </AppShell>
  );
}
