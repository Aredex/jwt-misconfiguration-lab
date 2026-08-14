// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { inspectToken } from '../../src/domain/jwtDecode'
import { verifyFixtureSignature } from '../../src/domain/signature'
import { SCENARIOS } from '../../src/fixtures/catalog'

function scenario(id: string) {
  const found = SCENARIOS.find((s) => s.id === id)
  if (!found) throw new Error(`fixture ${id} no encontrado`)
  return found
}

describe('verifyFixtureSignature (Web Crypto, HMAC)', () => {
  it('verifica correctamente la firma de un fixture HS256 válido', async () => {
    const fixture = scenario('happy-path')
    const decoded = inspectToken(fixture.token)
    const finding = await verifyFixtureSignature(decoded, fixture.fixtureSecret)
    expect(finding.ruleId).toBe('signature.valid')
    expect(finding.severity).toBe('info')
  })

  it('detecta una firma inválida cuando el secreto no coincide', async () => {
    const fixture = scenario('happy-path')
    const decoded = inspectToken(fixture.token)
    const finding = await verifyFixtureSignature(decoded, 'un-secreto-incorrecto')
    expect(finding.ruleId).toBe('signature.invalid')
    expect(finding.severity).toBe('critical')
  })

  it('detecta una firma inválida cuando el token fue editado (cambia un parámetro)', async () => {
    const fixture = scenario('wrong-audience')
    const decoded = inspectToken(fixture.token)
    const finding = await verifyFixtureSignature(decoded, scenario('happy-path').fixtureSecret)
    expect(finding.ruleId).toBe('signature.invalid')
  })

  it('omite la verificación (sin certificar nada) cuando alg es "none"', async () => {
    const fixture = scenario('alg-none-attack')
    const decoded = inspectToken(fixture.token)
    const finding = await verifyFixtureSignature(decoded, null)
    expect(finding.ruleId).toBe('signature.skipped-alg-rejected')
  })

  it('explica honestamente cuando no hay secreto de fixture disponible', async () => {
    const fixture = scenario('happy-path')
    const decoded = inspectToken(fixture.token)
    const finding = await verifyFixtureSignature(decoded, null)
    expect(finding.ruleId).toBe('signature.not-verified')
    expect(finding.severity).toBe('warning')
  })
})
