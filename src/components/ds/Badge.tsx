import type { Database } from '@/../supabase/types/database.types';

// Portado do design system Fós. Os 6 status são os mesmos do enum
// `status_agenda` no banco — o tipo abaixo garante que uma mudança no enum
// quebre a compilação em vez de renderizar um badge vazio em produção.
type StatusAgenda = Database['public']['Enums']['status_agenda'];

const STATUS_MAP: Record<StatusAgenda, { label: string; color: string; bg: string }> = {
  agendado:       { label: 'Agendado',       color: 'var(--text-secondary)',   bg: 'var(--surface-sunken)' },
  confirmado:     { label: 'Confirmado',     color: 'var(--sage-dark)',        bg: 'var(--color-primary-soft)' },
  em_atendimento: { label: 'Em atendimento', color: 'var(--champagne-dark)',   bg: 'var(--color-accent-soft)' },
  realizado:      { label: 'Realizado',      color: 'var(--sage-dark)',        bg: 'var(--color-primary-soft)' },
  faltou:         { label: 'Faltou',         color: 'var(--color-danger)',     bg: 'var(--color-danger-soft)' },
  cancelado:      { label: 'Cancelado',      color: 'var(--text-secondary)',   bg: 'var(--surface-sunken)' },
};

export function Badge({ status }: { status: StatusAgenda }) {
  const s = STATUS_MAP[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: 'var(--radius-pill)',
        background: s.bg,
        color: s.color,
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        fontSize: '12.5px',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}
