'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/../supabase/types/database.types';

type Estagio = Database['public']['Enums']['estagio_funil'];

/**
 * Move o lead de estágio. Não faz validação de ordem de propósito: a recepção
 * precisa poder pular etapas (um lead que já chega decidido vai direto para
 * ganho) e voltar atrás quando registra errado.
 */
export async function moverLead(leadId: string, estagio: Estagio) {
  const supabase = await createClient();
  const { error } = await supabase.from('lead').update({ estagio }).eq('id', leadId);
  if (error) return { erro: 'Não foi possível mover o lead.' };
  revalidatePath('/funil');
  return { ok: true };
}
