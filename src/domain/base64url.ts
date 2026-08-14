/** Codificación/decodificación base64url (RFC 4648 §5), usada por los tres
 * segmentos de un JWT (RFC 7519). No depende de Node `Buffer`: usa `atob`/
 * `btoa`, disponibles tanto en `window` como en el Web Worker. */

function base64UrlToBase64(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const paddingNeeded = (4 - (base64.length % 4)) % 4
  if (paddingNeeded === 3) {
    throw new Error('Longitud base64url inválida.')
  }
  return base64 + '='.repeat(paddingNeeded)
}

export function base64UrlDecodeToBytes(input: string): Uint8Array {
  const base64 = base64UrlToBase64(input)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function base64UrlDecodeToString(input: string): string {
  return new TextDecoder().decode(base64UrlDecodeToBytes(input))
}

export function base64UrlEncodeFromBytes(bytes: Uint8Array | ArrayBuffer): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (const byte of view) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function base64UrlEncodeFromString(input: string): string {
  return base64UrlEncodeFromBytes(new TextEncoder().encode(input))
}
