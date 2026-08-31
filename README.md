# Fós — ERP para clínicas de estética avançada

ERP para clínicas independentes (1-4 salas, 2-10 profissionais, atendimento particular).
Resolve **agenda, pacote de sessões e caixa**.

O contexto de produto, as decisões de design e a documentação técnica ficam no vault do
Obsidian do projeto (`Matheus - Personal/fós1.0/`), fora deste repositório — aqui mora só o código.

## Stack

| Camada | Escolha |
|---|---|
| Banco | Supabase Postgres — projeto `Fos1.0` (`fuzigasagxegnonokisa`), sa-east-1 |
| Multi-tenant | Projeto único, isolamento por `clinica_id` + Row Level Security |
| Auth | Supabase Auth — 4 perfis: admin, recepção, profissional, financeiro |
| Arquivos | Supabase Storage (fotos de paciente e antes/depois) |
| Jobs e webhooks | Supabase Edge Functions + `pg_cron` |
| Frontend | Next.js + React, hospedado na Vercel |

## Migrations

Ficam em `supabase/migrations/`, aplicadas pela integração do Supabase com o GitHub.
**O nome do arquivo é o carimbo de versão** — não renomeie um arquivo já aplicado, ou o
Supabase tenta rodá-lo de novo.

| Arquivo | O que faz |
|---|---|
| `20260831005442_001_fundacao_multitenant.sql` | `clinica`, `pessoa`, `usuario`, `profissional`, `auditoria`; RLS em todas |
| `20260831005531_002_helpers_para_schema_privado.sql` | Move os helpers de RLS de `public` para `private` (em `public` viravam endpoints REST) |

## Regras que não podem ser afrouxadas

Estas não são preferências de estilo — são o que impede vazamento de dado de saúde entre
clínicas. Qualquer tabela nova precisa respeitar as três:

1. **Toda tabela com dado de clínica carrega `clinica_id` e tem RLS habilitada.** Sem exceção.
   Uma tabela sem RLS é uma porta aberta para todo mundo que tem a chave pública — que vai
   no navegador do usuário, por definição.
2. **Permissão de perfil é aplicada no banco, não escondendo botão na tela.** Esconder na
   interface é UX; o controle de acesso é a policy.
3. **A auditoria é append-only.** Nenhum perfil, incluindo admin, pode alterar ou apagar —
   garantido por ausência de policy de `update`/`delete` somada a `revoke`.

Os helpers de RLS (`private.auth_clinica_id()`, `private.auth_perfil()`,
`private.auth_profissional_id()`) são `SECURITY DEFINER` de propósito: as policies consultam
`usuario`, e sem isso a policy de `usuario` chamaria a si mesma em recursão infinita.

## Verificação do isolamento

O isolamento foi verificado por teste, não por suposição — transações com `rollback`
simulando o JWT de usuários reais. Confirmado que:

- Usuário da Clínica A enxerga apenas pessoas da Clínica A.
- Recepção não lê auditoria e não apaga paciente (ambos exigem admin).
- **Admin não consegue alterar nem apagar o log de auditoria.**

Ao adicionar tabelas, repita esse tipo de teste em vez de confiar na leitura da policy.
