-- ============================================================
-- Migration 005: hardening do advisor
-- - move btree_gist para schema dedicado (não fica em public)
-- - índices de cobertura para as FKs mais usadas em join
-- ============================================================

create schema if not exists extensions;
alter extension btree_gist set schema extensions;

create index if not exists agendamento_procedimento_idx        on public.agendamento (procedimento_id);
create index if not exists agendamento_sala_idx                on public.agendamento (sala_id);
create index if not exists agendamento_equipamento_idx         on public.agendamento (equipamento_id);
create index if not exists agendamento_pacote_item_idx         on public.agendamento (pacote_paciente_item_id);

create index if not exists atendimento_pacote_item_idx         on public.atendimento (pacote_paciente_item_id);
create index if not exists atendimento_foto_atendimento_idx    on public.atendimento_foto (atendimento_id);

create index if not exists venda_pacote_paciente_idx           on public.venda (pacote_paciente_id);
create index if not exists venda_criado_por_idx                on public.venda (criado_por);

create index if not exists lead_duplicata_idx                  on public.lead (possivel_duplicata_de);
create index if not exists lead_venda_idx                      on public.lead (venda_id);

create index if not exists pacote_paciente_pacote_idx          on public.pacote_paciente (pacote_id);
create index if not exists pacote_paciente_item_proc_idx       on public.pacote_paciente_item (procedimento_id);

create index if not exists transferencia_origem_idx            on public.transferencia_sessao (item_origem_id);
create index if not exists transferencia_destino_idx           on public.transferencia_sessao (item_destino_id);
create index if not exists transferencia_por_idx               on public.transferencia_sessao (transferido_por);

create index if not exists procedimento_sala_idx               on public.procedimento (sala_id);
create index if not exists procedimento_equipamento_idx        on public.procedimento (equipamento_id);

create index if not exists usuario_pessoa_idx                  on public.usuario (pessoa_id);
create index if not exists profissional_pessoa_idx             on public.profissional (pessoa_id);
