// Claves únicas (v1) para todo el almacenamiento local
const STORAGE_KEY = 'presentia_data'
const SESSION_KEY = 'presentia_session'
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000
const ALT_STORAGE_KEY = 'presentia_data_v2'
const ALT_SESSION_KEY = 'presentia_session_v2'

const initialState = {
  admin: null,
  companies: [],
  employees: [],
  records: [],
  solicitudes_cambio: [],
  auditoria_fichajes: [],
}

function ensureMigration(data) {
  const migrated = {
    admin: data.admin ?? null,
    companies: Array.isArray(data.companies) ? data.companies : [],
    employees: Array.isArray(data.employees)
      ? data.employees.map((e) => ({
        ...e,
        // Normalizar posibles claves antiguas
        name: e.name ?? e.nombre,
        email: e.email ?? e.correo,
        role: e.role ?? e.rol,
      }))
      : [],
    records: Array.isArray(data.records) ? data.records : [],
    solicitudes_cambio: Array.isArray(data.solicitudes_cambio) ? data.solicitudes_cambio : [],
    auditoria_fichajes: Array.isArray(data.auditoria_fichajes) ? data.auditoria_fichajes : [],
  }

  if (migrated.admin && migrated.companies.length === 0) {
    const adminEmail = migrated.admin.username
    const companyId = crypto.randomUUID()
    migrated.companies.push({
      id: companyId,
      name: 'Presentia Demo',
      adminEmail,
      geolocalizacion_activa: false,
      createdAt: Date.now(),
    })

    migrated.employees = migrated.employees.map((e) => ({
      ...e,
      companyId: e.companyId ?? companyId,
    }))

    migrated.records = migrated.records.map((r) => ({
      ...r,
      companyId: r.companyId ?? (migrated.employees.find((e) => e.id === r.employeeId)?.companyId ?? companyId),
    }))
  } else {
    migrated.employees = migrated.employees.map((e) => ({
      ...e,
      companyId: e.companyId ?? null,
    }))
    migrated.records = migrated.records.map((r) => ({
      ...r,
      companyId: r.companyId ?? null,
    }))
  }

  // Normalizar campos de geolocalización en empresas
  migrated.companies = migrated.companies.map((c) => ({
    ...c,
    geolocalizacion_activa: c.geolocalizacion_activa ?? false,
  }))

  // Normalizar consentimiento geo en empleados
  migrated.employees = migrated.employees.map((e) => ({
    ...e,
    geo_consentimiento_aceptado: e.geo_consentimiento_aceptado ?? null,
    geo_consentimiento_fecha: e.geo_consentimiento_fecha ?? null,
    geo_consentimiento_pendiente: e.geo_consentimiento_pendiente ?? false,
  }))

  return migrated
}

function readStorage() {
  const raw = localStorage.getItem(STORAGE_KEY)
  const altRaw = localStorage.getItem(ALT_STORAGE_KEY)
  const source = raw ?? altRaw
  if (!source) return initialState

  try {
    const parsed = JSON.parse(source)
    const migrated = ensureMigration(parsed ?? {})
    // Siempre consolidar en STORAGE_KEY (v1) y mantenerlo actualizado
    if (!raw || JSON.stringify(migrated) !== JSON.stringify(parsed ?? {})) {
      writeStorage(migrated)
    }
    // Si existía la clave alternativa, la limpiamos para evitar duplicados
    if (altRaw) {
      localStorage.removeItem(ALT_STORAGE_KEY)
    }
    return migrated
  } catch {
    return initialState
  }
}

function writeStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getAppData() {
  return readStorage()
}

export function setAdmin(adminData) {
  const current = readStorage()
  current.admin = adminData
  writeStorage(current)
}

export function upsertCompany(company) {
  const current = readStorage()
  const index = current.companies.findIndex((item) => item.id === company.id)

  if (index >= 0) {
    current.companies[index] = company
  } else {
    current.companies.push(company)
  }

  writeStorage(current)
}

export function deleteCompany(companyId) {
  const current = readStorage()
  current.companies = current.companies.filter((item) => item.id !== companyId)
  current.employees = current.employees.filter((employee) => employee.companyId !== companyId)
  current.records = current.records.filter((record) => record.companyId !== companyId)
  writeStorage(current)
}

export function upsertEmployee(employee) {
  const current = readStorage()
  const index = current.employees.findIndex((item) => item.id === employee.id)

  if (index >= 0) {
    current.employees[index] = employee
  } else {
    current.employees.push(employee)
  }

  writeStorage(current)
}

export function deleteEmployee(employeeId) {
  const current = readStorage()
  current.employees = current.employees.filter((item) => item.id !== employeeId)
  current.records = current.records.filter((record) => record.employeeId !== employeeId)
  writeStorage(current)
}

export function saveRecord(record) {
  const current = readStorage()
  const index = current.records.findIndex((item) => item.id === record.id)

  if (index >= 0) {
    current.records[index] = record
  } else {
    current.records.push(record)
  }

  writeStorage(current)
}

export function saveSolicitud(solicitud) {
  const current = readStorage()
  const index = current.solicitudes_cambio.findIndex((item) => item.id === solicitud.id)

  if (index >= 0) {
    current.solicitudes_cambio[index] = solicitud
  } else {
    current.solicitudes_cambio.push(solicitud)
  }

  writeStorage(current)
}

export function saveAuditEntry(entry) {
  const current = readStorage()
  current.auditoria_fichajes.push(entry)
  writeStorage(current)
}

export function setSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(ALT_SESSION_KEY)
  if (!raw) return null

  try {
    const session = JSON.parse(raw)
    if (Date.now() - session.timestampLogin > SESSION_MAX_AGE_MS) {
      clearSession()
      return { expired: true }
    }
    // Consolidar sesión en clave única y limpiar la alternativa
    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, raw)
    }
    sessionStorage.removeItem(ALT_SESSION_KEY)
    return session
  } catch {
    return null
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(ALT_SESSION_KEY)
}

