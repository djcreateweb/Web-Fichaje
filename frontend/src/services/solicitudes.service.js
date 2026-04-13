import { getAppData, saveAuditEntry, saveRecord, saveSolicitud } from './storage.service'

// Combina una cadena "HH:MM" con la fecha de un timestamp de referencia
function mergeTimeWithDate(timeStr, referenceTimestamp) {
  const date = new Date(referenceTimestamp)
  const [hours, minutes] = timeStr.split(':').map(Number)
  date.setHours(hours, minutes, 0, 0)
  return date.getTime()
}

export function crearSolicitudCambio({
  fichajeId,
  employeeId,
  employeeName,
  companyId,
  entryTimestampActual,
  exitTimestampActual,
  entradaPropuestaStr, // "HH:MM" o ""
  salidaPropuestaStr, // "HH:MM" o ""
  motivo,
  comentarios,
}) {
  const entryTimestampPropuesta = entradaPropuestaStr
    ? mergeTimeWithDate(entradaPropuestaStr, entryTimestampActual)
    : null

  // Para la salida propuesta, usar la fecha de salida actual si existe, si no la de entrada
  const salidaReferencia = exitTimestampActual ?? entryTimestampActual
  const exitTimestampPropuesta = salidaPropuestaStr
    ? mergeTimeWithDate(salidaPropuestaStr, salidaReferencia)
    : null

  const solicitud = {
    id: crypto.randomUUID(),
    fichajeId,
    employeeId,
    employeeName,
    companyId,
    entryTimestampActual,
    exitTimestampActual,
    entryTimestampPropuesta,
    exitTimestampPropuesta,
    motivo,
    comentarios,
    estado: 'pendiente',
    creadoEn: Date.now(),
    resueltoPor: null,
    resueltoEn: null,
    comentarioResolucion: null,
  }

  saveSolicitud(solicitud)

  saveAuditEntry({
    id: crypto.randomUUID(),
    fichajeId,
    solicitudId: solicitud.id,
    companyId,
    accion: 'solicitud_cambio',
    usuarioId: employeeId,
    usuarioNombre: employeeName,
    usuarioRol: 'empleado',
    valorAnterior: { entryTimestamp: entryTimestampActual, exitTimestamp: exitTimestampActual },
    valorNuevo: { entryTimestamp: entryTimestampPropuesta, exitTimestamp: exitTimestampPropuesta },
    motivo,
    timestamp: Date.now(),
  })

  return solicitud
}

export function aprobarSolicitud(solicitudId, adminSession, comentario) {
  const data = getAppData()
  const solicitud = data.solicitudes_cambio.find((s) => s.id === solicitudId)
  if (!solicitud || solicitud.estado !== 'pendiente') return false

  const fichajeActual = data.records.find((r) => r.id === solicitud.fichajeId)
  if (!fichajeActual) return false

  const entryNueva = solicitud.entryTimestampPropuesta ?? fichajeActual.entryTimestamp
  const exitNueva =
    solicitud.exitTimestampPropuesta !== undefined
      ? solicitud.exitTimestampPropuesta
      : fichajeActual.exitTimestamp

  const fichajeActualizado = {
    ...fichajeActual,
    entryTimestamp: entryNueva,
    exitTimestamp: exitNueva,
  }

  saveRecord(fichajeActualizado)

  const solicitudActualizada = {
    ...solicitud,
    estado: 'aprobada',
    resueltoPor: adminSession.nombre,
    resueltoEn: Date.now(),
    comentarioResolucion: comentario || null,
  }

  saveSolicitud(solicitudActualizada)

  saveAuditEntry({
    id: crypto.randomUUID(),
    fichajeId: solicitud.fichajeId,
    solicitudId,
    companyId: solicitud.companyId,
    accion: 'aprobacion',
    usuarioId: adminSession.id,
    usuarioNombre: adminSession.nombre,
    usuarioRol: adminSession.rol,
    valorAnterior: { entryTimestamp: fichajeActual.entryTimestamp, exitTimestamp: fichajeActual.exitTimestamp },
    valorNuevo: { entryTimestamp: entryNueva, exitTimestamp: exitNueva },
    motivo: comentario || null,
    timestamp: Date.now(),
  })

  saveAuditEntry({
    id: crypto.randomUUID(),
    fichajeId: solicitud.fichajeId,
    solicitudId,
    companyId: solicitud.companyId,
    accion: 'modificacion_fichaje',
    usuarioId: adminSession.id,
    usuarioNombre: adminSession.nombre,
    usuarioRol: adminSession.rol,
    valorAnterior: { entryTimestamp: fichajeActual.entryTimestamp, exitTimestamp: fichajeActual.exitTimestamp },
    valorNuevo: { entryTimestamp: entryNueva, exitTimestamp: exitNueva },
    motivo: `Aprobación de solicitud. ${comentario || ''}`.trim(),
    timestamp: Date.now(),
  })

  return true
}

export function rechazarSolicitud(solicitudId, adminSession, comentario) {
  const data = getAppData()
  const solicitud = data.solicitudes_cambio.find((s) => s.id === solicitudId)
  if (!solicitud || solicitud.estado !== 'pendiente') return false

  const solicitudActualizada = {
    ...solicitud,
    estado: 'rechazada',
    resueltoPor: adminSession.nombre,
    resueltoEn: Date.now(),
    comentarioResolucion: comentario || null,
  }

  saveSolicitud(solicitudActualizada)

  saveAuditEntry({
    id: crypto.randomUUID(),
    fichajeId: solicitud.fichajeId,
    solicitudId,
    companyId: solicitud.companyId,
    accion: 'rechazo',
    usuarioId: adminSession.id,
    usuarioNombre: adminSession.nombre,
    usuarioRol: adminSession.rol,
    valorAnterior: { entryTimestamp: solicitud.entryTimestampActual, exitTimestamp: solicitud.exitTimestampActual },
    valorNuevo: null,
    motivo: comentario || null,
    timestamp: Date.now(),
  })

  return true
}

export function getSolicitudesParaEmpleado(employeeId) {
  const { solicitudes_cambio } = getAppData()
  return (solicitudes_cambio ?? [])
    .filter((s) => s.employeeId === employeeId)
    .sort((a, b) => b.creadoEn - a.creadoEn)
}

export function getSolicitudesParaAdmin(companyId) {
  const { solicitudes_cambio } = getAppData()
  return (solicitudes_cambio ?? [])
    .filter((s) => s.companyId === companyId)
    .sort((a, b) => b.creadoEn - a.creadoEn)
}

export function getAuditoriaParaFichaje(fichajeId) {
  const { auditoria_fichajes } = getAppData()
  return (auditoria_fichajes ?? [])
    .filter((e) => e.fichajeId === fichajeId)
    .sort((a, b) => a.timestamp - b.timestamp)
}
