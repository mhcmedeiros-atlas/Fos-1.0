'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

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
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--tinta)]">
            Fós
          </h1>
          <p className="mt-1 text-sm text-[var(--tinta-suave)]">
            ERP para clínicas de estética avançada
          </p>
        </div>

        <form
          onSubmit={entrar}
          className="rounded-[var(--radius-lg)] border border-[var(--linha)] bg-[var(--superficie)] p-6"
        >
          <label className="block text-xs font-bold text-[var(--tinta)] mb-1.5">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[var(--radius-md)] border border-[var(--linha)] bg-[var(--porcelana)] px-3 py-2.5 text-sm outline-none focus:border-[var(--salvia)] focus:ring-2 focus:ring-[var(--salvia-16)]"
          />

          <label className="mt-4 block text-xs font-bold text-[var(--tinta)] mb-1.5">Senha</label>
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-[var(--radius-md)] border border-[var(--linha)] bg-[var(--porcelana)] px-3 py-2.5 text-sm outline-none focus:border-[var(--salvia)] focus:ring-2 focus:ring-[var(--salvia-16)]"
          />

          {erro && (
            <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--terracota-10)] px-3 py-2.5 text-sm text-[var(--terracota)]">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="mt-5 w-full rounded-[var(--radius-md)] bg-[var(--salvia)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--salvia-escuro)] disabled:opacity-60"
          >
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
