# Organizador de Tarefas com IA Generativa

Aplicacao final da disciplina de IA Generativa. O sistema permite cadastrar tarefas e usa um LLM para sugerir prioridade, explicar a decisao, quebrar tarefas grandes em subtarefas e montar um plano diario de execucao.

## Problema e solucao

O problema escolhido foi a organizacao de tarefas quando existem prazos, niveis de importancia e dificuldade diferentes. A solucao combina uma regra objetiva de prioridade com IA generativa.

A regra calcula uma base numerica. O LLM usa essa base para gerar uma explicacao mais natural, subtarefas e uma ordem de execucao mais facil de entender.

## Funcionalidades com IA

- Sugerir prioridade de uma tarefa antes do cadastro.
- Explicar por que a tarefa recebeu aquela prioridade.
- Quebrar uma tarefa em subtarefas praticas.
- Organizar a lista cadastrada em um plano diario.

Cadastro, listagem e armazenamento continuam sem IA. A IA entra apenas onde existe julgamento, linguagem natural ou recomendacao.

## Arquitetura de LLM

Fluxo da sugestao de prioridade:

1. Usuario preenche nome, descricao, projeto, origem, prazo, dificuldade e importancia.
2. Frontend chama `POST /api/ai/suggest-priority`.
3. Backend executa a tool `calculate_rule_priority`.
4. Backend envia tarefa, resultado da tool e system prompt para o modelo.
5. Modelo retorna JSON com prioridade, score, explicacao e subtarefas.
6. Frontend exibe o resultado.

Fluxo do plano diario:

1. Usuario clica em "Organizar com IA".
2. Backend busca as tarefas cadastradas em memoria.
3. Backend executa a tool `build_daily_order`.
4. Modelo recebe a lista ordenada e gera um plano curto.
5. Frontend exibe o resumo e a ordem sugerida.

## Modelo e parametros

Provedor escolhido: OpenRouter.

Modelo configurado por padrao: `openai/gpt-5.2`, definido em `.env.local` por `OPENROUTER_MODEL`.

Parametros:

- `OPENROUTER_TEMPERATURE=0.3`: baixa criatividade para manter respostas consistentes.
- `OPENROUTER_TOP_P=0.9`: permite alguma variacao sem deixar a resposta solta.
- `max_completion_tokens`: limitado por chamada para evitar respostas longas.
- `response_format=json_object`: forca retorno estruturado em JSON.

Justificativa: a tarefa precisa de explicacoes curtas, previsiveis e estruturadas. Temperatura baixa reduz variacao. JSON facilita validar a resposta no backend antes de mostrar ao usuario.

## Framework e integracao

A integracao usa chamada direta via SDK oficial da OpenAI apontando para o endpoint compativel da OpenRouter no backend FastAPI.

Nao foi usado LangChain ou LangGraph porque o fluxo e pequeno: duas chamadas de IA, duas tools simples e nenhum RAG. Um framework maior adicionaria complexidade sem ganho claro para este caso.

A chave de API fica somente no backend, em `.env.local`. O frontend nunca acessa a chave.

## System prompt

O system prompt esta em `prompts/system_prompt.txt`.

Ele define:

- persona: assistente de priorizacao de tarefas;
- idioma: portugues do Brasil;
- restricoes: nao inventar tarefas ou datas;
- formato de saida: JSON valido;
- estrategia: uso de tags XML e exemplos few-shot.

## Tools

As tools estao em `tools/task_tools.py`.

`calculate_rule_priority`

- Entrada: nome, descricao, prazo, dificuldade, importancia, projeto e origem.
- Saida: prioridade base, score e justificativa por regra.
- Motivo: dar ao LLM uma ancora objetiva antes da explicacao textual.

`build_daily_order`

- Entrada: lista de tarefas cadastradas.
- Saida: tarefas ordenadas por score e prazo.
- Motivo: impedir que o LLM reorganize a lista de forma arbitraria.

## Como rodar

Instale as dependencias Python no ambiente virtual:

```bash
.venv\Scripts\python -m pip install -r backend\requirements.txt
```

Coloque sua chave local em `.env.local`:

```env
OPENROUTER_API_KEY=sua_chave_aqui
```

Depois execute:

```bash
npm start
```

## O que funcionou

- Separar a regra objetiva das respostas do LLM deixou a explicacao mais confiavel.
- JSON validado pelo backend evita quebrar a interface quando o modelo responde errado.
- Manter a chave no backend evita vazamento no frontend.
- Usar tools simples deixou a justificativa tecnica facil de explicar.

## O que nao funcionou / limitacoes

- Sem `OPENROUTER_API_KEY`, as funcoes de IA retornam erro de configuracao.
- O armazenamento ainda e em memoria; as tarefas somem ao reiniciar.
- O modelo pode sugerir subtarefas genericas quando o nome da tarefa e muito vago.
- Nao foi usado RAG porque o sistema nao consulta documentos externos.

## Stack

- Frontend: React + Vite
- Backend: Python + FastAPI
- IA: OpenRouter via SDK oficial da OpenAI
- Armazenamento: memoria da aplicacao
