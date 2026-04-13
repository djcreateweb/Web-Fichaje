import { useEffect, useMemo, useState } from "react"
import {
  createProgramadorTenant,
  deleteProgramadorTenant,
  getProgramadorStats,
  getProgramadorTenants,
  impersonateProgramadorTenant,
  loginProgramador,
  logoutProgramador,
  updateProgramadorTenant,
} from "./api"

const PAGE_SIZE = 10

function normalizarSlug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function formatFecha(value) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("es-ES")
}

export default function ProgramadorPanel() {
  // En local queremos que SIEMPRE pida credenciales (sin autologin por token persistido).
  const [token, setToken] = useState("")
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [stats, setStats] = useState({
    tenants_activos: 0,
    fichajes_hoy: 0,
    empleados_total: 0,
  })
  const [tenants, setTenants] = useState([])
  const [section, setSection] = useState("dashboard")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const [showTenantModal, setShowTenantModal] = useState(false)
  const [editingTenant, setEditingTenant] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [tenantToDelete, setTenantToDelete] = useState(null)
  const [tenantForm, setTenantForm] = useState({
    nombre: "",
    slug: "",
    plan: "basico",
    activo: true,
    admin_email: "",
  })

  const [loginForm, setLoginForm] = useState({ email: "", password: "" })

  const filteredTenants = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return tenants
    return tenants.filter((tenant) => {
      const nombre = tenant.nombre?.toLowerCase() ?? ""
      const slug = tenant.slug?.toLowerCase() ?? ""
      return nombre.includes(term) || slug.includes(term)
    })
  }, [search, tenants])

  const pageCount = Math.max(1, Math.ceil(filteredTenants.length / PAGE_SIZE))
  const paginatedTenants = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredTenants.slice(start, start + PAGE_SIZE)
  }, [filteredTenants, page])

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  async function cargarDatos() {
    if (!token) return
    setLoading(true)
    setError("")
    try {
      const [statsResponse, tenantsResponse] = await Promise.all([
        getProgramadorStats(token),
        getProgramadorTenants(token),
      ])
      setStats(statsResponse?.datos ?? stats)
      setTenants(tenantsResponse?.datos ?? [])
    } catch (apiError) {
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleLogin(event) {
    event.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    try {
      const response = await loginProgramador(loginForm.email.trim(), loginForm.password)
      const nextToken = response?.datos?.token
      const nextUser = response?.datos?.usuario ?? { email: loginForm.email.trim() }
      if (!nextToken) {
        throw new Error("No se recibió token de superadmin.")
      }
      setToken(nextToken)
      setUsuario(nextUser)
      setSection("dashboard")
      setLoginForm({ email: "", password: "" })
    } catch (apiError) {
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    setLoading(true)
    try {
      await logoutProgramador(token)
    } catch {
      // Si falla la API igualmente limpiamos sesión local.
    } finally {
      setToken("")
      setUsuario(null)
      setTenants([])
      setLoading(false)
    }
  }

  function abrirCrearTenant() {
    setEditingTenant(null)
    setTenantForm({
      nombre: "",
      slug: "",
      plan: "basico",
      activo: true,
      admin_email: "",
    })
    setShowTenantModal(true)
  }

  function abrirEditarTenant(tenant) {
    setEditingTenant(tenant)
    setTenantForm({
      nombre: tenant.nombre,
      slug: tenant.slug,
      plan: tenant.plan,
      activo: Boolean(tenant.activo),
      admin_email: "",
    })
    setShowTenantModal(true)
  }

  async function handleSubmitTenant(event) {
    event.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    try {
      if (!tenantForm.nombre.trim()) throw new Error("El nombre es obligatorio.")
      if (!tenantForm.slug.trim()) throw new Error("El slug es obligatorio.")

      if (editingTenant) {
        await updateProgramadorTenant(token, editingTenant.id, {
          nombre: tenantForm.nombre.trim(),
          plan: tenantForm.plan,
          activo: tenantForm.activo,
        })
        setSuccess("Empresa actualizada correctamente.")
      } else {
        if (!tenantForm.admin_email.trim()) throw new Error("El email admin inicial es obligatorio.")
        await createProgramadorTenant(token, {
          nombre: tenantForm.nombre.trim(),
          slug: tenantForm.slug.trim(),
          plan: tenantForm.plan,
          admin_email: tenantForm.admin_email.trim(),
        })
        setSuccess(`Empresa creada. Subdominio activo: ${tenantForm.slug.trim()}.presentia.es. El admin configurará su contraseña en el primer acceso.`)
      }
      setShowTenantModal(false)
      await cargarDatos()
    } catch (apiError) {
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  function abrirConfirmacionEliminar(tenant) {
    setTenantToDelete(tenant)
    setShowDeleteModal(true)
  }

  async function handleEliminarTenant() {
    if (!tenantToDelete) return
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      await deleteProgramadorTenant(token, tenantToDelete.id)
      setSuccess(`Empresa eliminada: ${tenantToDelete.nombre}`)
      setShowDeleteModal(false)
      setTenantToDelete(null)
      await cargarDatos()
    } catch (apiError) {
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActivo(tenant) {
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      await updateProgramadorTenant(token, tenant.id, {
        nombre: tenant.nombre,
        plan: tenant.plan,
        activo: !tenant.activo,
      })
      setSuccess(`Empresa ${!tenant.activo ? "activada" : "desactivada"} correctamente.`)
      await cargarDatos()
    } catch (apiError) {
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleImpersonate(tenant) {
    setLoading(true)
    setError("")
    try {
      const response = await impersonateProgramadorTenant(token, tenant.id)
      const tokenTemporal = response?.datos?.token
      if (!tokenTemporal) throw new Error("No se recibió token de impersonación.")
      const targetUrl = `${window.location.origin}/?impersonation=1&tenant=${tenant.slug}&token=${tokenTemporal}`
      window.open(targetUrl, "_blank", "noopener,noreferrer")
      setSuccess(`Acceso de solo lectura abierto para ${tenant.nombre}.`)
    } catch (apiError) {
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <main className="app-bg min-h-screen p-4 flex items-center justify-center">
        <section className="w-full max-w-md bg-white/85 backdrop-blur rounded-3xl p-8 shadow-[var(--shadow-soft)] border border-white/40">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Presentia</h1>
          <p className="text-slate-500 text-sm mb-6">Panel Programador</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700" htmlFor="programador-email">
              Usuario
            </label>
            <input
              id="programador-email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              type="text"
              value={loginForm.email}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <label className="block text-sm font-medium text-slate-700" htmlFor="programador-password">
              Contraseña
            </label>
            <input
              id="programador-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
            {error && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
            <button className="w-full rounded-lg bg-admin-700 text-white py-3 font-semibold" disabled={loading}>
              {loading ? "Entrando..." : "Entrar como Programador"}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="app-bg min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-[260px_1fr] gap-4">
        <aside className="bg-admin-700 text-white rounded-xl p-4 space-y-2">
          <h2 className="text-xl font-bold">Presentia</h2>
          <p className="text-sm text-blue-100">Panel Programador</p>
          <nav className="space-y-1 mt-4">
            <button type="button" className={`w-full text-left px-3 py-2 rounded-lg ${section === "dashboard" ? "bg-white/20" : "hover:bg-white/10"}`} onClick={() => setSection("dashboard")}>Dashboard</button>
            <button type="button" className={`w-full text-left px-3 py-2 rounded-lg ${section === "empresas" ? "bg-white/20" : "hover:bg-white/10"}`} onClick={() => setSection("empresas")}>Empresas</button>
            <button type="button" className="w-full text-left px-3 py-2 rounded-lg opacity-70 cursor-not-allowed">Facturación (próximamente)</button>
            <button type="button" className="w-full text-left px-3 py-2 rounded-lg opacity-70 cursor-not-allowed">Soporte (próximamente)</button>
          </nav>
        </aside>

        <section className="bg-white/80 backdrop-blur rounded-xl border border-white/40 shadow-[var(--shadow-soft)]">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-4 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-bold text-slate-800">{section === "dashboard" ? "Dashboard global" : "Gestión de empresas"}</h1>
              <p className="text-sm text-slate-500">Superadmin: {usuario?.email ?? "Programador"}</p>
            </div>
            <button type="button" className="rounded-lg bg-slate-800 text-white px-4 py-2 text-sm font-medium" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </header>

          <div className="p-5 space-y-4">
            {error && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
            {success && <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg">{success}</div>}

            {section === "dashboard" && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <article className="rounded-xl border border-slate-200 p-4 bg-white">
                  <p className="text-sm text-slate-500">Empresas activas</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.tenants_activos ?? 0}</p>
                </article>
                <article className="rounded-xl border border-slate-200 p-4 bg-white">
                  <p className="text-sm text-slate-500">Fichajes hoy</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.fichajes_hoy ?? 0}</p>
                </article>
                <article className="rounded-xl border border-slate-200 p-4 bg-white">
                  <p className="text-sm text-slate-500">Empleados totales</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.empleados_total ?? 0}</p>
                </article>
              </div>
            )}

            {section === "empresas" && (
              <>
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <input
                    className="w-full md:max-w-sm rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="Buscar por nombre o slug..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <button type="button" className="rounded-lg bg-admin-700 text-white px-4 py-2 text-sm font-semibold" onClick={abrirCrearTenant}>
                    Crear empresa
                  </button>
                </div>

                <div className="overflow-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="text-left p-3">Nombre</th>
                        <th className="text-left p-3">Subdominio</th>
                        <th className="text-left p-3">Email admin</th>
                        <th className="text-left p-3">Plan</th>
                        <th className="text-left p-3">Estado</th>
                        <th className="text-left p-3">Alta</th>
                        <th className="text-left p-3">Empleados</th>
                        <th className="text-left p-3">Último fichaje</th>
                        <th className="text-left p-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTenants.map((tenant) => (
                        <tr key={tenant.id} className="border-t border-slate-200">
                          <td className="p-3 font-medium text-slate-800">{tenant.nombre}</td>
                          <td className="p-3">{tenant.slug}</td>
                          <td className="p-3">{tenant.admin_email ?? "-"}</td>
                          <td className="p-3 uppercase">{tenant.plan}</td>
                          <td className="p-3">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${tenant.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {tenant.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="p-3">{formatFecha(tenant.created_at)}</td>
                          <td className="p-3">{tenant.empleados_count ?? 0}</td>
                          <td className="p-3">{formatFecha(tenant.ultimo_fichaje)}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-2">
                              <button className="px-2 py-1 rounded border border-slate-300" onClick={() => abrirEditarTenant(tenant)}>Editar</button>
                              <button className="px-2 py-1 rounded border border-slate-300" onClick={() => handleToggleActivo(tenant)}>{tenant.activo ? "Desactivar" : "Activar"}</button>
                              <button className="px-2 py-1 rounded border border-red-300 text-red-700" onClick={() => abrirConfirmacionEliminar(tenant)}>Eliminar</button>
                              <button className="px-2 py-1 rounded border border-admin-300 text-admin-700" onClick={() => handleImpersonate(tenant)}>Entrar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {paginatedTenants.length === 0 && (
                        <tr>
                          <td className="p-4 text-slate-500" colSpan={9}>No hay empresas que coincidan con la búsqueda.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Página {page} de {pageCount}</p>
                  <div className="flex gap-2">
                    <button type="button" className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>Anterior</button>
                    <button type="button" className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50" onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))} disabled={page === pageCount}>Siguiente</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {showTenantModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white border border-slate-200 p-5">
            <h3 className="text-lg font-bold text-slate-800">{editingTenant ? "Editar empresa" : "Crear empresa"}</h3>
            <form className="mt-4 grid md:grid-cols-2 gap-4" onSubmit={handleSubmitTenant}>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Nombre completo</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={tenantForm.nombre}
                  onChange={(event) => {
                    const nombre = event.target.value
                    setTenantForm((prev) => ({
                      ...prev,
                      nombre,
                      slug: editingTenant ? prev.slug : normalizarSlug(nombre),
                    }))
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Slug</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={tenantForm.slug}
                  onChange={(event) => setTenantForm((prev) => ({ ...prev, slug: normalizarSlug(event.target.value) }))}
                  readOnly={Boolean(editingTenant)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Plan</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={tenantForm.plan}
                  onChange={(event) => setTenantForm((prev) => ({ ...prev, plan: event.target.value }))}
                >
                  <option value="basico">Básico</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              {editingTenant ? (
                <div className="md:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={tenantForm.activo}
                      onChange={(event) => setTenantForm((prev) => ({ ...prev, activo: event.target.checked }))}
                    />
                    Empresa activa
                  </label>
                </div>
              ) : (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Email admin inicial</label>
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      type="email"
                      value={tenantForm.admin_email}
                      onChange={(event) => setTenantForm((prev) => ({ ...prev, admin_email: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                    El Programador solo define el correo del admin inicial. La contraseña la configurará ese admin en su primer acceso.
                  </div>
                </>
              )}

              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" className="px-4 py-2 rounded-lg border border-slate-300" onClick={() => setShowTenantModal(false)}>Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-admin-700 text-white">{editingTenant ? "Guardar cambios" : "Crear empresa"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && tenantToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 p-5">
            <h3 className="text-lg font-bold text-red-700">Confirmar eliminación</h3>
            <p className="mt-3 text-sm text-slate-700">
              Esta acción eliminará todos los datos de <strong>{tenantToDelete.nombre}</strong> incluyendo empleados, fichajes y registros. Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded-lg border border-slate-300" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button type="button" className="px-4 py-2 rounded-lg bg-red-600 text-white" onClick={handleEliminarTenant}>Confirmar eliminar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
