create table public.mensagem_recebida (
  id uuid primary key default gen_random_uuid(),
  canal text not null check (canal in ('whatsapp', 'instagram')),
  payload jsonb not null,
  criado_em timestamptz not null default now()
);

comment on table public.mensagem_recebida is
  'Log bruto do webhook da Meta (fase de teste da integração). Sem clinica_id ainda: '
  'existe apenas 1 clínica no ambiente de desenvolvimento. Quando entrar o roteamento '
  'multi-clínica por phone_number_id, esta tabela precisa ganhar clinica_id.';

alter table public.mensagem_recebida enable row level security;

create policy "admin le mensagens recebidas"
  on public.mensagem_recebida
  for select
  using (private.auth_perfil() = 'admin');
