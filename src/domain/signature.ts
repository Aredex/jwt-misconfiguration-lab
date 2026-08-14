import type { Finding } from '../contracts/types'
import { base64UrlEncodeFromBytes } from './base64url'
import { makeFinding, RULE_IDS } from './findings'
import type { DecodedToken } from './jwtTypes'

const HMAC_HASH_BY_ALG: Record<string, string> = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
}

/**
 * Implementa `verifyFixtureSignature()` (07-contratos-interfaces.md) con Web
 * Crypto (`SubtleCrypto`). Solo verifica firmas HMAC de **fixtures propios**:
 * el secreto nunca es un secreto real, nunca se expone en el `Finding`
 * devuelto (08-seguridad-privacidad.md: "no registrar... secretos") y esta
 * función jamás recibe un secreto aportado por el visitante.
 *
 * Si `fixtureSecret` es `null` (token pegado por el visitante, o fixture con
 * algoritmo asimétrico sin infraestructura de claves en esta demo estática),
 * la firma no se verifica y el hallazgo lo explica honestamente en vez de
 * simular una comprobación que no ocurrió.
 */
export async function verifyFixtureSignature(
  decoded: DecodedToken,
  fixtureSecret: string | null,
): Promise<Finding> {
  const alg = decoded.header.alg

  if (typeof alg === 'string' && alg.toLowerCase() === 'none') {
    return makeFinding(
      RULE_IDS.SIGNATURE_SKIPPED_ALG_REJECTED,
      'info',
      'La verificación de firma se omite: el algoritmo "none" ya fue rechazado y comprobar una firma vacía no aportaría información adicional.',
    )
  }

  const hashName = HMAC_HASH_BY_ALG[alg]

  if (fixtureSecret === null || hashName === undefined) {
    return makeFinding(
      RULE_IDS.SIGNATURE_NOT_VERIFIED,
      'warning',
      hashName === undefined
        ? `Este laboratorio verifica firmas simétricas (HS256/HS384/HS512) con Web Crypto. El algoritmo "${alg}" es asimétrico y no se verifica criptográficamente en esta demo estática sin infraestructura de claves; el resto de comprobaciones (claims y algoritmo) sí se ejecutaron.`
        : 'No hay un secreto de fixture configurado para este token: la firma no se verifica. Esta herramienta nunca procesa secretos reales.',
    )
  }

  const expected = await hmacSha256Like(hashName, fixtureSecret, decoded.signingInput)
  const provided = decoded.signatureB64Url

  if (expected === provided) {
    return makeFinding(
      RULE_IDS.SIGNATURE_VALID,
      'info',
      'La firma HMAC coincide con el secreto del fixture: la comprobación criptográfica de integridad pasó.',
    )
  }

  return makeFinding(
    RULE_IDS.SIGNATURE_INVALID,
    'critical',
    'La firma HMAC no coincide: el token fue alterado o firmado con un secreto distinto al esperado.',
    {
      suggestion:
        'Rechaza el token. Nunca aceptes un token cuya firma no verifica, sin importar qué tan válidos parezcan sus claims.',
    },
  )
}

async function hmacSha256Like(
  hashName: string,
  secret: string,
  signingInput: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: hashName },
    false,
    ['sign'],
  )
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signingInput),
  )
  return base64UrlEncodeFromBytes(signatureBytes)
}
