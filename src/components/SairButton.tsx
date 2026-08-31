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
      style={{
        border: '1px solid var(--border-default)',
        background: 'transparent',
        borderRadius: 'var(--radius-sm)',
        padding: '6px 12px',
        fontSize: 13,
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
      }}
    >
      Sair
    </button>
  );
}
