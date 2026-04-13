import { apiClient } from './api.service'

export async function getEmpresas(params = {}) {
  try {
    const response = await apiClient.get('/empresas', { params })
    return response.data
  } catch (error) {
    console.error('[Empresas] Error en getEmpresas:', error)
    throw error
  }
}

export async function getEmpresa(id) {
  try {
    const response = await apiClient.get(`/empresas/${id}`)
    return response.data
  } catch (error) {
    console.error('[Empresas] Error en getEmpresa:', error)
    throw error
  }
}

export async function createEmpresa(data) {
  try {
    const response = await apiClient.post('/empresas', data)
    return response.data
  } catch (error) {
    console.error('[Empresas] Error en createEmpresa:', error)
    throw error
  }
}

export async function updateEmpresa(id, data) {
  try {
    const response = await apiClient.put(`/empresas/${id}`, data)
    return response.data
  } catch (error) {
    console.error('[Empresas] Error en updateEmpresa:', error)
    throw error
  }
}

export async function deleteEmpresa(id) {
  try {
    const response = await apiClient.delete(`/empresas/${id}`)
    return response.data
  } catch (error) {
    console.error('[Empresas] Error en deleteEmpresa:', error)
    throw error
  }
}

