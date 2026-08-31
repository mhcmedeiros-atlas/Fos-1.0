'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ds/Button';
import { Grade, type Coluna } from './Grade';
import { PainelDetalhe } from './PainelDetalhe';
import {
  formatarDataExtenso, isoData, minutosDoDia, rotuloHora,
  type BlocoAgenda,
} from '@/lib/agenda';

type Visao = 'profissional' | 'sala';

export function AgendaCliente({
  data,
  blocos,
  profissionais,
  salas,
}: {
  data: string;
  blocos: BlocoAgenda[];
  profissionais: { id: string; nome: string }[];
  salas: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [visao, setVisao] = useState<Visao>('profissional');
  const [selecionado, setSelecionado] = useState<BlocoAgenda | null>(null);

  const dataObj = useMemo(() => {
    const [a, m, d] = data.split('-').map(Number);
    return new Date(a, m - 1, d);
  }, [data]);

  const colunas: Coluna[] = useMemo(() => {
    if (visao === 'profissional') {
      return profissionais.map((p) => {
        const meus = blocos.filter((b) => b.profissionalId === p.id);
        return {
          id: p.id,
          nome: p.nome,
          sub: meus.length === 0
            ? 'Sem agenda hoje'
            : `${meus.length} ${meus.length === 1 ? 'agendamento' : 'agendamentos'}`,
          blocos: meus,
          vazio: meus.length === 0,
        };
      });
    }
    return salas.map((s) => {
      const dela = blocos.filter((b) => b.salaId === s.id);
      return {
        id: s.id,
        nome: s.nome,
        sub: dela.length === 0
          ? 'Sem agenda hoje'
          : `${dela.length} ${dela.length === 1 ? 'agendamento' : 'agendamentos'}`,
        blocos: dela,
        vazio: dela.length === 0,
      };
    });
  }, [visao, blocos, profissionais, salas]);

  function irPara(deslocamento: number) {
    const d = new Date(dataObj);
    d.setDate(d.getDate() + deslocamento);
    router.push(`/agenda?data=${isoData(d)}`);
  }

  const botaoNav = {
    border: '1px solid var(--border-default)',
    background: 'var(--surface-card)',
    borderRadius: 'var(--radius-sm)',
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
  } as const;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-5)',
          borderBottom: '1px solid var(--border-default)',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => irPara(-1)} aria-label="Dia anterior" style={botaoNav}>
            <ChevronLeft size={16} />
          </button>
          <div
            style={{
              fontFamily: 'var(--font-display)', fontSize: 17,
              minWidth: 190, textAlign: 'center',
            }}
          >
            {formatarDataExtenso(dataObj)}
          </div>
          <button onClick={() => irPara(1)} aria-label="Próximo dia" style={botaoNav}>
            <ChevronRight size={16} />
          </button>
          <Button variant="secondary" size="sm" onClick={() => router.push('/agenda')}>
            Hoje
          </Button>
        </div>

        <div
          style={{
            display: 'flex', background: 'var(--surface-sunken)',
            borderRadius: 'var(--radius-md)', padding: 3, gap: 2,
          }}
        >
          {([['profissional', 'Por profissional'], ['sala', 'Por sala']] as const).map(([k, rotulo]) => (
            <button
              key={k}
              onClick={() => setVisao(k)}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                background: visao === k ? 'var(--surface-card)' : 'transparent',
                color: visao === k ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: visao === k ? 'var(--shadow-card)' : 'none',
              }}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      {colunas.length === 0 ? (
        <p style={{ padding: 'var(--space-8)', textAlign: 'center', fontSize: 13.5, color: 'var(--text-secondary)' }}>
          {visao === 'profissional'
            ? 'Nenhum profissional cadastrado. Cadastre a equipe para a agenda funcionar.'
            : 'Nenhuma sala cadastrada.'}
        </p>
      ) : (
        <div style={{ display: 'flex', minHeight: 0 }}>
          <Grade colunas={colunas} selecionadoId={selecionado?.id ?? null} onSelect={setSelecionado} />
          <PainelDetalhe
            bloco={selecionado}
            onFechar={() => setSelecionado(null)}
            onIniciar={(b) => router.push(`/atendimento/${b.id}`)}
          />
        </div>
      )}

      <footer
        style={{
          borderTop: '1px solid var(--border-default)',
          padding: 'var(--space-3) var(--space-5)',
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}
      >
        {blocos.length === 0
          ? 'Nenhum agendamento neste dia.'
          : `${blocos.length} ${blocos.length === 1 ? 'agendamento' : 'agendamentos'} · ${rotuloHora(
              Math.min(...blocos.map((b) => minutosDoDia(b.inicio)))
            )} às ${rotuloHora(Math.max(...blocos.map((b) => minutosDoDia(b.fim))))}`}
      </footer>
    </div>
  );
}
