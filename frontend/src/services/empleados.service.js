import { apiClient } from './api.service'

export async function getEmpleados(empresaId) {
  try {
    const response = await apiClient.get('/empleados', {
      params: empresaId ? { empresa_id: empresaId } : {},
    })
    return response.data
  } catch (error) {
    console.error('[Empleados] Error en getEmpleados:', error)
    throw error
  }
}

export async function createEmpleado(data) {
  try {
    const response = await apiClient.post('/empleados', data)
    return response.data
  } catch (error) {
    console.error('[Empleados] Error en createEmpleado:', error)
    throw error
  }
}

export async function updateEmpleado(id, data) {
  try {
    const response = await apiClient.put(`/empleados/${id}`, data)
    return response.data
  } catch (error) {
    console.error('[Empleados] Error en updateEmpleado:', error)
    throw error
  }
}

export async function deleteEmpleado(id) {
  try {
    const response = await apiClient.delete(`/empleados/${id}`)
    return response.data
  } catch (error) {
    console.error('[Empleados] Error en deleteEmpleado:', error)
    throw error
  }
}

export async function setPassword(id, contrasena) {
  try {
    const response = await apiClient.post(`/empleados/${id}/contrasena`, { contrasena })
    return response.data
  } catch (error) {
    console.error('[Empleados] Error en setPassword:', error)
    throw error
  }
}

export async function clearPassword(id) {
  try {
    const response = await apiClient.delete(`/empleados/${id}/contrasena`)
    return response.data
  } catch (error) {
    console.error('[Empleados] Error en clearPassword:', error)
    throw error
  }
}

