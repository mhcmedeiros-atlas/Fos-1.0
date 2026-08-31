'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthCard } from '@/components/ds/AuthCard';
import { Campo, Aviso } from '@/components/ds/Campo';
import { Button } from '@/components/ds/Button';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);

    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirmar?proximo=/redefinir-senha`,
    });

    // Sempre mostra a mesma confirmação, exista o e-mail ou não: revelar quais
    // e-mails têm conta é vazamento de informação (permite enumerar usuários).
    setEnviado(true);
    setCarregando(false);
  }

  if (enviado) {
    return (
      <AuthCard>
        <Aviso tipo="sucesso">
          Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha.
          Verifique a caixa de entrada e o spam.
        </Aviso>
        <div style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
          <Link href="/login" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Voltar para o login
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <form onSubmit={enviar}>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
          Informe seu e-mail e enviaremos um link para você criar uma nova senha.
        </p>

        <Campo
          label="E-mail"
          type="email"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
        />

        <div style={{ marginTop: 'var(--space-5)' }}>
          <Button type="submit" variant="primary" disabled={carregando}>
            {carregando ? 'Enviando…' : 'Enviar link'}
          </Button>
        </div>

        <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
          <Link href="/login" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Voltar para o login
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
