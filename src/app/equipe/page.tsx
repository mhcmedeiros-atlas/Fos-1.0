import { Sparkles, ShieldCheck } from 'lucide-react';
import { exigirSessao } from '@/lib/sessao';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/AppShell';
import { Vazio } from '@/components/Widget';
import { BotaoAtivar } from '@/components/equipe/BotaoAtivar';
import type { Database } from '@/../supabase/types/database.types';

type Perfil = Database['public']['Enums']['perfil_acesso'];

const ROTULO_PERFIL: Record<Perfil, string> = {
  admin: 'Administrador',
  recepcao: 'Recepção',
  profissional: 'Profissional',
  financeiro: 'Financeiro',
};

export default async function EquipePage() {
  const sessao = await exigirSessao();
  const supabase = await createClient();

  const [{ data: profissionais }, { data: usuarios }, { data: habilitacoes }] = await Promise.all([
    supabase
      .from('profissional')
      .select('id, pessoa_id, usuario_id, funcao, conselho, comissao_padrao, ativo')
      .order('criado_em'),
    supabase.from('usuario').select('id, pessoa_id, perfil, ativo'),
    supabase.from('procedimento_profissional').select('profissional_id'),
  ]);

  const idsPessoas = [
    ...new Set([
      ...(profissionais ?? []).map((p) => p.pessoa_id),
      ...(usuarios ?? []).map((u) => u.pessoa_id).filter((id): id is string => id !== null),
    ]),
  ];
  const { data: pessoas } = idsPessoas.length
    ? await supabase.from('pessoa').select('id, nome, email, telefone').in('id', idsPessoas)
    : { data: [] };
  const porPessoa = new Map((pessoas ?? []).map((p) => [p.id, p]));

  const perfilPorUsuario = new Map((usuarios ?? []).map((u) => [u.id, u.perfil]));

  const contagem = new Map<string, number>();
  for (const h of habilitacoes ?? []) {
    contagem.set(h.profissional_id, (contagem.get(h.profissional_id) ?? 0) + 1);
  }

  // Usuários sem registro de profissional (recepção, financeiro) aparecem em
  // bloco próprio: têm acesso ao sistema mas não executam atendimento.
  const idsProfissionaisUsuario = new Set(
    (profissionais ?? []).map((p) => p.usuario_id).filter(Boolean),
  );
  const semAtendimento = (usuarios ?? []).filter((u) => !idsProfissionaisUsuario.has(u.id));

  return (
    <AppShell sessao={sessao}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 'var(--space-4)' }}>
        Equipe
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
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
            Profissionais
          </h2>
          {(profissionais ?? []).length === 0 ? (
            <Vazio>Nenhum profissional cadastrado.</Vazio>
          ) : (
            (profissionais ?? []).map((p, i) => {
              const pessoa = porPessoa.get(p.pessoa_id);
              const habilitados = contagem.get(p.id) ?? 0;
              const perfil = p.usuario_id ? perfilPorUsuario.get(p.usuario_id) : null;
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: '13px var(--space-5)',
                    borderBottom:
                      i < (profissionais ?? []).length - 1 ? '1px solid var(--border-default)' : 'none',
                    opacity: p.ativo ? 1 : 0.55,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--surface-sunken)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    {pessoa?.nome?.[0] ?? '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {pessoa?.nome ?? 'Sem cadastro'}
                      {!p.ativo && (
                        <span
                          style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}
                        >
                          · Inativo
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 14,
                        marginTop: 3,
                        fontSize: 12.5,
                        color: 'var(--text-secondary)',
                        flexWrap: 'wrap',
                      }}
                    >
                      {p.funcao && <span>{p.funcao}</span>}
                      {p.conselho && <span>{p.conselho}</span>}
                      {perfil && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ShieldCheck size={12} />
                          {ROTULO_PERFIL[perfil]}
                        </span>
                      )}
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          // Sem procedimento habilitado o profissional não pode
                          // ser agendado: o banco recusa.
                          color: habilitados === 0 ? 'var(--color-danger)' : undefined,
                          fontWeight: habilitados === 0 ? 700 : 400,
                        }}
                      >
                        <Sparkles size={12} />
                        {habilitados === 0
                          ? 'Sem procedimento habilitado'
                          : `${habilitados} procedimento${habilitados > 1 ? 's' : ''}`}
                      </span>
                      {p.comissao_padrao !== null && <span>Comissão {p.comissao_padrao}%</span>}
                    </div>
                  </div>
                  <BotaoAtivar profissionalId={p.id} ativo={p.ativo} />
                </div>
              );
            })
          )}
        </section>

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
            Acessos sem atendimento
          </h2>
          {semAtendimento.length === 0 ? (
            <Vazio>Todo mundo com acesso também atende.</Vazio>
          ) : (
            semAtendimento.map((u, i) => {
              const pessoa = u.pessoa_id ? porPessoa.get(u.pessoa_id) : null;
              return (
                <div
                  key={u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: '13px var(--space-5)',
                    borderBottom: i < semAtendimento.length - 1 ? '1px solid var(--border-default)' : 'none',
                    opacity: u.ativo ? 1 : 0.55,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {pessoa?.nome ?? 'Usuário sem pessoa vinculada'}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {ROTULO_PERFIL[u.perfil]}
                      {pessoa?.email ? ` · ${pessoa.email}` : ''}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: 620 }}>
          Convidar um novo membro cria um usuário de autenticação, o que exige chave
          de serviço e não pode sair do navegador com segurança. Por isso o convite
          fica de fora desta tela — hoje se faz pelo painel do Supabase, e entra no
          backlog como fluxo próprio no servidor.
        </p>
      </div>
    </AppShell>
  );
}
