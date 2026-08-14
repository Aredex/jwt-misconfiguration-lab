// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
// Los contratos declaran "$schema": draft/2020-12; el import por defecto de
// `ajv` solo trae el meta-schema draft-07, así que usamos la build 2020.
import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, it } from 'vitest'
import { runEngine } from '../../src/domain/engine'
import type { EngineInput } from '../../src/contracts/types'
import { validateEngineInput } from '../../src/contracts/validateInput'
import { validateEngineOutput } from '../../src/contracts/validateOutput'
import { SCENARIOS } from '../../src/fixtures/catalog'

/**
 * Prueba de contrato: verifica que `validateInput.ts`/`validateOutput.ts`
 * (los validadores manuales que corren en producción, sin `ajv` en tiempo
 * de ejecución -ver la nota en validateInput.ts-) no diverjan de
 * `contracts/*.schema.json`. `ajv` solo se usa aquí, en pruebas.
 */

function loadSchema(relativePath: string): object {
  const path = fileURLToPath(new URL(`../../${relativePath}`, import.meta.url))
  return JSON.parse(readFileSync(path, 'utf-8')) as object
}

const ajv = new Ajv2020({ strict: true })
const validateInputSchema = ajv.compile(loadSchema('contracts/input.schema.json'))
const validateOutputSchema = ajv.compile(loadSchema('contracts/output.schema.json'))

function inputForScenario(id: string, token: string): EngineInput {
  return {
    schemaVersion: '1.0.0',
    scenarioId: id,
    payload: { token },
    options: { deterministic: true },
  }
}

describe('contrato: input.schema.json y output.schema.json', () => {
  it('cada fixture produce una entrada válida según ajv y el validador manual', () => {
    for (const scenario of SCENARIOS) {
      const input = inputForScenario(scenario.id, scenario.token)
      expect(validateInputSchema(input), JSON.stringify(validateInputSchema.errors)).toBe(true)
      expect(() => validateEngineInput(input)).not.toThrow()
    }
  })

  it('cada fixture produce una salida válida según ajv y el validador manual', async () => {
    for (const scenario of SCENARIOS) {
      const input = inputForScenario(scenario.id, scenario.token)
      const output = await runEngine(input)
      expect(validateOutputSchema(output), JSON.stringify(validateOutputSchema.errors)).toBe(true)
      expect(() => validateEngineOutput(output)).not.toThrow()
    }
  })

  it('ambos validadores de entrada coinciden al rechazar una entrada inválida', () => {
    const invalid = { schemaVersion: '9.9.9', scenarioId: 'x', payload: {}, options: {} }
    expect(validateInputSchema(invalid)).toBe(false)
    expect(() => validateEngineInput(invalid)).toThrow()
  })

  it('ambos validadores de salida coinciden al rechazar una salida inválida', () => {
    const invalid = {
      schemaVersion: '1.0.0',
      runId: 'r1',
      status: 'not-a-real-status',
      summary: 's',
      findings: [],
      evidence: { rulesVersion: '1.0.0', scenarioId: 'x' },
    }
    expect(validateOutputSchema(invalid)).toBe(false)
    expect(() => validateEngineOutput(invalid)).toThrow()
  })
})
