import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { exigirSessao } from '@/lib/sessao';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ds/Button';
import { Vazio } from '@/components/Widget';

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sessao = await exigirSessao();
  const supabase = await createClient();
  const { q } = await searchParams;
  const busca = (q ?? '').trim();

  // Profissionais também são `pessoa`, então saem da lista de pacientes.
  const { data: idsProfissionais } = await supabase.from('profissional').select('pessoa_id');
  const excluidos = (idsProfissionais ?? []).map((p) => p.pessoa_id);

  let query = supabase
    .from('pessoa')
    .select('id, nome, apelido, cpf, telefone, origem, ativo, anonimizada_em')
    .order('nome');

  if (excluidos.length > 0) query = query.not('id', 'in', `(${excluidos.join(',')})`);
  if (busca) query = query.or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%,cpf.ilike.%${busca}%`);

  const { data: pacientes } = await query;

  return (
    <AppShell sessao={sessao}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Pacientes</h1>
        <Link href="/pacientes/novo">
          <Button variant="primary" icon={<UserPlus size={15} />}>Novo paciente</Button>
        </Link>
      </div>

      <form style={{ marginBottom: 'var(--space-4)' }}>
        <input
          name="q"
          defaultValue={busca}
          placeholder="Buscar por nome, telefone ou CPF..."
          style={{
            width: 320, padding: '9px 14px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)', fontSize: 13.5,
            background: 'var(--surface-card)', outline: 'none',
          }}
        />
      </form>

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {(pacientes ?? []).length === 0 ? (
          <Vazio>
            {busca ? `Nenhum paciente encontrado para "${busca}".` : 'Nenhum paciente cadastrado ainda.'}
          </Vazio>
        ) : (
          (pacientes ?? []).map((p, i) => (
            <Link
              key={p.id}
              href={`/pacientes/${p.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                padding: '13px var(--space-5)',
                borderBottom: i < (pacientes?.length ?? 0) - 1 ? '1px solid var(--border-default)' : 'none',
                textDecoration: 'none', color: 'inherit',
                opacity: p.ativo && !p.anonimizada_em ? 1 : 0.55,
              }}
            >
              <div
                style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-pill)',
                  background: 'var(--surface-sunken)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-secondary)',
                  flexShrink: 0,
                }}
              >
                {p.nome[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {p.nome}
                  {!p.ativo && !p.anonimizada_em && (
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      · Inativo
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  {[p.apelido, p.telefone, p.origem].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
