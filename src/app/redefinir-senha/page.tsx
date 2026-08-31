'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthCard } from '@/components/ds/AuthCard';
import { Campo, Aviso } from '@/components/ds/Campo';
import { Button } from '@/components/ds/Button';

const MINIMO = 8;

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < MINIMO) {
      setErro(`A senha precisa ter pelo menos ${MINIMO} caracteres.`);
      return;
    }
    if (senha !== confirmacao) {
      setErro('As senhas não coincidem.');
      return;
    }

    setCarregando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });

    if (error) {
      setErro('Não foi possível alterar a senha. O link pode ter expirado — peça um novo.');
      setCarregando(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <AuthCard>
      <form onSubmit={salvar}>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
          Escolha uma nova senha para sua conta.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Campo
            label="Nova senha"
            type="password"
            value={senha}
            onChange={setSenha}
            required
            autoComplete="new-password"
          />
          <Campo
            label="Confirme a nova senha"
            type="password"
            value={confirmacao}
            onChange={setConfirmacao}
            required
            autoComplete="new-password"
          />
        </div>

        <p style={{ marginTop: 'var(--space-2)', fontSize: 12, color: 'var(--text-secondary)' }}>
          Mínimo de {MINIMO} caracteres.
        </p>

        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <div style={{ marginTop: 'var(--space-5)' }}>
          <Button type="submit" variant="primary" disabled={carregando}>
            {carregando ? 'Salvando…' : 'Salvar nova senha'}
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
