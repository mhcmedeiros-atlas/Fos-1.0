import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Webhook da Evolution API (WhatsApp não oficial).
 *
 * Existe em paralelo a `webhook-meta`, não no lugar dela: o Instagram só tem
 * API oficial, então os dois caminhos convivem. Ambos terminam na mesma função
 * `registrar_contato_recebido`, que é onde mora a regra de virar lead.
 *
 * Autenticação: a Evolution não manda JWT do Supabase, então a função roda com
 * verify_jwt desligado e valida um segredo compartilhado no header. Sem o
 * segredo configurado a função recusa tudo — falhar fechado é preferível a um
 * endpoint aberto gravando no banco.
 */

type Extraido = {
  instancia: string;
  remetente: string;
  nome: string | null;
};

// deno-lint-ignore no-explicit-any
function extrair(corpo: any): Extraido | null {
  // Só interessa mensagem recebida. `messages.update` é status de entrega.
  if (corpo?.event !== 'messages.upsert') return null;

  const dados = corpo?.data;
  if (!dados?.key) return null;

  // fromMe é a nossa própria mensagem ecoando de volta.
  if (dados.key.fromMe) return null;

  const jid = String(dados.key.remoteJid ?? '');
  // Grupos (@g.us) não viram lead: não representam um paciente individual.
  if (!jid || !jid.endsWith('@s.whatsapp.net')) return null;

  const instancia = String(corpo?.instance ?? '');
  if (!instancia) return null;

  return {
    instancia,
    remetente: jid.replace('@s.whatsapp.net', ''),
    nome: dados.pushName ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const segredo = Deno.env.get('EVOLUTION_WEBHOOK_SECRET');
  if (!segredo) {
    console.error('EVOLUTION_WEBHOOK_SECRET não configurado — recusando.');
    return new Response('Not configured', { status: 503 });
  }
  if (req.headers.get('x-webhook-token') !== segredo) {
    return new Response('Forbidden', { status: 403 });
  }

  const corpo = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const extraido = extrair(corpo);

    if (!extraido) {
      await supabase.from('mensagem_recebida').insert({
        canal: 'whatsapp',
        payload: corpo,
        observacao: `Evento Evolution ignorado: ${corpo?.event ?? 'sem evento'}`,
      });
    } else {
      const { error } = await supabase.rpc('registrar_contato_recebido', {
        p_canal: 'whatsapp',
        p_identificador_externo: extraido.instancia,
        p_remetente: extraido.remetente,
        p_nome: extraido.nome,
        p_payload: corpo,
      });
      if (error) console.error('registrar_contato_recebido falhou:', error.message);
    }
  } catch (e) {
    console.error('Erro ao processar webhook da Evolution:', e);
  }

  return new Response('OK', { status: 200 });
});
