import { exigirSessao } from '@/lib/sessao';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/AppShell';
import { CartaoLead, ESTAGIOS, type Lead } from '@/components/funil/CartaoLead';

export default async function FunilPage() {
  const sessao = await exigirSessao();
  const supabase = await createClient();

  // Sem filtro de clinica_id: o RLS já restringe ao tenant da sessão.
  const { data: leads } = await supabase
    .from('lead')
    .select('id, estagio, origem, proxima_acao, proxima_acao_em, pessoa:pessoa_id (id, nome, telefone)')
    .order('criado_em', { ascending: false });

  const lista = (leads ?? []) as unknown as Lead[];
  const porEstagio = new Map(ESTAGIOS.map((e) => [e.valor, [] as Lead[]]));
  for (const lead of lista) porEstagio.get(lead.estagio)?.push(lead);

  const abertos = lista.filter((l) => l.estagio !== 'ganho' && l.estagio !== 'perdido').length;

  return (
    <AppShell sessao={sessao}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Funil</h1>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {abertos} {abertos === 1 ? 'lead em aberto' : 'leads em aberto'}
        </span>
      </div>

      {/* O quadro rola na horizontal em vez de espremer as colunas: com 7
          estágios, colunas estreitas demais tornam o cartão ilegível. */}
      <div style={{ overflowX: 'auto', paddingBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', minWidth: 'min-content' }}>
          {ESTAGIOS.map((estagio) => {
            const doEstagio = porEstagio.get(estagio.valor) ?? [];
            return (
              <section
                key={estagio.valor}
                style={{
                  width: 232,
                  flexShrink: 0,
                  background: 'var(--surface-sunken)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <header
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '0 2px',
                  }}
                >
                  <h2 style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.01em' }}>
                    {estagio.rotulo}
                  </h2>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      background: 'var(--surface-card)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '1px 8px',
                    }}
                  >
                    {doEstagio.length}
                  </span>
                </header>

                {doEstagio.length === 0 ? (
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      padding: '14px 0',
                    }}
                  >
                    Vazio
                  </p>
                ) : (
                  doEstagio.map((lead) => <CartaoLead key={lead.id} lead={lead} />)
                )}
              </section>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
