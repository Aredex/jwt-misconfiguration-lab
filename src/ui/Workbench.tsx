import { useId, useMemo } from 'react'
import { inspectToken } from '../domain/jwtDecode'
import { MAX_TOKEN_INPUT_LENGTH } from '../domain/enginePayload'
import type { Scenario } from '../fixtures/types'
import type { RunPhase } from '../hooks/useRun'

interface WorkbenchProps {
  readonly scenarios: readonly Scenario[]
  readonly selectedScenarioId: string
  readonly onSelectScenario: (id: string) => void
  readonly token: string
  readonly onTokenChange: (token: string) => void
  readonly isCustomMode: boolean
  readonly onToggleCustomMode: (enabled: boolean) => void
  readonly customConsentGiven: boolean
  readonly onCustomConsentChange: (given: boolean) => void
  readonly expectedIssuer: string
  readonly onExpectedIssuerChange: (value: string) => void
  readonly expectedAudience: string
  readonly onExpectedAudienceChange: (value: string) => void
  readonly phase: RunPhase
  readonly onExecute: () => void
  readonly onCancel: () => void
}

const CATEGORY_LABEL: Record<Scenario['category'], string> = {
  'happy-path': 'Camino feliz',
  boundary: 'Frontera',
  adversarial: 'Adversarial',
  'dependency-down': 'Dependencia caída',
  'invalid-input': 'Entrada inválida',
}

export function Workbench(props: WorkbenchProps) {
  const scenarioListId = useId()
  const tokenFieldId = useId()
  const consentCheckboxId = useId()
  const issuerFieldId = useId()
  const audienceFieldId = useId()

  const structuralCheck = useMemo(() => {
    if (props.token.length === 0) return { state: 'inicial' as const }
    if (props.token.length > MAX_TOKEN_INPUT_LENGTH) return { state: 'demasiado-grande' as const }
    try {
      inspectToken(props.token)
      return { state: 'editada' as const }
    } catch (error) {
      return { state: 'invalida' as const, message: error instanceof Error ? error.message : '' }
    }
  }, [props.token])

  const isProcessing = props.phase === 'processing'

  return (
    <section className="panel" aria-labelledby="workbench-heading">
      <h2 id="workbench-heading">Entrada y escenario</h2>

      <fieldset>
        <legend>Selecciona un escenario</legend>
        <div className="scenario-list" role="radiogroup" aria-labelledby={scenarioListId}>
          <span id={scenarioListId} className="visually-hidden">
            Escenarios disponibles
          </span>
          {props.scenarios.map((scenario) => (
            <label
              key={scenario.id}
              className="scenario-option"
              htmlFor={`scenario-${scenario.id}`}
            >
              <input
                id={`scenario-${scenario.id}`}
                type="radio"
                name="scenario"
                value={scenario.id}
                checked={!props.isCustomMode && props.selectedScenarioId === scenario.id}
                onChange={() => {
                  props.onToggleCustomMode(false)
                  props.onSelectScenario(scenario.id)
                }}
              />
              <span>
                <span className="scenario-option__title">
                  {scenario.label}
                  <span className={`badge badge--${scenario.category}`}>
                    {CATEGORY_LABEL[scenario.category]}
                  </span>
                </span>
                <br />
                <span className="scenario-option__description">{scenario.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor={tokenFieldId}>Token (editable)</label>
        <textarea
          id={tokenFieldId}
          value={props.token}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          onChange={(event) => props.onTokenChange(event.target.value)}
          aria-invalid={
            structuralCheck.state === 'invalida' || structuralCheck.state === 'demasiado-grande'
          }
          aria-describedby={`${tokenFieldId}-hint`}
        />
        <p id={`${tokenFieldId}-hint`} className="field-hint">
          Puedes editar el token del fixture (por ejemplo, cambiar la audiencia) y volver a ejecutar
          para ver cómo cambia el resultado.
        </p>
        {structuralCheck.state === 'invalida' && (
          <p className="field-error" role="alert">
            Entrada inválida: {structuralCheck.message}
          </p>
        )}
        {structuralCheck.state === 'demasiado-grande' && (
          <p className="field-error" role="alert">
            El token supera el tamaño máximo permitido en esta demo (
            {MAX_TOKEN_INPUT_LENGTH.toLocaleString('es')} caracteres).
          </p>
        )}
      </div>

      <div className="advanced-toggle">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={props.isCustomMode}
            onChange={(event) => props.onToggleCustomMode(event.target.checked)}
          />
          <span>Avanzado: pegar un token propio en vez de un fixture</span>
        </label>
      </div>

      {props.isCustomMode && (
        <div
          className="consent-warning"
          role="region"
          aria-label="Aviso antes de pegar un token propio"
        >
          <p>
            <strong>No pegues tokens reales de producción ni secretos verdaderos.</strong> Esta
            herramienta procesa la entrada solo en tu navegador, pero un token real puede contener
            datos sensibles. Esta demo no verifica firmas de tokens propios y{' '}
            <strong>nunca certifica seguridad</strong>: solo explica los hallazgos de las
            comprobaciones que sí puede ejecutar (estructura, claims y algoritmo).
          </p>
          <label className="checkbox-row">
            <input
              id={consentCheckboxId}
              type="checkbox"
              checked={props.customConsentGiven}
              onChange={(event) => props.onCustomConsentChange(event.target.checked)}
            />
            <span>Entiendo el aviso y quiero continuar con un token propio</span>
          </label>

          {props.customConsentGiven && (
            <div className="section-grid section-grid--two custom-fields-grid">
              <div className="field">
                <label htmlFor={issuerFieldId}>Emisor esperado (iss) — opcional</label>
                <input
                  id={issuerFieldId}
                  type="text"
                  value={props.expectedIssuer}
                  onChange={(event) => props.onExpectedIssuerChange(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={audienceFieldId}>Audiencia esperada (aud) — opcional</label>
                <input
                  id={audienceFieldId}
                  type="text"
                  value={props.expectedAudience}
                  onChange={(event) => props.onExpectedAudienceChange(event.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="execute-row">
        <button
          type="button"
          className="button button--primary"
          onClick={props.onExecute}
          disabled={
            isProcessing ||
            structuralCheck.state === 'invalida' ||
            structuralCheck.state === 'demasiado-grande' ||
            structuralCheck.state === 'inicial' ||
            (props.isCustomMode && !props.customConsentGiven)
          }
        >
          {isProcessing ? 'Procesando…' : 'Ejecutar escenario'}
        </button>
        {isProcessing && (
          <button type="button" className="button button--secondary" onClick={props.onCancel}>
            Cancelar
          </button>
        )}
        <span className="status-line" aria-hidden="true">
          Estado: {phaseLabel(props.phase)}
        </span>
      </div>
    </section>
  )
}

function phaseLabel(phase: RunPhase): string {
  switch (phase) {
    case 'idle':
      return 'preparado'
    case 'processing':
      return 'procesando'
    case 'completed':
      return 'completado'
    case 'cancelled':
      return 'cancelado'
    case 'error':
      return 'error'
  }
}
