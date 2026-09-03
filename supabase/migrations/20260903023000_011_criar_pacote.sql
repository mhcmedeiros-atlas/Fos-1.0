-- Pacote e itens numa transação só: um pacote sem procedimento é registro
-- quebrado, e dois inserts separados do app deixariam esse estado possível.
--
-- Deliberadamente SEM security definer: assim as políticas de RLS continuam
-- valendo e só admin consegue criar, como já era a regra das tabelas.
create or replace function public.criar_pacote(
  p_nome text,
  p_valor_total numeric,
  p_validade_dias integer,
  p_condicao_parcelamento text,
  p_itens jsonb
) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_pacote_id uuid;
  v_item jsonb;
begin
  if p_itens is null or jsonb_array_length(p_itens) = 0 then
    raise exception 'Pacote precisa de pelo menos um procedimento.';
  end if;

  insert into public.pacote (clinica_id, nome, valor_total, validade_dias, condicao_parcelamento)
  values (
    private.auth_clinica_id(),
    p_nome,
    p_valor_total,
    p_validade_dias,
    nullif(p_condicao_parcelamento, '')
  )
  returning id into v_pacote_id;

  for v_item in select * from jsonb_array_elements(p_itens) loop
    insert into public.pacote_item (pacote_id, procedimento_id, quantidade_sessoes)
    values (
      v_pacote_id,
      (v_item->>'procedimento_id')::uuid,
      (v_item->>'quantidade_sessoes')::integer
    );
  end loop;

  return v_pacote_id;
end;
$$;

revoke execute on function public.criar_pacote(text, numeric, integer, text, jsonb) from public, anon;
grant execute on function public.criar_pacote(text, numeric, integer, text, jsonb) to authenticated;
