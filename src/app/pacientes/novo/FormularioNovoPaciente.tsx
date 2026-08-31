'use client';

import { useActionState } from 'react';
import { Aviso } from '@/components/ds/Campo';
import { Button } from '@/components/ds/Button';
import { criarPaciente } from './acoes';

// Campo controlado simples (sem o realce de foco do Campo do design system,
// que já assume value/onChange) para usar dentro de um <form action> nativo.
function CampoForm({ nome, label, tipo = 'text', obrigatorio = false }: {
  nome: string; label: string; tipo?: string; obrigatorio?: boolean;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
        {label}
      </span>
      <input
        name={nome}
        type={tipo}
        required={obrigatorio}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          background: 'var(--surface-page)',
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--text-primary)',
          outline: 'none',
        }}
      />
    </label>
  );
}

export function FormularioNovoPaciente() {
  const [estado, acao, pendente] = useActionState(criarPaciente, undefined);

  return (
    <form action={acao} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <CampoForm nome="nome" label="Nome completo" obrigatorio />
      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        <div style={{ flex: 1 }}><CampoForm nome="apelido" label="Apelido de tratamento" /></div>
        <div style={{ flex: 1 }}><CampoForm nome="cpf" label="CPF" /></div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        <div style={{ flex: 1 }}><CampoForm nome="telefone" label="WhatsApp" /></div>
        <div style={{ flex: 1 }}><CampoForm nome="email" label="E-mail" tipo="email" /></div>
      </div>
      <CampoForm nome="origem" label="Origem (como chegou até a clínica)" />

      {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}

      <div style={{ marginTop: 'var(--space-2)' }}>
        <Button variant="primary" disabled={pendente}>
          {pendente ? 'Salvando…' : 'Salvar paciente'}
        </Button>
      </div>
    </form>
  );
}
