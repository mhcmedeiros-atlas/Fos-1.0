'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ds/Badge';
import { Button } from '@/components/ds/Button';
import { minutosDoDia, rotuloHora, type BlocoAgenda, type StatusAgenda } from '@/lib/agenda';

/** Status em que não faz sentido iniciar atendimento — mesma regra do protótipo. */
const NAO_INICIAVEL: StatusAgenda[] = ['em_atendimento', 'realizado', 'faltou', 'cancelado'];

function Par({ rotulo, valor, mono }: { rotulo: string; valor: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{rotulo}</span>
      <span
        className={mono ? 'tabular' : undefined}
        style={{ color: 'var(--text-primary)', fontWeight: mono ? 400 : 600, textAlign: 'right' }}
      >
        {valor}
      </span>
    </div>
  );
}

export function PainelDetalhe({
  bloco,
  onFechar,
  onIniciar,
}: {
  bloco: BlocoAgenda | null;
  onFechar: () => void;
  onIniciar: (b: BlocoAgenda) => void;
}) {
  if (!bloco) return null;

  const podeIniciar = !NAO_INICIAVEL.includes(bloco.status);

  return (
    <aside
      style={{
        width: 300,
        flexShrink: 0,
        borderLeft: '1px solid var(--border-default)',
        background: 'var(--surface-card)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ fontSize: 14, fontWeight: 700 }}>Detalhes do agendamento</h2>
        <button
          onClick={onFechar}
          aria-label="Fechar"
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
        >
          <X size={16} />
        </button>
      </header>

      <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: 'var(--text-primary)' }}>
            {bloco.paciente}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {bloco.procedimento}
          </div>
        </div>

        <Badge status={bloco.status} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 13 }}>
          <Par rotulo="Profissional" valor={bloco.profissional} />
          <Par rotulo="Sala" valor={bloco.sala ?? '—'} />
          <Par
            rotulo="Horário"
            valor={`${rotuloHora(minutosDoDia(bloco.inicio))} – ${rotuloHora(minutosDoDia(bloco.fim))}`}
            mono
          />
        </div>

        <div
          style={{
            display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
            paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-default)',
          }}
        >
          <Button
            variant="primary"
            size="sm"
            disabled={!podeIniciar}
            onClick={() => onIniciar(bloco)}
          >
            Iniciar atendimento
          </Button>
          {!podeIniciar && (
            <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Este agendamento já foi {bloco.status === 'em_atendimento' ? 'iniciado' : 'encerrado'}.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
