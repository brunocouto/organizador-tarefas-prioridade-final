const optionLabels = {
  alta: 'Alta',
  atualizacao_site: 'Atualizacao do site',
  baixa: 'Baixa',
  equipe: 'Equipe',
  entrada: 'Entrada',
  marca_nova: 'Marca nova',
  media: 'Media',
  pessoal: 'Pessoal',
  trabalho: 'Trabalho',
}

export function translateOption(value) {
  return optionLabels[value] ?? value
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

export function getPriorityClass(priority) {
  return `priority-badge ${priority}`
}
