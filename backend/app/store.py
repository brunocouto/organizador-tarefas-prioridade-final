from datetime import date, datetime, timedelta
from uuid import UUID
from uuid import uuid4

from .models import Level, Project, StoredTask, TaskCreate, TaskResponse, TaskSource
from .priority import calculate_priority


class TaskStore:
    def __init__(self) -> None:
        self._tasks: list[StoredTask] = []
        self._seed()

    def list_tasks(self) -> list[TaskResponse]:
        return [self._to_response(task) for task in self._tasks]

    def create_task(self, task: TaskCreate) -> TaskResponse:
        stored_task = StoredTask(
            created_at=datetime.now(),
            id=uuid4(),
            **task.model_dump(),
        )
        self._tasks.insert(0, stored_task)

        return self._to_response(stored_task)

    def update_task(self, task_id: UUID, task: TaskCreate) -> TaskResponse | None:
        for index, stored_task in enumerate(self._tasks):
            if stored_task.id == task_id:
                updated_task = StoredTask(
                    created_at=stored_task.created_at,
                    id=stored_task.id,
                    **task.model_dump(),
                )
                self._tasks[index] = updated_task

                return self._to_response(updated_task)

        return None

    def _to_response(self, task: StoredTask) -> TaskResponse:
        priority = calculate_priority(task)

        return TaskResponse(
            **task.model_dump(),
            priority_label=priority.priority_label,
            priority_score=priority.priority_score,
            rationale=priority.rationale,
        )

    def _seed(self) -> None:
        today = date.today()
        examples = [
            TaskCreate(
                description="Concluir os arquivos principais e revisar se a entrega esta pronta para avaliacao.",
                difficulty=Level.HIGH,
                due_date=today,
                importance=Level.HIGH,
                name="Finalizar entrega da avaliacao",
                project=Project.WORK,
                source=TaskSource.TEAM,
            ),
            TaskCreate(
                description="Verificar se o README explica o objetivo, a arquitetura e como rodar o projeto.",
                difficulty=Level.MEDIUM,
                due_date=today + timedelta(days=5),
                importance=Level.HIGH,
                name="Revisar README do projeto",
                project=Project.SITE_UPDATE,
                source=TaskSource.TEAM,
            ),
            TaskCreate(
                description="Definir uma proposta visual e uma mensagem curta para apresentar a marca.",
                difficulty=Level.MEDIUM,
                due_date=today + timedelta(days=2),
                importance=Level.MEDIUM,
                name="Melhorar ideia da marca",
                project=Project.NEW_BRAND,
                source=TaskSource.INBOX,
            ),
            TaskCreate(
                description="Separar as atividades por prazo, importancia e dificuldade para planejar a semana.",
                difficulty=Level.LOW,
                due_date=today + timedelta(days=12),
                importance=Level.MEDIUM,
                name="Organizar tarefas da semana",
                project=Project.PERSONAL,
                source=TaskSource.INBOX,
            ),
        ]

        for task in examples:
            self._tasks.append(
                StoredTask(
                    created_at=datetime.now(),
                    id=uuid4(),
                    **task.model_dump(),
                )
            )


task_store = TaskStore()
