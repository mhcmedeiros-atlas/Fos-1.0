'use client';

import { useState, useTransition } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ds/Button';
import { Aviso } from '@/components/ds/Campo';
import { registrarProcedimentoExtra } from '@/app/atendimento/[id]/acoes';

type Procedimento = { id: string; nome: string; valor_tabela: number };

const entrada: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'var(--surface-page)',
  fontSize: 13,
  color: 'var(--text-primary)',
  outline: 'none',
};

const rotulo: React.CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 700,
  marginBottom: 5,
};

const dinheiro = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ProcedimentoExtra({
  agendamentoId,
  procedimentos,
}: {
  agendamentoId: string;
  procedimentos: Procedimento[];
}) {
  const [aberto, setAberto] = useState(false);
  const [pendente, executar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [procedimentoId, setProcedimentoId] = useState('');
  const [tipo, setTipo] = useState<'sessao_avulsa' | 'retorno'>('sessao_avulsa');
  const [forma, setForma] = useState('');
  const [valor, setValor] = useState('');
  const [taxa, setTaxa] = useState('');

  const escolhido = procedimentos.find((p) => p.id === procedimentoId);

  if (!aberto) {
    return (
      <Button variant="secondary" size="sm" icon={<PlusCircle size={15} />} onClick={() => setAberto(true)}>
        Procedimento feito na hora
      </Button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Registra um procedimento que não estava agendado. Entra na agenda logo após
        o atendimento atual, já como realizado.
      </p>

      <label>
        <span style={rotulo}>Procedimento</span>
        <select value={procedimentoId} onChange={(e) => setProcedimentoId(e.target.value)} style={entrada}>
          <option value="">Selecione…</option>
          {procedimentos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} — {dinheiro(Number(p.valor_tabela))}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span style={rotulo}>Tipo</span>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as 'sessao_avulsa' | 'retorno')}
          style={entrada}
        >
          <option value="sessao_avulsa">Sessão avulsa (gera venda)</option>
          <option value="retorno">Retorno (não cobra)</option>
        </select>
      </label>

      {tipo === 'sessao_avulsa' && (
        <>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ flex: 1 }}>
              <span style={rotulo}>Valor (R$)</span>
              <input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder={escolhido ? String(escolhido.valor_tabela) : 'tabela'}
                style={entrada}
              />
            </label>
            <label style={{ flex: 1 }}>
              <span style={rotulo}>Taxa (R$)</span>
              <input value={taxa} onChange={(e) => setTaxa(e.target.value)} placeholder="0" style={entrada} />
            </label>
          </div>

          <label>
            <span style={rotulo}>Forma de pagamento</span>
            <select value={forma} onChange={(e) => setForma(e.target.value)} style={entrada}>
              <option value="">Cobrar depois (venda fica em aberto)</option>
              <option value="pix">Pix</option>
              <option value="cartao">Cartão</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </label>
        </>
      )}

      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {ok && <Aviso tipo="sucesso">Procedimento registrado.</Aviso>}

      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          variant="primary"
          size="sm"
          disabled={pendente || !procedimentoId}
          onClick={() =>
            executar(async () => {
              setErro(null);
              setOk(false);
              const r = await registrarProcedimentoExtra(agendamentoId, {
                procedimentoId,
                tipo,
                formaPagamento: tipo === 'sessao_avulsa' && forma ? forma : null,
                valor: valor ? Number(valor.replace(',', '.')) : null,
                taxa: taxa ? Number(taxa.replace(',', '.')) : 0,
              });
              if (r?.erro) setErro(r.erro);
              else {
                setOk(true);
                setProcedimentoId('');
                setValor('');
                setTaxa('');
                setForma('');
              }
            })
          }
        >
          {pendente ? 'Registrando…' : 'Registrar'}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setAberto(false)}>
          Fechar
        </Button>
      </div>
    </div>
  );
}
