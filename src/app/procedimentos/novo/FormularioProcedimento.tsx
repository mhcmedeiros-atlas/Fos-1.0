'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ds/Button';
import { Aviso } from '@/components/ds/Campo';
import { criarProcedimento, type EstadoFormulario } from '../acoes';

function CampoTexto({
  label,
  name,
  type = 'text',
  required = false,
  placeholder,
  ajuda,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  ajuda?: string;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          background: 'var(--surface-page)',
          fontSize: 14,
          color: 'var(--text-primary)',
          outline: 'none',
        }}
      />
      {ajuda && (
        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
          {ajuda}
        </span>
      )}
    </label>
  );
}

export function FormularioProcedimento() {
  const [estado, acao, pendente] = useActionState<EstadoFormulario, FormData>(
    criarProcedimento,
    null,
  );

  return (
    <form action={acao} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <CampoTexto label="Nome" name="nome" required placeholder="Toxina botulínica" />
      <CampoTexto label="Categoria" name="categoria" placeholder="Injetáveis" />

      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        <div style={{ flex: 1 }}>
          <CampoTexto label="Duração (min)" name="duracao_min" type="number" required placeholder="60" />
        </div>
        <div style={{ flex: 1 }}>
          <CampoTexto label="Valor de tabela (R$)" name="valor_tabela" required placeholder="1200,00" />
        </div>
      </div>

      <CampoTexto
        label="Intervalo de retorno (dias)"
        name="intervalo_retorno_dias"
        type="number"
        placeholder="15"
        ajuda="Opcional. Usado para sugerir o retorno depois do atendimento."
      />

      {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}

      <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-2)' }}>
        <Button type="submit" variant="primary" disabled={pendente}>
          {pendente ? 'Salvando…' : 'Salvar procedimento'}
        </Button>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Profissionais habilitados, insumos consumidos e sala/equipamento se definem
        depois, na ficha do procedimento. Sem nenhum profissional habilitado o banco
        recusa o agendamento — é proteção, não erro.
      </p>
    </form>
  );
}
