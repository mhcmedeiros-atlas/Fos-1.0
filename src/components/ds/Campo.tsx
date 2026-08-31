'use client';

import { useState, type CSSProperties } from 'react';

/** Campo de formulário do design system Fós: rótulo + input com foco sálvia. */
export function Campo({
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  autoComplete,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [focado, setFocado] = useState(false);

  const style: CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${focado ? 'var(--color-primary)' : 'var(--border-default)'}`,
    boxShadow: focado ? '0 0 0 3px var(--focus-ring)' : 'none',
    background: 'var(--surface-page)',
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
  };

  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          fontSize: 12.5,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
        style={style}
      />
    </label>
  );
}

/** Aviso inline: terracota para erro, sálvia para confirmação. */
export function Aviso({ tipo, children }: { tipo: 'erro' | 'sucesso'; children: React.ReactNode }) {
  const erro = tipo === 'erro';
  return (
    <div
      style={{
        marginTop: 'var(--space-4)',
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        background: erro ? 'var(--color-danger-soft)' : 'var(--color-primary-soft)',
        color: erro ? 'var(--color-danger)' : 'var(--sage-dark)',
        fontSize: 13.5,
        lineHeight: 1.45,
      }}
    >
      {children}
    </div>
  );
}
