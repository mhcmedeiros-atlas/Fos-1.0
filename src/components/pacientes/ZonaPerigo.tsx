'use client';

import { useState, useTransition } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ds/Button';
import { Aviso } from '@/components/ds/Campo';
import { inativarPaciente, reativarPaciente, anonimizarPaciente } from '@/app/pacientes/[id]/acoes';

export function ZonaPerigo({
  pessoaId,
  ativo,
  anonimizada,
}: {
  pessoaId: string;
  ativo: boolean;
  anonimizada: boolean;
}) {
  const [pendente, executar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  if (anonimizada) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 'var(--space-4)', padding: '10px 14px',
          background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {ativo
            ? 'Some das buscas e da agenda. Histórico e pacotes preservados. Reversível.'
            : 'Paciente inativo — não aparece nas buscas nem na agenda.'}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={pendente}
          onClick={() =>
            executar(async () => {
              const r = ativo ? await inativarPaciente(pessoaId) : await reativarPaciente(pessoaId);
              if (r?.erro) setErro(r.erro);
            })
          }
        >
          {ativo ? 'Inativar paciente' : 'Reativar paciente'}
        </Button>
      </div>

      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 'var(--space-4)', padding: '10px 14px',
          background: 'var(--color-danger-soft)', borderRadius: 'var(--radius-md)',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--color-danger)', lineHeight: 1.4 }}>
          Apaga nome, CPF, contato e fotos. Vendas, sessões e rastreabilidade de
          lote são preservadas. <strong>Irreversível.</strong>
        </span>
        <Button variant="destructive" size="sm" onClick={() => setConfirmando(true)}>
          Anonimizar dados
        </Button>
      </div>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {confirmando && (
        <div
          role="dialog"
          aria-modal
          onClick={() => setConfirmando(false)}
          style={{
            position: 'fixed', inset: 0, background: '#2A282666',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 420, background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)', boxShadow: 'var(--shadow-popover)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <TriangleAlert size={18} style={{ color: 'var(--color-danger)' }} />
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Anonimizar este paciente?</h2>
            </div>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-danger)', marginBottom: 12 }}>
              Esta ação é irreversível.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Será apagado</div>
                <div style={{ color: 'var(--text-secondary)' }}>Nome, CPF, contato (telefone/e-mail) e fotos.</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Será preservado</div>
                <div style={{ color: 'var(--text-secondary)' }}>Vendas, sessões realizadas e rastreabilidade de lote.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={() => setConfirmando(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={pendente}
                onClick={() =>
                  executar(async () => {
                    const r = await anonimizarPaciente(pessoaId);
                    if (r?.erro) { setErro(r.erro); setConfirmando(false); }
                  })
                }
              >
                {pendente ? 'Anonimizando…' : 'Anonimizar definitivamente'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
