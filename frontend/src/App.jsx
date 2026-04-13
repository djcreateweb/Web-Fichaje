/* BLOQUE DUPLICADO (AUTO-GENERADO) — IGNORAR
   Se cierra justo antes del App real.

import { useEffect, useMemo, useState } from 'react'
import { cambiarPassword, getMe, getToken, login, logout } from './services/auth.service'
import { getEmpleados } from './services/empleados.service'
import { getEmpresas } from './services/empresas.service'
import { ficharEntrada, ficharSalida, getFichajesHoy } from './services/fichajes.service'

function App() {
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

          <p className="text-xs text-white/50 mt-4">
            Nota: el token se guarda solo en memoria (si recargas, tendrás que iniciar sesión de nuevo).
          </p>
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
            <p className="text-white/70 text-sm mt-1">Eventos de fichaje como entradas/salidas/pausas.</p>

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

export default App

import { useEffect, useMemo, useState } from 'react'
import { cambiarPassword, getMe, getToken, login, logout } from './services/auth.service'
import { getEmpleados } from './services/empleados.service'
import { getEmpresas } from './services/empresas.service'
import { ficharEntrada, ficharSalida, getFichajesHoy } from './services/fichajes.service'

function App() {
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

          <p className="text-xs text-white/50 mt-4">
            Nota: el token se guarda solo en memoria (si recargas, tendrás que iniciar sesión de nuevo).
          </p>
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
            <p className="text-white/70 text-sm mt-1">Eventos de fichaje como entradas/salidas/pausas.</p>

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

export default App

import { useEffect, useMemo, useState } from 'react'
import { cambiarPassword, getMe, getToken, login, logout } from './services/auth.service'
import { getEmpleados } from './services/empleados.service'
import { getEmpresas } from './services/empresas.service'
import { ficharEntrada, ficharSalida, getFichajesHoy } from './services/fichajes.service'

function App() {
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

  async function handleCambiarPassword(event) {
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

          <p className="text-xs text-white/50 mt-4">
            Nota: el token se guarda solo en memoria (si recargas, tendrás que iniciar sesión de nuevo).
          </p>
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

          <form className="mt-6 space-y-3" onSubmit={handleCambiarPassword}>
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
            <p className="text-white/70 text-sm mt-1">Eventos de fichaje como entradas/salidas/pausas.</p>

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

export default App

import { useEffect, useMemo, useState } from 'react'
import { cambiarPassword, getMe, getToken, login, logout } from './services/auth.service'
import { getEmpleados } from './services/empleados.service'
import { getEmpresas } from './services/empresas.service'
import { ficharEntrada, ficharSalida, getFichajesHoy } from './services/fichajes.service'

function App() {
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

  async function handleCambiarPassword(event) {
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

          <p className="text-xs text-white/50 mt-4">
            Nota: el token se guarda solo en memoria (si recargas, tendrás que iniciar sesión de nuevo).
          </p>
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

          <form className="mt-6 space-y-3" onSubmit={handleCambiarPassword}>
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
            <p className="text-white/70 text-sm mt-1">Eventos de fichaje como entradas/salidas/pausas.</p>

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

export default App

import { useEffect, useMemo, useState } from 'react'
import { cambiarPassword, getMe, getToken, login, logout } from './services/auth.service'
import { getEmpleados } from './services/empleados.service'
import { getEmpresas } from './services/empresas.service'
import { ficharEntrada, ficharSalida, getFichajesHoy } from './services/fichajes.service'

function App() {
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

  async function handleCambiarPassword(event) {
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

          <p className="text-xs text-white/50 mt-4">
            Nota: el token se guarda solo en memoria (si recargas, tendrás que iniciar sesión de nuevo).
          </p>
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

          <form className="mt-6 space-y-3" onSubmit={handleCambiarPassword}>
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
            <p className="text-white/70 text-sm mt-1">Eventos de fichaje como entradas/salidas/pausas.</p>

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

export default App

import { useEffect, useMemo, useState } from 'react'
import { cambiarPassword, getMe, getToken, login, logout } from './services/auth.service'
import { getEmpleados } from './services/empleados.service'
import { getEmpresas } from './services/empresas.service'
import { ficharEntrada, ficharSalida, getFichajesHoy } from './services/fichajes.service'

function App() {
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

  async function handleCambiarPassword(event) {
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

          <p className="text-xs text-white/50 mt-4">
            Nota: el token se guarda solo en memoria (si recargas, tendrás que iniciar sesión de nuevo).
          </p>
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

          <form className="mt-6 space-y-3" onSubmit={handleCambiarPassword}>
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
            <p className="text-white/70 text-sm mt-1">Eventos de fichaje como entradas/salidas/pausas.</p>

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

export default App
*/

import { useEffect, useMemo, useState } from 'react'
import {
  clearEmployeePassword,
  createCompany,
  createEmployee,
  getEmployeeAuthInfoByEmail,
  login,
  logout,
  setEmployeePassword,
  setEmployeePasswordAndLogin,
  setupAdminPassword,
  updateEmployeeProfile,
} from './services/auth.service'
import { deleteCompany, deleteEmployee, getAppData, getSession, upsertCompany, upsertEmployee } from './services/storage.service'
import { clockIn, clockOut, exportRecordsCsv } from './services/records.service'
import { aprobarSolicitud, crearSolicitudCambio, rechazarSolicitud } from './services/solicitudes.service'
import { calculateWorkedHours, formatDate, formatDateTime, formatHours, formatTime } from './utils/formatters'
import DailyTimeline from './components/charts/DailyTimeline'
import MapaFichajes from './components/maps/MapaFichajes'
import ProgramadorPanel from './programador/ProgramadorPanel'

function App() {
  const isProgramadorContext = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('panel') === 'programador'
  }, [])

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:9000/api'
  const frontendProgramadorUrl = `${window.location.origin}/?panel=programador`

  const [appData, setAppData] = useState(getAppData())
  const [session, setSession] = useState(() => {
    const current = getSession()
    return current?.expired ? null : current
  })
  const [now, setNow] = useState(() => Date.now())

  const [loginError, setLoginError] = useState('')

  const [loginStep, setLoginStep] = useState('correo')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginCandidate, setLoginCandidate] = useState(null)
  const [employeeSetupPassword, setEmployeeSetupPassword] = useState('')
  const [employeeSetupConfirmPassword, setEmployeeSetupConfirmPassword] = useState('')

  const [showAdminCreateModal, setShowAdminCreateModal] = useState(false)
  const [adminSetupEmail, setAdminSetupEmail] = useState('')
  const [adminSetupPassword, setAdminSetupPassword] = useState('')
  const [adminSetupConfirmPassword, setAdminSetupConfirmPassword] = useState('')

  const [adminSection, setAdminSection] = useState('dashboard')
  const [activeCompanyId, setActiveCompanyId] = useState('')

  const [companyForm, setCompanyForm] = useState({ id: '', name: '', geolocalizacion_activa: false })
  const [geoCapturando, setGeoCapturando] = useState(false)
  const [geoMensaje, setGeoMensaje] = useState(null) // null | 'ok' | 'error'

  const [dashboardFilters, setDashboardFilters] = useState(() => {
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const to = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const f = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
    const from = `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`
    return { from, to }
  })
  const [dashboardEmployeeId, setDashboardEmployeeId] = useState('')
  const [dashboardForm, setDashboardForm] = useState(() => {
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const to = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const f = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
    const from = `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`
    return { from, to, employeeId: '', companyId: '' }
  })

  const [employeeForm, setEmployeeForm] = useState({ id: '', name: '', email: '' })
  const [passwordEditor, setPasswordEditor] = useState({
    employeeId: '',
    password: '',
    confirm: '',
  })

  const [filters, setFilters] = useState({ employeeId: '', from: '', to: '' })

  // — Solicitudes de cambio (empleado) —
  const [solicitudModal, setSolicitudModal] = useState(null) // { record } | null
  const [solicitudForm, setSolicitudForm] = useState({ motivo: '', entradaPropuesta: '', salidaPropuesta: '', comentarios: '' })
  const [solicitudError, setSolicitudError] = useState('')
  const [solicitudSuccess, setSolicitudSuccess] = useState(false)

  // — Solicitudes de cambio (admin/superior) —
  const [solicitudesFilter, setSolicitudesFilter] = useState('pendiente')
  const [solicitudesPage, setSolicitudesPage] = useState(1)
  const [resolucionModal, setResolucionModal] = useState(null) // { solicitud, accion: 'aprobar'|'rechazar' }
  const [resolucionComentario, setResolucionComentario] = useState('')

  // — Ubicaciones de fichaje —
  const [ubicacionesForm, setUbicacionesForm] = useState(() => {
    const hoy = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const date = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`
    return { employeeId: '', from: date, to: date, tipo: 'todos' }
  })
  const [ubicacionesFilters, setUbicacionesFilters] = useState(null) // null = sin buscar aún
  const [ubicacionesTab, setUbicacionesTab] = useState('mapa') // 'mapa' | 'lista'
  const [ubicacionesPage, setUbicacionesPage] = useState(1)
  const [ubicacionesDetalle, setUbicacionesDetalle] = useState(null) // { employeeId, name }
  const [ubicacionesDetalleDate, setUbicacionesDetalleDate] = useState('')

  const companiesForAdmin = useMemo(() => {
    const adminEmail = session?.rol === 'admin' ? session.email : appData.admin?.username
    if (!adminEmail) return []
    return (appData.companies ?? []).filter((c) => c.adminEmail === adminEmail)
  }, [appData.admin?.username, appData.companies, session?.email, session?.rol])

  const resolvedActiveCompanyId = useMemo(() => {
    if (session?.rol === 'superior') return session.companyId
    if (session?.rol !== 'admin') return ''
    if (activeCompanyId) return activeCompanyId
    return companiesForAdmin[0]?.id ?? ''
  }, [activeCompanyId, companiesForAdmin, session])

  const employeeOpenRecord = useMemo(() => {
    if (!session || session.rol !== 'empleado') return null
    return appData.records.find((r) => r.employeeId === session.id && !r.exitTimestamp) ?? null
  }, [appData.records, session])

  // Empresa activa del panel admin
  const activeCompany = useMemo(() => {
    if (!resolvedActiveCompanyId) return null
    return (appData.companies ?? []).find((c) => c.id === resolvedActiveCompanyId) ?? null
  }, [appData.companies, resolvedActiveCompanyId])

  // Datos del empleado logueado (para consentimiento geo)
  const empleadoActual = useMemo(() => {
    if (!session || session.rol !== 'empleado') return null
    return (appData.employees ?? []).find((e) => e.id === session.id) ?? null
  }, [appData.employees, session])

  // Si la empresa del empleado tiene geo activa
  const geoActiva = useMemo(() => {
    if (!session?.companyId) return false
    const company = (appData.companies ?? []).find((c) => c.id === session.companyId)
    return company?.geolocalizacion_activa === true
  }, [appData.companies, session])

  // Si el empleado debe ver la pantalla de consentimiento
  const debeVerConsentimiento = useMemo(() => {
    if (!geoActiva || !empleadoActual) return false
    return empleadoActual.geo_consentimiento_aceptado == null || empleadoActual.geo_consentimiento_pendiente === true
  }, [geoActiva, empleadoActual])

  const geoConsentimientoAceptado = useMemo(
    () => empleadoActual?.geo_consentimiento_aceptado === true,
    [empleadoActual],
  )

  const employeeRecords = useMemo(() => {
    if (!session || session.rol !== 'empleado') return []
    return appData.records
      .filter((r) => r.employeeId === session.id)
      .sort((a, b) => b.entryTimestamp - a.entryTimestamp)
  }, [appData.records, session])

  const isSuperAdmin = Boolean(session && session.rol === 'admin')
  const hasAdminAccess = Boolean(session && (session.rol === 'admin' || session.rol === 'superior'))

  const employeesForCompany = useMemo(() => {
    if (!hasAdminAccess || !resolvedActiveCompanyId) return []
    return appData.employees.filter((e) => {
      if (e.companyId !== resolvedActiveCompanyId) return false
      // Un superior no puede ver su propio registro ni a otros superiores para su gestión
      if (session?.rol === 'superior') {
        if (e.id === session.id) return false
        if (e.role === 'superior') return false
      }
      return true
    })
  }, [appData.employees, hasAdminAccess, resolvedActiveCompanyId, session])

  const trackableEmployees = useMemo(() => {
    return employeesForCompany.filter((e) => e.role !== 'superior' && e.role !== 'admin')
  }, [employeesForCompany])

  const recordsForCompany = useMemo(() => {
    if (!hasAdminAccess || !resolvedActiveCompanyId) return []
    return appData.records.filter((r) => r.companyId === resolvedActiveCompanyId)
  }, [appData.records, hasAdminAccess, resolvedActiveCompanyId])

  const filteredRecords = useMemo(() => {
    if (!hasAdminAccess) return []
    const { employeeId, from, to } = filters
    return recordsForCompany
      .filter((record) => {
        // Un superior no puede ver sus propios fichajes
        if (session?.rol === 'superior' && record.employeeId === session.id) return false
        
        // Nadie rastrea las horas de los superiores
        const isTrackable = trackableEmployees.some(e => e.id === record.employeeId)
        if (!isTrackable) return false
        const _d = new Date(record.entryTimestamp)
        const date = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`
        const matchesEmployee = !employeeId || record.employeeId === employeeId
        const matchesFrom = !from || date >= from
        const matchesTo = !to || date <= to
        return matchesEmployee && matchesFrom && matchesTo
      })
      .sort((a, b) => b.entryTimestamp - a.entryTimestamp)
  }, [filters, hasAdminAccess, recordsForCompany, session])

  const hoursSummary = useMemo(() => {
    if (!hasAdminAccess) return []
    return employeesForCompany
      .map((employee) => {
        const workedHours = recordsForCompany
          .filter((record) => record.employeeId === employee.id && record.exitTimestamp)
          .reduce(
            (acc, record) => acc + calculateWorkedHours(record.entryTimestamp, record.exitTimestamp),
            0,
          )
        return {
          employeeId: employee.id,
          employeeName: employee.name,
          workedHours,
        }
      })
      .sort((a, b) => b.workedHours - a.workedHours)
  }, [employeesForCompany, hasAdminAccess, recordsForCompany])

  const dashboardData = useMemo(() => {
    const { from, to } = dashboardFilters
    const completed = recordsForCompany.filter((record) => {
      if (!record.exitTimestamp) return false
      if (dashboardEmployeeId && record.employeeId !== dashboardEmployeeId) return false
      const _d = new Date(record.entryTimestamp)
      const date = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`
      const matchesFrom = !from || date >= from
      const matchesTo = !to || date <= to
      return matchesFrom && matchesTo
    })

    const uniqueDaysAll = new Set(completed.map((record) => {
      const _rd = new Date(record.entryTimestamp)
      return `${record.employeeId}|${_rd.getFullYear()}-${String(_rd.getMonth() + 1).padStart(2, '0')}-${String(_rd.getDate()).padStart(2, '0')}`
    }))
    const totalCompleted = uniqueDaysAll.size
    const totalHours = completed.reduce(
      (acc, record) =>
        acc + calculateWorkedHours(record.entryTimestamp, record.exitTimestamp),
      0,
    )

    const daysByEmployee = new Map()
    const hoursByEmployeeMap = new Map()
    trackableEmployees.forEach((e) => {
      daysByEmployee.set(e.id, new Set())
      hoursByEmployeeMap.set(e.id, 0)
    })
    completed.forEach((record) => {
      const _rd = new Date(record.entryTimestamp)
      const dayKey = `${_rd.getFullYear()}-${String(_rd.getMonth() + 1).padStart(2, '0')}-${String(_rd.getDate()).padStart(2, '0')}`
      if (!daysByEmployee.has(record.employeeId)) daysByEmployee.set(record.employeeId, new Set())
      daysByEmployee.get(record.employeeId).add(dayKey)
      hoursByEmployeeMap.set(
        record.employeeId,
        (hoursByEmployeeMap.get(record.employeeId) ?? 0) +
        calculateWorkedHours(record.entryTimestamp, record.exitTimestamp),
      )
    })

    const attendanceCounts = trackableEmployees
      .filter((e) => !dashboardEmployeeId || e.id === dashboardEmployeeId)
      .map((employee) => ({
        employeeId: employee.id,
        employeeName: employee.name,
        count: daysByEmployee.get(employee.id)?.size ?? 0,
      }))
      .sort((a, b) => b.count - a.count)

    const hoursByEmployee = trackableEmployees
      .filter((e) => !dashboardEmployeeId || e.id === dashboardEmployeeId)
      .map((employee) => ({
        employeeId: employee.id,
        employeeName: employee.name,
        hours: hoursByEmployeeMap.get(employee.id) ?? 0,
      }))
      .sort((a, b) => b.hours - a.hours)

    const maxCount = attendanceCounts[0]?.count ?? 0

    // Agrupar todos los registros del rango (también abiertos) por día para el timeline
    const trackableIds = new Set(trackableEmployees.map((e) => e.id))
    const allInRange = recordsForCompany.filter((record) => {
      if (!trackableIds.has(record.employeeId)) return false
      if (dashboardEmployeeId && record.employeeId !== dashboardEmployeeId) return false
      const _d = new Date(record.entryTimestamp)
      const date = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`
      return (!from || date >= from) && (!to || date <= to)
    })
    const dayGroupsMap = new Map()
    allInRange.forEach((record) => {
      const _rd = new Date(record.entryTimestamp)
      const dayKey = `${_rd.getFullYear()}-${String(_rd.getMonth() + 1).padStart(2, '0')}-${String(_rd.getDate()).padStart(2, '0')}`
      if (!dayGroupsMap.has(dayKey)) dayGroupsMap.set(dayKey, [])
      dayGroupsMap.get(dayKey).push(record)
    })
    const days = Array.from(dayGroupsMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, records]) => ({ date, records }))

    return { totalCompleted, totalHours, attendanceCounts, hoursByEmployee, maxCount, days }
  }, [dashboardFilters, trackableEmployees, recordsForCompany, dashboardEmployeeId])

  const passwordEditorEmployee = useMemo(() => {
    if (!passwordEditor.employeeId) return null
    return employeesForCompany.find((e) => e.id === passwordEditor.employeeId) ?? null
  }, [employeesForCompany, passwordEditor.employeeId])

  // Solicitudes para el panel de admin/superior
  const solicitudesForCompany = useMemo(() => {
    if (!hasAdminAccess || !resolvedActiveCompanyId) return []
    return (appData.solicitudes_cambio ?? [])
      .filter((s) => s.companyId === resolvedActiveCompanyId)
      .sort((a, b) => b.creadoEn - a.creadoEn)
  }, [appData.solicitudes_cambio, hasAdminAccess, resolvedActiveCompanyId])

  const solicitudesPendientesCount = useMemo(
    () => solicitudesForCompany.filter((s) => s.estado === 'pendiente').length,
    [solicitudesForCompany],
  )

  const solicitudesFiltered = useMemo(() => {
    if (solicitudesFilter === 'todas') return solicitudesForCompany
    return solicitudesForCompany.filter((s) => s.estado === solicitudesFilter)
  }, [solicitudesForCompany, solicitudesFilter])

  const solicitudesPageSize = 10
  const solicitudesTotalPages = Math.max(1, Math.ceil(solicitudesFiltered.length / solicitudesPageSize))
  const clampedSolicitudesPage = Math.max(1, Math.min(solicitudesPage, solicitudesTotalPages))
  const pagedSolicitudes = solicitudesFiltered.slice(
    (clampedSolicitudesPage - 1) * solicitudesPageSize,
    clampedSolicitudesPage * solicitudesPageSize,
  )

  // Solicitudes del empleado actual (para mostrar indicador por fichaje)
  const empleadoSolicitudesPorFichaje = useMemo(() => {
    if (!session || session.rol !== 'empleado') return {}
    const map = {}
    for (const s of appData.solicitudes_cambio ?? []) {
      if (s.employeeId === session.id) {
        if (!map[s.fichajeId] || s.creadoEn > map[s.fichajeId].creadoEn) {
          map[s.fichajeId] = s
        }
      }
    }
    return map
  }, [appData.solicitudes_cambio, session])

  // Puntos con geo para el mapa principal
  const ubicacionesPoints = useMemo(() => {
    if (!hasAdminAccess || !ubicacionesFilters) return []
    const { employeeId, from, to, tipo } = ubicacionesFilters
    const pts = []
    for (const r of recordsForCompany) {
      const date = new Date(r.entryTimestamp).toISOString().slice(0, 10)
      if (employeeId && r.employeeId !== employeeId) continue
      if (from && date < from) continue
      if (to && date > to) continue
      if (tipo !== 'salida' && r.entry_ubicacion_disponible && r.entry_latitud != null) {
        pts.push({ id: `${r.id}-e`, fichajeId: r.id, employeeId: r.employeeId, employeeName: r.employeeName, tipo: 'entrada', timestamp: r.entryTimestamp, latitud: r.entry_latitud, longitud: r.entry_longitud })
      }
      if (tipo !== 'entrada' && r.exitTimestamp && r.exit_ubicacion_disponible && r.exit_latitud != null) {
        pts.push({ id: `${r.id}-s`, fichajeId: r.id, employeeId: r.employeeId, employeeName: r.employeeName, tipo: 'salida', timestamp: r.exitTimestamp, latitud: r.exit_latitud, longitud: r.exit_longitud })
      }
    }
    return pts.sort((a, b) => a.timestamp - b.timestamp)
  }, [hasAdminAccess, recordsForCompany, ubicacionesFilters])

  // Filas para la tabla de lista (incluye registros sin geo)
  const ubicacionesRecords = useMemo(() => {
    if (!hasAdminAccess || !ubicacionesFilters) return []
    const { employeeId, from, to, tipo } = ubicacionesFilters
    const rows = []
    for (const r of recordsForCompany) {
      const date = new Date(r.entryTimestamp).toISOString().slice(0, 10)
      if (employeeId && r.employeeId !== employeeId) continue
      if (from && date < from) continue
      if (to && date > to) continue
      if (tipo !== 'salida') {
        rows.push({ id: `${r.id}-e`, fichajeId: r.id, employeeId: r.employeeId, employeeName: r.employeeName, tipo: 'entrada', timestamp: r.entryTimestamp, latitud: r.entry_latitud, longitud: r.entry_longitud, disponible: r.entry_ubicacion_disponible ?? false })
      }
      if (tipo !== 'entrada' && r.exitTimestamp) {
        rows.push({ id: `${r.id}-s`, fichajeId: r.id, employeeId: r.employeeId, employeeName: r.employeeName, tipo: 'salida', timestamp: r.exitTimestamp, latitud: r.exit_latitud, longitud: r.exit_longitud, disponible: r.exit_ubicacion_disponible ?? false })
      }
    }
    return rows.sort((a, b) => b.timestamp - a.timestamp)
  }, [hasAdminAccess, recordsForCompany, ubicacionesFilters])

  // Puntos del empleado en detalle (drill-down)
  const ubicacionesDetallePoints = useMemo(() => {
    if (!ubicacionesDetalle || !ubicacionesDetalleDate) return []
    const pts = []
    for (const r of recordsForCompany) {
      if (r.employeeId !== ubicacionesDetalle.employeeId) continue
      if (new Date(r.entryTimestamp).toISOString().slice(0, 10) !== ubicacionesDetalleDate) continue
      if (r.entry_ubicacion_disponible && r.entry_latitud != null) {
        pts.push({ id: `${r.id}-e`, fichajeId: r.id, employeeId: r.employeeId, employeeName: r.employeeName, tipo: 'entrada', timestamp: r.entryTimestamp, latitud: r.entry_latitud, longitud: r.entry_longitud })
      }
      if (r.exitTimestamp && r.exit_ubicacion_disponible && r.exit_latitud != null) {
        pts.push({ id: `${r.id}-s`, fichajeId: r.id, employeeId: r.employeeId, employeeName: r.employeeName, tipo: 'salida', timestamp: r.exitTimestamp, latitud: r.exit_latitud, longitud: r.exit_longitud })
      }
    }
    return pts.sort((a, b) => a.timestamp - b.timestamp)
  }, [ubicacionesDetalle, ubicacionesDetalleDate, recordsForCompany])

  const ubicacionesPageSize = 15
  const ubicacionesTotalPages = Math.max(1, Math.ceil(ubicacionesRecords.length / ubicacionesPageSize))
  const clampedUbicacionesPage = Math.max(1, Math.min(ubicacionesPage, ubicacionesTotalPages))
  const pagedUbicacionesRecords = ubicacionesRecords.slice(
    (clampedUbicacionesPage - 1) * ubicacionesPageSize,
    clampedUbicacionesPage * ubicacionesPageSize,
  )

  const [employeeSection, setEmployeeSection] = useState('historial')
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const monthlyReportData = useMemo(() => {
    if (!session || session.rol !== 'empleado') return { days: [], totalHours: 0, totalDays: 0 }
    const [year, month] = reportMonth.split('-').map(Number)
    const filtered = appData.records.filter((r) => {
      if (r.employeeId !== session.id) return false
      const d = new Date(r.entryTimestamp)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })

    const byDay = new Map()
    filtered.forEach((r) => {
      const dateKey = new Date(r.entryTimestamp).toLocaleDateString('es-ES')
      const isoKey = new Date(r.entryTimestamp).toISOString().slice(0, 10)
      if (!byDay.has(isoKey)) byDay.set(isoKey, { dateKey, isoKey, records: [] })
      byDay.get(isoKey).records.push(r)
    })

    const days = Array.from(byDay.values())
      .sort((a, b) => a.isoKey.localeCompare(b.isoKey))
      .map(({ dateKey, isoKey, records }) => {
        const hours = records.reduce(
          (acc, r) => acc + (r.exitTimestamp ? calculateWorkedHours(r.entryTimestamp, r.exitTimestamp) : 0),
          0,
        )
        return { dateKey, isoKey, records, hours }
      })

    const totalHours = days.reduce((acc, d) => acc + d.hours, 0)
    return { days, totalHours, totalDays: days.length }
  }, [appData.records, reportMonth, session])

  function handleExportMonthlyReport() {
    const headers = ['Fecha', 'Entrada', 'Salida', 'Horas']
    const rows = []
    monthlyReportData.days.forEach((day) => {
      day.records.forEach((r) => {
        const entry = new Date(r.entryTimestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        const exit = r.exitTimestamp
          ? new Date(r.exitTimestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : '-'
        const hours = r.exitTimestamp
          ? calculateWorkedHours(r.entryTimestamp, r.exitTimestamp).toFixed(2).replace('.', ',')
          : '-'
        rows.push([day.dateKey, entry, exit, hours])
      })
      if (day.records.length > 1) {
        rows.push([`Total ${day.dateKey}`, '', '', day.hours.toFixed(2).replace('.', ',')])
      }
    })
    rows.push([])
    rows.push(['TOTAL MES', '', '', monthlyReportData.totalHours.toFixed(2).replace('.', ',')])
    rows.push([`Días trabajados: ${monthlyReportData.totalDays}`, '', '', ''])

    const csv = [headers, ...rows].map((r) => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `informe_${session.nombre.replace(/\s+/g, '_')}_${reportMonth}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const employeePageSize = 10
  const adminPageSize = 15
  const [employeePage, setEmployeePage] = useState(1)
  const [fichajesPage, setFichajesPage] = useState(1)

  const employeeTotalRecords = employeeRecords.length
  const employeeTotalPages = Math.max(1, Math.ceil(employeeTotalRecords / employeePageSize))
  const clampedEmployeePage = Math.max(
    1,
    Math.min(employeePage, employeeTotalPages),
  )
  const employeeStartIndex = (clampedEmployeePage - 1) * employeePageSize
  const employeeEndIndex = Math.min(clampedEmployeePage * employeePageSize, employeeTotalRecords)
  const pagedEmployeeRecords = employeeRecords.slice(employeeStartIndex, employeeEndIndex)

  const adminTotalRecords = filteredRecords.length
  const adminTotalPages = Math.max(1, Math.ceil(adminTotalRecords / adminPageSize))
  const clampedFichajesPage = Math.max(
    1,
    Math.min(fichajesPage, adminTotalPages),
  )
  const adminStartIndex = (clampedFichajesPage - 1) * adminPageSize
  const adminEndIndex = Math.min(clampedFichajesPage * adminPageSize, adminTotalRecords)
  const pagedFilteredRecords = filteredRecords.slice(adminStartIndex, adminEndIndex)

  useEffect(() => {
    let tick = 0
    const timer = setInterval(() => {
      tick += 1
      setNow(Date.now())
      const current = getSession()
      if (current?.expired) {
        setSession(null)
        setLoginStep('correo')
        setLoginCandidate(null)
        setLoginEmail('')
        setLoginPassword('')
        setLoginError('Tu sesión ha expirado por inactividad. Inicia sesión de nuevo.')
      } else if (tick % 5 === 0) {
        // Refresca datos automáticamente cada 5 s para todos los roles
        setAppData(getAppData())
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  function refreshData() {
    setAppData(getAppData())
  }

  function resetLoginState() {
    setLoginError('')
    setLoginPassword('')
    setLoginCandidate(null)
    setLoginStep('correo')
    setEmployeeSetupPassword('')
    setEmployeeSetupConfirmPassword('')
  }

  async function handleContinueEmail(event) {
    event.preventDefault()
    setLoginError('')

    // Asegurar que trabajamos con el último estado en storage (evita desincronización tras crear usuarios).
    const latestAppData = getAppData()
    setAppData(latestAppData)

    const email = loginEmail.trim()
    if (!email) {
      setLoginError('Introduce tu correo electrónico.')
      return
    }

    if (latestAppData.admin && email.toLowerCase() === latestAppData.admin.username.toLowerCase()) {
      setLoginCandidate({ rol: 'admin', email })
      setLoginStep('adminPassword')
      return
    }

    const info = getEmployeeAuthInfoByEmail(email)
    if (!info) {
      setLoginError('Usuario o contraseña incorrectos.')
      return
    }

    setLoginCandidate({ rol: info.role ?? 'empleado', ...info })
    setLoginStep(info.hasPassword ? 'empleadoPassword' : 'empleadoSetup')
  }

  async function handlePasswordLogin(event) {
    event.preventDefault()
    setLoginError('')

    const authSession = await login(loginEmail.trim(), loginPassword)
    if (!authSession) {
      setLoginError('Usuario o contraseña incorrectos.')
      return
    }

    setSession(authSession)
    setLoginError('')
    setLoginPassword('')
    setLoginStep('correo')
    setLoginCandidate(null)
  }

  async function handleCreateEmployeePassword(event) {
    event.preventDefault()
    setLoginError('')

    if (!loginCandidate || loginCandidate.rol === 'admin') return
    const resolvedEmployeeId =
      loginCandidate.employeeId ?? getEmployeeAuthInfoByEmail(loginEmail.trim())?.employeeId
    if (!resolvedEmployeeId) {
      setLoginError('No se ha encontrado el usuario para crear la contraseña. Vuelve a empezar.')
      setLoginStep('correo')
      setLoginCandidate(null)
      return
    }
    const password = employeeSetupPassword
    const confirm = employeeSetupConfirmPassword

    if (password.length < 8) {
      setLoginError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setLoginError('Las contraseñas no coinciden.')
      return
    }

    const sessionCreated = await setEmployeePasswordAndLogin(resolvedEmployeeId, password)
    if (!sessionCreated) {
      setLoginError('No ha sido posible crear la contraseña. Vuelve a intentarlo.')
      return
    }

    refreshData()
    setLoginPassword('')
    setEmployeeSetupPassword('')
    setEmployeeSetupConfirmPassword('')
    setLoginStep('correo')
    setLoginCandidate(null)
  }

  // Nota: Se elimina el flujo de "Configuración inicial / Crear administrador".
  // El acceso se hace siempre desde la pantalla "Acceso Fichaje".

  async function handleCreateAdmin(event) {
    event.preventDefault()
    setLoginError('')

    const email = adminSetupEmail.trim()
    if (!email.includes('@')) {
      setLoginError('Introduce un correo electrónico válido.')
      return
    }

    if (adminSetupPassword.length < 8) {
      setLoginError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (adminSetupPassword !== adminSetupConfirmPassword) {
      setLoginError('Las contraseñas no coinciden.')
      return
    }

    await setupAdminPassword(adminSetupPassword, email)
    createCompany('Presentia Demo', email)
    refreshData()

    // Cerrar modal y volver a pedir la contraseña (sin autologin).
    setShowAdminCreateModal(false)
    setAdminSetupEmail('')
    setAdminSetupPassword('')
    setAdminSetupConfirmPassword('')
    setLoginEmail(email)
    setLoginPassword('')
    setLoginCandidate({ rol: 'admin', email })
    setLoginStep('adminPassword')
  }

  async function handleSaveEmployeeProfile(event) {
    event.preventDefault()
    setLoginError('')

    const nombre = employeeForm.name.trim()
    const email = employeeForm.email.trim()
    if (nombre.length < 2) {
      setLoginError('El nombre debe tener al menos 2 caracteres.')
      return
    }
    if (!email.includes('@')) {
      setLoginError('Introduce un correo electrónico válido.')
      return
    }

    if (!resolvedActiveCompanyId) {
      setLoginError('Crea o selecciona una empresa antes de registrar empleados.')
      return
    }

    const targetRole = adminSection === 'superiores' ? 'superior' : 'empleado'
    if (employeeForm.id) {
      await updateEmployeeProfile(employeeForm.id, nombre, email, resolvedActiveCompanyId)
    } else {
      await createEmployee(nombre, email, resolvedActiveCompanyId, targetRole)
    }

    setEmployeeForm({ id: '', name: '', email: '' })
    setPasswordEditor({ employeeId: '', password: '', confirm: '' })
    refreshData()
  }

  function handleEditEmployee(employee) {
    setEmployeeForm({
      id: employee.id,
      name: employee.name,
      email: employee.email ?? '',
    })
  }

  function handleDeleteEmployee(employeeId) {
    const employee = employeesForCompany.find((e) => e.id === employeeId)
    const nombre = employee?.name ?? 'este empleado'
    const ok = window.confirm(
      `¿Eliminar al empleado '${nombre}'? Esta acción no se puede deshacer.`,
    )
    if (!ok) return

    deleteEmployee(employeeId)
    if (employeeForm.id === employeeId) setEmployeeForm({ id: '', name: '', email: '' })
    if (passwordEditor.employeeId === employeeId) setPasswordEditor({ employeeId: '', password: '', confirm: '' })
    refreshData()
  }

  function handleSelectEmployeeForPassword(employeeId) {
    setPasswordEditor({ employeeId, password: '', confirm: '' })
  }

  async function handleAdminUpdateEmployeePassword(event) {
    event.preventDefault()
    setLoginError('')

    if (!passwordEditor.employeeId) return

    const password = passwordEditor.password
    const confirm = passwordEditor.confirm

    if (password.length < 8) {
      setLoginError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setLoginError('Las contraseñas no coinciden.')
      return
    }

    const ok = await setEmployeePassword(passwordEditor.employeeId, password)
    if (!ok) {
      setLoginError('No se ha podido actualizar la contraseña. Vuelve a intentarlo.')
      return
    }

    setPasswordEditor({ employeeId: '', password: '', confirm: '' })
    refreshData()
  }

  function handleAdminClearEmployeePassword(employeeId) {
    const ok = window.confirm(
      `¿Borrar la contraseña del empleado con ID ${employeeId}? En el siguiente inicio se le pedirá crear una nueva contraseña.`,
    )
    if (!ok) return
    clearEmployeePassword(employeeId)
    if (passwordEditor.employeeId === employeeId) {
      setPasswordEditor({ employeeId: '', password: '', confirm: '' })
    }
    refreshData()
  }

  function handleLogout() {
    logout()
    setSession(null)
    setLoginStep('correo')
    setLoginCandidate(null)
    setLoginPassword('')
    setLoginEmail('')
    setLoginError('')
  }

  function handleDashboardSearch() {
    setDashboardFilters({ from: dashboardForm.from, to: dashboardForm.to })
    setDashboardEmployeeId(dashboardForm.employeeId)
  }

  async function captureGeo() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ disponible: false })
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          disponible: true,
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          precision_metros: pos.coords.accuracy,
        }),
        () => resolve({ disponible: false }),
        { timeout: 8000, maximumAge: 30000 },
      )
    })
  }

  async function handleToggleClock() {
    if (!session || session.rol !== 'empleado' || geoCapturando) return

    let geoData = null
    if (geoActiva && geoConsentimientoAceptado) {
      setGeoCapturando(true)
      setGeoMensaje(null)
      geoData = await captureGeo()
      setGeoCapturando(false)
      setGeoMensaje(geoData.disponible ? 'ok' : 'error')
      setTimeout(() => setGeoMensaje(null), 4000)
    }

    if (employeeOpenRecord) {
      clockOut(employeeOpenRecord, geoData)
    } else {
      clockIn(session.id, session.nombre, session.companyId ?? null, geoData)
    }
    refreshData()
  }

  function handleAceptarConsentimiento() {
    if (!empleadoActual) return
    upsertEmployee({
      ...empleadoActual,
      geo_consentimiento_aceptado: true,
      geo_consentimiento_fecha: Date.now(),
      geo_consentimiento_pendiente: false,
    })
    refreshData()
  }

  function handleRechazarConsentimiento() {
    if (!empleadoActual) return
    upsertEmployee({
      ...empleadoActual,
      geo_consentimiento_aceptado: false,
      geo_consentimiento_fecha: Date.now(),
      geo_consentimiento_pendiente: false,
    })
    refreshData()
  }

  function handleEditCompany(company) {
    setCompanyForm({ id: company.id, name: company.name, geolocalizacion_activa: company.geolocalizacion_activa ?? false })
  }

  function handleDeleteCompany(companyId) {
    const company = companiesForAdmin.find((c) => c.id === companyId)
    const name = company?.name ?? 'esta empresa'
    const ok = window.confirm(
      `¿Eliminar la empresa '${name}'? Se borrarán también sus empleados y fichajes.`,
    )
    if (!ok) return
    deleteCompany(companyId)
    if (activeCompanyId === companyId) setActiveCompanyId(companiesForAdmin.filter((c) => c.id !== companyId)[0]?.id ?? '')
    setCompanyForm({ id: '', name: '' })
    refreshData()
  }

  function handleSaveCompany(event) {
    event.preventDefault()
    setLoginError('')
    if (!session?.email) return

    const name = companyForm.name.trim()
    if (name.length < 2) {
      setLoginError('El nombre de la empresa debe tener al menos 2 caracteres.')
      return
    }

    if (companyForm.id) {
      const existing = companiesForAdmin.find((c) => c.id === companyForm.id)
      const geoSeLaActivo = companyForm.geolocalizacion_activa && !existing?.geolocalizacion_activa
      upsertCompany({
        id: companyForm.id,
        name,
        adminEmail: session.email,
        geolocalizacion_activa: companyForm.geolocalizacion_activa,
        createdAt: existing?.createdAt ?? Date.now(),
      })
      // Si se acaba de activar geo, marcar todos los empleados de la empresa como pendientes de consentimiento
      if (geoSeLaActivo) {
        const { employees } = getAppData()
        employees
          .filter((e) => e.companyId === companyForm.id)
          .forEach((emp) => upsertEmployee({ ...emp, geo_consentimiento_pendiente: true }))
      }
    } else {
      const created = createCompany(name, session.email, companyForm.geolocalizacion_activa)
      setActiveCompanyId(created.id)
    }

    setCompanyForm({ id: '', name: '', geolocalizacion_activa: false })
    refreshData()
  }

  function handleExportCsv() {
    const csv = exportRecordsCsv(filteredRecords)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fichajes-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // — Handlers de ubicaciones —

  function handleBuscarUbicaciones() {
    setUbicacionesFilters({ ...ubicacionesForm })
    setUbicacionesPage(1)
    setUbicacionesDetalle(null)
  }

  function handleAbrirDetalleEmpleado(employeeId, name) {
    const hoy = ubicacionesFilters?.from ?? new Date().toISOString().slice(0, 10)
    setUbicacionesDetalle({ employeeId, name })
    setUbicacionesDetalleDate(hoy)
  }

  function handleExportUbicacionesCsv() {
    const headers = ['Empleado', 'Fecha', 'Hora', 'Tipo', 'Latitud', 'Longitud', 'Ubicación disponible', 'Google Maps']
    const rows = ubicacionesRecords.map((row) => [
      row.employeeName,
      new Date(row.timestamp).toLocaleDateString('es-ES'),
      new Date(row.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      row.tipo === 'entrada' ? 'Entrada' : 'Salida',
      row.disponible && row.latitud != null ? String(row.latitud).replace('.', ',') : '-',
      row.disponible && row.longitud != null ? String(row.longitud).replace('.', ',') : '-',
      row.disponible ? 'Sí' : 'No',
      row.disponible ? `https://www.google.com/maps?q=${row.latitud},${row.longitud}` : '-',
    ])
    const csv = '\uFEFF' + [headers, ...rows].map((r) => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ubicaciones-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // — Handlers de solicitudes de cambio —

  function handleAbrirSolicitud(record) {
    setSolicitudModal({ record })
    setSolicitudForm({ motivo: '', entradaPropuesta: '', salidaPropuesta: '', comentarios: '' })
    setSolicitudError('')
    setSolicitudSuccess(false)
  }

  function handleCerrarSolicitud() {
    setSolicitudModal(null)
    setSolicitudError('')
    setSolicitudSuccess(false)
  }

  function handleEnviarSolicitud(event) {
    event.preventDefault()
    setSolicitudError('')

    if (!solicitudForm.motivo.trim()) {
      setSolicitudError('El motivo de la solicitud es obligatorio.')
      return
    }

    const record = solicitudModal.record
    crearSolicitudCambio({
      fichajeId: record.id,
      employeeId: session.id,
      employeeName: session.nombre,
      companyId: record.companyId ?? session.companyId,
      entryTimestampActual: record.entryTimestamp,
      exitTimestampActual: record.exitTimestamp,
      entradaPropuestaStr: solicitudForm.entradaPropuesta,
      salidaPropuestaStr: solicitudForm.salidaPropuesta,
      motivo: solicitudForm.motivo.trim(),
      comentarios: solicitudForm.comentarios.trim(),
    })

    setSolicitudSuccess(true)
    refreshData()
  }

  function handleAbrirResolucion(solicitud, accion) {
    setResolucionModal({ solicitud, accion })
    setResolucionComentario('')
  }

  function handleCerrarResolucion() {
    setResolucionModal(null)
    setResolucionComentario('')
  }

  function handleConfirmarResolucion(event) {
    event.preventDefault()
    if (!resolucionModal) return

    if (resolucionModal.accion === 'aprobar') {
      aprobarSolicitud(resolucionModal.solicitud.id, session, resolucionComentario)
    } else {
      rechazarSolicitud(resolucionModal.solicitud.id, session, resolucionComentario)
    }

    setResolucionModal(null)
    setResolucionComentario('')
    refreshData()
  }

  function handleAbrirProgramador() {
    window.open(frontendProgramadorUrl, '_blank', 'noopener,noreferrer')
  }

  if (isProgramadorContext) {
    return <ProgramadorPanel />
  }

  if (!session) {
    return (
      <main className="app-bg min-h-screen p-4 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto">
          <section className="w-full bg-white/80 backdrop-blur rounded-3xl p-8 shadow-[var(--shadow-soft)] border border-white/40 text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Acceso Fichaje</h1>
            <p className="text-slate-500 mb-8 text-sm">
              Accede con tus credenciales para fichar.
            </p>

            <form
              onSubmit={
                loginStep === 'correo'
                  ? handleContinueEmail
                  : loginStep === 'empleadoSetup'
                    ? handleCreateEmployeePassword
                    : handlePasswordLogin
              }
              className="space-y-4 text-left"
            >
              {loginStep !== 'correo' && (
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="text-sm font-medium text-admin-700 hover:underline"
                    onClick={() => resetLoginState()}
                  >
                    ← Cambiar correo
                  </button>
                  {loginCandidate && (
                    loginCandidate.rol === 'admin' ? (
                      <div className="inline-flex items-center rounded-full bg-admin-700/10 text-admin-700 border border-admin-700/20 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                        Administrador
                      </div>
                    ) : loginCandidate.rol === 'superior' ? (
                      <div className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                        Superior
                      </div>
                    ) : (
                      <div className="inline-flex items-center rounded-full bg-employee-500/10 text-employee-700 border border-employee-500/20 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                        Empleado
                      </div>
                    )
                  )}
                </div>
              )}

              {loginStep === 'correo' && (
                <>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="login-email">
                    Correo electrónico
                  </label>
                  <input
                    id="login-email"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                  {loginCandidate && (
                    loginCandidate.rol === 'admin' ? (
                      <div className="mt-2 inline-flex items-center rounded-full bg-admin-700/10 text-admin-700 border border-admin-700/20 px-3 py-1 text-sm font-semibold tracking-wide uppercase">
                        Administrador
                      </div>
                    ) : loginCandidate.rol === 'superior' ? (
                      <div className="mt-2 inline-flex items-center rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 text-sm font-semibold tracking-wide uppercase">
                        Superior
                      </div>
                    ) : (
                      <div className="mt-2 inline-flex items-center rounded-full bg-employee-500/10 text-employee-700 border border-employee-500/20 px-3 py-1 text-sm font-semibold tracking-wide uppercase">
                        Empleado
                      </div>
                    )
                  )}
                </>
              )}

              {(loginStep === 'adminPassword' || loginStep === 'empleadoPassword') && (
                <>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="login-password">
                    Contraseña
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </>
              )}

              {loginStep === 'empleadoSetup' && (
                <>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="setup-password">
                    Contraseña
                  </label>
                  <input
                    id="setup-password"
                    type="password"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={employeeSetupPassword}
                    onChange={(event) => setEmployeeSetupPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />

                  <label className="block text-sm font-medium text-slate-700" htmlFor="setup-confirm">
                    Confirmar contraseña
                  </label>
                  <input
                    id="setup-confirm"
                    type="password"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={employeeSetupConfirmPassword}
                    onChange={(event) => setEmployeeSetupConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                </>
              )}

              {loginError && <div role="alert" className="p-3 mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg font-medium">{loginError}</div>}

              <button className="w-full rounded-lg bg-admin-700 text-white py-3 font-semibold">
                {loginStep === 'empleadoSetup'
                  ? 'Crear contraseña y entrar'
                  : loginStep === 'correo'
                    ? 'Continuar'
                    : 'Entrar'}
              </button>
            </form>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
              <p className="text-sm font-semibold text-slate-700">¿Eres Programador?</p>
              <p className="mt-1 text-xs text-slate-600">
                Accede al panel superadmin para crear y gestionar tenants de Presentia.
              </p>
              <button
                type="button"
                className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                onClick={handleAbrirProgramador}
              >
                Ir a acceso Programador
              </button>
            </div>

            {!appData.admin && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
                <p className="text-sm font-semibold text-slate-700">¿No hay administrador?</p>
                <p className="mt-1 text-xs text-slate-600">
                  Crea el administrador local para poder gestionar empresas y usuarios.
                </p>
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg bg-admin-700 text-white px-3 py-2 text-sm font-semibold"
                  onClick={() => setShowAdminCreateModal(true)}
                >
                  Crear administrador
                </button>
              </div>
            )}
          </section>
        </div>

        {showAdminCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-800">Crear administrador</h2>
              <form className="mt-4 space-y-3 text-left" onSubmit={handleCreateAdmin}>
                <label className="block text-sm font-medium text-slate-700" htmlFor="create-admin-email">
                  Correo del administrador
                </label>
                <input
                  id="create-admin-email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={adminSetupEmail}
                  onChange={(event) => setAdminSetupEmail(event.target.value)}
                  autoComplete="email"
                  required
                />

                <label className="block text-sm font-medium text-slate-700" htmlFor="create-admin-password">
                  Contraseña
                </label>
                <input
                  id="create-admin-password"
                  type="password"
                  minLength={8}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={adminSetupPassword}
                  onChange={(event) => setAdminSetupPassword(event.target.value)}
                  required
                />

                <label className="block text-sm font-medium text-slate-700" htmlFor="create-admin-confirm">
                  Confirmar contraseña
                </label>
                <input
                  id="create-admin-confirm"
                  type="password"
                  minLength={8}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={adminSetupConfirmPassword}
                  onChange={(event) => setAdminSetupConfirmPassword(event.target.value)}
                  required
                />

                {loginError && (
                  <div role="alert" className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg font-medium">
                    {loginError}
                  </div>
                )}

                <div className="pt-2 flex gap-2 justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-slate-300"
                    onClick={() => {
                      setShowAdminCreateModal(false)
                      setLoginError('')
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-admin-700 text-white font-semibold">
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    )
  }

  if (hasAdminAccess) {
    return (
      <main className="app-bg min-h-screen p-4 md:p-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-[240px_1fr] gap-4">
          <aside className="bg-admin-700 text-white rounded-xl p-4 space-y-2">
            <h2 className="text-xl font-bold">Panel de administración</h2>
            <p className="text-sm text-blue-100">Bienvenido, {session.nombre}</p>
            <nav className="space-y-1">
              <button
                type="button"
                className={`w-full text-left px-3 py-2 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${adminSection === 'dashboard' ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                onClick={() => setAdminSection('dashboard')}
              >
                Cuadro de mando
              </button>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${adminSection === 'fichajes' ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                onClick={() => setAdminSection('fichajes')}
              >
                Fichajes
              </button>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${adminSection === 'ubicaciones' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                onClick={() => setAdminSection('ubicaciones')}
              >
                Ubicaciones
              </button>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 flex items-center justify-between ${adminSection === 'solicitudes' ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                onClick={() => setAdminSection('solicitudes')}
              >
                <span>Solicitudes</span>
                {solicitudesPendientesCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-amber-400 text-slate-900 text-xs font-bold">
                    {solicitudesPendientesCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${adminSection === 'empleados' ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                onClick={() => setAdminSection('empleados')}
              >
                Empleados
              </button>
              {isSuperAdmin && (
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${adminSection === 'superiores' ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                  onClick={() => setAdminSection('superiores')}
                >
                  Superiores
                </button>
              )}
              <button
                type="button"
                className={`w-full text-left px-3 py-2 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${adminSection === 'resumen' ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                onClick={() => setAdminSection('resumen')}
              >
                Resumen de horas
              </button>
              {isSuperAdmin && (
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${adminSection === 'empresa' ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                  onClick={() => setAdminSection('empresa')}
                >
                  Empresa
                </button>
              )}
            </nav>
            <button className="w-full mt-4 bg-white text-admin-700 rounded p-2 font-semibold" onClick={handleLogout}>Cerrar sesión</button>
          </aside>

          <section className="bg-white/80 backdrop-blur rounded-2xl p-4 md:p-6 shadow-[var(--shadow-card)] overflow-hidden border border-white/40">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Administración</h1>
                <p className="text-sm text-slate-600">Gestiona empresa, empleados y fichajes.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                {isSuperAdmin ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Empresa activa</label>
                    <select
                      className="w-full sm:min-w-72 rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-500/30"
                      value={resolvedActiveCompanyId}
                      onChange={(event) => setActiveCompanyId(event.target.value)}
                    >
                      {companiesForAdmin.length === 0 && <option value="">Sin empresas</option>}
                      {companiesForAdmin.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm font-medium text-slate-800">
                    <span className="text-xs text-slate-500 font-normal">Empresa:</span>
                    {(appData.companies ?? []).find((c) => c.id === resolvedActiveCompanyId)?.name ?? 'Mi Empresa'}
                    {activeCompany?.geolocalizacion_activa && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 text-xs font-semibold">
                        Geo activa
                      </span>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-500/30"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            </header>
            {adminSection !== 'empresa' && companiesForAdmin.length === 0 && (
              <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 mb-4">
                <p className="font-semibold text-amber-900">Aún no tienes empresas</p>
                <p className="text-sm text-amber-800 mt-1">
                  Crea una empresa en la sección <span className="font-semibold">Empresa</span> para poder registrar empleados y fichajes.
                </p>
              </div>
            )}

            {adminSection === 'dashboard' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Cuadro de mando</h3>
                    <p className="text-sm text-slate-600">
                      Vista general de asistencia y horas en el rango seleccionado.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-end">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Empleado</label>
                      <select
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={dashboardForm.employeeId}
                        onChange={(event) =>
                          setDashboardForm((prev) => ({ ...prev, employeeId: event.target.value }))
                        }
                      >
                        <option value="">Todos</option>
                        {trackableEmployees.map((e) => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Desde</label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={dashboardForm.from}
                        onChange={(event) =>
                          setDashboardForm((prev) => ({ ...prev, from: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Hasta</label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={dashboardForm.to}
                        onChange={(event) =>
                          setDashboardForm((prev) => ({ ...prev, to: event.target.value }))
                        }
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleDashboardSearch}
                        className="flex items-center gap-2 rounded-lg bg-admin-700 px-4 py-2 text-sm font-semibold text-white hover:bg-admin-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-500/40"
                        title="Buscar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                        Buscar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <article className="border border-slate-200 rounded-xl p-4 bg-white">
                    <p className="text-sm text-slate-500">{dashboardEmployeeId ? 'Empleado' : 'Empleados'}</p>
                    <p className="text-3xl font-bold text-admin-700 truncate">
                      {dashboardEmployeeId
                        ? trackableEmployees.find(e => e.id === dashboardEmployeeId)?.name.split(' ')[0]
                        : trackableEmployees.length}
                    </p>
                  </article>
                  <article className="border border-slate-200 rounded-xl p-4 bg-white">
                    <p className="text-sm text-slate-500">{dashboardEmployeeId ? 'Días asistidos' : 'Fichajes completados'}</p>
                    <p className="text-3xl font-bold text-admin-700">{dashboardData.totalCompleted}</p>
                  </article>
                  <article className="border border-slate-200 rounded-xl p-4 bg-white">
                    <p className="text-sm text-slate-500">Horas totales</p>
                    <p className="text-3xl font-bold text-admin-700">{formatHours(dashboardData.totalHours)}</p>
                  </article>
                </div>

                <DailyTimeline
                  days={dashboardData.days}
                  trackableEmployees={trackableEmployees}
                />
              </div>
            )}

            {adminSection === 'fichajes' && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3 md:items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-slate-700">Empleado</label>
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      value={filters.employeeId}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, employeeId: event.target.value }))
                      }
                    >
                      <option value="">Todos</option>
                      {employeesForCompany.map((employee) => (
                        <option key={employee.id} value={employee.id}>{employee.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Desde</label>
                    <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={filters.from} onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Hasta</label>
                    <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={filters.to} onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))} />
                  </div>
                  <button className="bg-admin-700 text-white rounded-lg px-4 py-2 h-10" onClick={handleExportCsv}>
                    Exportar CSV
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm text-slate-600">
                      Resultados: <span className="font-semibold">{adminTotalRecords}</span>
                      {adminTotalRecords > 0 && (
                        <span className="text-slate-500">
                          {' '}
                          (mostrando {adminStartIndex + 1}-{adminEndIndex})
                        </span>
                      )}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-800 disabled:opacity-50"
                        onClick={() => setFichajesPage((p) => Math.max(1, p - 1))}
                        disabled={clampedFichajesPage <= 1}
                      >
                        Anterior
                      </button>
                      <p className="text-sm text-slate-600">
                        Página {clampedFichajesPage} de {adminTotalPages}
                      </p>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-800 disabled:opacity-50"
                        onClick={() => setFichajesPage((p) => Math.min(adminTotalPages, p + 1))}
                        disabled={clampedFichajesPage >= adminTotalPages}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>

                  {adminTotalRecords === 0 ? (
                    <div className="border border-slate-200 rounded-xl p-6 bg-white">
                      <p className="font-semibold text-slate-800">No hay resultados</p>
                      <p className="text-sm text-slate-600 mt-1">
                        Ajusta los filtros o registra nuevos fichajes.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="hidden sm:block border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100 text-slate-700">
                            <tr>
                              <th className="text-left p-3">Empleado</th>
                              <th className="text-right p-3">Fecha</th>
                              <th className="text-right p-3">Entrada</th>
                              <th className="text-right p-3">Salida</th>
                              <th className="text-right p-3">Horas</th>
                              <th className="text-right p-3">Ubicación</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedFilteredRecords.map((record) => (
                              <tr key={record.id} className="border-t border-slate-100">
                                <td className="p-3">{record.employeeName}</td>
                                <td className="p-3 text-right font-mono">{formatDate(record.entryTimestamp)}</td>
                                <td className="p-3 text-right font-mono">{formatTime(record.entryTimestamp)}</td>
                                <td className="p-3 text-right font-mono">
                                  {record.exitTimestamp ? formatTime(record.exitTimestamp) : '-'}
                                </td>
                                <td className="p-3 text-right font-mono">
                                  {record.exitTimestamp
                                    ? formatHours(calculateWorkedHours(record.entryTimestamp, record.exitTimestamp))
                                    : '-'}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex flex-col items-end gap-1">
                                    {record.entry_ubicacion_disponible ? (
                                      <a
                                        href={`https://www.google.com/maps?q=${record.entry_latitud},${record.entry_longitud}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-xs font-mono"
                                        title={`Entrada: ${record.entry_latitud?.toFixed(5)}, ${record.entry_longitud?.toFixed(5)}`}
                                      >
                                        Entrada ↗
                                      </a>
                                    ) : activeCompany?.geolocalizacion_activa ? (
                                      <span className="text-xs text-slate-400">Sin ubicación (E)</span>
                                    ) : null}
                                    {record.exit_ubicacion_disponible ? (
                                      <a
                                        href={`https://www.google.com/maps?q=${record.exit_latitud},${record.exit_longitud}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-xs font-mono"
                                        title={`Salida: ${record.exit_latitud?.toFixed(5)}, ${record.exit_longitud?.toFixed(5)}`}
                                      >
                                        Salida ↗
                                      </a>
                                    ) : record.exitTimestamp && activeCompany?.geolocalizacion_activa ? (
                                      <span className="text-xs text-slate-400">Sin ubicación (S)</span>
                                    ) : null}
                                    {!record.entry_ubicacion_disponible && !record.exit_ubicacion_disponible && !activeCompany?.geolocalizacion_activa && (
                                      <span className="text-xs text-slate-300">—</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="sm:hidden space-y-3">
                        {pagedFilteredRecords.map((record) => (
                          <article key={record.id} className="border border-slate-200 rounded-xl p-4 bg-white">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-slate-800">{record.employeeName}</div>
                                <div className="text-xs text-slate-500 font-mono">{formatDate(record.entryTimestamp)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-slate-500">Horas</div>
                                <div className="font-mono font-semibold text-slate-800">
                                  {record.exitTimestamp
                                    ? formatHours(calculateWorkedHours(record.entryTimestamp, record.exitTimestamp))
                                    : '-'}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <div className="text-xs text-slate-500">Entrada</div>
                                <div className="font-mono text-slate-800">{formatTime(record.entryTimestamp)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500">Salida</div>
                                <div className="font-mono text-slate-800">
                                  {record.exitTimestamp ? formatTime(record.exitTimestamp) : '-'}
                                </div>
                              </div>
                            </div>
                            {activeCompany?.geolocalizacion_activa && (
                              <div className="mt-2 flex gap-3 text-xs">
                                {record.entry_ubicacion_disponible ? (
                                  <a href={`https://www.google.com/maps?q=${record.entry_latitud},${record.entry_longitud}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    Ubicación entrada ↗
                                  </a>
                                ) : <span className="text-slate-400">Sin ubic. entrada</span>}
                                {record.exitTimestamp && (record.exit_ubicacion_disponible ? (
                                  <a href={`https://www.google.com/maps?q=${record.exit_latitud},${record.exit_longitud}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    Salida ↗
                                  </a>
                                ) : <span className="text-slate-400">Sin ubic. salida</span>)}
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {adminSection === 'ubicaciones' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Ubicaciones de fichaje</h3>
                  <p className="text-sm text-slate-600">Consulta dónde ha fichado cada empleado en el mapa.</p>
                </div>

                {!activeCompany?.geolocalizacion_activa ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
                    <p className="font-semibold text-amber-900">Geolocalización no activa</p>
                    <p className="text-sm text-amber-800 mt-1">
                      Activa "Registrar ubicación al fichar" en la sección <span className="font-semibold">Empresa</span> para que los empleados registren su ubicación al fichar.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Vista de detalle por empleado */}
                    {ubicacionesDetalle ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="flex items-center gap-1.5 text-sm font-semibold text-admin-700 hover:underline"
                            onClick={() => setUbicacionesDetalle(null)}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                            </svg>
                            Volver
                          </button>
                          <span className="text-slate-300">|</span>
                          <span className="font-semibold text-slate-800">{ubicacionesDetalle.name}</span>
                        </div>

                        <div className="flex items-end gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Día</label>
                            <input
                              type="date"
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                              value={ubicacionesDetalleDate}
                              onChange={(e) => setUbicacionesDetalleDate(e.target.value)}
                            />
                          </div>
                        </div>

                        {ubicacionesDetallePoints.length === 0 ? (
                          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                            <p className="font-semibold text-slate-700">Sin ubicaciones registradas</p>
                            <p className="text-sm text-slate-500 mt-1">No hay fichajes con ubicación para este día.</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex gap-4 text-xs">
                              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-green-600"></span>Entrada</span>
                              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-600"></span>Salida</span>
                            </div>
                            <MapaFichajes points={ubicacionesDetallePoints} height={380} />
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-100 text-slate-700">
                                  <tr>
                                    <th className="text-left p-3">Tipo</th>
                                    <th className="text-left p-3">Hora</th>
                                    <th className="text-left p-3">Coordenadas</th>
                                    <th className="text-left p-3">Mapa</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ubicacionesDetallePoints.map((pt) => (
                                    <tr key={pt.id} className="border-t border-slate-100">
                                      <td className="p-3">
                                        <span className={`font-semibold ${pt.tipo === 'entrada' ? 'text-green-700' : 'text-red-700'}`}>
                                          {pt.tipo === 'entrada' ? '▶ Entrada' : '◀ Salida'}
                                        </span>
                                      </td>
                                      <td className="p-3 font-mono text-xs">
                                        {new Date(pt.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                      </td>
                                      <td className="p-3 font-mono text-xs text-slate-500">
                                        {pt.latitud.toFixed(6)}, {pt.longitud.toFixed(6)}
                                      </td>
                                      <td className="p-3">
                                        <a
                                          href={`https://www.google.com/maps?q=${pt.latitud},${pt.longitud}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline text-xs font-semibold"
                                        >
                                          Ver ↗
                                        </a>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Filtros */}
                        <div className="flex flex-wrap gap-3 items-end p-4 rounded-xl border border-slate-200 bg-white">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Empleado</label>
                            <select
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                              value={ubicacionesForm.employeeId}
                              onChange={(e) => setUbicacionesForm((p) => ({ ...p, employeeId: e.target.value }))}
                            >
                              <option value="">Todos</option>
                              {trackableEmployees.map((e) => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Desde</label>
                            <input
                              type="date"
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                              value={ubicacionesForm.from}
                              onChange={(e) => setUbicacionesForm((p) => ({ ...p, from: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Hasta</label>
                            <input
                              type="date"
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                              value={ubicacionesForm.to}
                              onChange={(e) => setUbicacionesForm((p) => ({ ...p, to: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                            <select
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                              value={ubicacionesForm.tipo}
                              onChange={(e) => setUbicacionesForm((p) => ({ ...p, tipo: e.target.value }))}
                            >
                              <option value="todos">Todos</option>
                              <option value="entrada">Solo entradas</option>
                              <option value="salida">Solo salidas</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            className="rounded-lg bg-admin-700 text-white px-4 py-2 text-sm font-semibold hover:bg-admin-800"
                            onClick={handleBuscarUbicaciones}
                          >
                            Buscar
                          </button>
                        </div>

                        {/* Sin buscar aún */}
                        {!ubicacionesFilters && (
                          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                            <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            <p className="font-semibold text-slate-700">Selecciona los filtros y pulsa Buscar</p>
                            <p className="text-sm text-slate-400 mt-1">Los fichajes con ubicación aparecerán en el mapa.</p>
                          </div>
                        )}

                        {/* Resultados */}
                        {ubicacionesFilters && (
                          <>
                            {/* Tabs mapa/lista */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex gap-1 border-b border-slate-200">
                                {[{ k: 'mapa', label: 'Mapa' }, { k: 'lista', label: 'Lista' }].map(({ k, label }) => (
                                  <button
                                    key={k}
                                    type="button"
                                    className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${ubicacionesTab === k ? 'bg-white border border-b-white border-slate-200 text-admin-700 -mb-px' : 'text-slate-500 hover:text-slate-800'}`}
                                    onClick={() => setUbicacionesTab(k)}
                                  >
                                    {label}
                                    {k === 'mapa' && <span className="ml-1.5 text-xs text-slate-400">({ubicacionesPoints.length})</span>}
                                    {k === 'lista' && <span className="ml-1.5 text-xs text-slate-400">({ubicacionesRecords.length})</span>}
                                  </button>
                                ))}
                              </div>
                              {ubicacionesRecords.length > 0 && (
                                <button
                                  type="button"
                                  className="text-sm font-semibold text-admin-700 hover:underline"
                                  onClick={handleExportUbicacionesCsv}
                                >
                                  Exportar CSV
                                </button>
                              )}
                            </div>

                            {/* Vista mapa */}
                            {ubicacionesTab === 'mapa' && (
                              ubicacionesPoints.length === 0 ? (
                                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                                  <p className="font-semibold text-slate-700">No hay ubicaciones registradas</p>
                                  <p className="text-sm text-slate-400 mt-1">No hay fichajes con ubicación para los filtros seleccionados.</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex gap-4 text-xs text-slate-600">
                                    <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-green-600"></span>Entrada</span>
                                    <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-600"></span>Salida</span>
                                    <span className="text-slate-400">· Haz clic en un pin para ver el detalle</span>
                                  </div>
                                  <MapaFichajes points={ubicacionesPoints} height={460} />
                                </div>
                              )
                            )}

                            {/* Vista lista */}
                            {ubicacionesTab === 'lista' && (
                              <div className="space-y-3">
                                {ubicacionesRecords.length === 0 ? (
                                  <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                                    <p className="font-semibold text-slate-700">Sin registros</p>
                                  </div>
                                ) : (
                                  <>
                                    <div className="hidden sm:block border border-slate-200 rounded-xl overflow-hidden bg-white">
                                      <table className="w-full text-sm">
                                        <thead className="bg-slate-100 text-slate-700">
                                          <tr>
                                            <th className="text-left p-3">Empleado</th>
                                            <th className="text-left p-3">Fecha</th>
                                            <th className="text-left p-3">Hora</th>
                                            <th className="text-left p-3">Tipo</th>
                                            <th className="text-left p-3">Coordenadas</th>
                                            <th className="text-left p-3">Mapa</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {pagedUbicacionesRecords.map((row) => (
                                            <tr key={row.id} className="border-t border-slate-100">
                                              <td className="p-3">
                                                <button
                                                  type="button"
                                                  className="font-semibold text-admin-700 hover:underline text-left"
                                                  onClick={() => handleAbrirDetalleEmpleado(row.employeeId, row.employeeName)}
                                                >
                                                  {row.employeeName}
                                                </button>
                                              </td>
                                              <td className="p-3 font-mono text-xs">
                                                {new Date(row.timestamp).toLocaleDateString('es-ES')}
                                              </td>
                                              <td className="p-3 font-mono text-xs">
                                                {new Date(row.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                              </td>
                                              <td className="p-3">
                                                <span className={`font-semibold text-xs ${row.tipo === 'entrada' ? 'text-green-700' : 'text-red-700'}`}>
                                                  {row.tipo === 'entrada' ? '▶ Entrada' : '◀ Salida'}
                                                </span>
                                              </td>
                                              <td className="p-3 font-mono text-xs text-slate-500">
                                                {row.disponible && row.latitud != null
                                                  ? `${row.latitud.toFixed(5)}, ${row.longitud.toFixed(5)}`
                                                  : <span className="text-slate-300">Sin ubicación</span>}
                                              </td>
                                              <td className="p-3">
                                                {row.disponible && row.latitud != null ? (
                                                  <a
                                                    href={`https://www.google.com/maps?q=${row.latitud},${row.longitud}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-xs font-semibold"
                                                  >
                                                    Ver ↗
                                                  </a>
                                                ) : <span className="text-slate-300 text-xs">—</span>}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* Tarjetas móvil */}
                                    <div className="sm:hidden space-y-3">
                                      {pagedUbicacionesRecords.map((row) => (
                                        <article key={row.id} className="border border-slate-200 rounded-xl p-4 bg-white">
                                          <div className="flex items-start justify-between gap-2">
                                            <div>
                                              <button
                                                type="button"
                                                className="font-semibold text-admin-700 hover:underline text-sm text-left"
                                                onClick={() => handleAbrirDetalleEmpleado(row.employeeId, row.employeeName)}
                                              >
                                                {row.employeeName}
                                              </button>
                                              <p className="text-xs text-slate-500 font-mono">
                                                {new Date(row.timestamp).toLocaleDateString('es-ES')} · {new Date(row.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                              </p>
                                            </div>
                                            <span className={`font-semibold text-xs shrink-0 ${row.tipo === 'entrada' ? 'text-green-700' : 'text-red-700'}`}>
                                              {row.tipo === 'entrada' ? '▶ Entrada' : '◀ Salida'}
                                            </span>
                                          </div>
                                          {row.disponible && row.latitud != null ? (
                                            <a
                                              href={`https://www.google.com/maps?q=${row.latitud},${row.longitud}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="mt-2 text-blue-600 hover:underline text-xs font-semibold block"
                                            >
                                              {row.latitud.toFixed(5)}, {row.longitud.toFixed(5)} · Ver en Maps ↗
                                            </a>
                                          ) : (
                                            <p className="mt-2 text-xs text-slate-400">Sin ubicación</p>
                                          )}
                                        </article>
                                      ))}
                                    </div>

                                    {/* Paginación */}
                                    {ubicacionesTotalPages > 1 && (
                                      <div className="flex items-center justify-between gap-3 pt-1">
                                        <button
                                          type="button"
                                          className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-800 disabled:opacity-50"
                                          onClick={() => setUbicacionesPage((p) => Math.max(1, p - 1))}
                                          disabled={clampedUbicacionesPage <= 1}
                                        >Anterior</button>
                                        <p className="text-sm text-slate-600">
                                          Página {clampedUbicacionesPage} de {ubicacionesTotalPages}
                                        </p>
                                        <button
                                          type="button"
                                          className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-800 disabled:opacity-50"
                                          onClick={() => setUbicacionesPage((p) => Math.min(ubicacionesTotalPages, p + 1))}
                                          disabled={clampedUbicacionesPage >= ubicacionesTotalPages}
                                        >Siguiente</button>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {adminSection === 'solicitudes' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Solicitudes de cambio de fichaje</h3>
                  <p className="text-sm text-slate-600">Revisa y gestiona las correcciones solicitadas por los empleados.</p>
                </div>

                {solicitudesPendientesCount > 0 && (
                  <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-slate-900 text-sm font-bold shrink-0">
                      {solicitudesPendientesCount}
                    </span>
                    <div>
                      <p className="font-semibold text-amber-900">
                        {solicitudesPendientesCount === 1
                          ? 'Hay 1 solicitud pendiente de revisión'
                          : `Hay ${solicitudesPendientesCount} solicitudes pendientes de revisión`}
                      </p>
                      <p className="text-sm text-amber-800">Revisa y aprueba o rechaza cada solicitud.</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-1 border-b border-slate-200">
                  {[
                    { key: 'pendiente', label: 'Pendientes' },
                    { key: 'aprobada', label: 'Aprobadas' },
                    { key: 'rechazada', label: 'Rechazadas' },
                    { key: 'todas', label: 'Todas' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${solicitudesFilter === key ? 'bg-white border border-b-white border-slate-200 text-admin-700 -mb-px' : 'text-slate-500 hover:text-slate-800'}`}
                      onClick={() => { setSolicitudesFilter(key); setSolicitudesPage(1) }}
                    >
                      {label}
                      {key === 'pendiente' && solicitudesPendientesCount > 0 && (
                        <span className="ml-1.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-amber-400 text-slate-900 text-xs font-bold">
                          {solicitudesPendientesCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {solicitudesFiltered.length === 0 ? (
                  <div className="border border-slate-200 rounded-xl p-6 bg-white">
                    <p className="font-semibold text-slate-800">No hay solicitudes</p>
                    <p className="text-sm text-slate-600 mt-1">No hay solicitudes con el estado seleccionado.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {pagedSolicitudes.map((sol) => {
                        const estadoBadge =
                          sol.estado === 'pendiente'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : sol.estado === 'aprobada'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                        const estadoLabel =
                          sol.estado === 'pendiente' ? 'Pendiente' : sol.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'
                        return (
                          <article key={sol.id} className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                            <div className="flex flex-wrap items-start gap-3 justify-between">
                              <div>
                                <p className="font-semibold text-slate-800">{sol.employeeName}</p>
                                <p className="text-xs text-slate-500 font-mono">
                                  Fichaje del {new Date(sol.entryTimestampActual).toLocaleDateString('es-ES')}
                                </p>
                              </div>
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoBadge}`}>
                                {estadoLabel}
                              </span>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3 text-sm">
                              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hora registrada</p>
                                <p className="font-mono text-slate-800">
                                  Entrada: {new Date(sol.entryTimestampActual).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="font-mono text-slate-800">
                                  Salida: {sol.exitTimestampActual
                                    ? new Date(sol.exitTimestampActual).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                                    : '—'}
                                </p>
                              </div>
                              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1">
                                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Hora propuesta</p>
                                <p className="font-mono text-blue-900">
                                  Entrada: {sol.entryTimestampPropuesta
                                    ? new Date(sol.entryTimestampPropuesta).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                                    : '— sin cambio —'}
                                </p>
                                <p className="font-mono text-blue-900">
                                  Salida: {sol.exitTimestampPropuesta
                                    ? new Date(sol.exitTimestampPropuesta).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                                    : '— sin cambio —'}
                                </p>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Motivo</p>
                              <p className="text-sm text-slate-800">{sol.motivo}</p>
                              {sol.comentarios && (
                                <p className="text-sm text-slate-600 mt-1 italic">{sol.comentarios}</p>
                              )}
                            </div>

                            <div className="text-xs text-slate-400 font-mono">
                              Solicitado el {new Date(sol.creadoEn).toLocaleString('es-ES')}
                            </div>

                            {sol.estado !== 'pendiente' && sol.resueltoPor && (
                              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                                <p className="font-semibold text-slate-700">
                                  {sol.estado === 'aprobada' ? 'Aprobado' : 'Rechazado'} por {sol.resueltoPor}
                                </p>
                                {sol.comentarioResolucion && (
                                  <p className="text-slate-600 mt-1">{sol.comentarioResolucion}</p>
                                )}
                                <p className="text-xs text-slate-400 font-mono mt-1">
                                  {new Date(sol.resueltoEn).toLocaleString('es-ES')}
                                </p>
                              </div>
                            )}

                            {sol.estado === 'pendiente' && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                  type="button"
                                  className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700"
                                  onClick={() => handleAbrirResolucion(sol, 'aprobar')}
                                >
                                  Aprobar cambio
                                </button>
                                <button
                                  type="button"
                                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700"
                                  onClick={() => handleAbrirResolucion(sol, 'rechazar')}
                                >
                                  Rechazar cambio
                                </button>
                              </div>
                            )}
                          </article>
                        )
                      })}
                    </div>

                    {solicitudesTotalPages > 1 && (
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-800 disabled:opacity-50"
                          onClick={() => setSolicitudesPage((p) => Math.max(1, p - 1))}
                          disabled={clampedSolicitudesPage <= 1}
                        >
                          Anterior
                        </button>
                        <p className="text-sm text-slate-600">
                          Página {clampedSolicitudesPage} de {solicitudesTotalPages}
                        </p>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-800 disabled:opacity-50"
                          onClick={() => setSolicitudesPage((p) => Math.min(solicitudesTotalPages, p + 1))}
                          disabled={clampedSolicitudesPage >= solicitudesTotalPages}
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {(adminSection === 'empleados' || adminSection === 'superiores') && (
              <div className="grid lg:grid-cols-[380px_1fr] gap-4">
                <div className="space-y-4">
                  <form
                    onSubmit={handleSaveEmployeeProfile}
                    className="space-y-3 p-4 border rounded-xl border-slate-200 bg-white"
                  >
                    <h3 className="font-semibold text-slate-800">
                      {employeeForm.id
                        ? (adminSection === 'superiores' ? 'Editar superior' : 'Editar empleado')
                        : (adminSection === 'superiores' ? 'Nuevo superior' : 'Nuevo empleado')}
                    </h3>

                    <div>
                      <label className="text-sm font-medium text-slate-700 block" htmlFor="employee-name">
                        Nombre
                      </label>
                      <input
                        id="employee-name"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={employeeForm.name}
                        onChange={(event) =>
                          setEmployeeForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 block" htmlFor="employee-email">
                        Correo electrónico
                      </label>
                      <input
                        id="employee-email"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={employeeForm.email}
                        onChange={(event) =>
                          setEmployeeForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                        required
                      />
                    </div>

                    <div className="rounded-lg border border-employee-500/30 bg-employee-100/50 p-3">
                      <p className="text-sm text-employee-700 font-medium">Flujo de contraseña</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Al crear el {adminSection === 'superiores' ? 'superior' : 'empleado'}, se le pedirá configurar su contraseña en su primer inicio de sesión.
                      </p>
                    </div>

                    {loginError && (
                      <div role="alert" className="p-3 mb-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg font-medium">
                        {loginError}
                      </div>
                    )}

                    <button className="w-full bg-admin-700 text-white rounded-lg py-2 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-500/60">
                      {employeeForm.id ? 'Guardar cambios' : (adminSection === 'superiores' ? 'Crear superior' : 'Crear empleado')}
                    </button>
                  </form>

                  {passwordEditorEmployee && (
                    <div className="p-4 border border-slate-200 rounded-xl bg-white">
                      <h3 className="font-semibold text-slate-800">Contraseña</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Gestionas la contraseña de <span className="font-semibold">{passwordEditorEmployee.name}</span>.
                      </p>

                      <p className="text-xs text-slate-500 mt-3">
                        Por seguridad, la contraseña no se puede ver en texto plano. Puedes cambiarla o borrarla para que el empleado cree una nueva.
                      </p>

                      <form onSubmit={handleAdminUpdateEmployeePassword} className="space-y-3 mt-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700" htmlFor="new-employee-password">
                            Nueva contraseña
                          </label>
                          <input
                            id="new-employee-password"
                            type="password"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            value={passwordEditor.password}
                            onChange={(event) =>
                              setPasswordEditor((prev) => ({ ...prev, password: event.target.value }))
                            }
                            minLength={8}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700" htmlFor="new-employee-password-confirm">
                            Confirmar contraseña
                          </label>
                          <input
                            id="new-employee-password-confirm"
                            type="password"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            value={passwordEditor.confirm}
                            onChange={(event) =>
                              setPasswordEditor((prev) => ({ ...prev, confirm: event.target.value }))
                            }
                            minLength={8}
                            required
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="submit"
                            className="flex-1 bg-admin-700 text-white rounded-lg py-2 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-500/60"
                          >
                            Actualizar
                          </button>
                          <button
                            type="button"
                            className="flex-1 rounded-lg border border-slate-300 py-2 font-semibold text-slate-800 hover:bg-slate-50"
                            onClick={() => handleAdminClearEmployeePassword(passwordEditorEmployee.id)}
                          >
                            Borrar contraseña
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                <div>
                  <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">{adminSection === 'superiores' ? 'Superiores' : 'Empleados'}</h3>
                        <p className="text-sm text-slate-600">Total: {employeesForCompany.filter(e => (e.role ?? 'empleado') === (adminSection === 'superiores' ? 'superior' : 'empleado')).length}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Acción rápida</p>
                        <p className="text-sm text-employee-700 font-medium">Gestiona contraseñas desde el panel.</p>
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 text-slate-700">
                          <tr>
                            <th className="text-left p-3">Empleado</th>
                            <th className="text-left p-3">Correo</th>
                            <th className="text-left p-3">Contraseña</th>
                            <th className="text-right p-3">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employeesForCompany
                            .filter(e => (e.role ?? 'empleado') === (adminSection === 'superiores' ? 'superior' : 'empleado'))
                            .map((employee) => {
                              const hasPassword = Boolean(employee.passwordHash && employee.salt)
                              return (
                                <tr key={employee.id} className="border-t border-slate-100">
                                  <td className="p-3">{employee.name}</td>
                                  <td className="p-3 font-mono text-xs text-slate-700">{employee.email ?? '-'}</td>
                                  <td className="p-3">
                                    {hasPassword ? (
                                      <span className="inline-flex items-center rounded-full bg-employee-500/15 text-employee-700 px-2 py-1 text-xs font-semibold">
                                        Creada
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-1 text-xs font-semibold">
                                        Pendiente
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="inline-flex items-center gap-2">
                                      <button
                                        type="button"
                                        className="text-admin-700 font-semibold hover:underline"
                                        onClick={() => handleEditEmployee(employee)}
                                      >
                                        Editar
                                      </button>
                                      <button
                                        type="button"
                                        className="text-slate-700 font-semibold hover:underline"
                                        onClick={() => handleSelectEmployeeForPassword(employee.id)}
                                      >
                                        Contraseña
                                      </button>
                                      <button
                                        type="button"
                                        className="text-red-700 font-semibold hover:underline"
                                        onClick={() => handleDeleteEmployee(employee.id)}
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>

                    <div className="sm:hidden p-4 space-y-3">
                      {employeesForCompany.filter(e => (e.role ?? 'empleado') === (adminSection === 'superiores' ? 'superior' : 'empleado')).map((employee) => {
                        const hasPassword = Boolean(employee.passwordHash && employee.salt)
                        return (
                          <div key={employee.id} className="border border-slate-200 rounded-xl p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-slate-800">{employee.name}</div>
                                <div className="text-xs text-slate-600 font-mono">{employee.email ?? '-'}</div>
                              </div>
                              {hasPassword ? (
                                <span className="inline-flex items-center rounded-full bg-employee-500/15 text-employee-700 px-2 py-1 text-xs font-semibold">
                                  Creada
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-1 text-xs font-semibold">
                                  Pendiente
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button type="button" className="px-3 py-2 rounded-lg text-admin-700 bg-slate-50 border border-slate-200 font-semibold" onClick={() => handleEditEmployee(employee)}>
                                Editar
                              </button>
                              <button type="button" className="px-3 py-2 rounded-lg text-slate-800 bg-slate-50 border border-slate-200 font-semibold" onClick={() => handleSelectEmployeeForPassword(employee.id)}>
                                Contraseña
                              </button>
                              <button type="button" className="px-3 py-2 rounded-lg text-red-700 bg-red-50 border border-red-100 font-semibold" onClick={() => handleDeleteEmployee(employee.id)}>
                                Eliminar
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {adminSection === 'resumen' && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-800">Resumen de horas trabajadas</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {hoursSummary.map((item) => (
                    <article key={item.employeeId} className="border border-slate-200 rounded-lg p-4">
                      <p className="text-slate-700 font-medium">{item.employeeName}</p>
                      <p className="text-2xl font-bold text-admin-700">{formatHours(item.workedHours)}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {adminSection === 'empresa' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Empresa</h3>
                  <p className="text-sm text-slate-600">
                    Las empresas se asocian a tu correo (<span className="font-mono">{session.email}</span>) para separar empleados y fichajes.
                  </p>
                </div>

                <div className="grid lg:grid-cols-[360px_1fr] gap-4">
                  <form
                    onSubmit={handleSaveCompany}
                    className="space-y-3 p-4 border border-slate-200 rounded-xl bg-white"
                  >
                    <h4 className="font-semibold text-slate-800">
                      {companyForm.id ? 'Editar empresa' : 'Nueva empresa'}
                    </h4>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block" htmlFor="company-name">
                        Nombre
                      </label>
                      <input
                        id="company-name"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={companyForm.name}
                        onChange={(event) =>
                          setCompanyForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                        required
                      />
                    </div>

                    <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 cursor-pointer hover:bg-slate-100">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-admin-700"
                        checked={companyForm.geolocalizacion_activa}
                        onChange={(e) => setCompanyForm((prev) => ({ ...prev, geolocalizacion_activa: e.target.checked }))}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">Registrar ubicación al fichar</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Los empleados deberán aceptar el aviso de geolocalización. El fichaje nunca se bloquea si no hay ubicación.
                        </p>
                      </div>
                    </label>

                    {loginError && (
                      <div role="alert" className="p-3 mb-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg font-medium">
                        {loginError}
                      </div>
                    )}

                    <button className="w-full bg-admin-700 text-white rounded-lg py-2 font-semibold">
                      {companyForm.id ? 'Guardar cambios' : 'Crear empresa'}
                    </button>
                  </form>

                  <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                    <div className="p-4 border-b border-slate-200">
                      <h4 className="font-semibold text-slate-800">Tus empresas</h4>
                      <p className="text-sm text-slate-600">Total: {companiesForAdmin.length}</p>
                    </div>

                    {companiesForAdmin.length === 0 ? (
                      <div className="p-6">
                        <p className="font-semibold text-slate-800">No hay empresas</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Crea la primera para empezar a registrar empleados.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {companiesForAdmin.map((company) => (
                          <div key={company.id} className="p-4 flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-800">{company.name}</p>
                                {company.geolocalizacion_activa && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 text-xs font-semibold">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 .552-.448 1-1 1s-1-.448-1-1 .448-1 1-1 1 .448 1 1zm0 0v4m0-12a7 7 0 110 14A7 7 0 0112 3z"/></svg>
                                    Geo activa
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-mono">{company.id}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="text-admin-700 font-semibold hover:underline"
                                onClick={() => handleEditCompany(company)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="text-slate-700 font-semibold hover:underline"
                                onClick={() => setActiveCompanyId(company.id)}
                              >
                                Activar
                              </button>
                              <button
                                type="button"
                                className="text-red-700 font-semibold hover:underline"
                                onClick={() => handleDeleteCompany(company.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Modal: confirmar aprobación o rechazo */}
        {resolucionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                {resolucionModal.accion === 'aprobar' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
              </h2>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm space-y-1">
                <p className="font-semibold text-slate-800">{resolucionModal.solicitud.employeeName}</p>
                <p className="text-slate-600">
                  Fichaje del {new Date(resolucionModal.solicitud.entryTimestampActual).toLocaleDateString('es-ES')}
                </p>
                <p className="text-slate-600">Motivo: {resolucionModal.solicitud.motivo}</p>
              </div>

              {resolucionModal.accion === 'aprobar' && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm space-y-1">
                  <p className="font-semibold text-blue-800">El fichaje se actualizará a:</p>
                  <p className="font-mono text-blue-900">
                    Entrada: {resolucionModal.solicitud.entryTimestampPropuesta
                      ? new Date(resolucionModal.solicitud.entryTimestampPropuesta).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                      : 'Sin cambio'}
                  </p>
                  <p className="font-mono text-blue-900">
                    Salida: {resolucionModal.solicitud.exitTimestampPropuesta
                      ? new Date(resolucionModal.solicitud.exitTimestampPropuesta).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                      : 'Sin cambio'}
                  </p>
                </div>
              )}

              <form onSubmit={handleConfirmarResolucion} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Comentario {resolucionModal.accion === 'rechazar' ? '(recomendado)' : '(opcional)'}
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
                    rows={3}
                    value={resolucionComentario}
                    onChange={(e) => setResolucionComentario(e.target.value)}
                    placeholder={resolucionModal.accion === 'aprobar' ? 'Motivo de aprobación...' : 'Motivo del rechazo...'}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className={`flex-1 rounded-lg py-2 font-semibold text-white ${resolucionModal.accion === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {resolucionModal.accion === 'aprobar' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-slate-300 py-2 font-semibold text-slate-800 hover:bg-slate-50"
                    onClick={handleCerrarResolucion}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="app-bg min-h-screen p-4 md:p-8">
      <section className="max-w-5xl mx-auto bg-white/80 backdrop-blur rounded-3xl shadow-[var(--shadow-card)] p-4 md:p-8 space-y-6 border border-white/40">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-employee-700">Panel de empleado</h1>
            <p className="text-slate-600 mt-1">Hola, {session.nombre}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Hora actual</p>
            <p className="font-mono text-2xl font-semibold text-employee-700">
              {formatDateTime(now)}
            </p>
          </div>
        </header>

        <div className="space-y-2">
          <div className="grid sm:grid-cols-[1fr_auto] gap-3">
            <button
              className="min-h-16 rounded-2xl bg-gradient-to-b from-employee-500 to-employee-700 text-white text-lg font-bold hover:brightness-105 active:brightness-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-employee-500/40 disabled:opacity-70 disabled:cursor-wait"
              onClick={handleToggleClock}
              disabled={geoCapturando}
            >
              {geoCapturando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Obteniendo ubicación...
                </span>
              ) : (employeeOpenRecord ? 'Fichar salida' : 'Fichar entrada')}
            </button>
            <button className="min-h-16 rounded-2xl border border-slate-200 bg-white px-5 font-semibold text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-employee-500/30" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
          {geoActiva && geoConsentimientoAceptado && geoMensaje && (
            <p className={`text-center text-sm font-medium ${geoMensaje === 'ok' ? 'text-green-600' : 'text-amber-600'}`}>
              {geoMensaje === 'ok' ? '✓ Ubicación registrada' : '⚠ Ubicación no disponible — fichaje registrado igualmente'}
            </p>
          )}
          {geoActiva && !geoConsentimientoAceptado && empleadoActual?.geo_consentimiento_aceptado === false && (
            <p className="text-center text-xs text-slate-400">Fichando sin ubicación</p>
          )}
        </div>

        <div className="flex gap-1 border-b border-slate-200">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${employeeSection === 'historial' ? 'bg-white border border-b-white border-slate-200 text-employee-700 -mb-px' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setEmployeeSection('historial')}
          >
            Historial
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${employeeSection === 'informe' ? 'bg-white border border-b-white border-slate-200 text-employee-700 -mb-px' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setEmployeeSection('informe')}
          >
            Informe mensual
          </button>
        </div>

        {employeeSection === 'historial' && (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-800">Historial de fichajes</h2>
                <p className="text-sm text-slate-600">Tu historial solo incluye tus fichajes.</p>
              </div>
              {employeeTotalRecords > 0 && (
                <p className="text-sm text-slate-500">
                  Mostrando {employeeStartIndex + 1}-{employeeEndIndex} de {employeeTotalRecords}
                </p>
              )}
            </div>

            {employeeTotalRecords === 0 ? (
              <div className="border border-slate-200 rounded-xl p-6 bg-white">
                <p className="font-semibold text-slate-800">Aún no tienes fichajes</p>
                <p className="text-sm text-slate-600 mt-1">
                  Pulsa el botón de fichar para registrar tu primera entrada.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden sm:block border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="text-right p-3">Fecha</th>
                        <th className="text-right p-3">Entrada</th>
                        <th className="text-right p-3">Salida</th>
                        <th className="text-right p-3">Total horas</th>
                        <th className="text-right p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedEmployeeRecords.map((record) => {
                        const solActual = empleadoSolicitudesPorFichaje[record.id]
                        const tienePendiente = solActual?.estado === 'pendiente'
                        return (
                          <tr key={record.id} className="border-t border-slate-100">
                            <td className="p-3 text-right font-mono">{formatDate(record.entryTimestamp)}</td>
                            <td className="p-3 text-right font-mono">{formatTime(record.entryTimestamp)}</td>
                            <td className="p-3 text-right font-mono">
                              {record.exitTimestamp ? formatTime(record.exitTimestamp) : '-'}
                            </td>
                            <td className="p-3 text-right font-mono">
                              {record.exitTimestamp
                                ? formatHours(calculateWorkedHours(record.entryTimestamp, record.exitTimestamp))
                                : '-'}
                            </td>
                            <td className="p-3 text-right">
                              {tienePendiente ? (
                                <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 text-xs font-semibold">
                                  Solicitud enviada
                                </span>
                              ) : solActual?.estado === 'aprobada' ? (
                                <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 border border-green-200 px-2 py-1 text-xs font-semibold">
                                  Aprobada
                                </span>
                              ) : solActual?.estado === 'rechazada' ? (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="inline-flex items-center rounded-full bg-red-100 text-red-800 border border-red-200 px-2 py-1 text-xs font-semibold">
                                    Solicitud rechazada
                                  </span>
                                  <button
                                    type="button"
                                    className="rounded-lg border border-employee-500/40 bg-employee-50 px-3 py-1 text-xs font-semibold text-employee-700 hover:bg-employee-100"
                                    onClick={() => handleAbrirSolicitud(record)}
                                  >
                                    Nueva solicitud
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="rounded-lg border border-employee-500/40 bg-employee-50 px-3 py-1 text-xs font-semibold text-employee-700 hover:bg-employee-100"
                                  onClick={() => handleAbrirSolicitud(record)}
                                >
                                  Solicitar cambio
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="sm:hidden space-y-3">
                  {pagedEmployeeRecords.map((record) => {
                    const solActual = empleadoSolicitudesPorFichaje[record.id]
                    const tienePendiente = solActual?.estado === 'pendiente'
                    return (
                      <article key={record.id} className="border border-slate-200 rounded-xl p-4 bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-800">{formatDate(record.entryTimestamp)}</div>
                            <div className="text-xs text-slate-500 font-mono">
                              Entrada: {formatTime(record.entryTimestamp)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500">Total</div>
                            <div className="font-mono text-lg font-semibold text-employee-700">
                              {record.exitTimestamp
                                ? formatHours(calculateWorkedHours(record.entryTimestamp, record.exitTimestamp))
                                : '-'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 text-sm grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs text-slate-500">Salida</div>
                            <div className="font-mono text-slate-700">
                              {record.exitTimestamp ? formatTime(record.exitTimestamp) : '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Horas</div>
                            <div className="font-mono text-slate-700">
                              {record.exitTimestamp
                                ? formatHours(calculateWorkedHours(record.entryTimestamp, record.exitTimestamp))
                                : '-'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          {tienePendiente ? (
                            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 text-xs font-semibold">
                              Solicitud enviada
                            </span>
                          ) : solActual?.estado === 'aprobada' ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 border border-green-200 px-2.5 py-1 text-xs font-semibold">
                              Aprobada
                            </span>
                          ) : solActual?.estado === 'rechazada' ? (
                            <div className="space-y-2">
                              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
                                <p className="font-semibold text-red-800 text-xs">Solicitud rechazada</p>
                                {solActual.comentarioResolucion && (
                                  <p className="text-red-700 text-xs mt-0.5">{solActual.comentarioResolucion}</p>
                                )}
                              </div>
                              <button
                                type="button"
                                className="w-full rounded-lg border border-employee-500/40 bg-employee-50 px-3 py-2 text-sm font-semibold text-employee-700 hover:bg-employee-100"
                                onClick={() => handleAbrirSolicitud(record)}
                              >
                                Nueva solicitud
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="w-full rounded-lg border border-employee-500/40 bg-employee-50 px-3 py-2 text-sm font-semibold text-employee-700 hover:bg-employee-100"
                              onClick={() => handleAbrirSolicitud(record)}
                            >
                              Solicitar cambio
                            </button>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-800 disabled:opacity-50"
                    onClick={() => setEmployeePage((p) => Math.max(1, p - 1))}
                    disabled={clampedEmployeePage <= 1}
                  >
                    Anterior
                  </button>
                  <p className="text-sm text-slate-600">
                    Página {clampedEmployeePage} de {employeeTotalPages}
                  </p>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-800 disabled:opacity-50"
                    onClick={() => setEmployeePage((p) => Math.min(employeeTotalPages, p + 1))}
                    disabled={clampedEmployeePage >= employeeTotalPages}
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {employeeSection === 'informe' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-800">Informe mensual</h2>
                <p className="text-sm text-slate-600">Resumen de horas y días trabajados en el mes.</p>
              </div>
              <div className="flex items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Mes</label>
                  <input
                    type="month"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-employee-700 text-white px-4 py-2 font-semibold text-sm hover:brightness-105 disabled:opacity-50"
                  onClick={handleExportMonthlyReport}
                  disabled={monthlyReportData.totalDays === 0}
                >
                  Descargar CSV
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <article className="border border-slate-200 rounded-xl p-4 bg-white">
                <p className="text-sm text-slate-500">Días trabajados</p>
                <p className="text-3xl font-bold text-employee-700">{monthlyReportData.totalDays}</p>
              </article>
              <article className="border border-slate-200 rounded-xl p-4 bg-white">
                <p className="text-sm text-slate-500">Horas totales</p>
                <p className="text-3xl font-bold text-employee-700">{formatHours(monthlyReportData.totalHours)}</p>
              </article>
            </div>

            {monthlyReportData.days.length === 0 ? (
              <div className="border border-slate-200 rounded-xl p-6 bg-white">
                <p className="font-semibold text-slate-800">Sin registros este mes</p>
                <p className="text-sm text-slate-600 mt-1">No hay fichajes en el mes seleccionado.</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:block border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="text-left p-3">Fecha</th>
                        <th className="text-right p-3">Entrada</th>
                        <th className="text-right p-3">Salida</th>
                        <th className="text-right p-3">Horas del día</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyReportData.days.map((day) => (
                        day.records.map((record, idx) => (
                          <tr key={record.id} className="border-t border-slate-100">
                            <td className="p-3 font-mono">{idx === 0 ? day.dateKey : ''}</td>
                            <td className="p-3 text-right font-mono">{formatTime(record.entryTimestamp)}</td>
                            <td className="p-3 text-right font-mono">{record.exitTimestamp ? formatTime(record.exitTimestamp) : '-'}</td>
                            <td className="p-3 text-right font-mono">
                              {idx === day.records.length - 1 ? (
                                <span className="font-semibold text-employee-700">{formatHours(day.hours)}</span>
                              ) : ''}
                            </td>
                          </tr>
                        ))
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                      <tr>
                        <td className="p-3 font-semibold text-slate-800" colSpan={3}>Total del mes</td>
                        <td className="p-3 text-right font-bold font-mono text-employee-700">{formatHours(monthlyReportData.totalHours)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="sm:hidden space-y-3">
                  {monthlyReportData.days.map((day) => (
                    <article key={day.isoKey} className="border border-slate-200 rounded-xl p-4 bg-white">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="font-semibold text-slate-800">{day.dateKey}</span>
                        <span className="font-mono font-bold text-employee-700">{formatHours(day.hours)}</span>
                      </div>
                      {day.records.map((record) => (
                        <div key={record.id} className="grid grid-cols-2 gap-2 text-sm border-t border-slate-100 pt-2 mt-2">
                          <div>
                            <div className="text-xs text-slate-500">Entrada</div>
                            <div className="font-mono text-slate-700">{formatTime(record.entryTimestamp)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Salida</div>
                            <div className="font-mono text-slate-700">{record.exitTimestamp ? formatTime(record.exitTimestamp) : '-'}</div>
                          </div>
                        </div>
                      ))}
                    </article>
                  ))}
                  <div className="border border-employee-200 bg-employee-50 rounded-xl p-4 flex items-center justify-between">
                    <span className="font-semibold text-employee-800">Total del mes</span>
                    <span className="font-mono font-bold text-employee-700">{formatHours(monthlyReportData.totalHours)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Pantalla de consentimiento de geolocalización */}
      {debeVerConsentimiento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-100 shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Aviso de geolocalización</h2>
                <p className="text-sm text-slate-500">Tu empresa ha activado el registro de ubicación</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-800">¿Qué datos se recogen?</p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Latitud y longitud (coordenadas GPS)</li>
                <li>Precisión aproximada en metros</li>
                <li>Solo en el momento exacto de fichar entrada o salida</li>
              </ul>
              <p className="font-semibold text-slate-800 pt-1">¿Para qué se usan?</p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Exclusivamente para el control horario</li>
                <li>No se comparten con terceros</li>
                <li>Solo los gestores de tu empresa pueden consultarlos</li>
              </ul>
              <p className="font-semibold text-slate-800 pt-1">¿Qué pasa si no acepto?</p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Puedes fichar igualmente sin ubicación</li>
                <li>No hay penalización por rechazar</li>
              </ul>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                className="w-full rounded-xl bg-employee-700 text-white py-3 font-semibold hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-employee-500/40"
                onClick={handleAceptarConsentimiento}
              >
                Entendido y acepto
              </button>
              <button
                type="button"
                className="w-full rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                onClick={handleRechazarConsentimiento}
              >
                Continuar sin ubicación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: solicitar cambio de fichaje */}
      {solicitudModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {solicitudSuccess ? (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Solicitud enviada</h2>
                <p className="text-sm text-slate-600">
                  Tu solicitud ha sido registrada y está pendiente de revisión por el administrador.
                  Recibirás una respuesta cuando sea procesada.
                </p>
                <button
                  type="button"
                  className="w-full rounded-lg bg-employee-700 text-white py-2 font-semibold hover:brightness-105"
                  onClick={handleCerrarSolicitud}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Solicitar cambio de fichaje</h2>
                    <p className="text-sm text-slate-500">
                      Fichaje del {new Date(solicitudModal.record.entryTimestamp).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-700"
                    onClick={handleCerrarSolicitud}
                    aria-label="Cerrar"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hora registrada actualmente</p>
                  <p className="font-mono text-slate-800">
                    Entrada: {formatTime(solicitudModal.record.entryTimestamp)}
                  </p>
                  <p className="font-mono text-slate-800">
                    Salida: {solicitudModal.record.exitTimestamp ? formatTime(solicitudModal.record.exitTimestamp) : '— aún abierto —'}
                  </p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  No puedes modificar el fichaje directamente. Esta solicitud será revisada por el administrador.
                </div>

                <form onSubmit={handleEnviarSolicitud} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="sol-motivo">
                      Motivo de la solicitud <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      id="sol-motivo"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
                      rows={3}
                      required
                      value={solicitudForm.motivo}
                      onChange={(e) => setSolicitudForm((prev) => ({ ...prev, motivo: e.target.value }))}
                      placeholder="Explica por qué necesitas corregir este fichaje..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="sol-entrada">
                        Hora de entrada correcta
                        <span className="text-slate-400 text-xs font-normal ml-1">(opcional)</span>
                      </label>
                      <input
                        id="sol-entrada"
                        type="time"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        value={solicitudForm.entradaPropuesta}
                        onChange={(e) => setSolicitudForm((prev) => ({ ...prev, entradaPropuesta: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="sol-salida">
                        Hora de salida correcta
                        <span className="text-slate-400 text-xs font-normal ml-1">(opcional)</span>
                      </label>
                      <input
                        id="sol-salida"
                        type="time"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        value={solicitudForm.salidaPropuesta}
                        onChange={(e) => setSolicitudForm((prev) => ({ ...prev, salidaPropuesta: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="sol-comentarios">
                      Comentarios adicionales
                      <span className="text-slate-400 text-xs font-normal ml-1">(opcional)</span>
                    </label>
                    <textarea
                      id="sol-comentarios"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
                      rows={2}
                      value={solicitudForm.comentarios}
                      onChange={(e) => setSolicitudForm((prev) => ({ ...prev, comentarios: e.target.value }))}
                      placeholder="Cualquier información adicional relevante..."
                    />
                  </div>

                  {solicitudError && (
                    <div role="alert" className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg font-medium">
                      {solicitudError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-employee-700 text-white py-2 font-semibold hover:brightness-105"
                    >
                      Enviar solicitud
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-lg border border-slate-300 py-2 font-semibold text-slate-800 hover:bg-slate-50"
                      onClick={handleCerrarSolicitud}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default App
