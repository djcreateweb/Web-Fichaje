import { useMemo, useState } from 'react'

export default function AttendanceBarChart({ data, hoursData, showHours = true }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [metric, setMetric] = useState('hours')

  const isAttendance = metric === 'attendance' || !showHours
  const activeData = isAttendance ? data : hoursData

  const maxValue = useMemo(() => {
    if (!activeData || activeData.length === 0) return 0
    return Math.max(0, ...activeData.map((d) => isAttendance ? d.count : d.hours))
  }, [activeData, isAttendance])

  const normalized = useMemo(() => {
    if (!activeData || activeData.length === 0) return []
    if (maxValue === 0) {
      return activeData.map((d) => ({
        employeeId: d.employeeId,
        employeeName: d.employeeName,
        value: 0,
        percent: 0,
        formatted: isAttendance ? '0 días' : '0 h'
      }))
    }

    return activeData.map((d) => {
      const val = isAttendance ? d.count : d.hours

      let formatted = ''
      if (isAttendance) {
        formatted = `${val} días`
      } else {
        const h = Math.floor(val)
        const m = Math.round((val - h) * 60)
        formatted = `${h}h ${m < 10 ? '0' : ''}${m}m`
      }

      return {
        employeeId: d.employeeId,
        employeeName: d.employeeName,
        value: val,
        percent: (val / maxValue) * 100,
        formatted
      }
    })
  }, [activeData, maxValue, isAttendance])

  if (!activeData || activeData.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg p-6 bg-white text-center">
        <p className="text-slate-800 font-medium">No hay datos suficientes</p>
        <p className="text-slate-500 text-sm mt-1">Registra fichajes para la fecha seleccionada.</p>
      </div>
    )
  }

  const CHART_HEIGHT = 180 // px, slightly smaller and more compact

  return (
    <div className="border border-slate-200 rounded-xl bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            {isAttendance ? 'Días Asistidos' : 'Horas Trabajadas'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAttendance ? 'Basado en fichajes completados.' : 'Total de tiempo efectivo registrado.'}
          </p>
        </div>

        {showHours && (
          <div className="p-1 bg-slate-100 rounded-lg inline-flex self-start">
            <button
              onClick={() => setMetric('attendance')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${isAttendance
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Por Días
            </button>
            <button
              onClick={() => setMetric('hours')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${!isAttendance
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Por Horas
            </button>
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="relative mt-2" style={{ height: CHART_HEIGHT }}>
        {/* Gridlines */}
        {[100, 75, 50, 25, 0].map((pct) => (
          <div
            key={pct}
            className="absolute left-0 right-0 flex items-center gap-3"
            style={{ bottom: `${(pct / 100) * CHART_HEIGHT}px`, transform: 'translateY(50%)' }}
          >
            <span className="text-[10px] text-slate-400 w-8 text-right shrink-0 font-medium font-mono">
              {pct === 0
                ? '0'
                : isAttendance
                  ? Math.round((pct / 100) * maxValue)
                  : (() => {
                      const hrs = (pct / 100) * maxValue;
                      const h = Math.floor(hrs);
                      const m = Math.round((hrs - h) * 60);
                      return `${h}h${m > 0 ? ` ${m < 10 ? '0' : ''}${m}m` : ''}`;
                    })()}
            </span>
            <div className="flex-1 border-t border-slate-100" />
          </div>
        ))}

        {/* Bars */}
        <div className="absolute inset-0 pl-11 flex items-end gap-1.5 sm:gap-2">
          {normalized.map((item, idx) => {
            // Give a tiny min-height so zeros are visible
            const barH = Math.max(2, (item.percent / 100) * CHART_HEIGHT)
            const isHovered = hoveredIndex === idx

            return (
              <button
                key={item.employeeId}
                type="button"
                className="flex-1 flex flex-col items-center justify-end focus:outline-none group h-full"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(idx)}
                onBlur={() => setHoveredIndex(null)}
                aria-label={`${item.employeeName}: ${item.formatted}`}
              >
                <div
                  className="w-full max-w-[40px] rounded-t-sm transition-all duration-300 ease-out"
                  style={{
                    height: barH,
                    backgroundColor: isHovered
                      ? 'var(--color-admin-700, #1e293b)'
                      : 'var(--color-admin-500, #64748b)',
                    opacity: isHovered ? 1 : 0.8,
                  }}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* X Axis Labels */}
      <div className="pl-11 flex gap-1.5 sm:gap-2 mt-3">
        {normalized.map((item) => (
          <div key={item.employeeId} className="flex-1 text-center">
            <span
              className="text-[10px] font-medium text-slate-500 block truncate"
              title={item.employeeName}
            >
              {item.employeeName.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}
