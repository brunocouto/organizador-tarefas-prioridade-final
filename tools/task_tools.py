from datetime import datetime
from uuid import uuid4

from backend.app.models import StoredTask, TaskCreate, TaskResponse
from backend.app.priority import calculate_priority


LLM_TOOLS = [
    {
        "name": "calculate_rule_priority",
        "description": (
            "Calcula uma prioridade base usando prazo, importancia e dificuldade. "
            "Serve como ancora numerica para a resposta do LLM."
        ),
        "parameters": {
            "type": "object",
            "required": ["name", "description", "due_date", "difficulty", "importance"],
            "properties": {
                "name": {"type": "string"},
                "description": {"type": "string"},
                "due_date": {"type": "string", "format": "date"},
                "difficulty": {"type": "string", "enum": ["baixa", "media", "alta"]},
                "importance": {"type": "string", "enum": ["baixa", "media", "alta"]},
                "project": {
                    "type": "string",
                    "enum": ["trabalho", "marca_nova", "atualizacao_site", "pessoal"],
                },
                "source": {"type": "string", "enum": ["entrada", "equipe"]},
            },
        },
    },
    {
        "name": "build_daily_order",
        "description": (
            "Ordena tarefas pelo score de prioridade e prazo. "
            "Serve como base objetiva para o plano diario gerado pelo LLM."
        ),
        "parameters": {
            "type": "object",
            "required": ["tasks"],
            "properties": {
                "tasks": {"type": "array", "items": {"type": "object"}},
            },
        },
    },
]


def calculate_rule_priority(task_data: dict) -> dict:
    task = TaskCreate.model_validate(task_data)
    stored_task = StoredTask(
        created_at=datetime.now(),
        id=uuid4(),
        **task.model_dump(),
    )
    priority = calculate_priority(stored_task)

    return {
        "priority_label": priority.priority_label.value,
        "priority_score": priority.priority_score,
        "rationale": priority.rationale,
    }


def build_daily_order(tasks_data: list[dict]) -> dict:
    tasks = [TaskResponse.model_validate(task) for task in tasks_data]
    ordered_tasks = sorted(
        tasks,
        key=lambda task: (-task.priority_score, task.due_date),
    )

    return {
        "rule": "priority_score desc, due_date asc",
        "ordered_tasks": [
            {
                "task_id": str(task.id),
                "name": task.name,
                "description": task.description,
                "due_date": task.due_date.isoformat(),
                "priority_label": task.priority_label.value,
                "priority_score": task.priority_score,
                "project": task.project.value,
                "source": task.source.value,
                "rule_rationale": task.rationale,
            }
            for task in ordered_tasks
        ],
    }
