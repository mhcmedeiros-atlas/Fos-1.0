'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';

// Portado do design system Fós (componente Button do Claude Design).
// Estilo inline lendo CSS vars, como no original — mantém a fidelidade e faz
// o componente seguir automaticamente qualquer troca de token.

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type ButtonSize = 'sm' | 'md';

const VARIANT_STYLE: Record<ButtonVariant, CSSProperties> = {
  primary: { background: 'var(--color-primary)', color: 'var(--text-inverse)', border: '1px solid var(--color-primary)' },
  secondary: { background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' },
  tertiary: { background: 'transparent', color: 'var(--color-primary)', border: '1px solid transparent' },
  destructive: { background: 'var(--surface-card)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' },
};

const HOVER_STYLE: Record<ButtonVariant, CSSProperties> = {
  primary: { background: 'var(--color-primary-hover)', borderColor: 'var(--color-primary-hover)' },
  secondary: { background: 'var(--surface-sunken)' },
  tertiary: { background: 'var(--color-primary-soft)' },
  destructive: { background: 'var(--color-danger-soft)' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon = null,
  children,
  onClick,
  type = 'button',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  const [hover, setHover] = useState(false);

  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: size === 'sm' ? '7px 14px' : '10px 18px',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: size === 'sm' ? '13.5px' : '14.5px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all var(--duration-fast) var(--ease-standard)',
    opacity: disabled ? 0.45 : 1,
    ...VARIANT_STYLE[variant],
    ...(!disabled && hover ? HOVER_STYLE[variant] : {}),
  };

  return (
    <button
      type={type}
      style={style}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
