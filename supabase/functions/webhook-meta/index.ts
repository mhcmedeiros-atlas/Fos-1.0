import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Webhook único para WhatsApp Cloud API e Instagram Messaging API.
 * Fase de teste: só registra o payload bruto em `mensagem_recebida`.
 * Nenhuma lógica de negócio (lead, deduplicação) ainda — isso vem depois
 * que a Meta confirmar que está entregando eventos de verdade.
 */
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
    const canal = corpo.object === 'instagram' ? 'instagram' : 'whatsapp';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { error } = await supabase.from('mensagem_recebida').insert({ canal, payload: corpo });
    if (error) console.error('Falha ao gravar mensagem_recebida:', error.message);

    // Meta exige 200 rápido, senão desativa o webhook após falhas repetidas.
    return new Response('EVENT_RECEIVED', { status: 200 });
  }

  return new Response('Method not allowed', { status: 405 });
});
