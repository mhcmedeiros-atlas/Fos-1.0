-- Qual conta externa (número do WhatsApp / conta do Instagram) pertence a qual
-- clínica. Sem esse mapeamento o webhook não tem como saber de quem é a mensagem,
-- e é isso que permite uma única Edge Function atender todas as clínicas.
create table public.canal_conexao (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinica(id),
  canal text not null check (canal in ('whatsapp', 'instagram')),
  identificador_externo text not null,
  descricao text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (canal, identificador_externo)
);

alter table public.canal_conexao enable row level security;

create policy "clinica le seus canais" on public.canal_conexao
  for select using (clinica_id = private.auth_clinica_id());

create policy "admin gerencia canais" on public.canal_conexao
  for all
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin')
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin');

-- Identidade da pessoa em cada canal externo. O Instagram não expõe telefone,
-- então a deduplicação por telefone não serve para os dois canais: esta tabela
-- é o ponto único que liga "quem mandou mensagem" a uma pessoa do cadastro.
create table public.contato_externo (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinica(id),
  pessoa_id uuid not null references public.pessoa(id),
  canal text not null check (canal in ('whatsapp', 'instagram')),
  identificador text not null,
  criado_em timestamptz not null default now(),
  unique (clinica_id, canal, identificador)
);

alter table public.contato_externo enable row level security;

create policy "clinica le seus contatos externos" on public.contato_externo
  for select using (clinica_id = private.auth_clinica_id());

create index idx_contato_externo_pessoa on public.contato_externo (pessoa_id);

-- Rastreabilidade: de qual clínica era a mensagem e em qual lead ela caiu.
alter table public.mensagem_recebida
  add column clinica_id uuid references public.clinica(id),
  add column remetente text,
  add column lead_id uuid references public.lead(id),
  add column processado_em timestamptz,
  add column observacao text;

drop policy "admin le mensagens recebidas" on public.mensagem_recebida;

create policy "admin le mensagens da clinica" on public.mensagem_recebida
  for select using (
    clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin'
  );

create index idx_mensagem_recebida_clinica on public.mensagem_recebida (clinica_id, criado_em desc);

-- O WhatsApp entrega o telefone como "5511987654321" e o cadastro guarda
-- "(11) 98765-4321". Reduzir ambos aos últimos 11 dígitos (DDD + número) faz os
-- dois formatos casarem. Limitação conhecida: não resolve a variação do nono
-- dígito em números antigos.
create or replace function private.normalizar_telefone(p_telefone text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_telefone is null then null
    when length(regexp_replace(p_telefone, '\D', '', 'g')) > 11
      then right(regexp_replace(p_telefone, '\D', '', 'g'), 11)
    else regexp_replace(p_telefone, '\D', '', 'g')
  end;
$$;

create index idx_pessoa_telefone_normalizado
  on public.pessoa (clinica_id, (private.normalizar_telefone(telefone)));

-- Toda a regra de "mensagem recebida vira lead" mora aqui, e não na Edge
-- Function: assim o formulário do site e qualquer outro canal futuro entram
-- pela mesma porta, com a mesma deduplicação.
create or replace function public.registrar_contato_recebido(
  p_canal text,
  p_identificador_externo text,
  p_remetente text,
  p_nome text,
  p_payload jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mensagem_id uuid;
  v_clinica_id uuid;
  v_pessoa_id uuid;
  v_lead_id uuid;
begin
  insert into public.mensagem_recebida (canal, payload, remetente)
  values (p_canal, p_payload, p_remetente)
  returning id into v_mensagem_id;

  select clinica_id into v_clinica_id
  from public.canal_conexao
  where canal = p_canal
    and identificador_externo = p_identificador_externo
    and ativo;

  -- Mensagem de uma conta que ninguém cadastrou: guarda o payload para
  -- diagnóstico, mas não inventa lead em clínica nenhuma.
  if v_clinica_id is null then
    update public.mensagem_recebida
    set observacao = 'Canal não mapeado: ' || coalesce(p_identificador_externo, '(sem identificador)')
    where id = v_mensagem_id;
    return v_mensagem_id;
  end if;

  select pessoa_id into v_pessoa_id
  from public.contato_externo
  where clinica_id = v_clinica_id and canal = p_canal and identificador = p_remetente;

  if v_pessoa_id is null and p_canal = 'whatsapp' then
    select id into v_pessoa_id
    from public.pessoa
    where clinica_id = v_clinica_id
      and anonimizada_em is null
      and private.normalizar_telefone(telefone) = private.normalizar_telefone(p_remetente)
    order by criado_em
    limit 1;
  end if;

  if v_pessoa_id is null then
    insert into public.pessoa (clinica_id, nome, telefone, origem)
    values (
      v_clinica_id,
      coalesce(nullif(trim(p_nome), ''), 'Contato ' || p_canal || ' ' || coalesce(p_remetente, '')),
      case when p_canal = 'whatsapp' then p_remetente end,
      p_canal
    )
    returning id into v_pessoa_id;
  end if;

  insert into public.contato_externo (clinica_id, pessoa_id, canal, identificador)
  values (v_clinica_id, v_pessoa_id, p_canal, p_remetente)
  on conflict (clinica_id, canal, identificador) do nothing;

  -- Segunda mensagem do mesmo contato não abre um lead novo: cai no que já está
  -- aberto no funil.
  select id into v_lead_id
  from public.lead
  where clinica_id = v_clinica_id
    and pessoa_id = v_pessoa_id
    and estagio not in ('ganho', 'perdido')
  order by criado_em desc
  limit 1;

  if v_lead_id is null then
    insert into public.lead (clinica_id, pessoa_id, origem, estagio, proxima_acao)
    values (v_clinica_id, v_pessoa_id, p_canal::public.origem_lead, 'novo', 'Responder primeiro contato')
    returning id into v_lead_id;
  end if;

  update public.mensagem_recebida
  set clinica_id = v_clinica_id, lead_id = v_lead_id, processado_em = now()
  where id = v_mensagem_id;

  return v_mensagem_id;
end;
$$;

revoke execute on function public.registrar_contato_recebido(text, text, text, text, jsonb)
  from public, anon, authenticated;

grant execute on function public.registrar_contato_recebido(text, text, text, text, jsonb)
  to service_role;
