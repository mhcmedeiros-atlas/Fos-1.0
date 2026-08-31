'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ds/Button';
import { Aviso } from '@/components/ds/Campo';
import { iniciarAtendimento, concluirAtendimento } from '@/app/atendimento/[id]/acoes';

export function BotaoIniciar({ agendamentoId }: { agendamentoId: string }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div>
      <Button
        variant="primary"
        disabled={pendente}
        onClick={() =>
          iniciar(async () => {
            const r = await iniciarAtendimento(agendamentoId);
            if (r?.erro) setErro(r.erro);
          })
        }
      >
        {pendente ? 'Iniciando…' : 'Iniciar atendimento'}
      </Button>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
    </div>
  );
}

export function BotaoConcluir({
  agendamentoId,
  resumoEfeitos,
}: {
  agendamentoId: string;
  resumoEfeitos: string;
}) {
  const [pendente, concluir] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
      <Button
        variant="primary"
        disabled={pendente}
        onClick={() =>
          concluir(async () => {
            const r = await concluirAtendimento(agendamentoId);
            if (r?.erro) setErro(r.erro);
          })
        }
      >
        {pendente ? 'Concluindo…' : 'Concluir atendimento'}
      </Button>
      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 420 }}>
        {resumoEfeitos}
      </p>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
    </div>
  );
}
