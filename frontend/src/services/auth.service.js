import { hashPassword, generateSalt } from '../utils/crypto'
import {
  getAppData,
  setAdmin,
  upsertCompany,
  upsertEmployee,
  setSession,
  clearSession,
} from './storage.service'

export async function setupAdminPassword(password, username) {
  const salt = generateSalt()
  const passwordHash = await hashPassword(password, salt)
  setAdmin({
    username,
    passwordHash,
    salt,
    createdAt: Date.now(),
  })
}

export function getEmployeeAuthInfoByEmail(identifier) {
  const { employees } = getAppData()
  const normalized = identifier.trim().toLowerCase()
  const hasAt = normalized.includes('@')

  const employee =
    employees.find((e) => e.email?.toLowerCase?.() === normalized) ??
    employees.find((e) => e.correo?.toLowerCase?.() === normalized) ??
    (!hasAt
      ? employees.find((e) => e.name?.toLowerCase?.() === normalized)
        ?? employees.find((e) => e.nombre?.toLowerCase?.() === normalized)
      : undefined)

  if (!employee) return null

  return {
    employeeId: employee.id,
    nombre: employee.name ?? employee.nombre,
    email: employee.email ?? employee.correo ?? '',
    companyId: employee.companyId ?? null,
    hasPassword: Boolean(employee.passwordHash && employee.salt),
    role: employee.role ?? employee.rol ?? 'empleado',
  }
}

export async function createEmployee(name, email, companyId, role = 'empleado') {
  const normalizedName = name.trim()
  const normalizedEmail = email.trim().toLowerCase()
  const employee = {
    id: crypto.randomUUID(),
    name: normalizedName,
    email: normalizedEmail,
    // Compatibilidad con formatos antiguos (evita "no encontrado" si alguna parte aún lee estas claves)
    nombre: normalizedName,
    correo: normalizedEmail,
    companyId,
    role,
    rol: role,
    passwordHash: null,
    salt: null,
    createdAt: Date.now(),
  }
  upsertEmployee(employee)
}

export async function updateEmployeeProfile(employeeId, name, email, companyId) {
  const { employees } = getAppData()
  const current = employees.find((employee) => employee.id === employeeId)
  if (!current) return

  const normalizedName = name.trim()
  const normalizedEmail = email.trim().toLowerCase()

  upsertEmployee({
    ...current,
    name: normalizedName,
    email: normalizedEmail,
    nombre: normalizedName,
    correo: normalizedEmail,
    companyId,
    role: current.role ?? 'empleado',
    rol: current.role ?? current.rol ?? 'empleado',
  })
}

export async function setEmployeePasswordAndLogin(employeeId, password) {
  const current = await setEmployeePassword(employeeId, password)
  if (!current) return null

  const session = {
    rol: current.role ?? 'empleado',
    id: current.id,
    nombre: current.name,
    email: current.email,
    companyId: current.companyId,
    timestampLogin: Date.now(),
  }
  setSession(session)
  return session
}

export async function setEmployeePassword(employeeId, password) {
  const { employees } = getAppData()
  const current = employees.find((employee) => employee.id === employeeId)
  if (!current) return null

  const salt = generateSalt()
  const passwordHash = await hashPassword(password, salt)

  upsertEmployee({
    ...current,
    passwordHash,
    salt,
  })

  return {
    id: current.id,
    name: current.name,
    email: current.email ?? '',
    companyId: current.companyId ?? null,
    role: current.role ?? 'empleado',
  }
}

export function clearEmployeePassword(employeeId) {
  const { employees } = getAppData()
  const current = employees.find((employee) => employee.id === employeeId)
  if (!current) return

  upsertEmployee({
    ...current,
    passwordHash: null,
    salt: null,
  })
}

export async function login(identifier, password) {
  const { admin, employees } = getAppData()

  if (admin && identifier.trim().toLowerCase() === admin.username.toLowerCase()) {
    const hash = await hashPassword(password, admin.salt)
    if (hash === admin.passwordHash) {
      const session = {
        rol: 'admin',
        id: 'admin',
        nombre: 'Administrador',
        email: admin.username,
        timestampLogin: Date.now(),
      }
      setSession(session)
      return session
    }
  }

  const normalized = identifier.trim().toLowerCase()
  const hasAt = normalized.includes('@')

  const employee =
    employees.find((item) => item.email?.toLowerCase?.() === normalized) ??
    (!hasAt
      ? employees.find((item) => item.name.toLowerCase() === normalized)
      : undefined)

  if (!employee) return null

  if (!employee.passwordHash || !employee.salt) return null

  const hash = await hashPassword(password, employee.salt)
  if (hash !== employee.passwordHash) return null

  const session = {
    rol: employee.role ?? 'empleado',
    id: employee.id,
    nombre: employee.name,
    email: employee.email ?? '',
    companyId: employee.companyId ?? null,
    timestampLogin: Date.now(),
  }
  setSession(session)
  return session
}

export function createCompany(name, adminEmail, geolocalizacion_activa = false) {
  const company = {
    id: crypto.randomUUID(),
    name,
    adminEmail,
    geolocalizacion_activa,
    createdAt: Date.now(),
  }
  upsertCompany(company)
  return company
}

export function logout() {
  clearSession()
}
