import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/../supabase/types/database.types';

export type Perfil = Database['public']['Enums']['perfil_acesso'];

export type Sessao = {
  userId: string;
  email: string;
  perfil: Perfil;
  clinicaId: string;
  clinicaNome: string;
  iniciais: string;
};

function iniciaisDe(nome: string) {
  const partes = nome.trim().split(/[\s@.]+/).filter(Boolean);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '??';
}

/**
 * Carrega a sessão do usuário logado com clínica e perfil.
 * Redireciona para /login sem sessão, e para /sem-vinculo se o login existe
 * mas não tem registro em `usuario` — estado real de um convite pendente.
 */
export async function exigirSessao(): Promise<Sessao> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('usuario')
    .select('perfil, clinica_id, clinica:clinica_id (nome), pessoa:pessoa_id (nome)')
    .eq('id', user.id)
    .maybeSingle();

  if (!data) redirect('/sem-vinculo');

  const clinicaNome = (data.clinica as { nome: string } | null)?.nome ?? 'Clínica';
  const pessoaNome = (data.pessoa as { nome: string } | null)?.nome;

  return {
    userId: user.id,
    email: user.email ?? '',
    perfil: data.perfil,
    clinicaId: data.clinica_id,
    clinicaNome,
    iniciais: iniciaisDe(pessoaNome ?? user.email ?? ''),
  };
}
