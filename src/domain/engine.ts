import { checkExternalAdapter } from '../adapter/externalAdapter'
import { EngineError, isEngineError } from '../contracts/errors'
import type { EngineInput, EngineOutput, Finding, FindingSeverity } from '../contracts/types'
import { detectAlgorithmIssues } from './algorithm'
import { validateClaims } from './claims'
import { validateEnginePayload } from './enginePayload'
import { makeFinding, RULE_IDS } from './findings'
import { inspectToken } from './jwtDecode'
import type { ValidationPolicy } from './jwtTypes'
import { verifyFixtureSignature } from './signature'
import { findScenario } from '../fixtures/catalog'
import { RULES_VERSION } from '../fixtures/types'

const SCHEMA_VERSION = '1.0.0' as const

/** Algoritmos aceptados por defecto cuando el visitante pega un token propio
 * (sin política de fixture asociada). "none" queda excluido siempre: se
 * rechaza incondicionalmente en `detectAlgorithmIssues` antes de consultar
 * esta lista. */
const CUSTOM_TOKEN_ALLOWED_ALGORITHMS = [
  'HS256',
  'HS384',
  'HS512',
  'RS256',
  'RS384',
  'RS512',
  'ES256',
  'ES384',
]

interface ResolvedScenario {
  readonly token: string
  readonly policy: ValidationPolicy
  readonly fixtureSecret: string | null
  readonly requiresAdapter: boolean
}

function resolveScenario(input: EngineInput): ResolvedScenario {
  const payload = validateEnginePayload(input.payload)

  if (input.scenarioId === 'custom-token') {
    const policy: ValidationPolicy = {
      allowedAlgorithms: CUSTOM_TOKEN_ALLOWED_ALGORITHMS,
      clockSkewSeconds: 30,
      referenceTimeEpochSeconds: Math.floor(Date.now() / 1000),
      ...(payload.policyOverrides?.expectedIssuer !== undefined
        ? { expectedIssuer: payload.policyOverrides.expectedIssuer }
        : {}),
      ...(payload.policyOverrides?.expectedAudience !== undefined
        ? { expectedAudience: payload.policyOverrides.expectedAudience }
        : {}),
    }
    return { token: payload.token, policy, fixtureSecret: null, requiresAdapter: false }
  }

  const scenario = findScenario(input.scenarioId)
  if (!scenario) {
    throw new EngineError('INPUT_INVALID', `El escenario "${input.scenarioId}" no existe.`, [
      '$.scenarioId',
    ])
  }

  // El token editado por el visitante en la interfaz reemplaza al del
  // fixture (permite demostrar "cambia un parámetro y vuelve a ejecutar");
  // la política y el secreto siguen perteneciendo al escenario elegido.
  return {
    token: payload.token,
    policy: scenario.policy,
    fixtureSecret: scenario.fixtureSecret,
    requiresAdapter: scenario.requiresAdapter ?? false,
  }
}

function assertNotCancelled(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new EngineError('RUN_CANCELLED', 'La ejecución fue cancelada.')
  }
}

/** Pausa cancelable usada solo por el Worker para dar tiempo visible al
 * estado "procesando" de la UI; `runEngine` en sí es instantánea y
 * determinista (útil para pruebas unitarias rápidas). */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}

/**
 * Orquesta `inspectToken`, `validateClaims`, `detectAlgorithmIssues` y
 * `verifyFixtureSignature` para producir un `EngineOutput` (07-contratos-
 * interfaces.md). Es la única función que las capas de UI/Worker deben
 * llamar; nunca lanza excepciones no tipadas hacia arriba.
 */
export async function runEngine(
  input: EngineInput,
  signal?: AbortSignal,
  options?: { readonly simulateLatencyMs?: number },
): Promise<EngineOutput> {
  const runId = generateRunId(input.scenarioId)

  try {
    assertNotCancelled(signal)
    if (options?.simulateLatencyMs) {
      await delay(options.simulateLatencyMs, signal)
      assertNotCancelled(signal)
    }

    const { token, policy, fixtureSecret, requiresAdapter } = resolveScenario(input)

    const findings: Finding[] = []
    let status: EngineOutput['status'] = 'completed'

    if (requiresAdapter) {
      const adapterResult = checkExternalAdapter()
      findings.push(
        makeFinding(RULE_IDS.ADAPTER_DISABLED, 'info', adapterResult.reason, {
          suggestion:
            'Este es el comportamiento esperado (kill switch apagado): la demo continúa en modo determinista con el mismo fixture.',
        }),
      )
      status = 'partial'
    }

    const decoded = inspectToken(token)
    findings.push(
      makeFinding(
        RULE_IDS.STRUCTURE_OK,
        'info',
        'El token tiene la estructura de tres segmentos de RFC 7519 y ambos segmentos decodifican a JSON válido.',
      ),
    )

    findings.push(...detectAlgorithmIssues(decoded.header, policy))
    findings.push(...validateClaims(decoded.claims, policy))

    assertNotCancelled(signal)
    const signatureFinding = await verifyFixtureSignature(decoded, fixtureSecret)
    assertNotCancelled(signal)
    findings.push(signatureFinding)

    return {
      schemaVersion: SCHEMA_VERSION,
      runId,
      status,
      summary: buildSummary(findings, requiresAdapter),
      findings,
      evidence: { rulesVersion: RULES_VERSION, scenarioId: input.scenarioId },
    }
  } catch (error) {
    return buildErrorOutput(runId, input.scenarioId, error)
  }
}

function generateRunId(scenarioId: string): string {
  const random =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `run_${scenarioId}_${random}`
}

function buildErrorOutput(runId: string, scenarioId: string, error: unknown): EngineOutput {
  const engineError = isEngineError(error)
    ? error
    : new EngineError('INTERNAL_ERROR', 'Ocurrió un error interno no clasificado.')

  const status: EngineOutput['status'] =
    engineError.code === 'RUN_CANCELLED' ? 'cancelled' : 'failed'
  const severity: FindingSeverity = engineError.code === 'RUN_CANCELLED' ? 'warning' : 'critical'

  const finding = makeFinding(
    ruleIdForError(engineError.code),
    severity,
    engineError.message,
    engineError.paths && engineError.paths.length > 0
      ? { evidencePath: engineError.paths[0] }
      : undefined,
  )

  return {
    schemaVersion: SCHEMA_VERSION,
    runId,
    status,
    summary: summaryForError(engineError.code),
    findings: [finding],
    evidence: { rulesVersion: RULES_VERSION, scenarioId },
  }
}

function ruleIdForError(code: EngineError['code']): (typeof RULE_IDS)[keyof typeof RULE_IDS] {
  switch (code) {
    case 'INPUT_INVALID':
      return RULE_IDS.ERROR_INPUT_INVALID
    case 'LIMIT_EXCEEDED':
      return RULE_IDS.ERROR_LIMIT_EXCEEDED
    case 'RUN_CANCELLED':
      return RULE_IDS.ERROR_RUN_CANCELLED
    case 'DEPENDENCY_UNAVAILABLE':
      return RULE_IDS.ERROR_DEPENDENCY_UNAVAILABLE
    case 'INTERNAL_ERROR':
    default:
      return RULE_IDS.ERROR_INTERNAL
  }
}

function summaryForError(code: EngineError['code']): string {
  switch (code) {
    case 'INPUT_INVALID':
      return 'No pudimos procesar esta entrada. Tus datos no se enviaron a ningún servidor; corrige los campos señalados.'
    case 'LIMIT_EXCEEDED':
      return 'La entrada excede los límites de tamaño de esta demo. Reduce el contenido e inténtalo de nuevo.'
    case 'RUN_CANCELLED':
      return 'La ejecución fue cancelada. Puedes volver a ejecutar el escenario cuando quieras.'
    case 'DEPENDENCY_UNAVAILABLE':
      return 'El adaptador real no está disponible. Se ofrece el modo determinista como alternativa.'
    case 'INTERNAL_ERROR':
    default:
      return 'Ocurrió un error interno no clasificado. No se registró el contenido de tu entrada.'
  }
}

function buildSummary(findings: readonly Finding[], requiresAdapter: boolean): string {
  const counts = countBySeverity(findings)
  const prefix = requiresAdapter
    ? 'El adaptador externo real está desactivado; se completó una verificación de respaldo en modo determinista. '
    : ''

  const disclaimer =
    'Esta herramienta no certifica seguridad: solo reporta los hallazgos de las comprobaciones deterministas que ejecutó.'

  if (counts.critical > 0) {
    return `${prefix}Se detectaron ${counts.critical} hallazgo(s) crítico(s) y ${counts.error} error(es). ${disclaimer}`
  }
  if (counts.error > 0) {
    return `${prefix}Se detectaron ${counts.error} error(es) de validación. ${disclaimer}`
  }
  if (counts.warning > 0) {
    return `${prefix}No se detectaron errores críticos, pero hay ${counts.warning} advertencia(s) que conviene revisar. ${disclaimer}`
  }
  return `${prefix}No se detectaron problemas en las comprobaciones ejecutadas (decodificación, claims, algoritmo y firma). ${disclaimer}`
}

function countBySeverity(findings: readonly Finding[]): Record<FindingSeverity, number> {
  const counts: Record<FindingSeverity, number> = { info: 0, warning: 0, error: 0, critical: 0 }
  for (const finding of findings) counts[finding.severity] += 1
  return counts
}
