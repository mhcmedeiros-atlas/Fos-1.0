-- ============================================================
-- 1. Parcelas previstas: o que a clínica TEM A RECEBER
-- ============================================================
-- venda.parcelas era um número decorativo: dizia "6x" e não existia nenhum
-- registro das 6. Sem isso não há como responder "quanto tenho a receber?" nem
-- "o que está atrasado?", que são as duas perguntas de caixa de qualquer
-- clínica.
create table public.parcela (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinica(id),
  venda_id uuid not null references public.venda(id) on delete cascade,
  numero integer not null check (numero > 0),
  valor numeric not null check (valor >= 0),
  vencimento date not null,
  recebimento_id uuid references public.recebimento(id),
  quitado_em timestamptz,
  unique (venda_id, numero)
);

create index idx_parcela_clinica_vencimento on public.parcela (clinica_id, vencimento);
create index idx_parcela_venda on public.parcela (venda_id);

alter table public.parcela enable row level security;

create policy "clinica le parcelas" on public.parcela
  for select using (clinica_id = private.auth_clinica_id());

create policy "admin e financeiro gerenciam parcelas" on public.parcela
  for all
  using (clinica_id = private.auth_clinica_id()
         and private.auth_perfil() in ('admin', 'financeiro'))
  with check (clinica_id = private.auth_clinica_id()
              and private.auth_perfil() in ('admin', 'financeiro'));

-- security definer porque é escrituração derivada de uma venda que o usuário
-- já teve permissão de criar; sem isso a recepção criaria a venda e o gatilho
-- falharia ao gravar as parcelas.
create or replace function public.fn_gerar_parcelas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_n     integer := greatest(coalesce(new.parcelas, 1), 1);
  v_base  numeric := round(new.valor_total / v_n, 2);
  v_soma  numeric := 0;
  v_valor numeric;
  i       integer;
begin
  for i in 1..v_n loop
    if i < v_n then
      v_valor := v_base;
      v_soma  := v_soma + v_base;
    else
      -- A última parcela absorve a sobra do arredondamento: a soma das
      -- parcelas tem que bater exatamente com o valor da venda.
      v_valor := new.valor_total - v_soma;
    end if;

    insert into public.parcela (clinica_id, venda_id, numero, valor, vencimento)
    values (new.clinica_id, new.id, i, v_valor,
            (new.criado_em + make_interval(months => i - 1))::date);
  end loop;
  return new;
end;
$$;

create trigger venda_gera_parcelas
  after insert on public.venda
  for each row execute function public.fn_gerar_parcelas();

-- ============================================================
-- 2. Recebimento quita parcela (FIFO)
-- ============================================================
create or replace function public.fn_alocar_recebimento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_resta numeric := new.valor_bruto;
  v_p     record;
begin
  for v_p in
    select id, valor from public.parcela
    where venda_id = new.venda_id and recebimento_id is null
    order by numero
  loop
    exit when v_resta <= 0;
    -- Pagamento parcial não quita a parcela: quitar pela metade esconderia
    -- que ainda falta dinheiro daquela parcela.
    exit when v_resta < v_p.valor;

    update public.parcela
       set recebimento_id = new.id, quitado_em = now()
     where id = v_p.id;
    v_resta := v_resta - v_p.valor;
  end loop;
  return new;
end;
$$;

create trigger recebimento_quita_parcela
  after insert on public.recebimento
  for each row execute function public.fn_alocar_recebimento();

-- ============================================================
-- 3. Não receber mais do que foi vendido
-- ============================================================
-- Não havia nada impedindo lançar R$ 5.000 recebidos numa venda de R$ 1.500.
create or replace function public.fn_checar_recebimento_excedente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total    numeric;
  v_recebido numeric;
begin
  select valor_total into v_total from public.venda where id = new.venda_id;

  select coalesce(sum(valor_bruto), 0) into v_recebido
    from public.recebimento
   where venda_id = new.venda_id
     and (TG_OP = 'INSERT' or id <> new.id);

  -- Tolerância de meio centavo para arredondamento, não para folga real.
  if v_recebido + new.valor_bruto > v_total + 0.005 then
    raise exception
      'Recebimento excede a venda: já recebido %, somando % , venda vale %',
      v_recebido, new.valor_bruto, v_total;
  end if;
  return new;
end;
$$;

create trigger recebimento_nao_excede_venda
  before insert or update on public.recebimento
  for each row execute function public.fn_checar_recebimento_excedente();

-- ============================================================
-- 4. Taxa em um lugar só
-- ============================================================
-- venda.taxa_maquininha e recebimento.taxa guardavam o mesmo fato e podiam
-- divergir. A taxa acontece quando o dinheiro entra, então ela pertence ao
-- recebimento. Verificado antes de remover: nas vendas existentes os dois
-- valores eram idênticos, então nada se perde.
create or replace function public.registrar_procedimento_extra(
  p_agendamento_origem_id uuid,
  p_procedimento_id uuid,
  p_tipo public.tipo_atendimento default 'sessao_avulsa',
  p_forma_pagamento text default null,
  p_valor numeric default null,
  p_taxa numeric default 0,
  p_pacote_paciente_item_id uuid default null
) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_origem      public.agendamento;
  v_proc        public.procedimento;
  v_inicio      timestamptz;
  v_agendamento uuid;
  v_atendimento uuid;
  v_venda       uuid;
  v_valor       numeric;
begin
  select * into v_origem from public.agendamento where id = p_agendamento_origem_id;
  if not found then raise exception 'Agendamento de origem não encontrado.'; end if;

  select * into v_proc from public.procedimento where id = p_procedimento_id;
  if not found then raise exception 'Procedimento não encontrado.'; end if;

  if p_tipo = 'sessao_pacote' and p_pacote_paciente_item_id is null then
    raise exception 'Sessão de pacote exige informar de qual pacote sai a sessão.';
  end if;

  v_inicio := greatest(now(), v_origem.fim);

  insert into public.agendamento
    (clinica_id, paciente_id, profissional_id, procedimento_id, sala_id, equipamento_id,
     inicio, fim, tipo, pacote_paciente_item_id, status)
  values
    (v_origem.clinica_id, v_origem.paciente_id, v_origem.profissional_id, p_procedimento_id,
     coalesce(v_proc.sala_id, v_origem.sala_id), v_proc.equipamento_id,
     v_inicio, v_inicio + make_interval(mins => v_proc.duracao_min),
     p_tipo, p_pacote_paciente_item_id, 'em_atendimento')
  returning id into v_agendamento;

  insert into public.atendimento
    (clinica_id, agendamento_id, paciente_id, profissional_id, tipo, pacote_paciente_item_id)
  values
    (v_origem.clinica_id, v_agendamento, v_origem.paciente_id, v_origem.profissional_id,
     p_tipo, p_pacote_paciente_item_id)
  returning id into v_atendimento;

  update public.atendimento set status = 'realizado' where id = v_atendimento;
  update public.agendamento set status = 'realizado' where id = v_agendamento;

  if p_tipo = 'sessao_avulsa' then
    v_valor := coalesce(p_valor, v_proc.valor_tabela);

    insert into public.venda
      (clinica_id, paciente_id, descricao, valor_total, forma_pagamento, criado_por)
    values
      (v_origem.clinica_id, v_origem.paciente_id,
       v_proc.nome || ' (extra na visita)', v_valor,
       coalesce(p_forma_pagamento, 'a_definir'), auth.uid())
    returning id into v_venda;

    if p_forma_pagamento is not null then
      insert into public.recebimento (clinica_id, venda_id, valor_bruto, taxa, forma)
      values (v_origem.clinica_id, v_venda, v_valor, coalesce(p_taxa, 0), p_forma_pagamento);
    end if;
  end if;

  return v_atendimento;
end;
$$;

drop function if exists public.vender_pacote(uuid, uuid, text, integer, numeric);

create or replace function public.vender_pacote(
  p_pacote_id uuid,
  p_paciente_id uuid,
  p_forma_pagamento text,
  p_parcelas integer default 1
) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_pacote             public.pacote%rowtype;
  v_item               record;
  v_pacote_paciente_id uuid;
begin
  select * into v_pacote from public.pacote where id = p_pacote_id;
  if not found then raise exception 'Pacote % não encontrado', p_pacote_id; end if;
  if not v_pacote.ativo then raise exception 'Pacote % está inativo', p_pacote_id; end if;

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

  -- A venda nasce sem recebimento de propósito: vender não é receber. As
  -- parcelas previstas são criadas pelo gatilho e ficam em aberto até entrar
  -- dinheiro de verdade.
  insert into public.venda
    (clinica_id, paciente_id, pacote_paciente_id, valor_total, forma_pagamento, parcelas, criado_por)
  values
    (v_pacote.clinica_id, p_paciente_id, v_pacote_paciente_id, v_pacote.valor_total,
     p_forma_pagamento, p_parcelas, auth.uid());

  return v_pacote_paciente_id;
end;
$$;

revoke execute on function public.vender_pacote(uuid, uuid, text, integer) from public, anon;
grant execute on function public.vender_pacote(uuid, uuid, text, integer) to authenticated;

alter table public.venda drop column taxa_maquininha;

-- ============================================================
-- 5. Retroativo para o que já existe
-- ============================================================
insert into public.parcela (clinica_id, venda_id, numero, valor, vencimento)
select v.clinica_id, v.id, 1, v.valor_total, v.criado_em::date
from public.venda v
where not exists (select 1 from public.parcela p where p.venda_id = v.id);

update public.parcela p
   set recebimento_id = r.id, quitado_em = r.recebido_em
  from public.recebimento r
 where r.venda_id = p.venda_id
   and p.recebimento_id is null
   and r.valor_bruto >= p.valor;
