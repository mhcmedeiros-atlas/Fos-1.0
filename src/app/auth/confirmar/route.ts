import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Recebe o clique no link enviado por e-mail (recuperação de senha, convite,
 * confirmação de cadastro), troca o token por uma sessão e segue para a página
 * de destino. Sem isso, o link do e-mail não vira sessão.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const proximo = searchParams.get('proximo') ?? '/';

  // Só aceita destino interno: `proximo` vem da URL e um valor absoluto
  // permitiria redirecionar para fora do domínio (open redirect).
  const destino = proximo.startsWith('/') && !proximo.startsWith('//') ? proximo : '/';

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${destino}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=link_invalido`);
}
