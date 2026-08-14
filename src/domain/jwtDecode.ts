import { EngineError } from '../contracts/errors'
import { base64UrlDecodeToString } from './base64url'
import type { DecodedToken, JwtHeader } from './jwtTypes'

/** Límite defensivo de tamaño del token completo, muy por encima de un JWT
 * típico (unos pocos KB), para evitar procesar cadenas desproporcionadas. */
export const MAX_TOKEN_LENGTH = 8_000

/**
 * Implementa `inspectToken(token)` (07-contratos-interfaces.md): decodifica
 * la estructura de un JWT (RFC 7519 §3) sin verificar la firma. Nunca
 * ejecuta el contenido decodificado ni lo inserta como HTML.
 */
export function inspectToken(token: string): DecodedToken {
  if (typeof token !== 'string' || token.length === 0) {
    throw new EngineError('INPUT_INVALID', 'El token está vacío.', ['$.token'])
  }
  if (token.length > MAX_TOKEN_LENGTH) {
    throw new EngineError('LIMIT_EXCEEDED', 'El token excede el tamaño máximo permitido.', [
      '$.token',
    ])
  }

  const segments = token.split('.')
  if (segments.length !== 3) {
    throw new EngineError(
      'INPUT_INVALID',
      'El token no tiene la estructura de tres segmentos (header.payload.signature) que exige RFC 7519.',
      ['$.token'],
    )
  }

  const [headerB64Url, payloadB64Url, signatureB64Url] = segments as [string, string, string]

  if (headerB64Url.length === 0 || payloadB64Url.length === 0) {
    throw new EngineError('INPUT_INVALID', 'El header o el payload del token están vacíos.', [
      '$.token',
    ])
  }

  const header = decodeSegment(headerB64Url, '$.token.header')
  const claims = decodeSegment(payloadB64Url, '$.token.payload')

  if (typeof header['alg'] !== 'string') {
    throw new EngineError('INPUT_INVALID', 'El header no declara un algoritmo ("alg") válido.', [
      '$.token.header.alg',
    ])
  }

  return {
    header: header as JwtHeader,
    claims,
    signatureB64Url,
    signingInput: `${headerB64Url}.${payloadB64Url}`,
    raw: { headerB64Url, payloadB64Url },
  }
}

function decodeSegment(segment: string, path: string): Record<string, unknown> {
  let json: string
  try {
    json = base64UrlDecodeToString(segment)
  } catch {
    throw new EngineError(
      'INPUT_INVALID',
      'Uno de los segmentos del token no es base64url válido.',
      [path],
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new EngineError(
      'INPUT_INVALID',
      'Uno de los segmentos del token no decodifica a JSON válido.',
      [path],
    )
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new EngineError('INPUT_INVALID', 'El segmento decodificado debe ser un objeto JSON.', [
      path,
    ])
  }

  return parsed as Record<string, unknown>
}
