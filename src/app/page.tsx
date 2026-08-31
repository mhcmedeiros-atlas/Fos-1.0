import { createClient } from '@/lib/supabase/server';
import { SairButton } from './sair-button';

const ROTULO_PERFIL: Record<string, string> = {
  admin: 'Administrador',
  recepcao: 'Recepção',
  profissional: 'Profissional',
  financeiro: 'Financeiro',
};

export default async function PainelPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // A consulta abaixo passa pelo RLS: só retorna se o usuário logado tiver
  // registro em `usuario`. Um login válido sem vínculo de clínica cai no
  // aviso mais abaixo — que é exatamente o estado de um convite pendente.
  const { data: usuario } = await supabase
    .from('usuario')
    .select('perfil, clinica_id, clinica:clinica_id (nome)')
    .eq('id', user!.id)
    .maybeSingle();

  return (
    <main className="min-h-screen">
      <header className="flex h-16 items-center justify-between border-b border-[var(--linha)] bg-[var(--superficie)] px-7">
        <div className="font-[family-name:var(--font-display)] text-xl">Fós</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--tinta-suave)]">{user?.email}</span>
          <SairButton />
        </div>
      </header>

      <div className="p-6">
        {usuario ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--linha)] bg-[var(--superficie)] p-6">
            <h1 className="font-[family-name:var(--font-display)] text-2xl">
              {(usuario.clinica as { nome: string } | null)?.nome ?? 'Clínica'}
            </h1>
            <p className="mt-1 text-sm text-[var(--tinta-suave)]">
              Você está conectado como{' '}
              <span className="font-semibold text-[var(--tinta)]">
                {ROTULO_PERFIL[usuario.perfil] ?? usuario.perfil}
              </span>
              .
            </p>

            <div className="mt-6 rounded-[var(--radius-md)] bg-[var(--superficie-afundada)] p-4 text-sm text-[var(--tinta-suave)]">
              Autenticação e isolamento por clínica funcionando. As telas do sistema
              (Painel do dia, Agenda, Atendimento, Pacientes, Procedimentos, Pacotes,
              Funil, Financeiro, Estoque e Equipe) entram nas próximas etapas.
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--terracota-16)] bg-[var(--terracota-10)] p-6">
            <h1 className="text-base font-bold text-[var(--terracota)]">
              Acesso ainda não vinculado a uma clínica
            </h1>
            <p className="mt-1.5 text-sm text-[var(--terracota)]">
              Seu login existe, mas nenhum perfil foi associado a ele. Um administrador
              precisa vincular este usuário a uma clínica antes do acesso funcionar.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
