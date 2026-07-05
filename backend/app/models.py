from datetime import date, datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class Level(str, Enum):
    LOW = "baixa"
    MEDIUM = "media"
    HIGH = "alta"


class Project(str, Enum):
    WORK = "trabalho"
    NEW_BRAND = "marca_nova"
    SITE_UPDATE = "atualizacao_site"
    PERSONAL = "pessoal"


class TaskSource(str, Enum):
    INBOX = "entrada"
    TEAM = "equipe"


class TaskCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=120)
    description: str = Field(..., min_length=10, max_length=500)
    due_date: date
    difficulty: Level
    importance: Level
    project: Project = Project.PERSONAL
    source: TaskSource = TaskSource.INBOX


class StoredTask(TaskCreate):
    id: UUID
    created_at: datetime


class TaskResponse(StoredTask):
    priority_label: Level
    priority_score: int = Field(..., ge=0, le=100)
    rationale: str


class AiSuggestionRequest(TaskCreate):
    pass


class AiSuggestionResponse(BaseModel):
    priority_label: Level
    priority_score: int = Field(..., ge=0, le=100)
    rationale: str = Field(..., min_length=10, max_length=700)
    subtasks: list[str] = Field(default_factory=list, max_length=6)


class AiDailyPlanItem(BaseModel):
    task_id: UUID
    name: str
    priority_label: Level
    reason: str = Field(..., min_length=8, max_length=400)


class AiDailyPlanResponse(BaseModel):
    summary: str = Field(..., min_length=8, max_length=700)
    ordered_tasks: list[AiDailyPlanItem] = Field(default_factory=list)
