'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ds/Button';
import { alternarProfissional } from '@/app/equipe/acoes';

export function BotaoAtivar({ profissionalId, ativo }: { profissionalId: string; ativo: boolean }) {
  const [pendente, executar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <Button
        variant="secondary"
        size="sm"
        disabled={pendente}
        onClick={() =>
          executar(async () => {
            const r = await alternarProfissional(profissionalId, !ativo);
            if (r?.erro) setErro(r.erro);
          })
        }
      >
        {pendente ? '…' : ativo ? 'Desativar' : 'Reativar'}
      </Button>
      {erro && <span style={{ fontSize: 11, color: 'var(--color-danger)' }}>{erro}</span>}
    </div>
  );
}
