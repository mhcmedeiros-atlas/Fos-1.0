import type { Database } from '@/../supabase/types/database.types';

export type Estagio = Database['public']['Enums']['estagio_funil'];
export type Origem = Database['public']['Enums']['origem_lead'];

export type Lead = {
  id: string;
  estagio: Estagio;
  origem: Origem;
  proxima_acao: string | null;
  proxima_acao_em: string | null;
  pessoa: { id: string; nome: string; telefone: string | null } | null;
};

/**
 * Mora aqui, e não no componente de cartão, porque a página é Server Component:
 * um valor exportado de um módulo 'use client' chega ao servidor como
 * referência de cliente, não como o array — e quebra em tempo de execução.
 */
export const ESTAGIOS: { valor: Estagio; rotulo: string }[] = [
  { valor: 'novo', rotulo: 'Novo' },
  { valor: 'em_contato', rotulo: 'Em contato' },
  { valor: 'avaliacao_agendada', rotulo: 'Avaliação agendada' },
  { valor: 'avaliacao_realizada', rotulo: 'Avaliação realizada' },
  { valor: 'orcamento_enviado', rotulo: 'Orçamento enviado' },
  { valor: 'ganho', rotulo: 'Ganho' },
  { valor: 'perdido', rotulo: 'Perdido' },
];
