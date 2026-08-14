import { describe, expect, it } from 'vitest'
import { isEngineError } from '../../src/contracts/errors'
import { validateEngineInput } from '../../src/contracts/validateInput'

const validInput = {
  schemaVersion: '1.0.0',
  scenarioId: 'happy-path',
  payload: { token: 'x' },
  options: { deterministic: true },
}

describe('validateEngineInput (contracts/input.schema.json)', () => {
  it('acepta una entrada válida', () => {
    expect(() => validateEngineInput(validInput)).not.toThrow()
  })

  it('rechaza schemaVersion incorrecta', () => {
    expect(() => validateEngineInput({ ...validInput, schemaVersion: '2.0.0' })).toThrow()
  })

  it('rechaza scenarioId con mayúsculas (no cumple el patrón)', () => {
    expect(() => validateEngineInput({ ...validInput, scenarioId: 'Happy-Path' })).toThrow()
  })

  it('rechaza scenarioId vacío', () => {
    expect(() => validateEngineInput({ ...validInput, scenarioId: '' })).toThrow()
  })

  it('rechaza propiedades adicionales no declaradas', () => {
    expect(() => validateEngineInput({ ...validInput, extra: true })).toThrow()
  })

  it('rechaza options.deterministic ausente', () => {
    expect(() => validateEngineInput({ ...validInput, options: {} })).toThrow()
  })

  it('rechaza un payload con más de 200 propiedades', () => {
    const payload: Record<string, number> = {}
    for (let i = 0; i < 201; i += 1) payload[`k${i}`] = i
    try {
      validateEngineInput({ ...validInput, payload })
    } catch (error) {
      expect(isEngineError(error)).toBe(true)
      if (isEngineError(error)) expect(error.code).toBe('LIMIT_EXCEEDED')
      return
    }
    throw new Error('debería haber lanzado LIMIT_EXCEEDED')
  })

  it('rechaza valores que no son objetos', () => {
    expect(() => validateEngineInput('no soy un objeto')).toThrow()
    expect(() => validateEngineInput(null)).toThrow()
    expect(() => validateEngineInput([1, 2, 3])).toThrow()
  })
})
