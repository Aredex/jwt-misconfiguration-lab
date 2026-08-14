import type { ValidationPolicy } from '../domain/jwtTypes'

export type ScenarioCategory =
  'happy-path' | 'boundary' | 'adversarial' | 'dependency-down' | 'invalid-input'

/**
 * Escenario/fixture versionado (06-modelo-datos.md). Todos los tokens son
 * ficticios (RFC 7519), generados para esta demo: ningún fixture contiene un
 * secreto, clave o dato real.
 */
export interface Scenario {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly category: ScenarioCategory
  readonly token: string
  readonly policy: ValidationPolicy
  /** Secreto simétrico usado solo para firmar este fixture. Nunca es un
   * secreto real; `null` cuando el algoritmo es asimétrico o no aplica. */
  readonly fixtureSecret: string | null
  /** Cuando es `true`, la ejecución primero intenta un adaptador externo
   * (desactivado por diseño/kill switch) antes de caer al modo determinista. */
  readonly requiresAdapter?: boolean
}

export const RULES_VERSION = '1.0.0'
