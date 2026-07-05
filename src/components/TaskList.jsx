import { CalendarDays, Pencil } from 'lucide-react'
import { formatDate, getPriorityClass, translateOption } from '../utils/formatters'

export function TaskList({ isLoading, onEditTask, tasks, title }) {
  if (isLoading) {
    return <p className="empty-state">Carregando tarefas.</p>
  }

  return (
    <div className="list-panel">
      <header className="panel-titlebar">
        <div>
          <h1>{title}</h1>
          <p>{tasks.length} tarefa(s) cadastrada(s)</p>
        </div>
      </header>

      {tasks.length === 0 ? (
        <p className="empty-state">Nenhuma tarefa cadastrada.</p>
      ) : (
        <section className="task-list" aria-label="Tarefas cadastradas">
          {tasks.map((task) => (
            <article className="task-card" key={task.id}>
              <div className="task-heading">
                <h2>{task.name}</h2>
                <span className={getPriorityClass(task.priority_label)}>
                  {translateOption(task.priority_label)}
                </span>
              </div>
              <p className="task-description">{task.description}</p>
              <div className="task-meta">
                <span>
                  <CalendarDays size={15} strokeWidth={2.1} />
                  {formatDate(task.due_date)}
                </span>
                <span>Projeto: {translateOption(task.project)}</span>
                <span>Origem: {translateOption(task.source)}</span>
                <span>Dificuldade: {translateOption(task.difficulty)}</span>
                <span>Importancia: {translateOption(task.importance)}</span>
              </div>
              <button className="row-action task-card-action" onClick={() => onEditTask(task)} type="button">
                <Pencil size={14} strokeWidth={2.1} />
                <span>Editar</span>
              </button>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
