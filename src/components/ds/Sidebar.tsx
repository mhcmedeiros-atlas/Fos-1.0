'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sun, CalendarDays, Stethoscope, Users, Sparkles,
  Layers, Filter, Wallet, Package, IdCard,
  type LucideIcon,
} from 'lucide-react';
import type { Database } from '@/../supabase/types/database.types';

type Perfil = Database['public']['Enums']['perfil_acesso'];

type Item = {
  href: string;
  label: string;
  Icon: LucideIcon;
  /** Perfis que enxergam o item. A visibilidade real é garantida pelo RLS no
   *  banco — esconder aqui é conveniência de navegação, não controle de acesso. */
  perfis: Perfil[];
};

const TODOS: Perfil[] = ['admin', 'recepcao', 'profissional', 'financeiro'];

const ITENS: Item[] = [
  { href: '/',              label: 'Painel do dia',  Icon: Sun,          perfis: TODOS },
  { href: '/agenda',        label: 'Agenda',         Icon: CalendarDays, perfis: ['admin', 'recepcao', 'profissional'] },
  { href: '/atendimento',   label: 'Atendimento',    Icon: Stethoscope,  perfis: ['admin', 'recepcao', 'profissional'] },
  { href: '/pacientes',     label: 'Pacientes',      Icon: Users,        perfis: ['admin', 'recepcao', 'profissional'] },
  { href: '/procedimentos', label: 'Procedimentos',  Icon: Sparkles,     perfis: ['admin', 'recepcao', 'profissional'] },
  { href: '/pacotes',       label: 'Pacotes',        Icon: Layers,       perfis: ['admin', 'recepcao'] },
  { href: '/funil',         label: 'Funil',          Icon: Filter,       perfis: ['admin', 'recepcao'] },
  { href: '/financeiro',    label: 'Financeiro',     Icon: Wallet,       perfis: ['admin', 'financeiro'] },
  { href: '/estoque',       label: 'Estoque',        Icon: Package,      perfis: ['admin', 'recepcao', 'profissional'] },
  { href: '/equipe',        label: 'Equipe',         Icon: IdCard,       perfis: ['admin'] },
];

export function Sidebar({
  perfil,
  atendimentoAtivo = false,
}: {
  perfil: Perfil;
  /** Ponto champagne quando há atendimento em andamento (decisão do prompt 13). */
  atendimentoAtivo?: boolean;
}) {
  const pathname = usePathname();
  const visiveis = ITENS.filter((i) => i.perfis.includes(perfil));

  return (
    <nav
      style={{
        width: 216,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        fontFamily: 'var(--font-sans)',
        alignSelf: 'flex-start',
        position: 'sticky',
        top: 'var(--space-5)',
      }}
    >
      {visiveis.map(({ href, label, Icon }) => {
        const ativo = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              background: ativo ? 'var(--color-primary-soft)' : 'transparent',
              color: ativo ? 'var(--sage-dark)' : 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: ativo ? 600 : 500,
              textDecoration: 'none',
              transition: 'background var(--duration-fast) var(--ease-standard)',
            }}
          >
            <Icon size={17} strokeWidth={2} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{label}</span>
            {href === '/atendimento' && atendimentoAtivo && (
              <span
                aria-label="Atendimento em andamento"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-accent)',
                  flexShrink: 0,
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
