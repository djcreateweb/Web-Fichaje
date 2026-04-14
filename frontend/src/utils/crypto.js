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
 * Hashea una contraseña con PBKDF2 (600 000 iteraciones, SHA-256) y salt.
 * @param {string} password
 * @param {string} salt  — hex string de 32 chars (16 bytes)
 * @returns {Promise<string>}
 */
export async function hashPassword(password, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const saltBuffer = new Uint8Array(salt.match(/.{2}/g).map((b) => parseInt(b, 16)))
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 600_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )
  return Array.from(new Uint8Array(derivedBits))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
