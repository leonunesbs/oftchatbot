# LUMI — Chatbot da Clínica Oft Leonardo (MVP WhatsApp)

LUMI é o chatbot da clínica `oftleonardo.com.br`, implementado em modo clássico (sem LLM), com foco em:

- responder dúvidas principais da clínica
- apoiar agendamento de consulta
- detectar sinais de urgência oftalmológica
- encaminhar para atendimento humano quando necessário

O MVP atual processa mensagens recebidas no WhatsApp via WAHA.

## Escopo funcional

### 1) Informações gerais

- horário de atendimento
- local e como chegar
- política de valores (texto informativo)
- dúvidas de serviços oftalmológicos (nível educativo)

### 2) Triagem de urgência

Se detectar sinais como dor ocular intensa, perda súbita de visão, trauma ocular, flashes/sombras ou produto químico no olho, a LUMI:

- orienta pronto atendimento imediato
- interrompe fluxo de agendamento

### 3) Agendamento

A LUMI coleta progressivamente:

- nome completo
- telefone
- e-mail (opcional)
- local
- tipo de consulta
- preferência de data/turno

Regras:

- captura múltiplas entidades na mesma frase
- pergunta apenas o que faltar
- confirma resumo antes da conclusão
- usa resposta curta e natural (uma pergunta principal por mensagem)

### 4) Reagendamento/cancelamento e handoff

Situações encaminhadas para humano via WhatsApp:

- pedido explícito por atendente
- reagendamento/cancelamento
- pergunta específica de preço/convênio
- fora de escopo
- falhas de validação persistentes

## Fora do escopo clínico

A LUMI não:

- diagnostica
- prescreve tratamento
- interpreta exame individual
- dá conduta médica personalizada

## LGPD e privacidade

- coleta mínima para agendamento
- aviso padrão: `Seus dados serão usados apenas para agendamento.`
- telemetria sem conteúdo sensível de conversa
- timezone operacional: `America/Fortaleza`

## Arquitetura implementada

### Núcleo LUMI

Arquivos em `src/lib/lumi`:

- `types.ts` — tipos de intent, estado, sessão e telemetria
- `patterns.ts` — normalização e padrões de termos
- `intents.ts` — classificador por regras com prioridade
- `entities.ts` — extração simples de entidades (nome, telefone, email, local, tipo, data/turno)
- `guardrails.ts` — bloqueio de conduta médica personalizada
- `copy.ts` — mensagens da persona LUMI
- `state-machine.ts` — orquestração do fluxo completo
- `telemetry.ts` — eventos não sensíveis
- `config/clinic.ts` — dados configuráveis da clínica
- `integrations/calcom.ts` — adapter Cal.com com fallback mock

### Persistência de estado conversacional

Foi adicionada a tabela `lumi_sessions` no SQLite usado por `contact-profile`, com:

- estado da conversa
- entidades coletadas (JSON)
- falhas de validação
- status de handoff
- último intent e timestamps

Arquivo: `src/lib/contact-profile/store.ts`.

### Integração com WAHA

No webhook `POST /api/waha/webhook`, mensagens de usuário elegíveis são processadas pela máquina de estados LUMI e a resposta é enviada com o domínio de chat já existente.

Arquivo: `src/app/api/waha/webhook/route.ts`.

## API do MVP

### `GET /api/slots`

Consulta horários por:

- `location`
- `consultationType`
- `date` (opcional)
- `period` (opcional: `manha|tarde|noite`)

Resposta:

- `slots`: lista de opções
- `count`: total

Arquivo: `src/app/api/slots/route.ts`.

### `POST /api/book`

Confirma agendamento com:

- `slotId`
- `fullName`
- `phone`
- `email` (opcional)
- `location`
- `consultationType`

Resposta:

- `ok`
- `confirmation.protocol`
- `confirmation.source` (`calcom|mock`)

Arquivo: `src/app/api/book/route.ts`.

## Variáveis de ambiente

Além das variáveis WAHA, o MVP suporta integração Cal.com:

- `CALCOM_API_BASE_URL` (opcional)
- `CALCOM_API_KEY` (opcional)

Os event types são buscados diretamente na API do Cal.com. Se as variáveis não estiverem definidas (ou se não houver event types disponíveis), o fluxo usa fallback mock.

Para webhook automático da sessão WAHA, você também pode configurar:

- `WAHA_WEBHOOK_URL` (opcional, padrão: `http://host.docker.internal:3030/api/waha/webhook`)

## Telemetria

Eventos:

- `intent_detected`
- `scheduling_started`
- `scheduling_completed`
- `urgent_triage_triggered`
- `handoff_triggered`
- `fallback_hit`

Arquivo: `src/lib/lumi/telemetry.ts`.

## Testes de diálogo (30 cenários)

Arquivo: `tests/lumi/dialogs.spec.ts`.

Cobertura:

- sinônimos e erros de digitação
- múltiplas informações na mesma frase
- urgência
- fuga de fluxo e retomada
- pedido direto de humano
- confirmações curtas (`sim`, `ok`)

## Rodando localmente

```bash
pnpm dev
```

Para validação de tipos:

```bash
pnpm type-check
```

Observação: atualmente o projeto possui erros pré-existentes em hooks legados não relacionados ao LUMI.
