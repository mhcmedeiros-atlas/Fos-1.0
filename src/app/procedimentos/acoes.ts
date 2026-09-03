'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type EstadoFormulario = { erro?: string } | null;

export async function criarProcedimento(
  _anterior: EstadoFormulario,
  dados: FormData,
): Promise<EstadoFormulario> {
  const nome = String(dados.get('nome') ?? '').trim();
  const categoria = String(dados.get('categoria') ?? '').trim();
  const duracao = Number(dados.get('duracao_min'));
  const valor = Number(String(dados.get('valor_tabela') ?? '').replace(',', '.'));
  const retorno = String(dados.get('intervalo_retorno_dias') ?? '').trim();

  if (!nome) return { erro: 'Informe o nome do procedimento.' };
  if (!Number.isFinite(duracao) || duracao <= 0) return { erro: 'Duração deve ser maior que zero.' };
  if (!Number.isFinite(valor) || valor < 0) return { erro: 'Valor inválido.' };

  const supabase = await createClient();

  // clinica_id não vai daqui: o default da coluna e o RLS resolvem o tenant.
  // Mandar do cliente abriria espaço para gravar na clínica errada.
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) return { erro: 'Sessão expirada.' };

  const { data: usuario } = await supabase
    .from('usuario')
    .select('clinica_id')
    .eq('id', sessao.user.id)
    .maybeSingle();

  if (!usuario) return { erro: 'Usuário sem clínica vinculada.' };

  const { error } = await supabase.from('procedimento').insert({
    clinica_id: usuario.clinica_id,
    nome,
    categoria: categoria || null,
    duracao_min: duracao,
    valor_tabela: valor,
    intervalo_retorno_dias: retorno ? Number(retorno) : null,
  });

  if (error) return { erro: 'Não foi possível salvar o procedimento.' };

  revalidatePath('/procedimentos');
  redirect('/procedimentos');
}
