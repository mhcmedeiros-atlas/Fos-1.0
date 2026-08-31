import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TriangleAlert, CheckCircle2, IdCard, Phone, History as HistoryIcon, UserRound } from 'lucide-react';
import { exigirSessao } from '@/lib/sessao';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/AppShell';
import { BalanceRing } from '@/components/ds/BalanceRing';
import { Badge } from '@/components/ds/Badge';
import { ZonaPerigo } from '@/components/pacientes/ZonaPerigo';

function Cartao({ titulo, children }: { titulo?: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: 'var(--surface-card)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)',
      }}
    >
      {titulo && <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 'var(--space-3)' }}>{titulo}</h2>}
      {children}
    </section>
  );
}

export default async function FichaPacientePage({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const supabase = await createClient();
  const { id } = await params;

  const { data: p } = await supabase
    .from('pessoa')
    .select(`
      id, nome, apelido, cpf, telefone, email, origem, ativo, anonimizada_em,
      responsavel_financeiro:responsavel_financeiro_id (id, nome, telefone),
      indicante:indicado_por_id (nome)
    `)
    .eq('id', id)
    .maybeSingle();

  if (!p) notFound();

  const [{ data: alertas }, { data: pacotes }, { data: consentimento }, { data: historico }] = await Promise.all([
    supabase.from('alerta_seguranca').select('id, descricao').eq('paciente_id', id).eq('ativo', true),
    supabase
      .from('pacote_paciente')
      .select('id, nome, comprado_em, validade_em, status, itens:pacote_paciente_item (sessoes_total, sessoes_usadas)')
      .eq('paciente_id', id)
      .order('comprado_em', { ascending: false }),
    supabase.from('termo_consentimento').select('assinado_em').eq('paciente_id', id).order('assinado_em', { ascending: false }).limit(1).maybeSingle(),
    supabase
      .from('atendimento')
      .select('id, status, concluido_em, tipo, procedimento:agendamento_id (procedimento:procedimento_id (nome), profissional:profissional_id (pessoa:pessoa_id (nome)))')
      .eq('paciente_id', id)
      .order('criado_em', { ascending: false })
      .limit(10),
  ]);

  const responsavel = p.responsavel_financeiro as { id: string; nome: string; telefone: string | null } | null;
  const indicante = p.indicante as { nome: string } | null;
  const anonimizada = p.anonimizada_em !== null;

  return (
    <AppShell sessao={sessao}>
      {(alertas ?? []).map((a) => (
        <div
          key={a.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px var(--space-5)',
            background: 'var(--color-danger-soft)', border: '1px solid var(--terracotta-16)',
            borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)',
          }}
        >
          <TriangleAlert size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-danger)' }}>{a.descricao}</span>
        </div>
      ))}

      <Link href="/pacientes" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={14} /> Voltar
      </Link>

      <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Cartao>
            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--text-secondary)', flexShrink: 0 }}>
                {p.nome[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500 }}>{p.nome}</div>
                {p.origem && (
                  <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: 'var(--sage-dark)', background: 'var(--color-primary-soft)', padding: '3px 10px', borderRadius: 'var(--radius-pill)', marginTop: 6 }}>
                    {indicante ? `Indicação — ${indicante.nome}` : p.origem}
                  </span>
                )}
                {p.apelido && <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6 }}>{p.apelido}</div>}
                <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  {p.cpf && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IdCard size={13} />{p.cpf}</span>}
                  {p.telefone && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={13} />{p.telefone}</span>}
                </div>
              </div>
            </div>
          </Cartao>

          <Cartao>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <UserRound size={20} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Responsável financeiro
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{responsavel?.nome ?? p.nome}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  {responsavel ? `${responsavel.telefone ?? '—'}` : 'Mesma pessoa'}
                </div>
              </div>
            </div>
          </Cartao>

          <Cartao titulo="Pacotes ativos">
            {(pacotes ?? []).length === 0 ? (
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
                Nenhum pacote.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {(pacotes ?? []).map((pkg) => {
                  const itens = (pkg.itens ?? []) as { sessoes_total: number; sessoes_usadas: number }[];
                  const total = itens.reduce((s, i) => s + i.sessoes_total, 0);
                  const usadas = itens.reduce((s, i) => s + i.sessoes_usadas, 0);
                  return (
                    <div key={pkg.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)' }}>
                      <BalanceRing filled={usadas} total={total} size={48} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{pkg.nome}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          Comprado em {new Date(pkg.comprado_em).toLocaleDateString('pt-BR')} · válido até {new Date(pkg.validade_em).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Cartao>

          <Cartao titulo="Anamnese e consentimento">
            {consentimento ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--sage-dark)' }}>
                <CheckCircle2 size={14} /> Termo assinado em {new Date(consentimento.assinado_em).toLocaleDateString('pt-BR')}
              </div>
            ) : (
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>Anamnese ainda não preenchida.</p>
            )}
          </Cartao>
        </div>

        <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Cartao titulo="Histórico de atendimentos">
            {(historico ?? []).length === 0 ? (
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
                Nenhum atendimento registrado ainda.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(historico ?? []).map((h) => {
                  const ag = h.procedimento as { procedimento: { nome: string } | null; profissional: { pessoa: { nome: string } | null } | null } | null;
                  return (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <HistoryIcon size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{ag?.procedimento?.nome ?? '—'}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{ag?.profissional?.pessoa?.nome ?? '—'}</div>
                      </div>
                      <Badge status={h.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </Cartao>

          <Cartao>
            <ZonaPerigo pessoaId={p.id} ativo={p.ativo} anonimizada={anonimizada} />
          </Cartao>
        </div>
      </div>
    </AppShell>
  );
}
