'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { AtSign, MessageCircle, Globe, CalendarClock, type LucideIcon } from 'lucide-react';
import { moverLead } from '@/app/funil/acoes';
import { ESTAGIOS, type Estagio, type Origem, type Lead } from '@/lib/funil';

// O lucide removeu os ícones de marca nas versões recentes; AtSign representa
// o Instagram sem depender de logo de terceiro.
const ICONE_ORIGEM: Record<Origem, LucideIcon> = {
  whatsapp: MessageCircle,
  instagram: AtSign,
  formulario: Globe,
};

export function CartaoLead({ lead }: { lead: Lead }) {
  const [pendente, executar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const Icone = ICONE_ORIGEM[lead.origem];

  // Atrasada é sinal de ação, não decoração: fica em destaque.
  const atrasada =
    lead.proxima_acao_em !== null && new Date(lead.proxima_acao_em) < new Date(new Date().toDateString());

  return (
    <article
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        opacity: pendente ? 0.55 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icone size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        {lead.pessoa ? (
          <Link
            href={`/pacientes/${lead.pessoa.id}`}
            style={{ fontSize: 13.5, fontWeight: 600, color: 'inherit', textDecoration: 'none' }}
          >
            {lead.pessoa.nome}
          </Link>
        ) : (
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>Sem cadastro</span>
        )}
      </div>

      {lead.pessoa?.telefone && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{lead.pessoa.telefone}</div>
      )}

      {lead.proxima_acao && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: atrasada ? 'var(--color-danger)' : 'var(--text-secondary)',
            fontWeight: atrasada ? 700 : 400,
          }}
        >
          <CalendarClock size={12} style={{ flexShrink: 0 }} />
          <span>
            {lead.proxima_acao}
            {lead.proxima_acao_em &&
              ` · ${new Date(lead.proxima_acao_em).toLocaleDateString('pt-BR')}`}
          </span>
        </div>
      )}

      <select
        aria-label="Mover para outro estágio"
        value={lead.estagio}
        disabled={pendente}
        onChange={(e) =>
          executar(async () => {
            const r = await moverLead(lead.id, e.target.value as Estagio);
            if (r?.erro) setErro(r.erro);
          })
        }
        style={{
          width: '100%',
          padding: '5px 8px',
          fontSize: 12,
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-default)',
          background: 'var(--surface-sunken)',
          color: 'var(--text-primary)',
        }}
      >
        {ESTAGIOS.map((e) => (
          <option key={e.valor} value={e.valor}>
            {e.rotulo}
          </option>
        ))}
      </select>

      {erro && <div style={{ fontSize: 11.5, color: 'var(--color-danger)' }}>{erro}</div>}
    </article>
  );
}
