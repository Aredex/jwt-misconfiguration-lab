import type { Finding } from '../contracts/types'
import { makeFinding, RULE_IDS } from './findings'
import type { JwtHeader, ValidationPolicy } from './jwtTypes'

/**
 * Detecta algoritmos y claves inválidos (P11-R3): ataque clásico
 * `alg: none` (CVE histórico en varias librerías JWT), algoritmos fuera de
 * la lista permitida por la política (cubre la "confusión de algoritmo"
 * HS256/RS256) y ausencia de `kid` cuando la política lo exige.
 */
export function detectAlgorithmIssues(header: JwtHeader, policy: ValidationPolicy): Finding[] {
  const findings: Finding[] = []
  const alg = header.alg

  if (typeof alg === 'string' && alg.toLowerCase() === 'none') {
    findings.push(
      makeFinding(
        RULE_IDS.ALG_NONE,
        'critical',
        'El header declara "alg": "none". Algunas librerías JWT aceptan tokens sin firma cuando encuentran este valor: es un bypass de autenticación conocido.',
        {
          evidencePath: '$.header.alg',
          suggestion:
            'Rechaza siempre "alg": "none" en el servidor; nunca confíes en el algoritmo declarado por el propio token.',
        },
      ),
    )
    return findings
  }

  if (!policy.allowedAlgorithms.includes(alg)) {
    findings.push(
      makeFinding(
        RULE_IDS.ALG_NOT_ALLOWED,
        'critical',
        `El algoritmo "${alg}" no está en la lista permitida para este escenario (${policy.allowedAlgorithms.join(', ')}). Aceptar algoritmos no configurados habilita ataques de confusión de algoritmo (p. ej. usar una clave pública RS256 como secreto HMAC).`,
        {
          evidencePath: '$.header.alg',
          suggestion:
            'Fija una lista blanca de algoritmos por verificador y compárala contra "alg" antes de verificar la firma.',
        },
      ),
    )
  } else {
    findings.push(
      makeFinding(
        RULE_IDS.ALG_OK,
        'info',
        `El algoritmo "${alg}" está permitido para este escenario.`,
        {
          evidencePath: '$.header.alg',
        },
      ),
    )
  }

  if (policy.requireKid && !header.kid) {
    findings.push(
      makeFinding(
        RULE_IDS.ALG_MISSING_KID,
        'warning',
        'El header no declara "kid" y la política de este escenario espera uno para seleccionar la clave correcta.',
        {
          evidencePath: '$.header.kid',
          suggestion:
            'Exige "kid" cuando rotas claves para evitar ambigüedad sobre qué clave verificar.',
        },
      ),
    )
  }

  return findings
}
