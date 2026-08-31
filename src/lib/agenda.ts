import type { Database } from '@/../supabase/types/database.types';

export type StatusAgenda = Database['public']['Enums']['status_agenda'];
export type TipoAtendimento = Database['public']['Enums']['tipo_atendimento'];

/** Janela visível da grade. 08:00–19:00 como no protótipo aprovado. */
export const INICIO_MIN = 8 * 60;
export const FIM_MIN = 19 * 60;
/** Pixels por minuto — define a altura total da grade. */
export const PX_POR_MIN = 1.2;
export const ALTURA_GRADE = (FIM_MIN - INICIO_MIN) * PX_POR_MIN;

export function minutosDoDia(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function rotuloHora(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Status que não ocupam a agenda — o banco também os ignora no bloqueio de conflito. */
const NAO_OCUPA: StatusAgenda[] = ['cancelado', 'faltou'];

export type BlocoAgenda = {
  id: string;
  inicio: string;
  fim: string;
  status: StatusAgenda;
  tipo: TipoAtendimento;
  paciente: string;
  procedimento: string;
  profissionalId: string;
  profissional: string;
  salaId: string | null;
  sala: string | null;
};

/**
 * Marca blocos que se sobrepõem dentro da mesma coluna e calcula a posição
 * lado a lado. O banco impede criar conflito novo (exclusion constraint), mas
 * dado legado ou encaixe forçado pode existir — a agenda precisa mostrar isso
 * em vez de desenhar um bloco por cima do outro.
 */
export function posicionar(blocos: BlocoAgenda[]) {
  const ordenados = [...blocos].sort(
    (a, b) => minutosDoDia(a.inicio) - minutosDoDia(b.inicio)
  );

  const grupos: BlocoAgenda[][] = [];
  for (const bloco of ordenados) {
    const grupo = grupos.find((g) =>
      g.some((outro) => sobrepoe(bloco, outro))
    );
    if (grupo) grupo.push(bloco);
    else grupos.push([bloco]);
  }

  return grupos.flatMap((grupo) =>
    grupo.map((bloco, i) => ({
      bloco,
      /** Quantos dividem a faixa horizontal, e qual a posição deste. */
      colunas: grupo.length,
      indice: i,
      conflito: grupo.length > 1,
    }))
  );
}

function sobrepoe(a: BlocoAgenda, b: BlocoAgenda) {
  if (NAO_OCUPA.includes(a.status) || NAO_OCUPA.includes(b.status)) return false;
  const ai = minutosDoDia(a.inicio), af = minutosDoDia(a.fim);
  const bi = minutosDoDia(b.inicio), bf = minutosDoDia(b.fim);
  return ai < bf && bi < af;
}

/** Data no formato YYYY-MM-DD, no fuso local (não em UTC). */
export function isoData(d: Date) {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function formatarDataExtenso(d: Date) {
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]}`;
}
