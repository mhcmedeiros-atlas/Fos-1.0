import { notFound } from 'next/navigation';
import { TriangleAlert, Camera, History } from 'lucide-react';
import { exigirSessao } from '@/lib/sessao';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ds/Badge';
import { BalanceRing } from '@/components/ds/BalanceRing';
import { BotaoIniciar, BotaoConcluir } from '@/components/atendimento/BotoesAtendimento';
import { minutosDoDia, rotuloHora } from '@/lib/agenda';

function Cartao({ titulo, children }: { titulo?: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
      }}
    >
      {titulo && (
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 'var(--space-3)' }}>{titulo}</h2>
      )}
      {children}
    </section>
  );
}

export default async function AtendimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sessao = await exigirSessao();
  const supabase = await createClient();
  const { id: agendamentoId } = await params;

  const { data: ag } = await supabase
    .from('agendamento')
    .select(`
      id, inicio, fim, status, tipo, pacote_paciente_item_id,
      paciente:paciente_id (id, nome, apelido),
      procedimento:procedimento_id (nome, intervalo_retorno_dias),
      profissional:profissional_id (pessoa:pessoa_id (nome)),
      sala:sala_id (nome)
    `)
    .eq('id', agendamentoId)
    .maybeSingle();

  if (!ag) notFound();

  const paciente = ag.paciente as { id: string; nome: string; apelido: string | null } | null;
  const procedimento = ag.procedimento as { nome: string; intervalo_retorno_dias: number | null } | null;
  const profissional = (ag.profissional as { pessoa: { nome: string } | null } | null)?.pessoa?.nome ?? '—';
  const sala = (ag.sala as { nome: string } | null)?.nome ?? null;

  const [{ data: atendimento }, { data: alertas }, { data: saldo }] = await Promise.all([
    supabase
      .from('atendimento')
      .select('id, status, iniciado_em, concluido_em')
      .eq('agendamento_id', agendamentoId)
      .maybeSingle(),

    // Alertas de segurança aparecem SEMPRE, em qualquer tipo de atendimento —
    // inclusive avaliação. Alergia é dado do paciente, não do tipo de sessão.
    supabase
      .from('alerta_seguranca')
      .select('id, tipo, descricao')
      .eq('paciente_id', paciente?.id ?? '')
      .eq('ativo', true),

    ag.pacote_paciente_item_id
      ? supabase
          .from('pacote_paciente_item')
          .select('sessoes_total, sessoes_usadas, procedimento_nome')
          .eq('id', ag.pacote_paciente_item_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const iniciado = atendimento !== null;
  const concluido = atendimento?.status === 'realizado';
  const avaliacao = ag.tipo === 'avaliacao';

  const efeitos = avaliacao
    ? 'Avaliação gratuita — não baixa sessão de pacote e não gera comissão.'
    : ag.tipo === 'sessao_pacote' && saldo
    ? `Sessão baixada do pacote (o anel avança para ${saldo.sessoes_usadas + 1} de ${saldo.sessoes_total}) · comissão gerada${
        procedimento?.intervalo_retorno_dias
          ? ` · retorno sugerido em ${procedimento.intervalo_retorno_dias} dias`
          : ''
      }.`
    : `Comissão gerada${
        procedimento?.intervalo_retorno_dias
          ? ` · retorno sugerido em ${procedimento.intervalo_retorno_dias} dias`
          : ''
      }.`;

  return (
    <AppShell sessao={sessao} atendimentoAtivo={iniciado && !concluido}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

        {(alertas ?? []).map((a) => (
          <div
            key={a.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              padding: '10px var(--space-5)',
              background: 'var(--color-danger-soft)',
              border: '1px solid var(--terracotta-16)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <TriangleAlert size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-danger)' }}>
              {a.descricao}
            </span>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <Cartao titulo="Protocolo de hoje">
              <div style={{ fontSize: 14.5, lineHeight: 1.6 }}>
                <div><strong>Procedimento:</strong> {procedimento?.nome ?? '—'}</div>
                <div><strong>Profissional:</strong> {profissional}</div>
                <div><strong>Sala:</strong> {sala ?? '—'}</div>
              </div>
            </Cartao>

            <Cartao titulo="Fotos">
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                {['Antes', 'Depois'].map((rotulo) => (
                  <div
                    key={rotulo}
                    style={{
                      flex: 1, minHeight: 150,
                      background: 'var(--surface-sunken)',
                      border: '1px dashed var(--border-strong)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: 8, color: 'var(--text-secondary)',
                    }}
                  >
                    <Camera size={26} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{rotulo}</span>
                  </div>
                ))}
              </div>
            </Cartao>
          </div>

          <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Cartao>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500 }}>
                {paciente?.nome ?? '—'}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                {procedimento?.nome} · {profissional}{sala ? ` · ${sala}` : ''}
              </div>
              <div className="tabular" style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
                {rotuloHora(minutosDoDia(ag.inicio))} – {rotuloHora(minutosDoDia(ag.fim))}
              </div>
              <div style={{ marginTop: 'var(--space-3)' }}>
                <Badge status={atendimento?.status ?? ag.status} />
              </div>

              {saldo && (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)',
                    borderTop: '1px solid var(--border-default)',
                  }}
                >
                  <BalanceRing filled={saldo.sessoes_usadas} total={saldo.sessoes_total} size={56} />
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                    sessões usadas do pacote, antes desta sessão
                  </span>
                </div>
              )}
            </Cartao>

            <Cartao>
              <div style={{ display: 'flex', gap: 10, fontSize: 13, alignItems: 'flex-start' }}>
                <History size={15} style={{ color: 'var(--text-secondary)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  {iniciado
                    ? `Iniciado às ${new Date(atendimento!.iniciado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                    : 'Atendimento ainda não iniciado.'}
                  {concluido && atendimento?.concluido_em &&
                    ` · concluído às ${new Date(atendimento.concluido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              </div>
            </Cartao>

            <Cartao>
              {concluido ? (
                <p style={{ fontSize: 13.5, color: 'var(--sage-dark)', lineHeight: 1.5 }}>
                  Atendimento concluído. {ag.tipo === 'sessao_pacote' && 'A sessão já foi baixada do pacote.'}
                </p>
              ) : iniciado ? (
                <BotaoConcluir agendamentoId={agendamentoId} resumoEfeitos={efeitos} />
              ) : (
                <BotaoIniciar agendamentoId={agendamentoId} />
              )}
            </Cartao>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
