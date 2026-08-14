import type { Finding, FindingSeverity } from '../contracts/types'

/** Catálogo de reglas del motor. Cada `ruleId` es estable y se usa tanto en
 * hallazgos como en pruebas de regresión (10-estrategia-pruebas.md). */
export const RULE_IDS = {
  MISSING_EXP: 'claims.missing-exp',
  EXP_INVALID_TYPE: 'claims.exp-invalid-type',
  TOKEN_EXPIRED: 'claims.token-expired',
  TOKEN_NOT_YET_VALID: 'claims.token-not-yet-valid',
  ISSUED_IN_FUTURE: 'claims.issued-in-future',
  ISSUER_MISSING_EXPECTATION: 'claims.issuer-not-configured',
  ISSUER_MISMATCH: 'claims.issuer-mismatch',
  AUDIENCE_MISSING_EXPECTATION: 'claims.audience-not-configured',
  AUDIENCE_MISMATCH: 'claims.audience-mismatch',
  CLAIMS_OK: 'claims.ok',
  ALG_NONE: 'algorithm.none-attack',
  ALG_NOT_ALLOWED: 'algorithm.not-allowed',
  ALG_MISSING_KID: 'algorithm.missing-kid',
  ALG_OK: 'algorithm.ok',
  SIGNATURE_INVALID: 'signature.invalid',
  SIGNATURE_VALID: 'signature.valid',
  SIGNATURE_NOT_VERIFIED: 'signature.not-verified',
  SIGNATURE_SKIPPED_ALG_REJECTED: 'signature.skipped-alg-rejected',
  ADAPTER_DISABLED: 'adapter.disabled',
  STRUCTURE_OK: 'structure.ok',
  ERROR_INPUT_INVALID: 'error.input-invalid',
  ERROR_LIMIT_EXCEEDED: 'error.limit-exceeded',
  ERROR_RUN_CANCELLED: 'error.run-cancelled',
  ERROR_DEPENDENCY_UNAVAILABLE: 'error.dependency-unavailable',
  ERROR_INTERNAL: 'error.internal',
} as const

export type RuleId = (typeof RULE_IDS)[keyof typeof RULE_IDS]

export function makeFinding(
  ruleId: RuleId,
  severity: FindingSeverity,
  message: string,
  extra?: { evidencePath?: string; suggestion?: string },
): Finding {
  const finding: {
    ruleId: RuleId
    severity: FindingSeverity
    message: string
    evidencePath?: string
    suggestion?: string
  } = { ruleId, severity, message }
  if (extra?.evidencePath !== undefined) finding.evidencePath = extra.evidencePath
  if (extra?.suggestion !== undefined) finding.suggestion = extra.suggestion
  return finding
}
