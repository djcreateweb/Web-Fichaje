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

export function calculateUniqueWorkedHours(records) {
  if (!Array.isArray(records) || records.length === 0) return 0

  const intervalsByDay = new Map()

  for (const r of records) {
    if (!r?.entryTimestamp || !r?.exitTimestamp) continue
    const start = Math.min(r.entryTimestamp, r.exitTimestamp)
    const end = Math.max(r.entryTimestamp, r.exitTimestamp)
    if (end <= start) continue

    let cursor = start
    while (new Date(cursor).toISOString().slice(0, 10) !== new Date(end).toISOString().slice(0, 10)) {
      const dayKey = new Date(cursor).toISOString().slice(0, 10)
      const endOfDay = new Date(cursor)
      endOfDay.setHours(23, 59, 59, 999)
      const segmentEnd = endOfDay.getTime()
      if (!intervalsByDay.has(dayKey)) intervalsByDay.set(dayKey, [])
      intervalsByDay.get(dayKey).push([cursor, segmentEnd])
      cursor = segmentEnd + 1
    }

    const dayKey = new Date(cursor).toISOString().slice(0, 10)
    if (!intervalsByDay.has(dayKey)) intervalsByDay.set(dayKey, [])
    intervalsByDay.get(dayKey).push([cursor, end])
  }

  let totalMinutes = 0

  for (const intervals of intervalsByDay.values()) {
    intervals.sort((a, b) => a[0] - b[0])

    const merged = []
    for (const [s, e] of intervals) {
      if (merged.length === 0) {
        merged.push([s, e])
        continue
      }
      const last = merged[merged.length - 1]
      if (s <= last[1]) {
        last[1] = Math.max(last[1], e)
        continue
      }
      merged.push([s, e])
    }

    for (const [s, e] of merged) {
      totalMinutes += Math.max(0, e - s) / (1000 * 60)
    }
  }

  return totalMinutes / 60
}
