'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthCard } from '@/components/ds/AuthCard';
import { Campo, Aviso } from '@/components/ds/Campo';
import { Button } from '@/components/ds/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  // Lido depois da montagem (e não por useSearchParams) para manter a página
  // estática e evitar exigir um limite de Suspense só por causa disto.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('erro') === 'link_invalido') {
      setErro('Esse link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".');
    }
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      // Mensagem genérica de propósito: não revelar se o e-mail existe.
      setErro('E-mail ou senha incorretos.');
      setCarregando(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <AuthCard>
      <form onSubmit={entrar}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Campo
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            required
            autoComplete="email"
          />
          <Campo
            label="Senha"
            type="password"
            value={senha}
            onChange={setSenha}
            required
            autoComplete="current-password"
          />
        </div>

        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <div style={{ marginTop: 'var(--space-5)' }}>
          <div style={{ display: 'block' }}>
            <Button type="submit" variant="primary" disabled={carregando}>
              {carregando ? 'Entrando…' : 'Entrar'}
            </Button>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
          <Link
            href="/recuperar-senha"
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
            }}
          >
            Esqueci minha senha
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
