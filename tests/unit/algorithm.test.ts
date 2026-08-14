import { describe, expect, it } from 'vitest'
import { detectAlgorithmIssues } from '../../src/domain/algorithm'
import type { JwtHeader, ValidationPolicy } from '../../src/domain/jwtTypes'

const policy: ValidationPolicy = {
  allowedAlgorithms: ['HS256'],
  requireKid: true,
  clockSkewSeconds: 30,
  referenceTimeEpochSeconds: 0,
}

describe('detectAlgorithmIssues (P11-R3: detectar algoritmos y claves inválidos)', () => {
  it('marca "alg: none" como crítico y no evalúa nada más', () => {
    const header: JwtHeader = { alg: 'none' }
    const findings = detectAlgorithmIssues(header, policy)
    expect(findings).toHaveLength(1)
    expect(findings[0]?.ruleId).toBe('algorithm.none-attack')
    expect(findings[0]?.severity).toBe('critical')
  })

  it('marca como crítico un algoritmo fuera de la lista permitida (confusión de algoritmo)', () => {
    const header: JwtHeader = { alg: 'HS256', kid: 'k1' }
    const restrictive: ValidationPolicy = { ...policy, allowedAlgorithms: ['RS256'] }
    const findings = detectAlgorithmIssues(header, restrictive)
    expect(
      findings.some((f) => f.ruleId === 'algorithm.not-allowed' && f.severity === 'critical'),
    ).toBe(true)
  })

  it('acepta un algoritmo permitido y con kid presente', () => {
    const header: JwtHeader = { alg: 'HS256', kid: 'k1' }
    const findings = detectAlgorithmIssues(header, policy)
    expect(findings.some((f) => f.ruleId === 'algorithm.ok')).toBe(true)
    expect(findings.some((f) => f.severity === 'critical' || f.severity === 'error')).toBe(false)
  })

  it('advierte si falta "kid" y la política lo exige', () => {
    const header: JwtHeader = { alg: 'HS256' }
    const findings = detectAlgorithmIssues(header, policy)
    expect(
      findings.some((f) => f.ruleId === 'algorithm.missing-kid' && f.severity === 'warning'),
    ).toBe(true)
  })
})
