# Caixa de conversas integrada ao funil — ALTA PRIORIDADE

Conversar com o lead dentro do Fós, com o funil reagindo ao que acontece na
conversa. Hoje a mensagem entra e vira lead, mas responder exige sair do
sistema — e o estágio do funil é movido à mão.

## Gatilhos pedidos

| Evento na conversa | Efeito no funil |
|---|---|
| Clínica responde a primeira mensagem | `novo` → `em_contato` |
| Alguém escreve `Agendado!` | → `avaliacao_agendada` |
| Orçamento enviado (a definir: anexo? palavra-chave?) | → `orcamento_enviado` |
| Venda registrada para a pessoa | → `ganho` |

## Como fazer

### Envio: aqui o Composio **serve**

Para Instagram já validamos `INSTAGRAM_SEND_TEXT_MESSAGE` (existe e a conexão
está ativa). Duas limitações que **não** são do Composio, são da Meta, e valem
para qualquer caminho:

- **Não dá para iniciar conversa.** Só responder thread existente.
- **Janela de 24h.** Fora dela o envio falha com `error_subcode 2534022`, e
  repetir não resolve — é política, não instabilidade.

Para WhatsApp, o envio sai pela Evolution (a instância que já está no roteiro),
não pelo Composio.

### Recebimento: o Composio **não serve** para tempo real

Confirmado na busca: não existe webhook de Instagram no Composio. É polling —
`sincronizar-instagram` já faz isso. Para uma caixa de conversa, alguns minutos
de latência incomodam; vale reavaliar intervalo curto ou voltar ao webhook
oficial da Meta quando o app estiver liberado.

WhatsApp via Evolution é webhook de verdade: tempo real, sem polling.

### O que falta no banco

Hoje `mensagem_recebida` guarda payload bruto, ótimo para depurar e ruim para
renderizar conversa. Precisa de uma tabela de mensagens normalizada:

```
conversa        (clinica_id, contato_externo_id, canal, ultima_mensagem_em,
                 nao_lidas, lead_id)
conversa_mensagem (conversa_id, direcao: entrada|saida, texto, enviado_em,
                 id_externo unique, autor_usuario_id)
```

`id_externo` único torna o polling idempotente — hoje reprocessar duplica linha
em `mensagem_recebida`.

### Onde os gatilhos devem morar

**No banco, como trigger em `conversa_mensagem`** — não na interface. Mesma
razão de `registrar_contato_recebido`: a mensagem pode chegar por webhook da
Evolution, por polling do Instagram ou pela tela, e a regra precisa valer nos
três. Regra na tela vale só para quem passa pela tela.

Cuidado de projeto: gatilho por palavra-chave (`Agendado!`) é frágil — pega
"não foi agendado" também. Sugestão: exigir que a mensagem **comece** com o
termo, e registrar em auditoria que o estágio mudou por gatilho, para dar
rastro quando a recepção estranhar.

### Ordem sugerida

1. Tabelas `conversa` / `conversa_mensagem` + normalização do que já entra
2. Tela de caixa de entrada (lista de conversas + thread), leitura só
3. Envio: Evolution (WhatsApp) e Composio (Instagram)
4. Triggers de estágio, com auditoria
5. Vínculo visual conversa ↔ cartão do funil

Os passos 1 e 2 não dependem de nenhuma pendência externa. O 3 depende da
instância da Evolution e da chave do Composio.
