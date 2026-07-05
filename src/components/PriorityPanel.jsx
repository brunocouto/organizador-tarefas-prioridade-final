import { MoreHorizontal, MessageSquare, Pencil, Plus, Sparkles, UserPlus } from 'lucide-react'
import { formatDate, getPriorityClass, translateOption } from '../utils/formatters'

function countByPriority(tasks, priority) {
  return tasks.filter((task) => task.priority_label === priority).length
}

export function PriorityPanel({
  aiPlan,
  isLoading,
  isPlanning,
  onAddTask,
  onEditTask,
  onPlanWithAi,
  tasks,
  title,
}) {
  if (isLoading) {
    return <p className="empty-state">Carregando tarefas.</p>
  }

  const highPriorityCount = countByPriority(tasks, 'alta')
  const mediumPriorityCount = countByPriority(tasks, 'media')
  const lowPriorityCount = countByPriority(tasks, 'baixa')

  return (
    <div className="today-panel">
      <header className="panel-titlebar">
        <div>
          <h1>{title}</h1>
          <p>
            {tasks.length} tarefa(s): {highPriorityCount} alta, {mediumPriorityCount} media,{' '}
            {lowPriorityCount} baixa
          </p>
        </div>
        <div className="panel-actions">
          <button className="secondary-action compact" disabled={isPlanning} onClick={onPlanWithAi} type="button">
            <Sparkles size={17} strokeWidth={2.2} />
            <span>{isPlanning ? 'Gerando' : 'Organizar com IA'}</span>
          </button>
          <button className="ghost-icon-button" type="button" title="Comentarios">
            <MessageSquare size={18} strokeWidth={2.1} />
          </button>
          <button className="ghost-icon-button" type="button" title="Compartilhar">
            <UserPlus size={18} strokeWidth={2.1} />
          </button>
          <button className="ghost-icon-button" type="button" title="Mais opcoes">
            <MoreHorizontal size={19} strokeWidth={2.1} />
          </button>
        </div>
      </header>

      <section className="ai-feature-panel">
        <div>
          <h2>Funcoes com IA</h2>
          <p>Organizar tarefas cadastradas em um plano de execucao.</p>
        </div>
        <button className="ai-main-action" disabled={isPlanning} onClick={onPlanWithAi} type="button">
          <Sparkles size={18} strokeWidth={2.2} />
          <span>{isPlanning ? 'Gerando plano' : 'Organizar tarefas com IA'}</span>
        </button>
      </section>

      {aiPlan && (
        <section className="ai-plan-result" aria-label="Plano gerado por IA">
          <p>{aiPlan.summary}</p>
          <ol>
            {aiPlan.ordered_tasks.map((item) => (
              <li key={item.task_id}>
                <strong>{item.name}</strong>
                <span>{item.reason}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="todo-task-list" aria-label="Ordem sugerida">
        {tasks.length === 0 ? (
          <p className="empty-state">Nenhuma tarefa nesta visao.</p>
        ) : (
          tasks.map((task, index) => (
            <article className="todo-task-row" key={task.id}>
              <span className={getPriorityClass(task.priority_label)} aria-hidden="true" />
              <div className="todo-task-content">
                <div className="todo-task-main">
                  <h2>{task.name}</h2>
                  <p>{task.description}</p>
                </div>
                <div className="todo-task-side">
                  <span>{translateOption(task.priority_label)}</span>
                  <small>{formatDate(task.due_date)}</small>
                  <button className="row-action" onClick={() => onEditTask(task)} type="button">
                    <Pencil size={14} strokeWidth={2.1} />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
              <span className="row-number">{index + 1}</span>
            </article>
          ))
        )}

        <button className="add-task-row" onClick={onAddTask} type="button">
          <Plus size={17} strokeWidth={2.2} />
          <span>Adicionar tarefa</span>
        </button>
      </section>
    </div>
  )
}
