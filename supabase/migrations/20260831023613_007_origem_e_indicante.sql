-- ============================================================
-- Migration 007: origem e indicante de pessoa (lacuna do modelo-de-dados.md
-- que ficou de fora da 001 — o protótipo já mostrava "Indicação — Nome").
-- ============================================================

alter table public.pessoa add column origem text;
alter table public.pessoa add column indicado_por_id uuid references public.pessoa(id);
create index pessoa_indicado_por_idx on public.pessoa (indicado_por_id);

create or replace function public.checar_indicante_mesma_clinica()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.indicado_por_id is not null then
    if not exists (
      select 1 from public.pessoa r
      where r.id = new.indicado_por_id and r.clinica_id = new.clinica_id
    ) then
      raise exception 'Indicante precisa ser da mesma clínica';
    end if;
    if new.indicado_por_id = new.id then
      raise exception 'Uma pessoa não pode se autoindicar';
    end if;
  end if;
  return new;
end;
$$;

create trigger pessoa_checa_indicante
  before insert or update of indicado_por_id on public.pessoa
  for each row execute function public.checar_indicante_mesma_clinica();
