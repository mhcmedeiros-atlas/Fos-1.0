import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Sincroniza DMs do Instagram via Composio.
 *
 * O Composio não oferece webhook de Instagram, então este canal é por polling:
 * um agendador chama esta função de tempos em tempos. Ela termina na mesma
 * `registrar_contato_recebido` usada pelo WhatsApp — a diferença entre push e
 * pull morre aqui e não vaza para a regra de negócio.
 *
 * Idempotência: reprocessar uma conversa não duplica paciente nem lead (a
 * dedupe está no banco); no pior caso repete uma linha em `mensagem_recebida`.
 * Por isso a janela é filtrada por `ultima_sincronizacao_em`, mas um eventual
 * reprocessamento é inofensivo.
 */

const COMPOSIO_BASE = Deno.env.get('COMPOSIO_BASE_URL') ?? 'https://backend.composio.dev';

async function composio(
  ferramenta: string,
  // deno-lint-ignore no-explicit-any
  argumentos: Record<string, any>,
  // deno-lint-ignore no-explicit-any
): Promise<any> {
  const resposta = await fetch(`${COMPOSIO_BASE}/api/v3/tools/execute/${ferramenta}`, {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('COMPOSIO_API_KEY')!,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      user_id: Deno.env.get('COMPOSIO_USER_ID'),
      arguments: argumentos,
    }),
  });

  if (!resposta.ok) {
    throw new Error(`Composio ${ferramenta} respondeu ${resposta.status}: ${await resposta.text()}`);
  }
  return await resposta.json();
}

// O Composio aninha a lista em data.data; ler só `data` devolve zero itens.
// deno-lint-ignore no-explicit-any
function itens(resposta: any): any[] {
  return resposta?.data?.data ?? [];
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const segredo = Deno.env.get('SINCRONIZACAO_SECRET');
  if (!segredo) return new Response('Not configured', { status: 503 });
  if (req.headers.get('x-webhook-token') !== segredo) {
    return new Response('Forbidden', { status: 403 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: canais, error: erroCanais } = await supabase
    .from('canal_conexao')
    .select('id, identificador_externo, ultima_sincronizacao_em')
    .eq('canal', 'instagram')
    .eq('ativo', true);

  if (erroCanais) {
    return new Response(JSON.stringify({ erro: erroCanais.message }), { status: 500 });
  }

  const resumo: Record<string, number> = { conversas: 0, registradas: 0, falhas: 0 };

  for (const canal of canais ?? []) {
    const desde = canal.ultima_sincronizacao_em ? new Date(canal.ultima_sincronizacao_em) : null;
    const iniciadoEm = new Date();

    try {
      const conversas = itens(await composio('INSTAGRAM_LIST_ALL_CONVERSATIONS', { limit: 25 }));

      for (const conversa of conversas) {
        // `updated_time` da própria thread evita abrir conversa que não mudou.
        if (desde && conversa.updated_time && new Date(conversa.updated_time) <= desde) continue;
        resumo.conversas++;

        let mensagens: unknown[] = [];
        try {
          mensagens = itens(
            await composio('INSTAGRAM_LIST_ALL_MESSAGES', {
              conversation_id: conversa.id,
              limit: 5,
            }),
          );
        } catch (e) {
          // Algumas threads falham com code=100/subcode=33. Segue para a próxima
          // em vez de abortar a varredura inteira.
          console.error('Falha ao ler thread', conversa.id, e);
          resumo.falhas++;
          continue;
        }

        for (const msg of mensagens) {
          // deno-lint-ignore no-explicit-any
          const m = msg as any;
          const remetente = String(m?.from?.id ?? '');
          // Nossa própria conta: é mensagem enviada, não contato novo.
          if (!remetente || remetente === canal.identificador_externo) continue;
          if (desde && m.created_time && new Date(m.created_time) <= desde) continue;

          const { error } = await supabase.rpc('registrar_contato_recebido', {
            p_canal: 'instagram',
            p_identificador_externo: canal.identificador_externo,
            p_remetente: remetente,
            p_nome: m?.from?.username ?? null,
            p_payload: { origem: 'composio', conversa_id: conversa.id, mensagem: m },
          });

          if (error) {
            console.error('registrar_contato_recebido falhou:', error.message);
            resumo.falhas++;
          } else {
            resumo.registradas++;
          }
        }
      }

      // Só avança o marcador se a varredura do canal foi até o fim: falhar no
      // meio e marcar como sincronizado perderia mensagens silenciosamente.
      await supabase
        .from('canal_conexao')
        .update({ ultima_sincronizacao_em: iniciadoEm.toISOString() })
        .eq('id', canal.id);
    } catch (e) {
      console.error('Falha ao sincronizar canal', canal.identificador_externo, e);
      resumo.falhas++;
    }
  }

  return new Response(JSON.stringify(resumo), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
});
