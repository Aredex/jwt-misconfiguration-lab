import { describe, expect, it } from 'vitest'
import { validateClaims } from '../../src/domain/claims'
import type { JwtClaims, ValidationPolicy } from '../../src/domain/jwtTypes'

const basePolicy: ValidationPolicy = {
  expectedIssuer: 'https://issuer.demo.jwt-lab.dev',
  expectedAudience: 'https://api.demo.jwt-lab.dev',
  allowedAlgorithms: ['HS256'],
  clockSkewSeconds: 30,
  referenceTimeEpochSeconds: 1_000_000,
}

const validClaims: JwtClaims = {
  iss: 'https://issuer.demo.jwt-lab.dev',
  aud: 'https://api.demo.jwt-lab.dev',
  sub: 'user_1',
  iat: 999_000,
  nbf: 999_000,
  exp: 1_003_600,
}

function findingsFor(overrides: Partial<JwtClaims>, policy: ValidationPolicy = basePolicy) {
  return validateClaims({ ...validClaims, ...overrides }, policy)
}

describe('validateClaims (P11-R2: validar exp/nbf/iss/aud)', () => {
  it('no produce errores para claims completamente válidos', () => {
    const findings = findingsFor({})
    const blocking = findings.filter((f) => f.severity === 'error' || f.severity === 'critical')
    expect(blocking).toHaveLength(0)
  })

  it('marca como error un token sin "exp"', () => {
    const findings = findingsFor({ exp: undefined })
    expect(findings.some((f) => f.ruleId === 'claims.missing-exp')).toBe(true)
  })

  it('marca como error un token expirado (exp + skew <= now)', () => {
    const findings = findingsFor({ exp: 999_500 })
    expect(findings.some((f) => f.ruleId === 'claims.token-expired')).toBe(true)
  })

  it('trata la frontera exp === now (con skew 0) como expirado', () => {
    const policy: ValidationPolicy = { ...basePolicy, clockSkewSeconds: 0 }
    const findings = validateClaims(
      { ...validClaims, exp: basePolicy.referenceTimeEpochSeconds },
      policy,
    )
    expect(findings.some((f) => f.ruleId === 'claims.token-expired')).toBe(true)
  })

  it('marca como error un token que aún no es válido (nbf en el futuro)', () => {
    const findings = findingsFor({ nbf: 1_500_000 })
    expect(findings.some((f) => f.ruleId === 'claims.token-not-yet-valid')).toBe(true)
  })

  it('marca como error un emisor distinto al esperado', () => {
    const findings = findingsFor({ iss: 'https://otro-emisor.example' })
    expect(findings.some((f) => f.ruleId === 'claims.issuer-mismatch')).toBe(true)
  })

  it('marca como error una audiencia distinta a la esperada', () => {
    const findings = findingsFor({ aud: 'https://otro-servicio.example' })
    expect(findings.some((f) => f.ruleId === 'claims.audience-mismatch')).toBe(true)
  })

  it('acepta una audiencia esperada dentro de un array de audiencias', () => {
    const findings = findingsFor({
      aud: ['https://otro.example', basePolicy.expectedAudience as string],
    })
    expect(findings.some((f) => f.ruleId === 'claims.audience-mismatch')).toBe(false)
  })

  it('informa (sin bloquear) cuando no hay issuer/audience esperados configurados', () => {
    const policy: ValidationPolicy = {
      allowedAlgorithms: ['HS256'],
      clockSkewSeconds: 30,
      referenceTimeEpochSeconds: 1_000_000,
    }
    const findings = validateClaims(validClaims, policy)
    expect(findings.some((f) => f.ruleId === 'claims.issuer-not-configured')).toBe(true)
    expect(findings.some((f) => f.ruleId === 'claims.audience-not-configured')).toBe(true)
    const blocking = findings.filter((f) => f.severity === 'error' || f.severity === 'critical')
    expect(blocking).toHaveLength(0)
  })
})
