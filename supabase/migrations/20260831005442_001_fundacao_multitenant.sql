-- ============================================================
-- Fós ERP — Migration 001: fundação multi-tenant
-- clinica / pessoa / usuario / profissional + auditoria + RLS
-- ============================================================

create type public.perfil_acesso as enum ('admin','recepcao','profissional','financeiro');

-- ---------- Tenant ----------
create table public.clinica (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  cnpj        text,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

-- ---------- Pessoa: entidade base de todo mundo ----------
-- Papéis (paciente, lead, responsável financeiro, indicante, profissional)
-- são tabelas que apontam para cá; a pessoa é única.
create table public.pessoa (
  id              uuid primary key default gen_random_uuid(),
  clinica_id      uuid not null references public.clinica(id) on delete restrict,
  nome            text not null,
  apelido         text,
  cpf             text,
  telefone        text,
  email           text,
  data_nascimento date,
  endereco        text,
  foto_url        text,
  -- anonimização (LGPD): marca a pessoa como anonimizada, irreversível.
  anonimizada_em  timestamptz,
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create index pessoa_clinica_idx  on public.pessoa (clinica_id);
create index pessoa_cpf_idx      on public.pessoa (clinica_id, cpf)      where cpf is not null;
create index pessoa_telefone_idx on public.pessoa (clinica_id, telefone) where telefone is not null;

-- ---------- Usuário: quem faz login ----------
create table public.usuario (
  id         uuid primary key references auth.users(id) on delete cascade,
  clinica_id uuid not null references public.clinica(id) on delete restrict,
  pessoa_id  uuid references public.pessoa(id) on delete set null,
  perfil     public.perfil_acesso not null,
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

create index usuario_clinica_idx on public.usuario (clinica_id);

-- ---------- Profissional: quem atende ----------
-- usuario_id nulo = agendável, mas sem acesso ao sistema.
create table public.profissional (
  id              uuid primary key default gen_random_uuid(),
  clinica_id      uuid not null references public.clinica(id) on delete restrict,
  pessoa_id       uuid not null references public.pessoa(id) on delete restrict,
  usuario_id      uuid unique references public.usuario(id) on delete set null,
  funcao          text,
  conselho        text,
  comissao_padrao numeric(5,2),
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now()
);

create index profissional_clinica_idx on public.profissional (clinica_id);

-- ============================================================
-- Helpers de RLS
-- SECURITY DEFINER de propósito: as policies consultam `usuario`,
-- e sem isso a policy de `usuario` chamaria a si mesma (recursão).
-- search_path travado para evitar sequestro de resolução de nome.
-- NOTA: movidos para o schema `private` na migration 002.
-- ============================================================

create or replace function public.auth_clinica_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.clinica_id from public.usuario u
  where u.id = (select auth.uid()) and u.ativo
$$;

create or replace function public.auth_perfil()
returns public.perfil_acesso
language sql
stable
security definer
set search_path = ''
as $$
  select u.perfil from public.usuario u
  where u.id = (select auth.uid()) and u.ativo
$$;

-- profissional_id do usuário logado (nulo se não for profissional)
create or replace function public.auth_profissional_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id from public.profissional p
  where p.usuario_id = (select auth.uid()) and p.ativo
$$;

-- ============================================================
-- Auditoria — append-only
-- ============================================================
create table public.auditoria (
  id              bigint generated always as identity primary key,
  clinica_id      uuid not null,
  usuario_id      uuid,
  tabela          text not null,
  registro_id     uuid,
  acao            text not null,
  categoria       text not null check (categoria in ('saude','financeiro','exclusao')),
  valor_anterior  jsonb,
  valor_novo      jsonb,
  ocorrido_em     timestamptz not null default now()
);

create index auditoria_clinica_idx  on public.auditoria (clinica_id, ocorrido_em desc);
create index auditoria_registro_idx on public.auditoria (tabela, registro_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.clinica      enable row level security;
alter table public.pessoa       enable row level security;
alter table public.usuario      enable row level security;
alter table public.profissional enable row level security;
alter table public.auditoria    enable row level security;

-- clinica: enxerga só a própria; ninguém cria/apaga clínica pelo app.
create policy clinica_select on public.clinica
  for select to authenticated
  using (id = public.auth_clinica_id());

create policy clinica_update on public.clinica
  for update to authenticated
  using (id = public.auth_clinica_id() and public.auth_perfil() = 'admin')
  with check (id = public.auth_clinica_id());

-- pessoa: isolada por clínica.
create policy pessoa_select on public.pessoa
  for select to authenticated
  using (clinica_id = public.auth_clinica_id());

create policy pessoa_insert on public.pessoa
  for insert to authenticated
  with check (clinica_id = public.auth_clinica_id());

create policy pessoa_update on public.pessoa
  for update to authenticated
  using (clinica_id = public.auth_clinica_id())
  with check (clinica_id = public.auth_clinica_id());

-- exclusão física só de cadastro sem vínculo: regra na aplicação,
-- mas só admin pode sequer tentar.
create policy pessoa_delete on public.pessoa
  for delete to authenticated
  using (clinica_id = public.auth_clinica_id() and public.auth_perfil() = 'admin');

-- usuario: cada um se enxerga; admin enxerga a clínica toda.
create policy usuario_select on public.usuario
  for select to authenticated
  using (
    id = (select auth.uid())
    or (clinica_id = public.auth_clinica_id() and public.auth_perfil() = 'admin')
  );

create policy usuario_admin_write on public.usuario
  for all to authenticated
  using (clinica_id = public.auth_clinica_id() and public.auth_perfil() = 'admin')
  with check (clinica_id = public.auth_clinica_id() and public.auth_perfil() = 'admin');

-- profissional: todos da clínica leem (a agenda precisa); só admin escreve.
create policy profissional_select on public.profissional
  for select to authenticated
  using (clinica_id = public.auth_clinica_id());

create policy profissional_admin_write on public.profissional
  for all to authenticated
  using (clinica_id = public.auth_clinica_id() and public.auth_perfil() = 'admin')
  with check (clinica_id = public.auth_clinica_id() and public.auth_perfil() = 'admin');

-- auditoria: append-only de verdade.
-- Só admin lê; qualquer autenticado insere; NINGUÉM edita ou apaga
-- (ausência de policy de update/delete + revoke no grant).
create policy auditoria_select on public.auditoria
  for select to authenticated
  using (clinica_id = public.auth_clinica_id() and public.auth_perfil() = 'admin');

create policy auditoria_insert on public.auditoria
  for insert to authenticated
  with check (clinica_id = public.auth_clinica_id());

revoke update, delete on public.auditoria from authenticated, anon;

-- ---------- atualizado_em automático ----------
create or replace function public.touch_atualizado_em()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger pessoa_touch before update on public.pessoa
  for each row execute function public.touch_atualizado_em();
