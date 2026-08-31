import type { ReactNode } from 'react';
import { Sidebar } from './ds/Sidebar';
import { TopBar } from './TopBar';
import type { Sessao } from '@/lib/sessao';

/** Moldura de todas as telas autenticadas: barra superior + sidebar + conteúdo. */
export function AppShell({
  sessao,
  atendimentoAtivo = false,
  children,
}: {
  sessao: Sessao;
  atendimentoAtivo?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar clinica={sessao.clinicaNome} iniciais={sessao.iniciais} />
      <div style={{ display: 'flex', gap: 'var(--space-5)', padding: 'var(--space-5)', flex: 1, minHeight: 0 }}>
        <Sidebar perfil={sessao.perfil} atendimentoAtivo={atendimentoAtivo} />
        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}
