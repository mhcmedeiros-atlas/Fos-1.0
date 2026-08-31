'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SairButton() {
  const router = useRouter();

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={sair}
      className="rounded-[var(--radius-sm)] border border-[var(--linha)] px-3 py-1.5 text-sm text-[var(--tinta-suave)] transition hover:bg-[var(--superficie-afundada)]"
    >
      Sair
    </button>
  );
}
