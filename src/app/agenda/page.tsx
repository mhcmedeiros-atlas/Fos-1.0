import { exigirSessao } from '@/lib/sessao';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/AppShell';
import { AgendaCliente } from '@/components/agenda/AgendaCliente';
import { isoData, type BlocoAgenda } from '@/lib/agenda';

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const sessao = await exigirSessao();
  const supabase = await createClient();
  const { data: dataParam } = await searchParams;

  // Aceita só YYYY-MM-DD; qualquer outra coisa cai em hoje.
  const valida = dataParam && /^\d{4}-\d{2}-\d{2}$/.test(dataParam);
  const dia = valida ? new Date(`${dataParam}T00:00:00`) : new Date();
  const data = isoData(dia);

  const inicioDia = new Date(dia); inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(dia);    fimDia.setHours(23, 59, 59, 999);

  const [agendamentos, profissionais, salas] = await Promise.all([
    supabase
      .from('agendamento')
      .select(`
        id, inicio, fim, status, tipo,
        paciente:paciente_id (nome),
        procedimento:procedimento_id (nome),
        profissional:profissional_id (id, pessoa:pessoa_id (nome)),
        sala:sala_id (id, nome)
      `)
      .gte('inicio', inicioDia.toISOString())
      .lte('inicio', fimDia.toISOString())
      .order('inicio'),

    supabase
      .from('profissional')
      .select('id, pessoa:pessoa_id (nome)')
      .eq('ativo', true),

    supabase.from('sala').select('id, nome').eq('ativo', true),
  ]);

  const nome = (r: unknown) => (r as { nome: string } | null)?.nome ?? '—';

  const blocos: BlocoAgenda[] = (agendamentos.data ?? []).map((a) => {
    const prof = a.profissional as { id: string; pessoa: { nome: string } | null } | null;
    const sala = a.sala as { id: string; nome: string } | null;
    return {
      id: a.id,
      inicio: a.inicio,
      fim: a.fim,
      status: a.status,
      tipo: a.tipo,
      paciente: nome(a.paciente),
      procedimento: nome(a.procedimento),
      profissionalId: prof?.id ?? '',
      profissional: prof?.pessoa?.nome ?? '—',
      salaId: sala?.id ?? null,
      sala: sala?.nome ?? null,
    };
  });

  // Profissional só enxerga a própria coluna — a mesma regra que o RLS já
  // aplica nos agendamentos, refletida na montagem das colunas.
  const listaProf = (profissionais.data ?? []).map((p) => ({
    id: p.id,
    nome: (p.pessoa as { nome: string } | null)?.nome ?? '—',
  }));

  return (
    <AppShell sessao={sessao}>
      <AgendaCliente
        data={data}
        blocos={blocos}
        profissionais={listaProf}
        salas={salas.data ?? []}
      />
    </AppShell>
  );
}
