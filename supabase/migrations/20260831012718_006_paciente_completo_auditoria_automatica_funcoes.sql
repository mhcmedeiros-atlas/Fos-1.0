-- ============================================================
-- Migration 006: completa Paciente (responsável financeiro, alertas
-- de segurança, anamnese, termo de consentimento), automatiza a
-- auditoria via trigger, e encapsula regras críticas em funções
-- (venda de pacote, anonimização) em vez de confiar na aplicação.
-- ============================================================

-- ---------- Responsável financeiro (pessoa que paga por outra) ----------
alter table public.pessoa add column responsavel_financeiro_id uuid references public.pessoa(id);
create index pessoa_responsavel_idx on public.pessoa (responsavel_financeiro_id);

create or replace function public.checar_responsavel_mesma_clinica()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.responsavel_financeiro_id is not null then
    if not exists (
      select 1 from public.pessoa r
      where r.id = new.responsavel_financeiro_id and r.clinica_id = new.clinica_id
    ) then
      raise exception 'Responsável financeiro precisa ser da mesma clínica';
    end if;
  end if;
  return new;
end;
$$;

create trigger pessoa_checa_responsavel
  before insert or update of responsavel_financeiro_id on public.pessoa
  for each row execute function public.checar_responsavel_mesma_clinica();

-- ---------- Alertas de segurança (fixos no topo da ficha) ----------
create type public.tipo_alerta_seguranca as enum
  ('alergia','anticoagulante','gestacao','procedimento_anterior_outro_local');

create table public.alerta_seguranca (
  id          uuid primary key default gen_random_uuid(),
  clinica_id  uuid not null references public.clinica(id) on delete restrict,
  paciente_id uuid not null references public.pessoa(id) on delete restrict,
  tipo        public.tipo_alerta_seguranca not null,
  descricao   text not null,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  criado_por  uuid references public.usuario(id)
);
create index alerta_seguranca_paciente_idx on public.alerta_seguranca (paciente_id) where ativo;
create index alerta_seguranca_clinica_idx  on public.alerta_seguranca (clinica_id);

-- ---------- Anamnese (perguntas configuráveis pela clínica) + consentimento ----------
create table public.anamnese_pergunta (
  id         uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinica(id) on delete restrict,
  ordem      int not null default 0,
  texto      text not null,
  ativo      boolean not null default true
);
create index anamnese_pergunta_clinica_idx on public.anamnese_pergunta (clinica_id);

create table public.anamnese_resposta (
  id            uuid primary key default gen_random_uuid(),
  clinica_id    uuid not null references public.clinica(id) on delete restrict,
  paciente_id   uuid not null references public.pessoa(id) on delete restrict,
  pergunta_id   uuid not null references public.anamnese_pergunta(id) on delete restrict,
  resposta      text,
  respondido_em timestamptz not null default now(),
  unique (paciente_id, pergunta_id)
);
create index anamnese_resposta_paciente_idx on public.anamnese_resposta (paciente_id);

create table public.termo_consentimento (
  id            uuid primary key default gen_random_uuid(),
  clinica_id    uuid not null references public.clinica(id) on delete restrict,
  paciente_id   uuid not null references public.pessoa(id) on delete restrict,
  versao        text not null default '1.0',
  assinado_em   timestamptz not null default now(),
  evidencia_url text  -- assinatura em tela/touch com timestamp — ver integracoes.md
);
create index termo_consentimento_paciente_idx on public.termo_consentimento (paciente_id);

-- ============================================================
-- Auditoria automática — trigger genérico, categoria por tabela/coluna
-- ============================================================
create or replace function public.fn_auditoria()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_categoria  text := TG_ARGV[0];
  v_clinica_id uuid;
  v_registro_id uuid;
begin
  if TG_OP = 'DELETE' then
    v_clinica_id  := OLD.clinica_id;
    v_registro_id := OLD.id;
  else
    v_clinica_id  := NEW.clinica_id;
    v_registro_id := NEW.id;
  end if;

  insert into public.auditoria
    (clinica_id, usuario_id, tabela, registro_id, acao, categoria, valor_anterior, valor_novo)
  values (
    v_clinica_id,
    auth.uid(),
    TG_TABLE_NAME,
    v_registro_id,
    lower(TG_OP),
    v_categoria,
    case when TG_OP <> 'INSERT' then to_jsonb(OLD) else null end,
    case when TG_OP <> 'DELETE' then to_jsonb(NEW) else null end
  );

  if TG_OP = 'DELETE' then return OLD; else return NEW; end if;
end;
$$;

-- dado de saúde
create trigger alerta_seguranca_auditoria
  after insert or update or delete on public.alerta_seguranca
  for each row execute function public.fn_auditoria('saude');

create trigger anamnese_resposta_auditoria
  after insert or update on public.anamnese_resposta
  for each row execute function public.fn_auditoria('saude');

create trigger termo_consentimento_auditoria
  after insert on public.termo_consentimento
  for each row execute function public.fn_auditoria('saude');

-- dado financeiro
create trigger pessoa_financeiro_auditoria
  after update of responsavel_financeiro_id on public.pessoa
  for each row execute function public.fn_auditoria('financeiro');

create trigger venda_auditoria
  after insert or update on public.venda
  for each row execute function public.fn_auditoria('financeiro');

create trigger recebimento_auditoria
  after insert or update on public.recebimento
  for each row execute function public.fn_auditoria('financeiro');

create trigger atendimento_comissao_auditoria
  after update of comissao_valor, comissao_status on public.atendimento
  for each row execute function public.fn_auditoria('financeiro');

-- exclusão/inativação de pessoa — trigger dedicado, NÃO o genérico:
-- anonimização não pode gravar os valores antigos (regra explícita em
-- regras-de-negocio.md), mas inativação comum precisa gravar o estado
-- anterior. O genérico não distingue os dois casos; este trigger sim.
create or replace function public.fn_auditoria_pessoa_exclusao()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.anonimizada_em is not null and old.anonimizada_em is null then
    insert into public.auditoria (clinica_id, usuario_id, tabela, registro_id, acao, categoria)
    values (new.clinica_id, auth.uid(), 'pessoa', new.id, 'anonimizar', 'exclusao');
  else
    insert into public.auditoria
      (clinica_id, usuario_id, tabela, registro_id, acao, categoria, valor_anterior, valor_novo)
    values (
      new.clinica_id, auth.uid(), 'pessoa', new.id,
      case when new.ativo then 'reativar' else 'inativar' end,
      'exclusao', to_jsonb(old), to_jsonb(new)
    );
  end if;
  return new;
end;
$$;

create trigger pessoa_exclusao_auditoria
  after update of ativo, anonimizada_em on public.pessoa
  for each row execute function public.fn_auditoria_pessoa_exclusao();

create trigger pessoa_exclusao_fisica_auditoria
  after delete on public.pessoa
  for each row execute function public.fn_auditoria('exclusao');

-- pessoa anonimizada fica congelada: nenhuma outra alteração é aceita
-- (garante "não pode ser reativado nem editado" no banco, não por convenção).
create or replace function public.bloquear_edicao_anonimizado()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.anonimizada_em is not null then
    raise exception 'Pessoa % já foi anonimizada e não pode ser alterada', old.id;
  end if;
  return new;
end;
$$;

create trigger pessoa_bloqueia_edicao_pos_anonimizacao
  before update on public.pessoa
  for each row execute function public.bloquear_edicao_anonimizado();

-- ============================================================
-- Função: anonimizar_paciente — nível 2 de exclusão (regras-de-negocio.md)
-- Só admin. Some com PII, preserva venda/sessão/lote. Irreversível.
-- ============================================================
create or replace function public.anonimizar_paciente(p_pessoa_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if private.auth_perfil() <> 'admin' then
    raise exception 'Apenas administrador pode anonimizar um paciente';
  end if;

  update public.pessoa set
    nome              = 'Paciente anonimizado',
    apelido           = null,
    cpf               = null,
    telefone          = null,
    email             = null,
    endereco          = null,
    foto_url          = null,
    data_nascimento   = null,
    anonimizada_em    = now(),
    ativo             = false
  where id = p_pessoa_id
    and clinica_id = private.auth_clinica_id();

  if not found then
    raise exception 'Pessoa % não encontrada nesta clínica', p_pessoa_id;
  end if;
end;
$$;

revoke execute on function public.anonimizar_paciente(uuid) from public;
grant  execute on function public.anonimizar_paciente(uuid) to authenticated;

-- ============================================================
-- Função: vender_pacote — "cadastro é template, transação guarda a cópia"
-- Cria a instância do paciente + itens com saldo, atômico, numa chamada só.
-- ============================================================
create or replace function public.vender_pacote(
  p_pacote_id       uuid,
  p_paciente_id     uuid,
  p_forma_pagamento text,
  p_parcelas        int default 1,
  p_taxa_maquininha numeric default 0
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_pacote             public.pacote%rowtype;
  v_item               record;
  v_pacote_paciente_id uuid;
begin
  select * into v_pacote from public.pacote where id = p_pacote_id;
  if not found then
    raise exception 'Pacote % não encontrado', p_pacote_id;
  end if;
  if not v_pacote.ativo then
    raise exception 'Pacote % está inativo', p_pacote_id;
  end if;

  insert into public.pacote_paciente (clinica_id, paciente_id, pacote_id, nome, valor_pago, validade_em)
  values (v_pacote.clinica_id, p_paciente_id, p_pacote_id, v_pacote.nome, v_pacote.valor_total,
          current_date + v_pacote.validade_dias)
  returning id into v_pacote_paciente_id;

  for v_item in
    select pi.procedimento_id, pi.quantidade_sessoes, p.nome as proc_nome
    from public.pacote_item pi
    join public.procedimento p on p.id = pi.procedimento_id
    where pi.pacote_id = p_pacote_id
  loop
    insert into public.pacote_paciente_item (pacote_paciente_id, procedimento_id, procedimento_nome, sessoes_total)
    values (v_pacote_paciente_id, v_item.procedimento_id, v_item.proc_nome, v_item.quantidade_sessoes);
  end loop;

  insert into public.venda
    (clinica_id, paciente_id, pacote_paciente_id, valor_total, forma_pagamento, parcelas, taxa_maquininha, criado_por)
  values
    (v_pacote.clinica_id, p_paciente_id, v_pacote_paciente_id, v_pacote.valor_total,
     p_forma_pagamento, p_parcelas, p_taxa_maquininha, auth.uid());

  return v_pacote_paciente_id;
end;
$$;

revoke execute on function public.vender_pacote(uuid,uuid,text,int,numeric) from public;
grant  execute on function public.vender_pacote(uuid,uuid,text,int,numeric) to authenticated;

-- ============================================================
-- RLS das tabelas novas
-- ============================================================
alter table public.alerta_seguranca  enable row level security;
alter table public.anamnese_pergunta enable row level security;
alter table public.anamnese_resposta enable row level security;
alter table public.termo_consentimento enable row level security;

create policy alerta_seguranca_select on public.alerta_seguranca for select to authenticated
  using (clinica_id = private.auth_clinica_id());
create policy alerta_seguranca_write on public.alerta_seguranca for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao','profissional'))
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao','profissional'));

create policy anamnese_pergunta_select on public.anamnese_pergunta for select to authenticated
  using (clinica_id = private.auth_clinica_id());
create policy anamnese_pergunta_admin_write on public.anamnese_pergunta for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin')
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() = 'admin');

create policy anamnese_resposta_select on public.anamnese_resposta for select to authenticated
  using (clinica_id = private.auth_clinica_id());
create policy anamnese_resposta_write on public.anamnese_resposta for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao','profissional'))
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao','profissional'));

create policy termo_consentimento_select on public.termo_consentimento for select to authenticated
  using (clinica_id = private.auth_clinica_id());
create policy termo_consentimento_write on public.termo_consentimento for all to authenticated
  using (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao','profissional'))
  with check (clinica_id = private.auth_clinica_id() and private.auth_perfil() in ('admin','recepcao','profissional'));

-- índices de cobertura pras FKs novas (mesmo padrão da migration 005)
create index anamnese_resposta_pergunta_idx on public.anamnese_resposta (pergunta_id);
create index alerta_seguranca_criado_por_idx on public.alerta_seguranca (criado_por);

-- ============================================================
-- Storage: fotos de paciente e de atendimento (antes/depois)
-- Convenção de caminho: {clinica_id}/... — a policy verifica o 1º segmento.
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('fotos-pacientes','fotos-pacientes', false),
  ('fotos-atendimento','fotos-atendimento', false)
on conflict (id) do nothing;

create policy fotos_pacientes_select on storage.objects for select to authenticated
  using (bucket_id = 'fotos-pacientes' and (storage.foldername(name))[1] = private.auth_clinica_id()::text);
create policy fotos_pacientes_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos-pacientes' and (storage.foldername(name))[1] = private.auth_clinica_id()::text
              and private.auth_perfil() in ('admin','recepcao','profissional'));
create policy fotos_pacientes_delete on storage.objects for delete to authenticated
  using (bucket_id = 'fotos-pacientes' and (storage.foldername(name))[1] = private.auth_clinica_id()::text
         and private.auth_perfil() = 'admin');

create policy fotos_atendimento_select on storage.objects for select to authenticated
  using (bucket_id = 'fotos-atendimento' and (storage.foldername(name))[1] = private.auth_clinica_id()::text);
create policy fotos_atendimento_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos-atendimento' and (storage.foldername(name))[1] = private.auth_clinica_id()::text
              and private.auth_perfil() in ('admin','recepcao','profissional'));
create policy fotos_atendimento_delete on storage.objects for delete to authenticated
  using (bucket_id = 'fotos-atendimento' and (storage.foldername(name))[1] = private.auth_clinica_id()::text
         and private.auth_perfil() = 'admin');
