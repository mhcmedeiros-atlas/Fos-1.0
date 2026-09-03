'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type EstadoFormulario = { erro?: string } | null;

export async function criarPacote(
  _anterior: EstadoFormulario,
  dados: FormData,
): Promise<EstadoFormulario> {
  const nome = String(dados.get('nome') ?? '').trim();
  const valor = Number(String(dados.get('valor_total') ?? '').replace(',', '.'));
  const validade = Number(dados.get('validade_dias'));
  const condicao = String(dados.get('condicao_parcelamento') ?? '').trim();

  // Os itens chegam serializados porque a quantidade de linhas é dinâmica.
  let itens: { procedimento_id: string; quantidade_sessoes: number }[] = [];
  try {
    itens = JSON.parse(String(dados.get('itens') ?? '[]'));
  } catch {
    return { erro: 'Itens do pacote inválidos.' };
  }

  if (!nome) return { erro: 'Informe o nome do pacote.' };
  if (!Number.isFinite(valor) || valor < 0) return { erro: 'Valor total inválido.' };
  if (!Number.isFinite(validade) || validade <= 0) return { erro: 'Validade deve ser maior que zero.' };

  const validos = itens.filter((i) => i.procedimento_id && i.quantidade_sessoes > 0);
  if (validos.length === 0) return { erro: 'Adicione ao menos um procedimento com sessões.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('criar_pacote', {
    p_nome: nome,
    p_valor_total: valor,
    p_validade_dias: validade,
    p_condicao_parcelamento: condicao,
    p_itens: validos,
  });

  // A mensagem do banco é útil aqui (ex: violação de RLS quando não é admin),
  // então não a mascaramos com um texto genérico.
  if (error) return { erro: error.message };

  revalidatePath('/pacotes');
  redirect('/pacotes');
}
