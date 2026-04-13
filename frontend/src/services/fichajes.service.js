import { apiClient } from './api.service'

export async function ficharEntrada(coords = null) {
  return fichar('entrada', coords)
}

export async function ficharSalida(coords = null) {
  return fichar('salida', coords)
}

export async function ficharPausaInicio(coords = null) {
  return fichar('pausa_inicio', coords)
}

export async function ficharPausaFin(coords = null) {
  return fichar('pausa_fin', coords)
}

async function fichar(tipo, coords) {
  try {
    const payload = {
      tipo,
      latitud: coords?.latitud ?? coords?.latitude ?? null,
      longitud: coords?.longitud ?? coords?.longitude ?? null,
    }
    const response = await apiClient.post('/fichajes', payload)
    return response.data
  } catch (error) {
    console.error('[Fichajes] Error en fichar:', error)
    throw error
  }
}

export async function getFichajesHoy() {
  try {
    const response = await apiClient.get('/fichajes/hoy')
    return response.data
  } catch (error) {
    console.error('[Fichajes] Error en getFichajesHoy:', error)
    throw error
  }
}

export async function getFichajesPorEmpleado(id, desde, hasta) {
  try {
    const response = await apiClient.get(`/fichajes/empleado/${id}`, {
      params: {
        fecha_desde: desde,
        fecha_hasta: hasta,
      },
    })
    return response.data
  } catch (error) {
    console.error('[Fichajes] Error en getFichajesPorEmpleado:', error)
    throw error
  }
}

export async function getFichajesMapa(fecha) {
  try {
    const response = await apiClient.get('/fichajes/mapa', {
      params: fecha ? { fecha } : {},
    })
    return response.data
  } catch (error) {
    console.error('[Fichajes] Error en getFichajesMapa:', error)
    throw error
  }
}

export async function getResumen(desde, hasta, empresaId) {
  try {
    const response = await apiClient.get('/fichajes/resumen', {
      params: {
        fecha_desde: desde,
        fecha_hasta: hasta,
        ...(empresaId ? { empresa_id: empresaId } : {}),
      },
    })
    return response.data
  } catch (error) {
    console.error('[Fichajes] Error en getResumen:', error)
    throw error
  }
}

