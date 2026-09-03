-- Paciente veio fazer botox e acabou fazendo preenchimento também. Antes disso
-- não havia onde lançar: atendimento.agendamento_id é NOT NULL e único, então
-- todo atendimento exigia agendamento prévio.
--
-- A solução mantém o modelo: cria o agendamento retroativo do procedimento
-- extra. A sala foi ocupada de verdade, então a agenda deve refletir isso — e
-- as restrições de conflito e a checagem de habilitação continuam valendo.
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
  v_origem       public.agendamento;
  v_proc         public.procedimento;
  v_inicio       timestamptz;
  v_agendamento  uuid;
  v_atendimento  uuid;
  v_venda        uuid;
  v_valor        numeric;
begin
  select * into v_origem from public.agendamento where id = p_agendamento_origem_id;
  if not found then
    raise exception 'Agendamento de origem não encontrado.';
  end if;

  select * into v_proc from public.procedimento where id = p_procedimento_id;
  if not found then
    raise exception 'Procedimento não encontrado.';
  end if;

  if p_tipo = 'sessao_pacote' and p_pacote_paciente_item_id is null then
    raise exception 'Sessão de pacote exige informar de qual pacote sai a sessão.';
  end if;

  -- O extra acontece DEPOIS do procedimento original, não em paralelo: usar o
  -- fim da origem evita colidir com ela nas restrições de exclusão. Se colidir
  -- com outro agendamento, a restrição barra — e é certo barrar, porque aí o
  -- profissional está de fato com dois compromissos ao mesmo tempo.
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

  -- Concluir por UPDATE, e não já inserir como 'realizado': o gatilho de
  -- conclusão é BEFORE UPDATE OF status, e é ele que grava concluido_em e baixa
  -- a sessão do pacote.
  update public.atendimento set status = 'realizado' where id = v_atendimento;
  update public.agendamento set status = 'realizado' where id = v_agendamento;

  -- Sessão avulsa gera venda própria. Essa regra estava documentada e sem
  -- implementação: nada no banco criava o lançamento financeiro.
  if p_tipo = 'sessao_avulsa' then
    v_valor := coalesce(p_valor, v_proc.valor_tabela);

    insert into public.venda
      (clinica_id, paciente_id, descricao, valor_total, forma_pagamento, taxa_maquininha, criado_por)
    values
      (v_origem.clinica_id, v_origem.paciente_id,
       v_proc.nome || ' (extra na visita)', v_valor,
       coalesce(p_forma_pagamento, 'a_definir'), coalesce(p_taxa, 0), auth.uid())
    returning id into v_venda;

    -- Só registra recebimento se a forma de pagamento foi informada: sem isso
    -- a venda fica em aberto, que é o estado honesto de "ainda vou cobrar".
    if p_forma_pagamento is not null then
      insert into public.recebimento (clinica_id, venda_id, valor_bruto, taxa, forma)
      values (v_origem.clinica_id, v_venda, v_valor, coalesce(p_taxa, 0), p_forma_pagamento);
    end if;
  end if;

  return v_atendimento;
end;
$$;

revoke execute on function public.registrar_procedimento_extra(uuid, uuid, public.tipo_atendimento, text, numeric, numeric, uuid) from public, anon;
grant execute on function public.registrar_procedimento_extra(uuid, uuid, public.tipo_atendimento, text, numeric, numeric, uuid) to authenticated;
