const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`

    try {
      const payload = await response.json()
      message = payload.detail ?? message
    } catch {
      // Keep the generic message when the backend does not return JSON.
    }

    throw new Error(message)
  }

  return response.json()
}

export function listTasks() {
  return request('/api/tasks')
}

export function createTask(payload) {
  return request('/api/tasks', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function updateTask(id, payload) {
  return request(`/api/tasks/${id}`, {
    body: JSON.stringify(payload),
    method: 'PUT',
  })
}

export function suggestTaskWithAi(payload) {
  return request('/api/ai/suggest-priority', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function planTasksWithAi() {
  return request('/api/ai/daily-plan', {
    method: 'POST',
  })
}
