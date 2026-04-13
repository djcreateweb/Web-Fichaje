import { getAppData, saveRecord } from './storage.service'
import { calculateWorkedHours } from '../utils/formatters'

export function getEmployeeOpenRecord(employeeId) {
  const { records } = getAppData()
  return records.find((record) => record.employeeId === employeeId && !record.exitTimestamp)
}

export function clockIn(employeeId, employeeName, companyId, geoData = null) {
  const record = {
    id: crypto.randomUUID(),
    employeeId,
    employeeName,
    companyId,
    entryTimestamp: Date.now(),
    exitTimestamp: null,
    entry_latitud: geoData?.latitud ?? null,
    entry_longitud: geoData?.longitud ?? null,
    entry_precision_metros: geoData?.precision_metros ?? null,
    entry_ubicacion_disponible: geoData?.disponible ?? false,
    exit_latitud: null,
    exit_longitud: null,
    exit_precision_metros: null,
    exit_ubicacion_disponible: false,
  }
  saveRecord(record)
}

export function clockOut(record, geoData = null) {
  saveRecord({
    ...record,
    exitTimestamp: Date.now(),
    exit_latitud: geoData?.latitud ?? null,
    exit_longitud: geoData?.longitud ?? null,
    exit_precision_metros: geoData?.precision_metros ?? null,
    exit_ubicacion_disponible: geoData?.disponible ?? false,
  })
}

export function getEmployeeRecords(employeeId) {
  const { records } = getAppData()
  return records
    .filter((record) => record.employeeId === employeeId)
    .sort((a, b) => b.entryTimestamp - a.entryTimestamp)
}

export function getFilteredRecords(filters) {
  const { records } = getAppData()
  return records
    .filter((record) => {
      const date = new Date(record.entryTimestamp).toISOString().slice(0, 10)
      const matchesEmployee =
        !filters.employeeId || record.employeeId === filters.employeeId
      const matchesFrom = !filters.from || date >= filters.from
      const matchesTo = !filters.to || date <= filters.to
      return matchesEmployee && matchesFrom && matchesTo
    })
    .sort((a, b) => b.entryTimestamp - a.entryTimestamp)
}

export function getHoursSummary() {
  const { employees, records } = getAppData()
  return employees
    .map((employee) => {
      const workedHours = records
        .filter((record) => record.employeeId === employee.id && record.exitTimestamp)
        .reduce(
          (acc, record) =>
            acc + calculateWorkedHours(record.entryTimestamp, record.exitTimestamp),
          0,
        )

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        workedHours,
      }
    })
    .sort((a, b) => b.workedHours - a.workedHours)
}

export function getAttendanceCounts(filters) {
  const { employees, records } = getAppData()

  const from = filters?.from || ''
  const to = filters?.to || ''

  const countsByEmployeeId = new Map()
  employees.forEach((employee) => countsByEmployeeId.set(employee.id, 0))

  records.forEach((record) => {
    if (!record.exitTimestamp) return

    const date = new Date(record.entryTimestamp).toISOString().slice(0, 10)
    const matchesFrom = !from || date >= from
    const matchesTo = !to || date <= to
    if (!matchesFrom || !matchesTo) return

    countsByEmployeeId.set(
      record.employeeId,
      (countsByEmployeeId.get(record.employeeId) ?? 0) + 1,
    )
  })

  return employees
    .map((employee) => ({
      employeeId: employee.id,
      employeeName: employee.name,
      count: countsByEmployeeId.get(employee.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count)
}

export function exportRecordsCsv(records) {
  const headers = [
    'Empleado',
    'Fecha',
    'Hora de entrada',
    'Hora de salida',
    'Horas totales',
    'Lat. entrada',
    'Long. entrada',
    'Lat. salida',
    'Long. salida',
    'Ubicación entrada disponible',
    'Ubicación salida disponible',
  ]
  const rows = records.map((record) => {
    const date = new Date(record.entryTimestamp).toLocaleDateString('es-ES')
    const entry = new Date(record.entryTimestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const exit = record.exitTimestamp
      ? new Date(record.exitTimestamp).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-'
    const hours = record.exitTimestamp
      ? calculateWorkedHours(record.entryTimestamp, record.exitTimestamp)
          .toFixed(2)
          .replace('.', ',')
      : '-'

    return [
      record.employeeName,
      date,
      entry,
      exit,
      hours,
      record.entry_latitud != null ? String(record.entry_latitud).replace('.', ',') : '-',
      record.entry_longitud != null ? String(record.entry_longitud).replace('.', ',') : '-',
      record.exit_latitud != null ? String(record.exit_latitud).replace('.', ',') : '-',
      record.exit_longitud != null ? String(record.exit_longitud).replace('.', ',') : '-',
      record.entry_ubicacion_disponible ? 'Sí' : 'No',
      record.exit_ubicacion_disponible ? 'Sí' : 'No',
    ]
  })

  return [headers, ...rows].map((row) => row.join(';')).join('\n')
}

