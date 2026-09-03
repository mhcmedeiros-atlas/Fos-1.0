'use client';

import { useActionState, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ds/Button';
import { Aviso } from '@/components/ds/Campo';
import { criarPacote, type EstadoFormulario } from '../acoes';

type Procedimento = { id: string; nome: string; valor_tabela: number };
type Item = { procedimento_id: string; quantidade_sessoes: number };

const entrada: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'var(--surface-page)',
  fontSize: 14,
  color: 'var(--text-primary)',
  outline: 'none',
};

const rotulo: React.CSSProperties = {
  display: 'block',
  fontSize: 12.5,
  fontWeight: 700,
  marginBottom: 6,
};

const dinheiro = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function FormularioPacote({ procedimentos }: { procedimentos: Procedimento[] }) {
  const [estado, acao, pendente] = useActionState<EstadoFormulario, FormData>(criarPacote, null);
  const [itens, setItens] = useState<Item[]>([{ procedimento_id: '', quantidade_sessoes: 1 }]);

  const porId = new Map(procedimentos.map((p) => [p.id, p]));

  // Soma dos procedimentos avulsos: serve de referência para o desconto do
  // pacote, que é a razão comercial de existir pacote.
  const somaAvulsa = itens.reduce((s, i) => {
    const p = porId.get(i.procedimento_id);
    return s + (p ? Number(p.valor_tabela) * i.quantidade_sessoes : 0);
  }, 0);

  function atualizar(indice: number, mudanca: Partial<Item>) {
    setItens((atual) => atual.map((i, n) => (n === indice ? { ...i, ...mudanca } : i)));
  }

  return (
    <form action={acao} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <input type="hidden" name="itens" value={JSON.stringify(itens)} />

      <label>
        <span style={rotulo}>Nome do pacote</span>
        <input name="nome" required placeholder="Protocolo facial completo" style={entrada} />
      </label>

      <div>
        <span style={rotulo}>Procedimentos incluídos</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {itens.map((item, indice) => (
            <div key={indice} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                aria-label="Procedimento"
                value={item.procedimento_id}
                onChange={(e) => atualizar(indice, { procedimento_id: e.target.value })}
                style={{ ...entrada, flex: 1 }}
              >
                <option value="">Selecione…</option>
                {procedimentos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — {dinheiro(Number(p.valor_tabela))}
                  </option>
                ))}
              </select>
              <input
                aria-label="Sessões"
                type="number"
                min={1}
                value={item.quantidade_sessoes}
                onChange={(e) =>
                  atualizar(indice, { quantidade_sessoes: Number(e.target.value) || 1 })
                }
                style={{ ...entrada, width: 88 }}
              />
              <button
                type="button"
                aria-label="Remover procedimento"
                onClick={() => setItens((a) => a.filter((_, n) => n !== indice))}
                disabled={itens.length === 1}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: itens.length === 1 ? 'default' : 'pointer',
                  color: 'var(--text-secondary)',
                  opacity: itens.length === 1 ? 0.35 : 1,
                  padding: 6,
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setItens((a) => [...a, { procedimento_id: '', quantidade_sessoes: 1 }])}
          style={{
            marginTop: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--sage-dark)',
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
          }}
        >
          <Plus size={14} /> Adicionar procedimento
        </button>

        {somaAvulsa > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 10 }}>
            Somando avulso: <strong>{dinheiro(somaAvulsa)}</strong>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        <label style={{ flex: 1 }}>
          <span style={rotulo}>Valor total (R$)</span>
          <input name="valor_total" required placeholder="6200,00" style={entrada} />
        </label>
        <label style={{ flex: 1 }}>
          <span style={rotulo}>Validade (dias)</span>
          <input name="validade_dias" type="number" required placeholder="365" style={entrada} />
        </label>
      </div>

      <label>
        <span style={rotulo}>Condição de parcelamento</span>
        <input
          name="condicao_parcelamento"
          placeholder="Até 10x sem juros"
          style={entrada}
        />
      </label>

      {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}

      <div style={{ marginTop: 'var(--space-2)' }}>
        <Button type="submit" variant="primary" disabled={pendente}>
          {pendente ? 'Salvando…' : 'Salvar pacote'}
        </Button>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        O pacote e seus itens são gravados numa transação única no banco: ou entra
        completo, ou não entra. Só perfil administrador pode criar.
      </p>
    </form>
  );
}
