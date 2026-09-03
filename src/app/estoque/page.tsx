import { TriangleAlert, Package } from 'lucide-react';
import { exigirSessao } from '@/lib/sessao';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/AppShell';
import { Vazio } from '@/components/Widget';

const DIAS = 24 * 60 * 60 * 1000;

export default async function EstoquePage() {
  const sessao = await exigirSessao();
  const supabase = await createClient();

  const [{ data: insumos }, { data: lotes }] = await Promise.all([
    supabase.from('insumo').select('id, nome, unidade_consumo, estoque_minimo, ativo').order('nome'),
    supabase
      .from('insumo_lote')
      .select('id, insumo_id, numero_lote, quantidade_restante, validade, aberto_em, validade_pos_abertura, ativo')
      .eq('ativo', true),
  ]);

  const lotesPorInsumo = new Map<string, typeof lotes>();
  for (const l of lotes ?? []) {
    const atual = lotesPorInsumo.get(l.insumo_id) ?? [];
    atual.push(l);
    lotesPorInsumo.set(l.insumo_id, atual);
  }

  const hoje = new Date(new Date().toDateString());

  // Um lote vence por dois caminhos: a validade do fabricante e a validade
  // depois de aberto. Vale a que chegar primeiro.
  function venceEm(lote: { validade: string | null; validade_pos_abertura: string | null }) {
    const datas = [lote.validade, lote.validade_pos_abertura]
      .filter((d): d is string => d !== null)
      .map((d) => new Date(d).getTime());
    return datas.length ? new Date(Math.min(...datas)) : null;
  }

  const alertas: { insumo: string; texto: string }[] = [];
  for (const insumo of insumos ?? []) {
    const meus = lotesPorInsumo.get(insumo.id) ?? [];
    const total = meus.reduce((s, l) => s + Number(l.quantidade_restante), 0);

    if (insumo.estoque_minimo !== null && total < Number(insumo.estoque_minimo)) {
      alertas.push({
        insumo: insumo.nome,
        texto: `Estoque abaixo do mínimo (${total} de ${insumo.estoque_minimo} ${insumo.unidade_consumo})`,
      });
    }
    for (const lote of meus) {
      const vence = venceEm(lote);
      if (!vence) continue;
      const dias = Math.round((vence.getTime() - hoje.getTime()) / DIAS);
      if (dias < 0) {
        alertas.push({ insumo: insumo.nome, texto: `Lote ${lote.numero_lote} venceu há ${-dias} dias` });
      } else if (dias <= 30) {
        alertas.push({ insumo: insumo.nome, texto: `Lote ${lote.numero_lote} vence em ${dias} dias` });
      }
    }
  }

  return (
    <AppShell sessao={sessao}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 'var(--space-4)' }}>
        Estoque
      </h1>

      {alertas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 'var(--space-5)' }}>
          {alertas.map((a, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px var(--space-5)',
                background: 'var(--color-danger-soft)',
                border: '1px solid var(--terracotta-16)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <TriangleAlert size={15} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--color-danger)' }}>
                <strong>{a.insumo}</strong> — {a.texto}
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {(insumos ?? []).length === 0 ? (
          <Vazio>Nenhum insumo cadastrado ainda.</Vazio>
        ) : (
          (insumos ?? []).map((insumo, i) => {
            const meus = lotesPorInsumo.get(insumo.id) ?? [];
            const total = meus.reduce((s, l) => s + Number(l.quantidade_restante), 0);
            const abaixo =
              insumo.estoque_minimo !== null && total < Number(insumo.estoque_minimo);
            return (
              <div
                key={insumo.id}
                style={{
                  padding: '13px var(--space-5)',
                  borderBottom: i < (insumos ?? []).length - 1 ? '1px solid var(--border-default)' : 'none',
                  opacity: insumo.ativo ? 1 : 0.55,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Package size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{insumo.nome}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {meus.length} {meus.length === 1 ? 'lote' : 'lotes'} ativo
                      {meus.length === 1 ? '' : 's'}
                      {insumo.estoque_minimo !== null && ` · mínimo ${insumo.estoque_minimo}`}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                      fontWeight: 600,
                      color: abaixo ? 'var(--color-danger)' : 'var(--text-primary)',
                    }}
                  >
                    {total} {insumo.unidade_consumo}
                  </div>
                </div>

                {meus.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      marginTop: 8,
                      paddingLeft: 28,
                    }}
                  >
                    {meus.map((lote) => {
                      const vence = venceEm(lote);
                      const dias = vence
                        ? Math.round((vence.getTime() - hoje.getTime()) / DIAS)
                        : null;
                      const critico = dias !== null && dias <= 30;
                      return (
                        <span
                          key={lote.id}
                          style={{
                            fontSize: 11.5,
                            fontFamily: 'var(--font-mono)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-pill)',
                            background: critico ? 'var(--color-danger-soft)' : 'var(--surface-sunken)',
                            color: critico ? 'var(--color-danger)' : 'var(--text-secondary)',
                          }}
                        >
                          {lote.numero_lote} · {lote.quantidade_restante}
                          {lote.aberto_em && ' · aberto'}
                          {dias !== null && ` · ${dias < 0 ? 'vencido' : `${dias}d`}`}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
