-- O Composio não entrega webhook de Instagram: a sincronização é por polling.
-- Guardar o instante da última varredura evita reprocessar toda a caixa de
-- entrada a cada rodada.
alter table public.canal_conexao
  add column ultima_sincronizacao_em timestamptz;

comment on column public.canal_conexao.ultima_sincronizacao_em is
  'Última varredura bem-sucedida do canal. Só usado por canais com polling '
  '(Instagram via Composio); canais com webhook deixam nulo.';
