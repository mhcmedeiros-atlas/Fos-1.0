import { Search } from 'lucide-react';
import { SairButton } from './SairButton';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function TopBar({ clinica, iniciais }: { clinica: string; iniciais: string }) {
  const hoje = new Date();
  const dataFormatada = `${DIAS[hoje.getDay()]}, ${hoje.getDate()} de ${MESES[hoje.getMonth()]}`;

  return (
    <header
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-6)',
        borderBottom: '1px solid var(--border-default)',
        background: 'var(--surface-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500 }}>
          {clinica}
        </div>
        <div style={{ position: 'relative' }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-secondary)' }}
          />
          <input
            placeholder="Buscar paciente..."
            style={{
              width: 260,
              padding: '7px 12px 7px 32px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13.5,
              background: 'var(--surface-page)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{dataFormatada}</div>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--sage-16)',
            color: 'var(--sage-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          {iniciais}
        </div>
        <SairButton />
      </div>
    </header>
  );
}
