'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Desativar não apaga: o histórico de atendimentos e comissões continua
 * apontando para o profissional. Some da agenda e das listas de escolha.
 */
export async function alternarProfissional(profissionalId: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from('profissional').update({ ativo }).eq('id', profissionalId);
  if (error) return { erro: error.message };
  revalidatePath('/equipe');
  return { ok: true };
}
