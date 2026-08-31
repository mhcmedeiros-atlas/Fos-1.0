'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type EstadoCriarPaciente = { erro?: string } | undefined;

export async function criarPaciente(
  _estadoAnterior: EstadoCriarPaciente,
  formData: FormData
): Promise<EstadoCriarPaciente> {
  const supabase = await createClient();

  const nome = String(formData.get('nome') ?? '').trim();
  if (!nome) return { erro: 'Nome é obrigatório.' };

  const { data: usuario } = await supabase.auth.getUser();
  const { data: perfil } = await supabase
    .from('usuario')
    .select('clinica_id')
    .eq('id', usuario.user!.id)
    .single();

  if (!perfil) return { erro: 'Sessão inválida.' };

  const cpf = String(formData.get('cpf') ?? '').trim() || null;
  const telefone = String(formData.get('telefone') ?? '').trim() || null;

  // Deduplicação por telefone/CPF (regras-de-negocio.md — mesma regra do
  // Funil): não bloqueia, só avisa, porque a recepção decide se é a mesma
  // pessoa. Aqui o formulário simples bloqueia por segurança até o Funil
  // ganhar a tela própria de resolução de duplicata.
  if (cpf || telefone) {
    const filtros = [cpf ? `cpf.eq.${cpf}` : null, telefone ? `telefone.eq.${telefone}` : null]
      .filter(Boolean)
      .join(',');
    const { data: possivelDuplicata } = await supabase
      .from('pessoa')
      .select('id, nome')
      .or(filtros)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle();

    if (possivelDuplicata) {
      return {
        erro: `Já existe um cadastro com esse CPF ou telefone: ${possivelDuplicata.nome}.`,
      };
    }
  }

  const { data: novo, error } = await supabase
    .from('pessoa')
    .insert({
      clinica_id: perfil.clinica_id,
      nome,
      apelido: String(formData.get('apelido') ?? '').trim() || null,
      cpf,
      telefone,
      email: String(formData.get('email') ?? '').trim() || null,
      origem: String(formData.get('origem') ?? '').trim() || null,
    })
    .select('id')
    .single();

  if (error || !novo) return { erro: 'Não foi possível criar o cadastro.' };

  redirect(`/pacientes/${novo.id}`);
}
