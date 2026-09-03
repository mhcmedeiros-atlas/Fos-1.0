import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Webhook único para WhatsApp Cloud API e Instagram Messaging API.
 *
 * A função só traduz o payload da Meta para os campos que o banco espera; toda
 * a regra (achar a clínica, deduplicar a pessoa, abrir ou reaproveitar o lead)
 * mora em `registrar_contato_recebido`, para não existir uma segunda cópia da
 * regra de funil aqui fora.
 */

type Contato = {
  canal: 'whatsapp' | 'instagram';
  /** Conta que RECEBEU a mensagem — é o que identifica a clínica. */
  identificadorExterno: string;
  /** Quem MANDOU: wa_id no WhatsApp, IGSID no Instagram. */
  remetente: string;
  nome: string | null;
};

// deno-lint-ignore no-explicit-any
function extrairContatos(corpo: any): Contato[] {
  const contatos: Contato[] = [];

  if (corpo?.object === 'instagram') {
    for (const entry of corpo.entry ?? []) {
      const contaId = String(entry?.id ?? '');
      for (const evento of entry?.messaging ?? []) {
        // is_echo é a nossa própria resposta voltando; não é contato novo.
        if (!evento?.message || evento.message.is_echo) continue;
        const remetente = String(evento?.sender?.id ?? '');
        if (!remetente) continue;
        // O webhook do Instagram não traz o nome — só o IGSID.
        contatos.push({ canal: 'instagram', identificadorExterno: contaId, remetente, nome: null });
      }
    }
    return contatos;
  }

  for (const entry of corpo?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const valor = change?.value;
      // Sem `messages` é atualização de status (entregue/lido): não vira lead.
      if (!valor?.messages?.length) continue;
      const contaId = String(valor?.metadata?.phone_number_id ?? '');
      for (const msg of valor.messages) {
        const remetente = String(msg?.from ?? '');
        if (!remetente) continue;
        // deno-lint-ignore no-explicit-any
        const perfil = (valor.contacts ?? []).find((c: any) => c?.wa_id === remetente);
        contatos.push({
          canal: 'whatsapp',
          identificadorExterno: contaId,
          remetente,
          nome: perfil?.profile?.name ?? null,
        });
      }
    }
  }
  return contatos;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const modo = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const desafio = url.searchParams.get('hub.challenge');
    const tokenEsperado = Deno.env.get('META_VERIFY_TOKEN');

    if (modo === 'subscribe' && token && token === tokenEsperado) {
      return new Response(desafio, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method === 'POST') {
    const corpo = await req.json();
    const canal = corpo?.object === 'instagram' ? 'instagram' : 'whatsapp';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    try {
      const contatos = extrairContatos(corpo);

      if (contatos.length === 0) {
        // Evento legítimo mas sem mensagem (status, echo). Guarda o payload
        // bruto assim mesmo: sem isso, depurar "sumiu uma notificação" é cego.
        await supabase.from('mensagem_recebida').insert({
          canal,
          payload: corpo,
          observacao: 'Evento sem mensagem de entrada',
        });
      } else {
        for (const contato of contatos) {
          const { error } = await supabase.rpc('registrar_contato_recebido', {
            p_canal: contato.canal,
            p_identificador_externo: contato.identificadorExterno,
            p_remetente: contato.remetente,
            p_nome: contato.nome,
            p_payload: corpo,
          });
          if (error) console.error('registrar_contato_recebido falhou:', error.message);
        }
      }
    } catch (e) {
      console.error('Erro ao processar webhook:', e);
    }

    // Meta exige 200 rápido, senão desativa o webhook após falhas repetidas.
    // Erro nosso não pode virar perda de entrega: por isso o 200 mesmo no catch.
    return new Response('EVENT_RECEIVED', { status: 200 });
  }

  return new Response('Method not allowed', { status: 405 });
});
