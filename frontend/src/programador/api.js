const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:9000/api"

function getHeaders(token, contentType = "application/json") {
  const headers = {
    "Content-Type": contentType,
    Accept: "application/json",
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}/programador${path}`, options)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMessage = data?.mensaje ?? "Error inesperado del servidor."
    throw new Error(errorMessage)
  }

  return data
}

export async function loginProgramador(email, password) {
  const body = new URLSearchParams({ email, password }).toString()
  return request("/login", {
    method: "POST",
    headers: getHeaders(null, "application/x-www-form-urlencoded"),
    body,
  })
}

export async function logoutProgramador(token) {
  return request("/logout", {
    method: "POST",
    headers: getHeaders(token),
  })
}

export async function getProgramadorStats(token) {
  return request("/stats", {
    method: "GET",
    headers: getHeaders(token),
  })
}

export async function getProgramadorTenants(token) {
  return request("/tenants", {
    method: "GET",
    headers: getHeaders(token),
  })
}

export async function createProgramadorTenant(token, payload) {
  const body = new URLSearchParams(payload).toString()
  return request("/tenants", {
    method: "POST",
    headers: getHeaders(token, "application/x-www-form-urlencoded"),
    body,
  })
}

export async function updateProgramadorTenant(token, tenantId, payload) {
  const body = new URLSearchParams(payload).toString()
  return request(`/tenants/${tenantId}`, {
    method: "PUT",
    headers: getHeaders(token, "application/x-www-form-urlencoded"),
    body,
  })
}

export async function deleteProgramadorTenant(token, tenantId) {
  return request(`/tenants/${tenantId}`, {
    method: "DELETE",
    headers: getHeaders(token),
  })
}

export async function impersonateProgramadorTenant(token, tenantId) {
  return request(`/tenants/${tenantId}/impersonate`, {
    method: "POST",
    headers: getHeaders(token),
  })
}
