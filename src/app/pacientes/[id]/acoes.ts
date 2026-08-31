'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Nível 1 de exclusão (regras-de-negocio.md): reversível, some das buscas
 * ativas, nada é apagado.
 */
export async function inativarPaciente(pessoaId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('pessoa').update({ ativo: false }).eq('id', pessoaId);
  if (error) return { erro: 'Não foi possível inativar.' };
  revalidatePath(`/pacientes/${pessoaId}`);
  revalidatePath('/pacientes');
  return { ok: true };
}

export async function reativarPaciente(pessoaId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('pessoa').update({ ativo: true }).eq('id', pessoaId);
  if (error) return { erro: 'Não foi possível reativar.' };
  revalidatePath(`/pacientes/${pessoaId}`);
  revalidatePath('/pacientes');
  return { ok: true };
}

/**
 * Nível 2 (regras-de-negocio.md): irreversível. Toda a lógica de apagar PII e
 * congelar o registro contra edição futura mora na função do banco
 * `anonimizar_paciente` — aqui só chamamos, para não duplicar a regra em dois
 * lugares que podem divergir com o tempo.
 */
export async function anonimizarPaciente(pessoaId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('anonimizar_paciente', { p_pessoa_id: pessoaId });
  if (error) return { erro: error.message };
  revalidatePath(`/pacientes/${pessoaId}`);
  revalidatePath('/pacientes');
  redirect('/pacientes');
}
