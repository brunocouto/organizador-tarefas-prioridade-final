from pathlib import Path
from uuid import UUID

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .llm import (
    LlmConfigurationError,
    LlmProviderError,
    plan_day_with_ai,
    suggest_priority_with_ai,
)
from .models import AiDailyPlanResponse, AiSuggestionRequest, AiSuggestionResponse, TaskCreate, TaskResponse
from .store import task_store

app = FastAPI(title="Organizador de Tarefas")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/tasks", response_model=list[TaskResponse])
def list_tasks() -> list[TaskResponse]:
    return task_store.list_tasks()


@app.post(
    "/api/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task(task: TaskCreate) -> TaskResponse:
    return task_store.create_task(task)


@app.put("/api/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: UUID, task: TaskCreate) -> TaskResponse:
    updated_task = task_store.update_task(task_id, task)

    if updated_task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa nao encontrada.")

    return updated_task


@app.post("/api/ai/suggest-priority", response_model=AiSuggestionResponse)
def suggest_priority(task: AiSuggestionRequest) -> AiSuggestionResponse:
    try:
        return suggest_priority_with_ai(task)
    except LlmConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except LlmProviderError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@app.post("/api/ai/daily-plan", response_model=AiDailyPlanResponse)
def create_daily_plan() -> AiDailyPlanResponse:
    try:
        return plan_day_with_ai(task_store.list_tasks())
    except LlmConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except LlmProviderError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


dist_dir = Path(__file__).resolve().parents[2] / "dist"

if dist_dir.exists():
    assets_dir = dist_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str) -> FileResponse:
        requested_file = dist_dir / full_path

        if requested_file.is_file():
            return FileResponse(requested_file)

        return FileResponse(dist_dir / "index.html")
