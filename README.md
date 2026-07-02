---
title: Organizador de Tarefas
sdk: docker
app_port: 7860
pinned: false
---

# Organizador de Tarefas com Priorizacao Inteligente

Aplicacao prototipo para a avaliacao intermediaria de IA Generativa.

## Escopo

O sistema permite cadastrar tarefas com nome, prazo, dificuldade e importancia. A aplicacao lista as tarefas e mostra um painel com a ordem de prioridade sugerida.

Nao ha integracao com LLM nesta versao. A priorizacao e simulada por regra no backend para representar o ponto em que um LLM poderia ser integrado futuramente.

## Problema e solucao proposta

O problema escolhido foi a organizacao de tarefas quando existem prazos, dificuldade e niveis diferentes de importancia. A solucao proposta e um painel simples que recebe as tarefas e calcula uma ordem sugerida para execucao.

No futuro, um LLM poderia substituir a regra simulada para interpretar descricoes mais completas, sugerir subtarefas e explicar melhor a prioridade. Nesta entrega, isso nao foi implementado porque o enunciado pede prototipo sem modelo de IA real.

## Stack

- Frontend: React + Vite
- Backend: Python + FastAPI
- Armazenamento: memoria da aplicacao
- Deploy previsto: Hugging Face Spaces com Docker

## Escolhas de design

A aplicacao foi separada em frontend e backend porque essa foi a arquitetura recomendada no enunciado. O frontend concentra a interface de cadastro, lista e painel. O backend concentra a regra simulada de priorizacao e o armazenamento em memoria.

O armazenamento em memoria foi escolhido para manter o prototipo simples. Os dados somem quando o servidor reinicia, mas isso atende ao objetivo desta etapa: demonstrar interface e estrutura sem criar uma solucao de producao.

A regra de priorizacao considera prazo, importancia e dificuldade. Ela fica isolada em `backend/app/priority.py` para facilitar uma futura troca por chamada de LLM.

## Como rodar localmente

No VS Code, abra um terminal na pasta do projeto e execute:

```bash
npm start
```

A aplicacao abre em `http://localhost:8000`.

Se a porta `8000` estiver ocupada, o comando usa a proxima porta livre e mostra o link no terminal.

## Funcionalidades

- Cadastro de tarefa
- Lista de tarefas cadastradas
- Painel de prioridades
- Priorizacao simulada
- Dados em memoria durante a execucao

## Uso do agente de codificacao

O projeto foi criado com apoio do OpenAI Codex. Os pedidos principais foram:

- criar o projeto dentro da pasta da avaliacao;
- usar React + Vite no frontend;
- usar Python + FastAPI no backend;
- manter o banco em memoria;
- nao integrar LLM nesta etapa;
- manter poucas funcionalidades, com organizacao limpa.

## O que funcionou

- A geracao da estrutura React + FastAPI funcionou bem.
- A separacao da regra simulada em um modulo proprio deixou a futura integracao com LLM mais simples.
- O build do React foi gerado com sucesso.
- A API foi testada com listagem e cadastro de tarefa.
- O backend conseguiu servir o build de producao do frontend.

## O que nao funcionou

- O primeiro comando para criar o Vite falhou por erro de certificado local do npm. Foi necessario executar novamente usando a CA do sistema.
- O armazenamento em memoria nao persiste dados apos reiniciar o servidor. Isso foi mantido de proposito para o prototipo.
