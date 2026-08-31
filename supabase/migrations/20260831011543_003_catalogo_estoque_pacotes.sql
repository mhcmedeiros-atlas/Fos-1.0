-- ============================================================
-- Migration 003: catálogo (procedimento), estoque (insumo/lote),
-- pacotes (catálogo + instância vendida com saldo)
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Sala / Equipamento (catálogo por clínica) ----------
create table public.sala (
  id         uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinica(id) on delete restrict,
  nome       text not null,
  ativo      boolean not null default true
);
create index sala_clinica_idx on public.sala (clinica_id);

create table public.equipamento (
  id         uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinica(id) on delete restrict,
  nome       text not null,
  ativo      boolean not null default true
);
create index equipamento_clinica_idx on public.equipamento (clinica_id);

-- ---------- Procedimento (nomenclatura decidida 2026-08-30) ----------
create table public.procedimento (
  id                     uuid primary key default gen_random_uuid(),
  clinica_id             uuid not null references public.clinica(id) on delete restrict,
  nome                   text not null,
  categoria              text,
  foto_url               text,
  duracao_min            int not null check (duracao_min > 0),
  valor_tabela           numeric(10,2) not null check (valor_tabela >= 0),
  intervalo_retorno_dias int,
  intervalo_recall_dias  int,
  sala_id                uuid references public.sala(id) on delete set null,
  equipamento_id         uuid references public.equipamento(id) on delete set null,
  ativo                  boolean not null default true,
  criado_em              timestamptz not null default now(),
  atualizado_em          timestamptz not null default now()
);
create index procedimento_clinica_idx on public.procedimento (clinica_id);
create trigger procedimento_touch before update on public.procedimento
  for each row execute function public.touch_atualizado_em();

-- profissionais habilitados a executar cada procedimento (com exceção de comissão)
create table public.procedimento_profissional (
  procedimento_id   uuid not null references public.procedimento(id) on delete cascade,
  profissional_id   uuid not null references public.profissional(id) on delete cascade,
  comissao_percentual numeric(5,2), -- null = usa comissao_padrao do profissional
  primary key (procedimento_id, profissional_id)
);

-- ---------- Insumo / Lote ----------
create type public.unidade_consumo as enum ('unidade','ml','seringa','frasco','disparo');

create table public.insumo (
  id               uuid primary key default gen_random_uuid(),
  clinica_id       uuid not null references public.clinica(id) on delete restrict,
  nome             text not null,
  unidade_consumo  public.unidade_consumo not null,
  estoque_minimo   numeric(10,2),
  ativo            boolean not null default true,
  criado_em        timestamptz not null default now()
);
create index insumo_clinica_idx on public.insumo (clinica_id);

create table public.insumo_lote (
  id                  uuid primary key default gen_random_uuid(),
  clinica_id          uuid not null references public.clinica(id) on delete restrict,
  insumo_id           uuid not null references public.insumo(id) on delete restrict,
  numero_lote         text not null,
  quantidade_recebida numeric(10,2) not null check (quantidade_recebida > 0),
  quantidade_restante numeric(10,2) not null check (quantidade_restante >= 0),
  validade            date,
  aberto_em           timestamptz,        -- fracionado: quando começou a ser usado
  validade_pos_abertura date,             -- validade de uso após aberto (diferente da validade de fábrica)
  fornecedor          text,
  custo               numeric(10,2),
  ativo               boolean not null default true,
  recebido_em         timestamptz not null default now(),
  unique (clinica_id, insumo_id, numero_lote)
);
create index insumo_lote_clinica_idx  on public.insumo_lote (clinica_id);
create index insumo_lote_insumo_idx   on public.insumo_lote (insumo_id);

-- consumo padrão de insumo por procedimento (quantidade sugestão, ajustável no atendimento)
create table public.procedimento_insumo (
  procedimento_id    uuid not null references public.procedimento(id) on delete cascade,
  insumo_id          uuid not null references public.insumo(id) on delete cascade,
  quantidade_padrao  numeric(10,2) not null check (quantidade_padrao > 0),
  primary key (procedimento_id, insumo_id)
);

-- ---------- Pacote: catálogo (template) ----------
create table public.pacote (
  id                     uuid primary key default gen_random_uuid(),
  clinica_id             uuid not null references public.clinica(id) on delete restrict,
  nome                   text not null,
  foto_url               text,
  valor_total            numeric(10,2) not null check (valor_total >= 0),
  validade_dias          int not null check (validade_dias > 0),
  condicao_parcelamento  text,
  ativo                  boolean not null default true,
  criado_em              timestamptz not null default now(),
  atualizado_em          timestamptz not null default now()
);
create index pacote_clinica_idx on public.pacote (clinica_id);
create trigger pacote_touch before update on public.pacote
  for each row execute function public.touch_atualizado_em();

create table public.pacote_item (
  pacote_id         uuid not null references public.pacote(id) on delete cascade,
  procedimento_id   uuid not null references public.procedimento(id) on delete restrict,
  quantidade_sessoes int not null check (quantidade_sessoes > 0),
  primary key (pacote_id, procedimento_id)
);

-- ---------- Pacote do paciente: a CÓPIA vendida, com saldo próprio ----------
-- "Cadastro é template, o registro transacional guarda a cópia" (regras-de-negocio.md).
-- Alterar `pacote` (catálogo) nunca afeta linhas já existentes aqui.
create type public.status_pacote_paciente as enum ('ativo','vencido','cancelado');

create table public.pacote_paciente (
  id             uuid primary key default gen_random_uuid(),
  clinica_id     uuid not null references public.clinica(id) on delete restrict,
  paciente_id    uuid not null references public.pessoa(id) on delete restrict,
  pacote_id      uuid references public.pacote(id) on delete set null, -- referência informativa; nunca fonte de verdade
  nome           text not null,           -- copiado do catálogo na venda
  valor_pago     numeric(10,2) not null check (valor_pago >= 0),
  comprado_em    date not null default current_date,
  validade_em    date not null,
  status         public.status_pacote_paciente not null default 'ativo',
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
create index pacote_paciente_clinica_idx  on public.pacote_paciente (clinica_id);
create index pacote_paciente_paciente_idx on public.pacote_paciente (paciente_id);
create trigger pacote_paciente_touch before update on public.pacote_paciente
  for each row execute function public.touch_atualizado_em();

create table public.pacote_paciente_item (
  id                  uuid primary key default gen_random_uuid(),
  pacote_paciente_id  uuid not null references public.pacote_paciente(id) on delete cascade,
  procedimento_id     uuid not null references public.procedimento(id) on delete restrict,
  procedimento_nome   text not null,    -- copiado no momento da venda
  sessoes_total       int not null check (sessoes_total > 0),
  sessoes_usadas      int not null default 0 check (sessoes_usadas >= 0),
  constraint saldo_nao_excede check (sessoes_usadas <= sessoes_total)
);
create index pacote_paciente_item_pp_idx on public.pacote_paciente_item (pacote_paciente_id);

-- transferência de sessão entre pacientes — log obrigatório (regras-de-negocio.md)
create table public.transferencia_sessao (
  id                    bigint generated always as identity primary key,
  clinica_id            uuid not null references public.clinica(id) on delete restrict,
  item_origem_id        uuid not null references public.pacote_paciente_item(id) on delete restrict,
  item_destino_id       uuid not null references public.pacote_paciente_item(id) on delete restrict,
  quantidade            int not null check (quantidade > 0),
  motivo                text,
  transferido_por       uuid references public.usuario(id),
  transferido_em        timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.sala                    enable row level security;
alter table public.equipamento              enable row level security;
alter table public.procedimento             enable row level security;
alter table public.procedimento_profissional enable row level security;
alter table public.insumo                   enable row level security;
alter table public.insumo_lote              enable row level security;
alter table public.procedimento_insumo      enable row level security;
alter table public.pacote                   enable row level security;
alter table public.pacote_item              enable row level security;
alter table public.pacote_paciente          enable row level security;
alter table public.pacote_paciente_item     enable row level security;
alter table public.transferencia_sessao     enable row level security;

-- leitura: todo mundo autenticado da clínica (agenda/atendimento precisam consultar).
-- escrita de cadastro (procedimento, pacote, insumo, sala, equipamento): admin.
-- escrita operacional (lote, pacote_paciente, transferência): admin ou recepção.

create policy sala_select on public.sala for select to authenticated
  using (clinica_id = private.auth_clinica_id());
create policy sala_admin_write on public.sala for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin')
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin');

create policy equipamento_select on public.equipamento for select to authenticated
  using (clinica_id = private.auth_clinica_id());
create policy equipamento_admin_write on public.equipamento for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin')
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin');

create policy procedimento_select on public.procedimento for select to authenticated
  using (clinica_id = private.auth_clinica_id());
create policy procedimento_admin_write on public.procedimento for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin')
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin');

create policy procedimento_profissional_select on public.procedimento_profissional for select to authenticated
  using (exists (select 1 from public.procedimento p where p.id = procedimento_id and p.clinica_id = private.auth_clinica_id()));
create policy procedimento_profissional_admin_write on public.procedimento_profissional for all to authenticated
  using (private.auth_perfil() = 'admin' and exists (select 1 from public.procedimento p where p.id = procedimento_id and p.clinica_id = private.auth_clinica_id()))
  with check (private.auth_perfil() = 'admin' and exists (select 1 from public.procedimento p where p.id = procedimento_id and p.clinica_id = private.auth_clinica_id()));

create policy insumo_select on public.insumo for select to authenticated
  using (clinica_id = private.auth_clinica_id());
create policy insumo_admin_write on public.insumo for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin')
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin');

create policy insumo_lote_select on public.insumo_lote for select to authenticated
  using (clinica_id = private.auth_clinica_id());
create policy insumo_lote_write on public.insumo_lote for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao'))
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao'));

create policy procedimento_insumo_select on public.procedimento_insumo for select to authenticated
  using (exists (select 1 from public.procedimento p where p.id = procedimento_id and p.clinica_id = private.auth_clinica_id()));
create policy procedimento_insumo_admin_write on public.procedimento_insumo for all to authenticated
  using (private.auth_perfil() = 'admin' and exists (select 1 from public.procedimento p where p.id = procedimento_id and p.clinica_id = private.auth_clinica_id()))
  with check (private.auth_perfil() = 'admin' and exists (select 1 from public.procedimento p where p.id = procedimento_id and p.clinica_id = private.auth_clinica_id()));

create policy pacote_select on public.pacote for select to authenticated
  using (clinica_id = private.auth_clinica_id());
create policy pacote_admin_write on public.pacote for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin')
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin');

create policy pacote_item_select on public.pacote_item for select to authenticated
  using (exists (select 1 from public.pacote p where p.id = pacote_id and p.clinica_id = private.auth_clinica_id()));
create policy pacote_item_admin_write on public.pacote_item for all to authenticated
  using (private.auth_perfil() = 'admin' and exists (select 1 from public.pacote p where p.id = pacote_id and p.clinica_id = private.auth_clinica_id()))
  with check (private.auth_perfil() = 'admin' and exists (select 1 from public.pacote p where p.id = pacote_id and p.clinica_id = private.auth_clinica_id()));

create policy pacote_paciente_select on public.pacote_paciente for select to authenticated
  using (clinica_id = private.auth_clinica_id());
create policy pacote_paciente_write on public.pacote_paciente for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao'))
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao'));

create policy pacote_paciente_item_select on public.pacote_paciente_item for select to authenticated
  using (exists (select 1 from public.pacote_paciente pp where pp.id = pacote_paciente_id and pp.clinica_id = private.auth_clinica_id()));
create policy pacote_paciente_item_write on public.pacote_paciente_item for all to authenticated
  using (private.auth_perfil() in ('admin','recepcao') and exists (select 1 from public.pacote_paciente pp where pp.id = pacote_paciente_id and pp.clinica_id = private.auth_clinica_id()))
  with check (private.auth_perfil() in ('admin','recepcao') and exists (select 1 from public.pacote_paciente pp where pp.id = pacote_paciente_id and pp.clinica_id = private.auth_clinica_id()));

create policy transferencia_sessao_select on public.transferencia_sessao for select to authenticated
  using (clinica_id = private.auth_clinica_id());
create policy transferencia_sessao_insert on public.transferencia_sessao for insert to authenticated
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao'));
-- sem policy de update/delete: transferência também é registro append-only.
