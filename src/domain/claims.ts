import type { Finding } from '../contracts/types'
import { makeFinding, RULE_IDS } from './findings'
import type { JwtClaims, ValidationPolicy } from './jwtTypes'

/**
 * Implementa `validateClaims(policy)` (07-contratos-interfaces.md): valida
 * exp/nbf/iat/iss/aud contra una política determinista. Usa
 * `policy.referenceTimeEpochSeconds` en lugar de `Date.now()` para que cada
 * fixture produzca siempre el mismo resultado (ADR-003, evidencia primero).
 */
export function validateClaims(claims: JwtClaims, policy: ValidationPolicy): Finding[] {
  const findings: Finding[] = []
  const now = policy.referenceTimeEpochSeconds
  const skew = policy.clockSkewSeconds

  findings.push(...validateExpiration(claims, now, skew))
  findings.push(...validateNotBefore(claims, now, skew))
  findings.push(...validateIssuedAt(claims, now, skew))
  findings.push(...validateIssuer(claims, policy))
  findings.push(...validateAudience(claims, policy))

  return findings
}

function validateExpiration(claims: JwtClaims, now: number, skew: number): Finding[] {
  if (claims.exp === undefined) {
    return [
      makeFinding(
        RULE_IDS.MISSING_EXP,
        'error',
        'El claim "exp" no está presente: el token nunca expira según su propio contenido.',
        {
          evidencePath: '$.claims.exp',
          suggestion:
            'Rechaza tokens sin "exp" salvo que el emisor documente explícitamente por qué son de vida infinita.',
        },
      ),
    ]
  }
  if (typeof claims.exp !== 'number' || !Number.isFinite(claims.exp)) {
    return [
      makeFinding(
        RULE_IDS.EXP_INVALID_TYPE,
        'error',
        'El claim "exp" no es un timestamp numérico válido.',
        {
          evidencePath: '$.claims.exp',
        },
      ),
    ]
  }
  // RFC 7519 §4.1.4: el receptor NO DEBE aceptar el token en o después del
  // instante indicado por "exp" (frontera inclusiva).
  if (claims.exp + skew <= now) {
    return [
      makeFinding(
        RULE_IDS.TOKEN_EXPIRED,
        'error',
        `El token expiró: "exp" (${formatEpoch(claims.exp)}) ya pasó respecto al tiempo de referencia (${formatEpoch(now)}).`,
        {
          evidencePath: '$.claims.exp',
          suggestion:
            'Rechaza el token y solicita uno nuevo; no extiendas la validez en el cliente.',
        },
      ),
    ]
  }
  return []
}

function validateNotBefore(claims: JwtClaims, now: number, skew: number): Finding[] {
  if (claims.nbf === undefined) return []
  if (typeof claims.nbf !== 'number' || !Number.isFinite(claims.nbf)) {
    return [
      makeFinding(
        RULE_IDS.EXP_INVALID_TYPE,
        'error',
        'El claim "nbf" no es un timestamp numérico válido.',
        {
          evidencePath: '$.claims.nbf',
        },
      ),
    ]
  }
  if (claims.nbf - skew > now) {
    return [
      makeFinding(
        RULE_IDS.TOKEN_NOT_YET_VALID,
        'error',
        `El token todavía no es válido: "nbf" (${formatEpoch(claims.nbf)}) es posterior al tiempo de referencia (${formatEpoch(now)}).`,
        {
          evidencePath: '$.claims.nbf',
          suggestion: 'No proceses el token hasta alcanzar su tiempo "nbf".',
        },
      ),
    ]
  }
  return []
}

function validateIssuedAt(claims: JwtClaims, now: number, skew: number): Finding[] {
  if (claims.iat === undefined) return []
  if (typeof claims.iat !== 'number' || !Number.isFinite(claims.iat)) return []
  if (claims.iat - skew > now) {
    return [
      makeFinding(
        RULE_IDS.ISSUED_IN_FUTURE,
        'warning',
        `"iat" (${formatEpoch(claims.iat)}) es posterior al tiempo de referencia (${formatEpoch(now)}); puede indicar reloj desincronizado.`,
        { evidencePath: '$.claims.iat' },
      ),
    ]
  }
  return []
}

function validateIssuer(claims: JwtClaims, policy: ValidationPolicy): Finding[] {
  if (!policy.expectedIssuer) {
    return [
      makeFinding(
        RULE_IDS.ISSUER_MISSING_EXPECTATION,
        'info',
        'No hay un emisor ("iss") esperado configurado para este escenario; la comprobación se omite.',
        { evidencePath: '$.claims.iss' },
      ),
    ]
  }
  if (claims.iss !== policy.expectedIssuer) {
    return [
      makeFinding(
        RULE_IDS.ISSUER_MISMATCH,
        'error',
        `El emisor "${describe(claims.iss)}" no coincide con el emisor esperado "${policy.expectedIssuer}".`,
        {
          evidencePath: '$.claims.iss',
          suggestion: 'Rechaza tokens cuyo "iss" no pertenezca a la lista de emisores confiables.',
        },
      ),
    ]
  }
  return []
}

function validateAudience(claims: JwtClaims, policy: ValidationPolicy): Finding[] {
  if (!policy.expectedAudience) {
    return [
      makeFinding(
        RULE_IDS.AUDIENCE_MISSING_EXPECTATION,
        'info',
        'No hay una audiencia ("aud") esperada configurada para este escenario; la comprobación se omite.',
        { evidencePath: '$.claims.aud' },
      ),
    ]
  }
  const audiences = Array.isArray(claims.aud)
    ? claims.aud
    : claims.aud !== undefined
      ? [claims.aud]
      : []
  if (!audiences.includes(policy.expectedAudience)) {
    return [
      makeFinding(
        RULE_IDS.AUDIENCE_MISMATCH,
        'error',
        `La audiencia declarada (${describe(claims.aud)}) no incluye la audiencia esperada "${policy.expectedAudience}".`,
        {
          evidencePath: '$.claims.aud',
          suggestion:
            'Rechaza tokens cuyo "aud" no incluya el identificador exacto de tu servicio.',
        },
      ),
    ]
  }
  return []
}

function describe(value: string | readonly string[] | undefined): string {
  if (value === undefined) return '(ausente)'
  return typeof value === 'string' ? value : value.join(', ')
}

function formatEpoch(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toISOString()
}
