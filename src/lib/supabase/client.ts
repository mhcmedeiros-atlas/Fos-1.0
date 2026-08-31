import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/../supabase/types/database.types';

/** Cliente Supabase para uso em Client Components (roda no navegador). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
