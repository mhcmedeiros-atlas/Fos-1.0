-- As colunas comissao_valor e comissao_status existiam, procedimento_profissional
-- tinha comissao_percentual e profissional tinha comissao_padrao — e nada no
-- banco calculava nada. A funcionalidade existia como esquema, sem comportamento.
--
-- Regra: ao concluir o atendimento, calcula sobre a base do procedimento.
--   avaliacao e retorno -> não geram comissão (não há cobrança)
--   sessao_avulsa       -> base é o valor de tabela do procedimento
--   sessao_pacote       -> base é o valor pago no pacote rateado por sessão
--
-- Percentual: o específico do par procedimento+profissional manda; sem ele,
-- cai na comissão padrão do profissional; sem ela, não há comissão.
create or replace function public.fn_calcular_comissao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_procedimento_id uuid;
  v_percentual      numeric;
  v_base            numeric;
  v_total_sessoes   integer;
  v_valor_pago      numeric;
begin
  if new.status <> 'realizado' or old.status = 'realizado' then
    return new;
  end if;

  if new.tipo in ('avaliacao', 'retorno') then
    new.comissao_valor  := null;
    new.comissao_status := 'nao_aplica';
    return new;
  end if;

  select procedimento_id into v_procedimento_id
    from public.agendamento where id = new.agendamento_id;

  select coalesce(pp.comissao_percentual, pr.comissao_padrao)
    into v_percentual
    from public.profissional pr
    left join public.procedimento_profissional pp
           on pp.profissional_id = pr.id
          and pp.procedimento_id = v_procedimento_id
   where pr.id = new.profissional_id;

  if v_percentual is null or v_percentual = 0 then
    new.comissao_valor  := null;
    new.comissao_status := 'nao_aplica';
    return new;
  end if;

  if new.tipo = 'sessao_pacote' and new.pacote_paciente_item_id is not null then
    -- Rateio simples: o valor pago dividido pelo total de sessões do pacote.
    -- Simplificação consciente — o modelo não guarda preço por sessão, e um
    -- rateio por valor de tabela distorceria quando há desconto no pacote.
    select pp.valor_pago,
           (select sum(i.sessoes_total)
              from public.pacote_paciente_item i
             where i.pacote_paciente_id = pp.id)
      into v_valor_pago, v_total_sessoes
      from public.pacote_paciente_item it
      join public.pacote_paciente pp on pp.id = it.pacote_paciente_id
     where it.id = new.pacote_paciente_item_id;

    if coalesce(v_total_sessoes, 0) = 0 then
      new.comissao_valor  := null;
      new.comissao_status := 'nao_aplica';
      return new;
    end if;

    v_base := v_valor_pago / v_total_sessoes;
  else
    select valor_tabela into v_base
      from public.procedimento where id = v_procedimento_id;
  end if;

  new.comissao_valor  := round(coalesce(v_base, 0) * v_percentual / 100, 2);
  new.comissao_status := 'a_pagar';
  return new;
end;
$$;

-- BEFORE, e depois do gatilho de conclusão em ordem alfabética
-- (atendimento_conclusao < atendimento_z_comissao), para que concluido_em já
-- esteja definido quando a comissão for calculada.
create trigger atendimento_z_comissao
  before update of status on public.atendimento
  for each row execute function public.fn_calcular_comissao();
