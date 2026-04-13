/**
 * Genera un salt hexadecimal único por usuario.
 * @returns {string}
 */
export function generateSalt() {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Hashea una contraseña con SHA-256 y salt.
 * @param {string} password
 * @param {string} salt
 * @returns {Promise<string>}
 */
export async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(password + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
