import { useEffect, useMemo, useState } from 'react'
import { cambiarPassword, getMe, getToken, login, logout } from './services/auth.service'
import { getEmpleados } from './services/empleados.service'
import { getEmpresas } from './services/empresas.service'
import { ficharEntrada, ficharSalida, getFichajesHoy } from './services/fichajes.service'

function AppRuntime() {
  const [cargando, setCargando] = useState(true)
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')

  const [loginIdentificador, setLoginIdentificador] = useState('')
  const [loginContrasena, setLoginContrasena] = useState('')

  const [forzarCambioPassword, setForzarCambioPassword] = useState(false)
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordNueva2, setPasswordNueva2] = useState('')

  const [empresas, setEmpresas] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [fichajesHoy, setFichajesHoy] = useState([])

  const rol = session?.rol ?? ''
  const esAdmin = rol === 'admin' || rol === 'administrador'
  const esSupervisor = rol === 'supervisor' || rol === 'superior'
  const tieneAccesoAdmin = esAdmin || esSupervisor

  const empresaId = session?.empresa_id ?? null

  const ultimoEventoHoy = useMemo(() => {
    if (!Array.isArray(fichajesHoy) || fichajesHoy.length === 0) return null
    return fichajesHoy[fichajesHoy.length - 1]
  }, [fichajesHoy])

  const puedeFicharEntrada = useMemo(() => {
    if (!ultimoEventoHoy) return true
    return ultimoEventoHoy.tipo !== 'entrada'
  }, [ultimoEventoHoy])

  async function cargarDatosPostLogin(nextSession) {
    try {
      setError('')
      if (!nextSession) return

      if (tieneAccesoAdmin) {
        const rEmpresas = await getEmpresas()
        setEmpresas(rEmpresas?.datos ?? [])

        const resolvedEmpresaId = nextSession.empresa_id ?? (rEmpresas?.datos?.[0]?.id ?? null)
        if (resolvedEmpresaId) {
          const rEmpleados = await getEmpleados(resolvedEmpresaId)
          setEmpleados(rEmpleados?.datos ?? [])
        } else {
          setEmpleados([])
        }
      } else {
        setEmpresas([])
        setEmpleados([])
      }

      const rFichajes = await getFichajesHoy()
      setFichajesHoy(rFichajes?.datos ?? [])
    } catch (e) {
      console.error('[App] Error cargando datos:', e)
      setError('No se pudieron cargar los datos desde el servidor.')
    }
  }

  useEffect(() => {
    async function boot() {
      try {
        const token = getToken()
        if (!token) {
          setSession(null)
          setCargando(false)
          return
        }

        const me = await getMe()
        const datos = me?.datos ?? null
        setSession(datos)
        setForzarCambioPassword(Boolean(datos?.debe_cambiar_password))
        await cargarDatosPostLogin(datos)
      } finally {
        setCargando(false)
      }
    }

    boot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLoginSubmit(event) {
    event.preventDefault()
    setError('')
    setCargando(true)
    try {
      const result = await login(loginIdentificador.trim(), loginContrasena)
      if (!result?.ok) {
        setError('Usuario o contraseña incorrectos.')
        return
      }
      const datos = result?.datos ?? null
      setSession(datos)
      setForzarCambioPassword(Boolean(datos?.debe_cambiar_password))
      await cargarDatosPostLogin(datos)
      setLoginContrasena('')
    } finally {
      setCargando(false)
    }
  }

  async function handleLogout() {
    setCargando(true)
    try {
      await logout()
      setSession(null)
      setEmpresas([])
      setEmpleados([])
      setFichajesHoy([])
      setForzarCambioPassword(false)
      setPasswordActual('')
      setPasswordNueva('')
      setPasswordNueva2('')
    } finally {
      setCargando(false)
    }
  }

  async function handleCambiarPasswordSubmit(event) {
    event.preventDefault()
    setError('')
    if (passwordNueva.length < 8) {
      setError('La contraseña nueva debe tener al menos 8 caracteres.')
      return
    }
    if (passwordNueva !== passwordNueva2) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }

    setCargando(true)
    try {
      await cambiarPassword(passwordActual, passwordNueva)
      setForzarCambioPassword(false)
      setPasswordActual('')
      setPasswordNueva('')
      setPasswordNueva2('')
      const me = await getMe()
      const datos = me?.datos ?? null
      setSession(datos)
    } catch (e) {
      console.error('[App] Error cambiando password:', e)
      setError('No se pudo cambiar la contraseña. Revisa los datos e inténtalo de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  async function captureGeo() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
            precision_metros: pos.coords.accuracy,
          }),
        () => resolve(null),
        { timeout: 8000, maximumAge: 30000 },
      )
    })
  }

  async function handleFichar() {
    setError('')
    setCargando(true)
    try {
      const geo = await captureGeo()
      if (puedeFicharEntrada) {
        await ficharEntrada(geo)
      } else {
        await ficharSalida(geo)
      }
      const rFichajes = await getFichajesHoy()
      setFichajesHoy(rFichajes?.datos ?? [])
    } catch (e) {
      console.error('[App] Error fichando:', e)
      setError('No se pudo registrar el fichaje.')
    } finally {
      setCargando(false)
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="font-semibold">Cargando…</p>
          <p className="text-white/70 text-sm mt-1">Conectando con la API</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6">
          <h1 className="text-2xl font-bold">Presentia</h1>
          <p className="text-white/70 mt-1">Acceso</p>

          <form className="mt-6 space-y-3" onSubmit={handleLoginSubmit}>
            <div>
              <label className="text-sm font-semibold text-white/80">Correo o nombre</label>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 outline-none focus:border-white/30"
                value={loginIdentificador}
                onChange={(e) => setLoginIdentificador(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-white/80">Contraseña</label>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 outline-none focus:border-white/30"
                value={loginContrasena}
                onChange={(e) => setLoginContrasena(e.target.value)}
                type="password"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button className="w-full py-2 rounded-lg bg-white text-slate-900 font-semibold" type="submit">
              Entrar
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (forzarCambioPassword) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6">
          <h1 className="text-2xl font-bold">Cambio de contraseña</h1>
          <p className="text-white/70 mt-1">Por seguridad, debes actualizar tu contraseña para continuar.</p>

          <form className="mt-6 space-y-3" onSubmit={handleCambiarPasswordSubmit}>
            <div>
              <label className="text-sm font-semibold text-white/80">Contraseña actual</label>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 outline-none focus:border-white/30"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                type="password"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-white/80">Contraseña nueva</label>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 outline-none focus:border-white/30"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                type="password"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-white/80">Repite la contraseña nueva</label>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 outline-none focus:border-white/30"
                value={passwordNueva2}
                onChange={(e) => setPasswordNueva2(e.target.value)}
                type="password"
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button className="w-full py-2 rounded-lg bg-white text-slate-900 font-semibold" type="submit">
              Cambiar contraseña
            </button>
            <button
              className="w-full py-2 rounded-lg bg-transparent border border-white/20 font-semibold"
              type="button"
              onClick={handleLogout}
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Presentia</h1>
            <p className="text-white/70 mt-1">
              Sesión: <span className="font-semibold">{session.nombre}</span> ({session.rol})
            </p>
          </div>
          <button className="px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="font-bold text-lg">Fichaje (hoy)</h2>
            <button
              className="mt-4 w-full py-2 rounded-lg bg-white text-slate-900 font-semibold disabled:opacity-50"
              onClick={handleFichar}
              disabled={cargando}
            >
              {puedeFicharEntrada ? 'Fichar entrada' : 'Fichar salida'}
            </button>
            <div className="mt-4 space-y-2">
              {(fichajesHoy ?? []).length === 0 ? (
                <p className="text-white/60 text-sm">Aún no hay fichajes hoy.</p>
              ) : (
                (fichajesHoy ?? []).map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2 border border-white/10"
                  >
                    <span className="font-semibold">{f.tipo}</span>
                    <span className="text-white/70">
                      {new Date(f.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {tieneAccesoAdmin ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h2 className="font-bold text-lg">Administración</h2>
              <p className="text-white/70 text-sm mt-1">Empresas y empleados (vista básica).</p>

              <div className="mt-4">
                <p className="text-sm font-semibold">Empresas</p>
                <div className="mt-2 space-y-2">
                  {(empresas ?? []).length === 0 ? (
                    <p className="text-white/60 text-sm">No hay empresas.</p>
                  ) : (
                    empresas.map((e) => (
                      <div key={e.id} className="text-sm bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                        <p className="font-semibold">{e.nombre}</p>
                        <p className="text-white/60">Admin: {e.correo_administrador || '—'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-semibold">Empleados (empresa {empresaId ?? '—'})</p>
                <div className="mt-2 space-y-2">
                  {(empleados ?? []).length === 0 ? (
                    <p className="text-white/60 text-sm">No hay empleados o no se pudo cargar.</p>
                  ) : (
                    empleados.map((emp) => (
                      <div key={emp.id} className="text-sm bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                        <p className="font-semibold">
                          {emp.nombre} {emp.apellidos ?? ''}
                        </p>
                        <p className="text-white/60">{emp.correo}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h2 className="font-bold text-lg">Estado</h2>
              <p className="text-white/70 text-sm mt-1">Panel de empleado en migración.</p>
              <p className="text-white/60 text-sm mt-3">
                Token en memoria: <span className="font-mono">{getToken() ? 'sí' : 'no'}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AppRuntime

