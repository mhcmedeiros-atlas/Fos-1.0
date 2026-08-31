'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Inicia o atendimento de um agendamento: cria o registro de atendimento e
 * move o agendamento para "em atendimento".
 *
 * Escrito como Server Action e não no cliente porque envolve duas escritas que
 * precisam andar juntas. O `unique` em agendamento_id impede atendimento
 * duplicado mesmo se dois cliques chegarem ao mesmo tempo.
 */
export async function iniciarAtendimento(agendamentoId: string) {
  const supabase = await createClient();

  const { data: ag, error: erroAg } = await supabase
    .from('agendamento')
    .select('id, clinica_id, paciente_id, profissional_id, tipo, pacote_paciente_item_id, status')
    .eq('id', agendamentoId)
    .single();

  if (erroAg || !ag) return { erro: 'Agendamento não encontrado.' };

  if (['realizado', 'faltou', 'cancelado'].includes(ag.status)) {
    return { erro: 'Este agendamento já foi encerrado.' };
  }

  // Já iniciado: segue para ele em vez de tentar criar de novo.
  const { data: existente } = await supabase
    .from('atendimento')
    .select('id')
    .eq('agendamento_id', agendamentoId)
    .maybeSingle();

  if (!existente) {
    const { error } = await supabase.from('atendimento').insert({
      clinica_id: ag.clinica_id,
      agendamento_id: ag.id,
      paciente_id: ag.paciente_id,
      profissional_id: ag.profissional_id,
      tipo: ag.tipo,
      pacote_paciente_item_id: ag.pacote_paciente_item_id,
      status: 'em_atendimento',
    });
    if (error) return { erro: 'Não foi possível iniciar o atendimento.' };

    await supabase
      .from('agendamento')
      .update({ status: 'em_atendimento' })
      .eq('id', agendamentoId);
  }

  revalidatePath('/agenda');
  revalidatePath('/');
  redirect(`/atendimento/${agendamentoId}`);
}

/**
 * Conclui o atendimento. A baixa de sessão do pacote e o carimbo de conclusão
 * são feitos por trigger no banco — aqui só muda o status, e o banco cuida do
 * resto. Isso mantém a regra válida mesmo se outra parte do sistema concluir
 * um atendimento por outro caminho.
 */
export async function concluirAtendimento(agendamentoId: string) {
  const supabase = await createClient();

  const { data: at } = await supabase
    .from('atendimento')
    .select('id, status')
    .eq('agendamento_id', agendamentoId)
    .maybeSingle();

  if (!at) return { erro: 'Atendimento não encontrado.' };
  if (at.status === 'realizado') return { erro: 'Este atendimento já foi concluído.' };

  const { error } = await supabase
    .from('atendimento')
    .update({ status: 'realizado' })
    .eq('id', at.id);

  if (error) return { erro: 'Não foi possível concluir o atendimento.' };

  await supabase
    .from('agendamento')
    .update({ status: 'realizado' })
    .eq('id', agendamentoId);

  revalidatePath('/agenda');
  revalidatePath('/');
  revalidatePath(`/atendimento/${agendamentoId}`);
  return { ok: true };
}
