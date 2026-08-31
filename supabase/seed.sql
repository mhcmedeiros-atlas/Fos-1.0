-- ============================================================
-- Dados de demonstração — clínica "Fós Estética (demonstração)"
--
-- NÃO é uma migration: não roda automaticamente, e não deve.
-- É o catálogo de exemplo (o mesmo do protótipo aprovado) para que as
-- telas tenham dado real com que trabalhar durante o desenvolvimento.
--
-- Já aplicado no projeto Fos1.0 em 2026-08-31. Guardado aqui para poder
-- recriar o ambiente de demonstração do zero, se necessário.
-- ============================================================

insert into public.clinica (id, nome, cnpj)
values ('d0000000-0000-4000-8000-000000000001', 'Fós Estética (demonstração)', null)
on conflict (id) do nothing;

insert into public.sala (id, clinica_id, nome) values
  ('d0000000-0000-4000-8000-000000000101','d0000000-0000-4000-8000-000000000001','Sala 1'),
  ('d0000000-0000-4000-8000-000000000102','d0000000-0000-4000-8000-000000000001','Sala 2')
on conflict (id) do nothing;

insert into public.equipamento (id, clinica_id, nome) values
  ('d0000000-0000-4000-8000-000000000201','d0000000-0000-4000-8000-000000000001','Ultraformer')
on conflict (id) do nothing;

insert into public.procedimento (id, clinica_id, nome, categoria, duracao_min, valor_tabela, intervalo_retorno_dias, intervalo_recall_dias, sala_id, equipamento_id) values
  ('d0000000-0000-4000-8000-000000000301','d0000000-0000-4000-8000-000000000001','Toxina botulínica','Injetáveis',60,850.00,15,150,'d0000000-0000-4000-8000-000000000102',null),
  ('d0000000-0000-4000-8000-000000000302','d0000000-0000-4000-8000-000000000001','Bioestimulador','Injetáveis',75,1400.00,30,240,'d0000000-0000-4000-8000-000000000102',null),
  ('d0000000-0000-4000-8000-000000000303','d0000000-0000-4000-8000-000000000001','Skinbooster','Injetáveis',50,900.00,30,180,'d0000000-0000-4000-8000-000000000102',null),
  ('d0000000-0000-4000-8000-000000000304','d0000000-0000-4000-8000-000000000001','Peeling de fenol','Estética facial',45,650.00,15,365,'d0000000-0000-4000-8000-000000000101',null),
  ('d0000000-0000-4000-8000-000000000305','d0000000-0000-4000-8000-000000000001','Limpeza de pele','Estética facial',60,380.00,null,60,'d0000000-0000-4000-8000-000000000101',null),
  ('d0000000-0000-4000-8000-000000000306','d0000000-0000-4000-8000-000000000001','Drenagem facial','Estética facial',40,280.00,null,45,'d0000000-0000-4000-8000-000000000101',null),
  ('d0000000-0000-4000-8000-000000000307','d0000000-0000-4000-8000-000000000001','Radiofrequência corporal','Estética corporal',50,320.00,null,90,'d0000000-0000-4000-8000-000000000101','d0000000-0000-4000-8000-000000000201')
on conflict (id) do nothing;

insert into public.insumo (id, clinica_id, nome, unidade_consumo, estoque_minimo) values
  ('d0000000-0000-4000-8000-000000000401','d0000000-0000-4000-8000-000000000001','Toxina botulínica','unidade',50),
  ('d0000000-0000-4000-8000-000000000402','d0000000-0000-4000-8000-000000000001','Ácido hialurônico','ml',5),
  ('d0000000-0000-4000-8000-000000000403','d0000000-0000-4000-8000-000000000001','Ponteira de Ultraformer','disparo',2000),
  ('d0000000-0000-4000-8000-000000000404','d0000000-0000-4000-8000-000000000001','Fios de PDO','unidade',10)
on conflict (id) do nothing;

insert into public.pacote (id, clinica_id, nome, valor_total, validade_dias, condicao_parcelamento) values
  ('d0000000-0000-4000-8000-000000000501','d0000000-0000-4000-8000-000000000001','Toxina botulínica — 3 sessões',1800.00,180,'Até 6x sem juros'),
  ('d0000000-0000-4000-8000-000000000502','d0000000-0000-4000-8000-000000000001','Protocolo facial completo',6200.00,365,'Até 10x sem juros')
on conflict (id) do nothing;

insert into public.pacote_item (pacote_id, procedimento_id, quantidade_sessoes) values
  ('d0000000-0000-4000-8000-000000000501','d0000000-0000-4000-8000-000000000301',3),
  ('d0000000-0000-4000-8000-000000000502','d0000000-0000-4000-8000-000000000302',4),
  ('d0000000-0000-4000-8000-000000000502','d0000000-0000-4000-8000-000000000303',2)
on conflict do nothing;

-- ============================================================
-- Vincular um login à clínica
--
-- O usuário do Auth NÃO é criado aqui de propósito: a senha nunca deve
-- passar por arquivo de código, chat ou log. Crie em
-- Dashboard → Authentication → Users → Add user, e então rode:
--
--   insert into public.usuario (id, clinica_id, perfil)
--   select u.id, 'd0000000-0000-4000-8000-000000000001', 'admin'
--   from auth.users u
--   where u.email = 'SEU-EMAIL-AQUI'
--   on conflict (id) do update set perfil = excluded.perfil;
--
-- Perfis possíveis: admin, recepcao, profissional, financeiro.
-- ============================================================
