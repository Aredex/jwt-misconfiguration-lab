import type { EngineOutput, Finding, FindingSeverity } from '../contracts/types'
import type { RunPhase } from '../hooks/useRun'

interface ResultPanelProps {
  readonly phase: RunPhase
  readonly output: EngineOutput | null
  readonly errorMessage: string | null
  readonly onExportJson: () => void
  readonly onExportMarkdown: () => void
}

const STATUS_LABEL: Record<EngineOutput['status'], string> = {
  completed: 'Completado',
  partial: 'Parcial',
  failed: 'Fallido',
  cancelled: 'Cancelado',
}

export function ResultPanel({
  phase,
  output,
  errorMessage,
  onExportJson,
  onExportMarkdown,
}: ResultPanelProps) {
  return (
    <section className="panel" aria-labelledby="result-heading">
      <h2 id="result-heading">Resultado</h2>

      {phase === 'idle' && (
        <p className="result-empty">
          Aún no hay resultado. Ejecuta el fixture para ver cada decisión.
        </p>
      )}

      {phase === 'processing' && <p aria-live="polite">Procesando la ejecución…</p>}

      {phase === 'error' && (
        <p className="field-error" role="alert">
          {errorMessage ??
            'No pudimos procesar esta entrada. Tus datos no se enviaron; corrige los campos señalados.'}
        </p>
      )}

      {phase === 'cancelled' && !output && (
        <p className="status-line" role="status">
          La ejecución fue cancelada. Puedes volver a ejecutar el escenario cuando quieras.
        </p>
      )}

      {output && (
        <div>
          <div className={`result-summary result-summary--${output.status}`}>
            <p>
              <strong>Estado: {STATUS_LABEL[output.status]}.</strong> La ejecución terminó. Abre
              cada decisión para revisar su evidencia.
            </p>
            <p>{output.summary}</p>
          </div>

          <SeverityCounts findings={output.findings} />

          <ul className="findings-list">
            {output.findings.map((finding, index) => (
              <FindingItem key={`${finding.ruleId}-${index}`} finding={finding} />
            ))}
          </ul>

          <div className="export-row">
            <button type="button" className="button button--secondary" onClick={onExportJson}>
              Exportar JSON
            </button>
            <button type="button" className="button button--secondary" onClick={onExportMarkdown}>
              Exportar Markdown
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function SeverityCounts({ findings }: { readonly findings: readonly Finding[] }) {
  const counts: Record<FindingSeverity, number> = { info: 0, warning: 0, error: 0, critical: 0 }
  for (const finding of findings) counts[finding.severity] += 1
  return (
    <p className="status-line">
      {counts.critical} crítico(s) · {counts.error} error(es) · {counts.warning} advertencia(s) ·{' '}
      {counts.info} informativo(s)
    </p>
  )
}

const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  info: 'Info',
  warning: 'Advertencia',
  error: 'Error',
  critical: 'Crítico',
}

function FindingItem({ finding }: { readonly finding: Finding }) {
  return (
    <li>
      <details className="finding">
        <summary>
          <span className={`severity-dot severity-dot--${finding.severity}`} aria-hidden="true" />
          <span className="severity-label">{SEVERITY_LABEL[finding.severity]}</span>
          <span>{finding.message}</span>
        </summary>
        <div className="finding-body">
          <dl>
            <dt>Regla</dt>
            <dd>
              <code>{finding.ruleId}</code>
            </dd>
            {finding.evidencePath && (
              <>
                <dt>Evidencia</dt>
                <dd>
                  <code>{finding.evidencePath}</code>
                </dd>
              </>
            )}
            {finding.suggestion && (
              <>
                <dt>Sugerencia</dt>
                <dd>{finding.suggestion}</dd>
              </>
            )}
          </dl>
        </div>
      </details>
    </li>
  )
}
