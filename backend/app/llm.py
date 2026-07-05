import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from openai import APIError, OpenAI
from pydantic import ValidationError

from tools.task_tools import build_daily_order, calculate_rule_priority

from .models import (
    AiDailyPlanResponse,
    AiSuggestionRequest,
    AiSuggestionResponse,
    TaskResponse,
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PROMPT_PATH = PROJECT_ROOT / "prompts" / "system_prompt.txt"

load_dotenv(PROJECT_ROOT / ".env.local")

try:
    import truststore

    truststore.inject_into_ssl()
except ImportError:
    pass


class LlmConfigurationError(RuntimeError):
    pass


class LlmProviderError(RuntimeError):
    pass


def suggest_priority_with_ai(task: AiSuggestionRequest) -> AiSuggestionResponse:
    task_data = task.model_dump(mode="json")
    tool_result = calculate_rule_priority(task_data)
    payload = {
        "task_data": task_data,
        "tool_results": {
            "calculate_rule_priority": tool_result,
        },
        "instruction": (
            "Sugira a prioridade final, explique a decisao e divida a tarefa "
            "em ate 5 subtarefas praticas."
        ),
    }
    data = _call_json_model(payload, max_completion_tokens=700)

    try:
        return AiSuggestionResponse.model_validate(data)
    except ValidationError as exc:
        raise LlmProviderError("A IA retornou uma sugestao fora do formato esperado.") from exc


def plan_day_with_ai(tasks: list[TaskResponse]) -> AiDailyPlanResponse:
    if not tasks:
        return AiDailyPlanResponse(summary="Nao ha tarefas cadastradas para organizar.", ordered_tasks=[])

    tasks_data = [task.model_dump(mode="json") for task in tasks]
    tool_result = build_daily_order(tasks_data)
    payload = {
        "tasks": tasks_data,
        "tool_results": {
            "build_daily_order": tool_result,
        },
        "instruction": (
            "Monte um plano diario curto usando somente as tarefas recebidas. "
            "Mantenha os task_id originais."
        ),
    }
    data = _call_json_model(payload, max_completion_tokens=900)

    try:
        return AiDailyPlanResponse.model_validate(data)
    except ValidationError as exc:
        raise LlmProviderError("A IA retornou um plano fora do formato esperado.") from exc


def _call_json_model(payload: dict[str, Any], max_completion_tokens: int) -> dict[str, Any]:
    try:
        response = _get_client().chat.completions.create(
            extra_headers=_openrouter_headers(),
            model=os.getenv("OPENROUTER_MODEL", "openai/gpt-5.2"),
            messages=[
                {"role": "system", "content": _read_system_prompt()},
                {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
            ],
            response_format={"type": "json_object"},
            temperature=_float_env("OPENROUTER_TEMPERATURE", 0.3),
            top_p=_float_env("OPENROUTER_TOP_P", 0.9),
            max_completion_tokens=max_completion_tokens,
        )
    except APIError as exc:
        raise LlmProviderError("Erro ao chamar a API de IA.") from exc

    content = response.choices[0].message.content
    if not content:
        raise LlmProviderError("A IA retornou uma resposta vazia.")

    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise LlmProviderError("A IA retornou um JSON invalido.") from exc


def _get_client() -> OpenAI:
    api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise LlmConfigurationError("Configure OPENROUTER_API_KEY no arquivo .env.local.")

    return OpenAI(
        api_key=api_key,
        base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
    )


def _openrouter_headers() -> dict[str, str]:
    headers = {
        "X-OpenRouter-Title": os.getenv(
            "OPENROUTER_APP_TITLE",
            "Organizador de Tarefas IA Generativa",
        ),
    }
    site_url = os.getenv("OPENROUTER_SITE_URL")

    if site_url:
        headers["HTTP-Referer"] = site_url

    return headers


def _read_system_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def _float_env(name: str, default: float) -> float:
    value = os.getenv(name)

    if not value:
        return default

    try:
        return float(value)
    except ValueError:
        return default
