-- ============================================================
-- Migration 004: agendamento, atendimento, venda, funil de leads
-- ============================================================

create extension if not exists btree_gist;

create type public.status_agenda as enum ('agendado','confirmado','em_atendimento','realizado','faltou','cancelado');
create type public.tipo_atendimento as enum ('avaliacao','sessao_pacote','sessao_avulsa','retorno');

-- ---------- Agendamento ----------
create table public.agendamento (
  id                     uuid primary key default gen_random_uuid(),
  clinica_id             uuid not null references public.clinica(id) on delete restrict,
  paciente_id            uuid not null references public.pessoa(id) on delete restrict,
  profissional_id        uuid not null references public.profissional(id) on delete restrict,
  procedimento_id        uuid not null references public.procedimento(id) on delete restrict,
  sala_id                uuid references public.sala(id) on delete set null,
  equipamento_id         uuid references public.equipamento(id) on delete set null,
  inicio                 timestamptz not null,
  fim                    timestamptz not null check (fim > inicio),
  tipo                   public.tipo_atendimento not null,
  pacote_paciente_item_id uuid references public.pacote_paciente_item(id) on delete restrict,
  status                 public.status_agenda not null default 'agendado',
  criado_em              timestamptz not null default now(),
  atualizado_em          timestamptz not null default now(),
  constraint sessao_pacote_tem_item check (
    (tipo = 'sessao_pacote' and pacote_paciente_item_id is not null)
    or (tipo <> 'sessao_pacote' and pacote_paciente_item_id is null)
  ),
  -- bloqueio de conflito (regras-de-negocio.md): profissional, sala e equipamento
  -- não podem ter dois horários sobrepostos, exceto em agendamentos já cancelados/faltou.
  exclude using gist (
    profissional_id with =,
    tstzrange(inicio, fim) with &&
  ) where (status not in ('cancelado','faltou')),
  exclude using gist (
    sala_id with =,
    tstzrange(inicio, fim) with &&
  ) where (status not in ('cancelado','faltou') and sala_id is not null),
  exclude using gist (
    equipamento_id with =,
    tstzrange(inicio, fim) with &&
  ) where (status not in ('cancelado','faltou') and equipamento_id is not null)
);
create index agendamento_clinica_idx      on public.agendamento (clinica_id);
create index agendamento_paciente_idx     on public.agendamento (paciente_id);
create index agendamento_profissional_idx on public.agendamento (profissional_id, inicio);
create trigger agendamento_touch before update on public.agendamento
  for each row execute function public.touch_atualizado_em();

-- profissional precisa estar habilitado no procedimento (prompt 12: "o sistema impede
-- agendar um procedimento com um profissional não habilitado").
create or replace function public.checar_profissional_habilitado()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.procedimento_profissional pp
    where pp.procedimento_id = new.procedimento_id
      and pp.profissional_id = new.profissional_id
  ) then
    raise exception 'Profissional % não está habilitado para o procedimento %', new.profissional_id, new.procedimento_id;
  end if;
  return new;
end;
$$;

create trigger agendamento_checa_habilitacao
  before insert or update of profissional_id, procedimento_id on public.agendamento
  for each row execute function public.checar_profissional_habilitado();

-- ---------- Atendimento ----------
create table public.atendimento (
  id                      uuid primary key default gen_random_uuid(),
  clinica_id              uuid not null references public.clinica(id) on delete restrict,
  agendamento_id          uuid not null unique references public.agendamento(id) on delete restrict,
  paciente_id             uuid not null references public.pessoa(id) on delete restrict,
  profissional_id         uuid not null references public.profissional(id) on delete restrict,
  tipo                    public.tipo_atendimento not null,
  pacote_paciente_item_id uuid references public.pacote_paciente_item(id) on delete restrict,
  protocolo               text,
  status                  public.status_agenda not null default 'em_atendimento',
  comissao_valor          numeric(10,2),
  comissao_status         text not null default 'nao_aplica' check (comissao_status in ('nao_aplica','a_pagar','paga')),
  iniciado_em             timestamptz not null default now(),
  concluido_em            timestamptz,
  criado_em               timestamptz not null default now()
);
create index atendimento_clinica_idx      on public.atendimento (clinica_id);
create index atendimento_paciente_idx     on public.atendimento (paciente_id);
create index atendimento_profissional_idx on public.atendimento (profissional_id);

create table public.atendimento_foto (
  id             uuid primary key default gen_random_uuid(),
  atendimento_id uuid not null references public.atendimento(id) on delete cascade,
  tipo           text not null check (tipo in ('antes','depois')),
  url            text not null,
  criado_em      timestamptz not null default now()
);

-- consumo de insumo no atendimento: baixa o lote (regras-de-negocio.md — "Baixa automática por lote").
create table public.atendimento_insumo (
  id              uuid primary key default gen_random_uuid(),
  atendimento_id  uuid not null references public.atendimento(id) on delete restrict,
  insumo_lote_id  uuid not null references public.insumo_lote(id) on delete restrict,
  quantidade      numeric(10,2) not null check (quantidade > 0),
  criado_em       timestamptz not null default now()
);
create index atendimento_insumo_atend_idx on public.atendimento_insumo (atendimento_id);
create index atendimento_insumo_lote_idx  on public.atendimento_insumo (insumo_lote_id);

-- baixa o saldo do lote ao registrar consumo; nunca deixa ficar negativo
-- (o check quantidade_restante >= 0 em insumo_lote garante isso no banco).
create or replace function public.baixar_saldo_lote()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.insumo_lote
     set quantidade_restante = quantidade_restante - new.quantidade
   where id = new.insumo_lote_id;
  return new;
end;
$$;

create trigger atendimento_insumo_baixa_lote
  after insert on public.atendimento_insumo
  for each row execute function public.baixar_saldo_lote();

-- ao concluir sessão de pacote, baixa 1 sessão do item do pacote do paciente
-- (regras-de-negocio.md: "sessão de pacote" baixa saldo; os demais tipos não).
create or replace function public.concluir_atendimento_baixa_sessao()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'realizado' and old.status <> 'realizado' then
    new.concluido_em := now();
    if new.tipo = 'sessao_pacote' and new.pacote_paciente_item_id is not null then
      update public.pacote_paciente_item
         set sessoes_usadas = sessoes_usadas + 1
       where id = new.pacote_paciente_item_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger atendimento_conclusao
  before update of status on public.atendimento
  for each row execute function public.concluir_atendimento_baixa_sessao();

-- ---------- Venda ----------
create table public.venda (
  id                uuid primary key default gen_random_uuid(),
  clinica_id        uuid not null references public.clinica(id) on delete restrict,
  paciente_id       uuid not null references public.pessoa(id) on delete restrict,
  pacote_paciente_id uuid references public.pacote_paciente(id) on delete set null,
  descricao         text, -- para venda avulsa sem pacote (procedimento avulso)
  valor_total       numeric(10,2) not null check (valor_total >= 0),
  forma_pagamento   text not null,
  parcelas          int not null default 1 check (parcelas > 0),
  taxa_maquininha   numeric(10,2) not null default 0,
  criado_por        uuid references public.usuario(id),
  criado_em         timestamptz not null default now()
);
create index venda_clinica_idx  on public.venda (clinica_id);
create index venda_paciente_idx on public.venda (paciente_id);

create table public.recebimento (
  id           uuid primary key default gen_random_uuid(),
  clinica_id   uuid not null references public.clinica(id) on delete restrict,
  venda_id     uuid not null references public.venda(id) on delete restrict,
  valor_bruto  numeric(10,2) not null check (valor_bruto >= 0),
  taxa         numeric(10,2) not null default 0,
  valor_liquido numeric(10,2) generated always as (valor_bruto - taxa) stored,
  forma        text not null,
  recebido_em  timestamptz not null default now()
);
create index recebimento_clinica_idx on public.recebimento (clinica_id);
create index recebimento_venda_idx   on public.recebimento (venda_id);

-- ---------- Funil de leads ----------
create type public.origem_lead as enum ('whatsapp','instagram','formulario');
create type public.estagio_funil as enum
  ('novo','em_contato','avaliacao_agendada','avaliacao_realizada','orcamento_enviado','ganho','perdido');

create table public.lead (
  id                    uuid primary key default gen_random_uuid(),
  clinica_id            uuid not null references public.clinica(id) on delete restrict,
  pessoa_id             uuid not null references public.pessoa(id) on delete restrict,
  origem                public.origem_lead not null,
  estagio               public.estagio_funil not null default 'novo',
  proxima_acao          text,
  proxima_acao_em       date,
  possivel_duplicata_de uuid references public.pessoa(id),
  venda_id              uuid references public.venda(id), -- setado ao ganhar
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now()
);
create index lead_clinica_idx on public.lead (clinica_id);
create index lead_pessoa_idx  on public.lead (pessoa_id);
create trigger lead_touch before update on public.lead
  for each row execute function public.touch_atualizado_em();

-- ============================================================
-- RLS
-- ============================================================
alter table public.agendamento     enable row level security;
alter table public.atendimento     enable row level security;
alter table public.atendimento_foto   enable row level security;
alter table public.atendimento_insumo enable row level security;
alter table public.venda           enable row level security;
alter table public.recebimento     enable row level security;
alter table public.lead            enable row level security;

-- Agendamento: admin/recepção veem tudo da clínica; profissional só a própria agenda
-- (permissoes-e-auditoria.md: "profissional vê só a própria agenda").
create policy agendamento_select on public.agendamento for select to authenticated
  using (
    clinica_id = private.auth_clinica_id()
    and (
      private.auth_perfil() in ('admin','recepcao')
      or profissional_id = private.auth_profissional_id()
    )
  );
create policy agendamento_write on public.agendamento for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao'))
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao'));

-- Atendimento: mesma regra de visibilidade da agenda.
-- NOTA: comissao_valor/comissao_status ficam no mesmo row; RLS é por linha, não por
-- coluna — recepção (que já pode ver a própria agenda) tecnicamente vê esses campos
-- também. Ocultar coluna por perfil exige view dedicada; registrado como pendência
-- em CLAUDE.md em vez de resolvido aqui.
create policy atendimento_select on public.atendimento for select to authenticated
  using (
    clinica_id = private.auth_clinica_id()
    and (
      private.auth_perfil() in ('admin','recepcao')
      or profissional_id = private.auth_profissional_id()
    )
  );
create policy atendimento_insert on public.atendimento for insert to authenticated
  with check (
    clinica_id = private.auth_clinica_id()
    and (private.auth_perfil() in ('admin','recepcao') or profissional_id = private.auth_profissional_id())
  );
create policy atendimento_update on public.atendimento for update to authenticated
  using (
    clinica_id = private.auth_clinica_id()
    and (private.auth_perfil() in ('admin','recepcao') or profissional_id = private.auth_profissional_id())
  )
  with check (
    clinica_id = private.auth_clinica_id()
    and (private.auth_perfil() in ('admin','recepcao') or profissional_id = private.auth_profissional_id())
  );

create policy atendimento_foto_select on public.atendimento_foto for select to authenticated
  using (exists (select 1 from public.atendimento a where a.id = atendimento_id and a.clinica_id = private.auth_clinica_id()));
create policy atendimento_foto_write on public.atendimento_foto for all to authenticated
  using (exists (select 1 from public.atendimento a where a.id = atendimento_id and a.clinica_id = private.auth_clinica_id()
    and (private.auth_perfil() in ('admin','recepcao') or a.profissional_id = private.auth_profissional_id())))
  with check (exists (select 1 from public.atendimento a where a.id = atendimento_id and a.clinica_id = private.auth_clinica_id()
    and (private.auth_perfil() in ('admin','recepcao') or a.profissional_id = private.auth_profissional_id())));

create policy atendimento_insumo_select on public.atendimento_insumo for select to authenticated
  using (exists (select 1 from public.atendimento a where a.id = atendimento_id and a.clinica_id = private.auth_clinica_id()));
create policy atendimento_insumo_write on public.atendimento_insumo for all to authenticated
  using (exists (select 1 from public.atendimento a where a.id = atendimento_id and a.clinica_id = private.auth_clinica_id()
    and (private.auth_perfil() in ('admin','recepcao') or a.profissional_id = private.auth_profissional_id())))
  with check (exists (select 1 from public.atendimento a where a.id = atendimento_id and a.clinica_id = private.auth_clinica_id()
    and (private.auth_perfil() in ('admin','recepcao') or a.profissional_id = private.auth_profissional_id())));

-- Financeiro: só admin e financeiro (permissoes-e-auditoria.md).
create policy venda_select on public.venda for select to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','financeiro','recepcao'));
create policy venda_write on public.venda for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao','financeiro'))
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao','financeiro'));

create policy recebimento_select on public.recebimento for select to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','financeiro','recepcao'));
create policy recebimento_write on public.recebimento for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao','financeiro'))
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao','financeiro'));

-- Funil: recepção e admin.
create policy lead_select on public.lead for select to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao'));
create policy lead_write on public.lead for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao'))
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao'));
