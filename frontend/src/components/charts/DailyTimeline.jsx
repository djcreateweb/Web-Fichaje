import { useMemo } from 'react'
import { formatTime } from '../../utils/formatters'

function DayChart({ day, trackableEmployees }) {
  const employeesWithRecords = useMemo(() => {
    const map = new Map(trackableEmployees.map((e) => [e.id, { ...e, records: [] }]))
    day.records.forEach((r) => {
      if (map.has(r.employeeId)) map.get(r.employeeId).records.push(r)
    })
    return Array.from(map.values()).filter((e) => e.records.length > 0)
  }, [day.records, trackableEmployees])

  const { minMs, rangeMs, hourLabels } = useMemo(() => {
    const allTimes = day.records.flatMap((r) =>
      [r.entryTimestamp, r.exitTimestamp].filter(Boolean),
    )
    if (allTimes.length === 0) return { minMs: 0, rangeMs: 1, hourLabels: [] }

    const minT = Math.min(...allTimes)
    const maxT = Math.max(...allTimes)

    const start = new Date(minT)
    start.setMinutes(0, 0, 0)
    const end = new Date(maxT)
    end.setHours(end.getHours() + 1, 0, 0, 0)

    const minMs = start.getTime()
    const rangeMs = end.getTime() - minMs

    const hourLabels = []
    const cur = new Date(start)
    while (cur.getTime() <= end.getTime()) {
      hourLabels.push({
        label: `${String(cur.getHours()).padStart(2, '0')}:00`,
        pct: ((cur.getTime() - minMs) / rangeMs) * 100,
      })
      cur.setHours(cur.getHours() + 1)
    }

    return { minMs, rangeMs, hourLabels }
  }, [day.records])

  const formattedDate = useMemo(() => {
    const [y, m, d] = day.date.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [day.date])

  if (employeesWithRecords.length === 0) return null

  return (
    <div className="border border-slate-200 rounded-xl bg-white p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
      <p className="text-sm font-semibold text-slate-700 capitalize mb-3">{formattedDate}</p>

      <div className="space-y-2">
        {employeesWithRecords.map((emp) => (
          <div key={emp.id} className="flex items-center gap-2">
            {/* Nombre */}
            <span
              className="w-24 text-xs font-medium text-slate-600 truncate shrink-0"
              title={emp.name}
            >
              {emp.name.split(' ')[0]}
            </span>

            {/* Barra de timeline */}
            <div className="flex-1 relative h-6 bg-slate-100 rounded overflow-hidden">
              {emp.records.map((r) => {
                const left = Math.max(0, ((r.entryTimestamp - minMs) / rangeMs) * 100)
                const exitT = r.exitTimestamp ?? (minMs + rangeMs)
                const width = Math.max(1, ((exitT - r.entryTimestamp) / rangeMs) * 100)
                return (
                  <div
                    key={r.id}
                    className={`absolute top-0 h-full rounded-sm ${r.exitTimestamp ? 'bg-admin-700' : 'bg-employee-500'}`}
                    style={{
                      left: `${left}%`,
                      width: `${Math.min(width, 100 - left)}%`,
                    }}
                    title={`${formatTime(r.entryTimestamp)} – ${r.exitTimestamp ? formatTime(r.exitTimestamp) : 'En curso'}`}
                  />
                )
              })}
            </div>

            {/* Horas entrada–salida */}
            <span className="w-40 text-xs text-slate-500 shrink-0 text-right leading-tight">
              {emp.records
                .map(
                  (r) =>
                    `${formatTime(r.entryTimestamp)} – ${r.exitTimestamp ? formatTime(r.exitTimestamp) : '…'}`,
                )
                .join(' / ')}
            </span>
          </div>
        ))}
      </div>

      {/* Eje horario */}
      <div className="flex gap-2 mt-2">
        <div className="w-24 shrink-0" />
        <div className="flex-1 relative h-4">
          {hourLabels.map(({ label, pct }) => (
            <span
              key={label}
              className="absolute text-[10px] text-slate-400 -translate-x-1/2 font-mono select-none"
              style={{ left: `${pct}%` }}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="w-40 shrink-0" />
      </div>
    </div>
  )
}

export default function DailyTimeline({ days, trackableEmployees }) {
  if (!days || days.length === 0) {
    return (
      <div className="border border-slate-200 rounded-xl bg-white p-6 text-center">
        <p className="text-slate-800 font-medium">No hay datos suficientes</p>
        <p className="text-slate-500 text-sm mt-1">
          Selecciona un rango de fechas y pulsa Buscar.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {days.map((day) => (
        <DayChart key={day.date} day={day} trackableEmployees={trackableEmployees} />
      ))}
    </div>
  )
}
