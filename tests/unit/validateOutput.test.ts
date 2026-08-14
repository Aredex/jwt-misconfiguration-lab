import { describe, expect, it } from 'vitest'
import { validateEngineOutput } from '../../src/contracts/validateOutput'

const validOutput = {
  schemaVersion: '1.0.0',
  runId: 'run_happy-path_abc123',
  status: 'completed',
  summary: 'Ejecución determinista completada',
  findings: [{ ruleId: 'algorithm.ok', severity: 'info', message: 'ok' }],
  evidence: { rulesVersion: '1.0.0', scenarioId: 'happy-path' },
}

describe('validateEngineOutput (contracts/output.schema.json)', () => {
  it('acepta una salida válida', () => {
    expect(() => validateEngineOutput(validOutput)).not.toThrow()
  })

  it('rechaza un status fuera del enum', () => {
    expect(() => validateEngineOutput({ ...validOutput, status: 'unknown' })).toThrow()
  })

  it('rechaza una severity fuera del enum', () => {
    expect(() =>
      validateEngineOutput({
        ...validOutput,
        findings: [{ ruleId: 'x', severity: 'catastrophic', message: 'm' }],
      }),
    ).toThrow()
  })

  it('rechaza un finding sin ruleId', () => {
    expect(() =>
      validateEngineOutput({ ...validOutput, findings: [{ severity: 'info', message: 'm' }] }),
    ).toThrow()
  })

  it('rechaza más de 1000 findings', () => {
    const findings = Array.from({ length: 1001 }, (_, i) => ({
      ruleId: `r${i}`,
      severity: 'info' as const,
      message: 'm',
    }))
    expect(() => validateEngineOutput({ ...validOutput, findings })).toThrow()
  })

  it('rechaza propiedades adicionales no declaradas en evidence', () => {
    expect(() =>
      validateEngineOutput({
        ...validOutput,
        evidence: { rulesVersion: '1.0.0', scenarioId: 'happy-path', secret: 'nope' },
      }),
    ).toThrow()
  })
})
