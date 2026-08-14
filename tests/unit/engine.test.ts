// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { runEngine } from '../../src/domain/engine'
import type { EngineInput } from '../../src/contracts/types'
import { validateEngineOutput } from '../../src/contracts/validateOutput'
import { SCENARIOS, findScenario } from '../../src/fixtures/catalog'

function scenario(id: string) {
  const found = findScenario(id)
  if (!found) throw new Error(`fixture ${id} no encontrado`)
  return found
}

/** Construye el `EngineInput` tal como lo arma la interfaz real: el texto
 * del token viaja en `payload.token`, precargado con el del fixture elegido
 * (la UI permite editarlo antes de ejecutar). */
function inputForScenario(id: string, tokenOverride?: string): EngineInput {
  return {
    schemaVersion: '1.0.0',
    scenarioId: id,
    payload: { token: tokenOverride ?? scenario(id).token },
    options: { deterministic: true },
  }
}

describe('runEngine (orquestación end-to-end de contracts/*.schema.json)', () => {
  it('happy-path: completa sin errores ni críticos, y nunca certifica seguridad', async () => {
    const output = await runEngine(inputForScenario('happy-path'))
    expect(() => validateEngineOutput(output)).not.toThrow()
    expect(output.status).toBe('completed')
    expect(output.findings.some((f) => f.severity === 'error' || f.severity === 'critical')).toBe(
      false,
    )
    expect(output.summary).toMatch(/no certifica seguridad/i)
  })

  it('expired-token: produce un hallazgo de expiración', async () => {
    const output = await runEngine(inputForScenario('expired-token'))
    expect(output.findings.some((f) => f.ruleId === 'claims.token-expired')).toBe(true)
  })

  it('wrong-audience: produce un hallazgo de audiencia', async () => {
    const output = await runEngine(inputForScenario('wrong-audience'))
    expect(output.findings.some((f) => f.ruleId === 'claims.audience-mismatch')).toBe(true)
  })

  it('alg-none-attack: produce un hallazgo crítico de algoritmo', async () => {
    const output = await runEngine(inputForScenario('alg-none-attack'))
    expect(
      output.findings.some(
        (f) => f.ruleId === 'algorithm.none-attack' && f.severity === 'critical',
      ),
    ).toBe(true)
  })

  it('algorithm-confusion: firma válida pero algoritmo no permitido (crítico)', async () => {
    const output = await runEngine(inputForScenario('algorithm-confusion'))
    expect(output.findings.some((f) => f.ruleId === 'algorithm.not-allowed')).toBe(true)
    expect(output.findings.some((f) => f.ruleId === 'signature.valid')).toBe(true)
  })

  it('boundary-exp: la frontera exp === referenceTime se trata como expirada', async () => {
    const output = await runEngine(inputForScenario('boundary-exp'))
    expect(output.findings.some((f) => f.ruleId === 'claims.token-expired')).toBe(true)
  })

  it('invalid-structure: produce status "failed" sin lanzar excepciones', async () => {
    const output = await runEngine(inputForScenario('invalid-structure'))
    expect(output.status).toBe('failed')
    expect(output.findings).toHaveLength(1)
    expect(output.findings[0]?.ruleId).toBe('error.input-invalid')
  })

  it('external-adapter-disabled: cae a modo determinista con status "partial"', async () => {
    const output = await runEngine(inputForScenario('external-adapter-disabled'))
    expect(output.status).toBe('partial')
    expect(output.findings.some((f) => f.ruleId === 'adapter.disabled')).toBe(true)
    // El fallback determinista igualmente ejecutó las comprobaciones normales.
    expect(output.findings.some((f) => f.ruleId === 'structure.ok')).toBe(true)
  })

  it('un scenarioId desconocido produce un error de entrada tipado, no una excepción', async () => {
    const output = await runEngine({
      schemaVersion: '1.0.0',
      scenarioId: 'no-existe',
      payload: { token: 'cualquier-cosa' },
      options: { deterministic: true },
    })
    expect(output.status).toBe('failed')
  })

  it('respeta la cancelación vía AbortSignal', async () => {
    const controller = new AbortController()
    controller.abort()
    const output = await runEngine(inputForScenario('happy-path'), controller.signal)
    expect(output.status).toBe('cancelled')
  })

  it('editar el token de un fixture invalida su firma original (demuestra "cambia un parámetro")', async () => {
    // Reemplaza el token del escenario happy-path por el de wrong-audience:
    // la política/secreto siguen siendo los de happy-path, así que la firma
    // (calculada con el secreto de wrong-audience) deja de coincidir.
    const output = await runEngine(inputForScenario('happy-path', scenario('wrong-audience').token))
    expect(output.findings.some((f) => f.ruleId === 'signature.invalid')).toBe(true)
  })

  it('todos los escenarios del catálogo producen una salida válida contra el contrato', async () => {
    for (const s of SCENARIOS) {
      const output = await runEngine(inputForScenario(s.id))
      expect(() => validateEngineOutput(output)).not.toThrow()
    }
  })
})
