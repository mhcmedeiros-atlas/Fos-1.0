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

/**
 * Procedimento feito na hora, sem agendamento próprio — a paciente veio para um
 * e acabou fazendo outro.
 *
 * Toda a regra mora em `registrar_procedimento_extra`: cria o agendamento
 * retroativo, o atendimento já concluído e, se for avulso, a venda. Aqui não
 * repetimos nada disso, porque essa mesma situação vai chegar por outros
 * caminhos (recepção lançando depois, importação) e a regra precisa ser uma só.
 */
export async function registrarProcedimentoExtra(
  agendamentoOrigemId: string,
  dados: {
    procedimentoId: string;
    tipo: 'sessao_avulsa' | 'retorno';
    formaPagamento: string | null;
    valor: number | null;
    taxa: number;
  },
) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('registrar_procedimento_extra', {
    p_agendamento_origem_id: agendamentoOrigemId,
    p_procedimento_id: dados.procedimentoId,
    p_tipo: dados.tipo,
    p_forma_pagamento: dados.formaPagamento,
    p_valor: dados.valor,
    p_taxa: dados.taxa,
    p_pacote_paciente_item_id: null,
  });

  // A mensagem do banco é informativa aqui — "profissional não habilitado" e
  // conflito de agenda são exatamente o que a recepção precisa ler.
  if (error) return { erro: error.message };

  revalidatePath('/agenda');
  revalidatePath('/');
  revalidatePath(`/atendimento/${agendamentoOrigemId}`);
  return { ok: true };
}
