'use client';

import { TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ds/Badge';
import {
  ALTURA_GRADE, INICIO_MIN, FIM_MIN, PX_POR_MIN,
  minutosDoDia, rotuloHora, posicionar,
  type BlocoAgenda,
} from '@/lib/agenda';

export type Coluna = {
  id: string;
  nome: string;
  sub: string;
  blocos: BlocoAgenda[];
  vazio?: boolean;
};

function Regua() {
  const marcas: number[] = [];
  for (let t = INICIO_MIN; t <= FIM_MIN; t += 60) marcas.push(t);

  return (
    <div
      style={{
        width: 56,
        flexShrink: 0,
        position: 'relative',
        height: ALTURA_GRADE,
        borderRight: '1px solid var(--border-default)',
      }}
    >
      {marcas.map((t) => (
        <div
          key={t}
          className="tabular"
          style={{
            position: 'absolute',
            top: (t - INICIO_MIN) * PX_POR_MIN - 6,
            right: 8,
            fontSize: 11.5,
            color: 'var(--text-secondary)',
          }}
        >
          {rotuloHora(t)}
        </div>
      ))}
    </div>
  );
}

function Linhas() {
  const linhas: number[] = [];
  for (let t = INICIO_MIN; t <= FIM_MIN; t += 30) linhas.push(t);

  return (
    <>
      {linhas.map((t) => (
        <div
          key={t}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: (t - INICIO_MIN) * PX_POR_MIN,
            borderTop: t % 60 === 0
              ? '1px solid var(--border-default)'
              : '1px dashed var(--line)',
            opacity: t % 60 === 0 ? 1 : 0.6,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}

function Bloco({
  bloco, colunas, indice, conflito, selecionado, onSelect,
}: {
  bloco: BlocoAgenda;
  colunas: number;
  indice: number;
  conflito: boolean;
  selecionado: boolean;
  onSelect: (b: BlocoAgenda) => void;
}) {
  const inicio = minutosDoDia(bloco.inicio);
  const fim = minutosDoDia(bloco.fim);
  const top = (inicio - INICIO_MIN) * PX_POR_MIN;
  const altura = Math.max((fim - inicio) * PX_POR_MIN, 30);

  const avaliacao = bloco.tipo === 'avaliacao';
  const largura = 100 / colunas;

  // Só mostra o que cabe: nada de texto cortado no meio da palavra.
  const rotuloTopo = conflito ? 'Conflito de horário' : avaliacao ? 'Avaliação' : null;
  const mostraRotulo = rotuloTopo !== null && altura >= 44;
  const mostraProc = altura >= 64;
  const mostraBadge = altura >= 84;

  const borda = conflito
    ? '1px solid var(--color-danger)'
    : avaliacao
    ? '1.5px dashed var(--border-strong)'
    : selecionado
    ? '1.5px solid var(--color-primary)'
    : '1px solid var(--border-default)';

  return (
    <button
      onClick={() => onSelect(bloco)}
      style={{
        position: 'absolute',
        top,
        height: altura,
        left: `calc(${indice * largura}% + 4px)`,
        width: `calc(${largura}% - 8px)`,
        background: conflito ? 'var(--color-danger-soft)' : 'var(--surface-card)',
        border: borda,
        borderRadius: 'var(--radius-sm)',
        padding: '5px 8px',
        cursor: 'pointer',
        overflow: 'hidden',
        textAlign: 'left',
        boxShadow: selecionado ? '0 0 0 3px var(--sage-16)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {mostraRotulo && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            fontWeight: 700,
            color: conflito ? 'var(--color-danger)' : 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
          }}
        >
          {conflito && <TriangleAlert size={10} style={{ flexShrink: 0 }} />}
          {rotuloTopo}
        </span>
      )}
      <span
        style={{
          fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)',
          lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
        {bloco.paciente}
      </span>
      {mostraProc && (
        <span
          style={{
            fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {bloco.procedimento}
        </span>
      )}
      {mostraBadge && <Badge status={bloco.status} />}
    </button>
  );
}

export function Grade({
  colunas,
  selecionadoId,
  onSelect,
}: {
  colunas: Coluna[];
  selecionadoId: string | null;
  onSelect: (b: BlocoAgenda) => void;
}) {
  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'auto', minWidth: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ minHeight: 56, borderBottom: '1px solid var(--border-default)' }} />
        <Regua />
      </div>

      <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
        {colunas.map((col, ci) => (
          <div
            key={col.id}
            style={{
              flex: 1,
              minWidth: 200,
              borderRight: ci < colunas.length - 1 ? '1px solid var(--border-default)' : 'none',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '12px 10px',
                borderBottom: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minHeight: 56,
              }}
            >
              <div
                style={{
                  width: 30, height: 30, borderRadius: 'var(--radius-pill)',
                  background: 'var(--surface-sunken)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 13,
                  color: 'var(--text-secondary)', flexShrink: 0,
                }}
              >
                {col.nome[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {col.nome}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{col.sub}</div>
              </div>
            </div>

            <div
              style={{
                position: 'relative',
                height: ALTURA_GRADE,
                background: col.vazio ? 'var(--surface-sunken)' : 'transparent',
              }}
            >
              <Linhas />
              {col.vazio && (
                <div
                  style={{
                    position: 'absolute', top: 24, left: 0, right: 0,
                    textAlign: 'center', fontSize: 12.5, color: 'var(--text-secondary)',
                  }}
                >
                  Nenhum agendamento hoje
                </div>
              )}
              {posicionar(col.blocos).map(({ bloco, colunas: n, indice, conflito }) => (
                <Bloco
                  key={bloco.id}
                  bloco={bloco}
                  colunas={n}
                  indice={indice}
                  conflito={conflito}
                  selecionado={selecionadoId === bloco.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
