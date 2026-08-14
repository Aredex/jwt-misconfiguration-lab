/** Tipos de dominio para el header y los claims de un JWT (RFC 7519). */

export interface JwtHeader {
  readonly alg: string
  readonly typ?: string
  readonly kid?: string
  readonly [extra: string]: unknown
}

export interface JwtClaims {
  readonly iss?: string
  readonly sub?: string
  readonly aud?: string | readonly string[]
  readonly exp?: number
  readonly nbf?: number
  readonly iat?: number
  readonly jti?: string
  readonly [extra: string]: unknown
}

export interface DecodedToken {
  readonly header: JwtHeader
  readonly claims: JwtClaims
  /** Segmento de firma en base64url, tal como aparece en el token. Nunca se
   * expone como bytes “útiles”: solo se usa para comparar en verifySignature. */
  readonly signatureB64Url: string
  /** `header.payload` — la entrada exacta que protege la firma. */
  readonly signingInput: string
  readonly raw: {
    readonly headerB64Url: string
    readonly payloadB64Url: string
  }
}

/** Política de validación esperada para un escenario/fixture concreto. */
export interface ValidationPolicy {
  readonly expectedIssuer?: string
  readonly expectedAudience?: string
  readonly allowedAlgorithms: readonly string[]
  readonly requireKid?: boolean
  /** Tolerancia de reloj en segundos para exp/nbf/iat (skew). */
  readonly clockSkewSeconds: number
  /** Tiempo de referencia determinista (epoch, segundos) usado en lugar de
   * `Date.now()` para que cada fixture produzca siempre el mismo resultado. */
  readonly referenceTimeEpochSeconds: number
}
