import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  CalendarDays,
  CheckSquare,
  CircleDot,
  ClipboardList,
  Inbox,
  ListChecks,
  Menu,
  Plus,
  PlusCircle,
  Search,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import {
  createTask,
  listTasks,
  planTasksWithAi,
  suggestTaskWithAi,
  updateTask,
} from './api/tasks'
import { PriorityPanel } from './components/PriorityPanel'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'

const viewTitles = {
  create: 'Criar tarefa',
  inbox: 'Caixa de entrada',
  important: 'Importante',
  list: 'Lista',
  project_brand: 'Marca nova',
  project_personal: 'Pessoal',
  project_site: 'Atualizacao do site',
  project_work: 'Trabalho',
  team: 'Caixa da equipe',
  today: 'Hoje',
}

const projectViews = {
  project_brand: 'marca_nova',
  project_personal: 'pessoal',
  project_site: 'atualizacao_site',
  project_work: 'trabalho',
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function taskMatchesView(task, view) {
  if (view === 'inbox') {
    return task.source === 'entrada'
  }

  if (view === 'team') {
    return task.source === 'equipe'
  }

  if (view === 'today') {
    return task.due_date <= getToday()
  }

  if (view === 'important') {
    return task.priority_label === 'alta'
  }

  if (projectViews[view]) {
    return task.project === projectViews[view]
  }

  return true
}

function taskMatchesSearch(task, searchTerm) {
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase()

  if (!normalizedSearch) {
    return true
  }

  return `${task.name} ${task.description}`.toLocaleLowerCase().includes(normalizedSearch)
}

function App() {
  const [activeView, setActiveView] = useState('today')
  const [previousView, setPreviousView] = useState('today')
  const [editingTask, setEditingTask] = useState(null)
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPlanning, setIsPlanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [aiPlan, setAiPlan] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((first, second) => {
        if (second.priority_score !== first.priority_score) {
          return second.priority_score - first.priority_score
        }

        return new Date(first.due_date) - new Date(second.due_date)
      }),
    [tasks],
  )

  const visibleTasks = useMemo(
    () =>
      sortedTasks
        .filter((task) => taskMatchesView(task, activeView))
        .filter((task) => taskMatchesSearch(task, searchTerm)),
    [activeView, searchTerm, sortedTasks],
  )

  const counts = useMemo(
    () => ({
      inbox: tasks.filter((task) => task.source === 'entrada').length,
      important: tasks.filter((task) => task.priority_label === 'alta').length,
      project_brand: tasks.filter((task) => task.project === 'marca_nova').length,
      project_personal: tasks.filter((task) => task.project === 'pessoal').length,
      project_site: tasks.filter((task) => task.project === 'atualizacao_site').length,
      project_work: tasks.filter((task) => task.project === 'trabalho').length,
      team: tasks.filter((task) => task.source === 'equipe').length,
      today: tasks.filter((task) => task.due_date <= getToday()).length,
    }),
    [tasks],
  )

  useEffect(() => {
    async function loadTasks() {
      try {
        const response = await listTasks()
        setTasks(response)
      } catch {
        setError('Nao foi possivel carregar as tarefas.')
      } finally {
        setIsLoading(false)
      }
    }

    loadTasks()
  }, [])

  function selectView(view) {
    setActiveView(view)
    setEditingTask(null)
    setAiPlan(null)
    setError('')
    setMessage('')
  }

  function startCreateTask() {
    setEditingTask(null)
    setPreviousView(activeView === 'create' ? previousView : activeView)
    setActiveView('create')
  }

  function startEditTask(task) {
    setEditingTask(task)
    setPreviousView(activeView)
    setActiveView('create')
    setError('')
    setMessage('')
  }

  function cancelEdit() {
    setEditingTask(null)
    setActiveView(previousView)
  }

  async function handleCreateTask(payload) {
    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const task = await createTask(payload)
      setTasks((currentTasks) => [task, ...currentTasks])
      setAiPlan(null)
      setMessage('Tarefa cadastrada.')
      setActiveView('list')
    } catch {
      setError('Nao foi possivel cadastrar a tarefa.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdateTask(id, payload) {
    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const task = await updateTask(id, payload)
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) => (currentTask.id === task.id ? task : currentTask)),
      )
      setEditingTask(null)
      setAiPlan(null)
      setMessage('Tarefa atualizada.')
      setActiveView(previousView)
    } catch {
      setError('Nao foi possivel atualizar a tarefa.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSuggestTask(payload) {
    setIsSuggesting(true)
    setError('')
    setMessage('')

    try {
      return await suggestTaskWithAi(payload)
    } finally {
      setIsSuggesting(false)
    }
  }

  async function handlePlanTasks() {
    setIsPlanning(true)
    setError('')
    setMessage('')

    try {
      const plan = await planTasksWithAi()
      setAiPlan(plan)
      setMessage('Plano gerado com IA.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsPlanning(false)
    }
  }

  function renderContent() {
    if (activeView === 'create') {
      return (
        <TaskForm
          isSaving={isSaving}
          isSuggesting={isSuggesting}
          onCancelEdit={cancelEdit}
          onCreateTask={handleCreateTask}
          onSuggestTask={handleSuggestTask}
          onUpdateTask={handleUpdateTask}
          taskToEdit={editingTask}
        />
      )
    }

    if (activeView === 'list') {
      return (
        <TaskList
          isLoading={isLoading}
          onEditTask={startEditTask}
          tasks={visibleTasks}
          title={viewTitles[activeView]}
        />
      )
    }

    return (
      <PriorityPanel
        aiPlan={aiPlan}
        isLoading={isLoading}
        isPlanning={isPlanning}
        onAddTask={startCreateTask}
        onEditTask={startEditTask}
        onPlanWithAi={handlePlanTasks}
        tasks={visibleTasks}
        title={viewTitles[activeView]}
      />
    )
  }

  function sidebarClass(view) {
    return activeView === view ? 'sidebar-item active' : 'sidebar-item'
  }

  function projectClass(view) {
    return activeView === view ? 'project-item active' : 'project-item'
  }

  return (
    <main className="todo-shell">
      <header className="todo-topbar">
        <div className="topbar-left">
          <button className="icon-button" type="button" title="Menu">
            <Menu size={19} strokeWidth={2.1} />
          </button>
          <div className="topbar-logo" aria-hidden="true">
            <ClipboardList size={20} strokeWidth={2.3} />
          </div>
          <label className="quick-search">
            <Search size={16} strokeWidth={2.1} />
            <input
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Busca rapida"
              type="search"
              value={searchTerm}
            />
          </label>
        </div>

        <div className="topbar-actions">
          <button className="icon-button" onClick={startCreateTask} type="button" title="Adicionar">
            <Plus size={19} strokeWidth={2.1} />
          </button>
          <button className="icon-button" type="button" title="Notificacoes">
            <Bell size={18} strokeWidth={2.1} />
          </button>
          <button className="icon-button" type="button" title="Configuracoes">
            <Settings size={18} strokeWidth={2.1} />
          </button>
        </div>
      </header>

      <div className="todo-body">
        <aside className="todo-sidebar" aria-label="Navegacao lateral">
          <nav className="sidebar-nav">
            <button className={sidebarClass('inbox')} onClick={() => selectView('inbox')} type="button">
              <Inbox size={17} strokeWidth={2.1} />
              <span>Caixa de entrada</span>
              <strong>{counts.inbox}</strong>
            </button>
            <button className={sidebarClass('team')} onClick={() => selectView('team')} type="button">
              <Users size={17} strokeWidth={2.1} />
              <span>Caixa da equipe</span>
              <strong>{counts.team}</strong>
            </button>
            <button className={sidebarClass('today')} onClick={() => selectView('today')} type="button">
              <CalendarDays size={17} strokeWidth={2.1} />
              <span>Hoje</span>
              <strong>{counts.today}</strong>
            </button>
            <button className={sidebarClass('create')} onClick={startCreateTask} type="button">
              <PlusCircle size={17} strokeWidth={2.1} />
              <span>Criar tarefa</span>
            </button>
            <button className={sidebarClass('list')} onClick={() => selectView('list')} type="button">
              <ListChecks size={17} strokeWidth={2.1} />
              <span>Lista</span>
              <strong>{tasks.length}</strong>
            </button>
            <button
              className={sidebarClass('important')}
              onClick={() => selectView('important')}
              type="button"
            >
              <Sparkles size={17} strokeWidth={2.1} />
              <span>Importante</span>
              <strong>{counts.important}</strong>
            </button>
          </nav>

          <section className="sidebar-section">
            <div className="sidebar-heading">
              <span>Projetos</span>
              <button className="mini-icon-button" onClick={startCreateTask} type="button" title="Nova tarefa">
                <Plus size={16} strokeWidth={2.1} />
              </button>
            </div>
            <button
              className={projectClass('project_work')}
              onClick={() => selectView('project_work')}
              type="button"
            >
              <CircleDot size={14} strokeWidth={2.2} />
              <span>Trabalho</span>
              <strong>{counts.project_work}</strong>
            </button>
            <button
              className={projectClass('project_brand')}
              onClick={() => selectView('project_brand')}
              type="button"
            >
              <CircleDot size={14} strokeWidth={2.2} />
              <span>Marca nova</span>
              <strong>{counts.project_brand}</strong>
            </button>
            <button
              className={projectClass('project_site')}
              onClick={() => selectView('project_site')}
              type="button"
            >
              <CircleDot size={14} strokeWidth={2.2} />
              <span>Atualizacao do site</span>
              <strong>{counts.project_site}</strong>
            </button>
            <button
              className={projectClass('project_personal')}
              onClick={() => selectView('project_personal')}
              type="button"
            >
              <CheckSquare size={14} strokeWidth={2.2} />
              <span>Pessoal</span>
              <strong>{counts.project_personal}</strong>
            </button>
          </section>
        </aside>

        <section className="todo-main">
          {(message || error) && (
            <div className={error ? 'status-message error' : 'status-message'}>
              {error || message}
            </div>
          )}

          <div className="workspace">{renderContent()}</div>
        </section>
      </div>
    </main>
  )
}

export default App
