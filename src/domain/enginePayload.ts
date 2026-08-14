import { EngineError } from '../contracts/errors'

/**
 * Forma concreta de `EngineInput["payload"]` para este dominio (JWT). El
 * contrato genérico (contracts/input.schema.json) solo exige un objeto con
 * como máximo 200 propiedades; esta forma es una restricción propia de la
 * aplicación, documentada aquí y verificada por `validateEnginePayload`.
 */
export interface EnginePayload {
  readonly token: string
  readonly policyOverrides?: {
    readonly expectedIssuer?: string
    readonly expectedAudience?: string
  }
}

export const MAX_TOKEN_INPUT_LENGTH = 8_000

export function validateEnginePayload(payload: Record<string, unknown>): EnginePayload {
  const token = payload['token']
  if (typeof token !== 'string' || token.length === 0) {
    throw new EngineError('INPUT_INVALID', 'El campo "token" está vacío o no es texto.', [
      '$.payload.token',
    ])
  }
  if (token.length > MAX_TOKEN_INPUT_LENGTH) {
    throw new EngineError('LIMIT_EXCEEDED', 'El campo "token" excede el tamaño máximo permitido.', [
      '$.payload.token',
    ])
  }

  const overridesRaw = payload['policyOverrides']
  if (overridesRaw === undefined) return { token }

  if (typeof overridesRaw !== 'object' || overridesRaw === null || Array.isArray(overridesRaw)) {
    throw new EngineError('INPUT_INVALID', 'El campo "policyOverrides" debe ser un objeto.', [
      '$.payload.policyOverrides',
    ])
  }

  const record = overridesRaw as Record<string, unknown>
  const expectedIssuer = record['expectedIssuer']
  const expectedAudience = record['expectedAudience']
  const policyOverrides: NonNullable<EnginePayload['policyOverrides']> = {
    ...(typeof expectedIssuer === 'string' && expectedIssuer.length > 0 ? { expectedIssuer } : {}),
    ...(typeof expectedAudience === 'string' && expectedAudience.length > 0
      ? { expectedAudience }
      : {}),
  }

  return { token, policyOverrides }
}
