import { describe, expect, it } from 'vitest'
import { isEngineError, type EngineError } from '../../src/contracts/errors'
import type { ErrorCode } from '../../src/contracts/types'
import { inspectToken, MAX_TOKEN_LENGTH } from '../../src/domain/jwtDecode'
import { SCENARIOS } from '../../src/fixtures/catalog'

function scenario(id: string) {
  const found = SCENARIOS.find((s) => s.id === id)
  if (!found) throw new Error(`fixture ${id} no encontrado`)
  return found
}

function captureEngineError(fn: () => unknown): EngineError {
  try {
    fn()
  } catch (error) {
    if (isEngineError(error)) return error
    throw error
  }
  throw new Error('Se esperaba que la función lanzara un EngineError.')
}

function expectEngineErrorCode(fn: () => unknown, code: ErrorCode): EngineError {
  const error = captureEngineError(fn)
  expect(error.code).toBe(code)
  return error
}

describe('inspectToken (P11-R1: decodificar tokens ficticios)', () => {
  it('decodifica el header y los claims de un token bien formado', () => {
    const decoded = inspectToken(scenario('happy-path').token)
    expect(decoded.header.alg).toBe('HS256')
    expect(decoded.header.kid).toBe('demo-key-1')
    expect(decoded.claims.iss).toBe('https://issuer.demo.jwt-lab.dev')
    expect(decoded.claims.sub).toBe('user_1234')
  })

  it('rechaza una cadena sin tres segmentos', () => {
    expectEngineErrorCode(() => inspectToken('esto-no-tiene.estructura'), 'INPUT_INVALID')
  })

  it('rechaza un token vacío', () => {
    expectEngineErrorCode(() => inspectToken(''), 'INPUT_INVALID')
  })

  it('rechaza un token que excede el tamaño máximo', () => {
    const huge = 'a'.repeat(MAX_TOKEN_LENGTH + 1)
    expectEngineErrorCode(() => inspectToken(huge), 'LIMIT_EXCEEDED')
  })

  it('rechaza un segmento que no es JSON válido', () => {
    const badPayload = `${btoa('{"alg":"HS256"}').replace(/=+$/, '')}.not-json.sig`
    expectEngineErrorCode(() => inspectToken(badPayload), 'INPUT_INVALID')
  })

  it('rechaza un header sin "alg"', () => {
    const header = btoa(JSON.stringify({ typ: 'JWT' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    const payload = btoa(JSON.stringify({ sub: 'x' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    const error = expectEngineErrorCode(
      () => inspectToken(`${header}.${payload}.sig`),
      'INPUT_INVALID',
    )
    expect(error.paths).toContain('$.token.header.alg')
  })
})
