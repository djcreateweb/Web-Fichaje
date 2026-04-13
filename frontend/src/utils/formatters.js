export function formatDateTime(timestamp) {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(timestamp) {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleDateString('es-ES')
}

export function formatTime(timestamp) {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatHours(hoursDecimal) {
  if (!hoursDecimal) return '0h 00m'
  const h = Math.floor(hoursDecimal)
  const m = Math.round((hoursDecimal - h) * 60)
  return `${h}h ${m < 10 ? '0' : ''}${m}m`
}

export function calculateWorkedHours(entryTimestamp, exitTimestamp) {
  if (!entryTimestamp || !exitTimestamp) return 0
  const diffMs = Math.max(0, exitTimestamp - entryTimestamp)
  return diffMs / (1000 * 60 * 60)
}
