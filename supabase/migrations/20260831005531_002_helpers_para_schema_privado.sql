-- ============================================================
-- Migration 002: tira os helpers de RLS do schema público.
-- Em `public` eles viram endpoints REST (/rest/v1/rpc/...).
-- Em `private` continuam utilizáveis pelas policies, mas o
-- PostgREST não os expõe (só serve os schemas configurados).
-- ============================================================

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.auth_clinica_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.clinica_id from public.usuario u
  where u.id = (select auth.uid()) and u.ativo
$$;

create or replace function private.auth_perfil()
returns public.perfil_acesso
language sql
stable
security definer
set search_path = ''
as $$
  select u.perfil from public.usuario u
  where u.id = (select auth.uid()) and u.ativo
$$;

create or replace function private.auth_profissional_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id from public.profissional p
  where p.usuario_id = (select auth.uid()) and p.ativo
$$;

-- EXECUTE é concedido a PUBLIC por padrão: tirar e liberar só ao logado.
revoke execute on function private.auth_clinica_id()      from public;
revoke execute on function private.auth_perfil()          from public;
revoke execute on function private.auth_profissional_id() from public;
grant  execute on function private.auth_clinica_id()      to authenticated;
grant  execute on function private.auth_perfil()          to authenticated;
grant  execute on function private.auth_profissional_id() to authenticated;

-- ---------- repontar as policies ----------
drop policy clinica_select              on public.clinica;
drop policy clinica_update              on public.clinica;
drop policy pessoa_select               on public.pessoa;
drop policy pessoa_insert               on public.pessoa;
drop policy pessoa_update               on public.pessoa;
drop policy pessoa_delete               on public.pessoa;
drop policy usuario_select              on public.usuario;
drop policy usuario_admin_write         on public.usuario;
drop policy profissional_select         on public.profissional;
drop policy profissional_admin_write    on public.profissional;
drop policy auditoria_select            on public.auditoria;
drop policy auditoria_insert            on public.auditoria;

create policy clinica_select on public.clinica
  for select to authenticated
  using (id = private.auth_clinica_id());

create policy clinica_update on public.clinica
  for update to authenticated
  using (id = private.auth_clinica_id() and private.auth_perfil() = 'admin')
  with check (id = private.auth_clinica_id());

create policy pessoa_select on public.pessoa
  for select to authenticated
  using (clinica_id = private.auth_clinica_id());

create policy pessoa_insert on public.pessoa
  for insert to authenticated
  with check (clinica_id = private.auth_clinica_id());

create policy pessoa_update on public.pessoa
  for update to authenticated
  using (clinica_id = private.auth_clinica_id())
  with check (clinica_id = private.auth_clinica_id());

create policy pessoa_delete on public.pessoa
  for delete to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin');

create policy usuario_select on public.usuario
  for select to authenticated
  using (
    id = (select auth.uid())
    or (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin')
  );

create policy usuario_admin_write on public.usuario
  for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin')
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin');

create policy profissional_select on public.profissional
  for select to authenticated
  using (clinica_id = private.auth_clinica_id());

create policy profissional_admin_write on public.profissional
  for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin')
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin');

create policy auditoria_select on public.auditoria
  for select to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin');

create policy auditoria_insert on public.auditoria
  for insert to authenticated
  with check (clinica_id = private.auth_clinica_id());

drop function public.auth_clinica_id();
drop function public.auth_perfil();
drop function public.auth_profissional_id();
