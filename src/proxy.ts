import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Rotas alcançáveis sem sessão. `/redefinir-senha` NÃO entra aqui de propósito:
// ela exige a sessão que o link do e-mail cria em /auth/confirmar, então quem
// chega nela sem passar pelo link é mandado para o login.
// `/privacidade` precisa ser pública: a Meta exige que o rastreador dela
// consiga abrir a política de privacidade para publicar o app.
const ROTAS_PUBLICAS = ['/login', '/auth', '/recuperar-senha', '/privacidade'];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() revalida o token no servidor. Não usar getSession() aqui:
  // ela lê o cookie sem verificar, e um cookie pode ser forjado.
  const { data: { user } } = await supabase.auth.getUser();

  const ehPublica = ROTAS_PUBLICAS.some((rota) =>
    request.nextUrl.pathname.startsWith(rota)
  );

  if (!user && !ehPublica) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
