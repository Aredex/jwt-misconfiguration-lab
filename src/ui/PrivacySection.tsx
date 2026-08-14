interface PrivacySectionProps {
  readonly historyConsent: boolean
  readonly onHistoryConsentChange: (consent: boolean) => void
  readonly onDeleteLocalData: () => void
  readonly deleteStatus: 'idle' | 'done'
}

export function PrivacySection({
  historyConsent,
  onHistoryConsentChange,
  onDeleteLocalData,
  deleteStatus,
}: PrivacySectionProps) {
  return (
    <section id="privacidad" className="section" aria-labelledby="privacy-heading">
      <div className="container">
        <h2 id="privacy-heading">Privacidad y datos locales</h2>
        <div className="section-grid section-grid--two">
          <div>
            <p>
              Todo el procesamiento ocurre en tu navegador, en un Web Worker dedicado. Ningún token,
              claim o payload sale de tu dispositivo mientras usas los fixtures incluidos.
            </p>
            <p>
              Esta herramienta <strong>no certifica seguridad ni anonimización</strong>: solo
              reporta los hallazgos de las comprobaciones deterministas que ejecutó sobre la entrada
              que le diste.
            </p>
          </div>
          <div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={historyConsent}
                onChange={(event) => onHistoryConsentChange(event.target.checked)}
              />
              <span>
                Guardar un historial de resultados en este navegador (IndexedDB). Nunca incluye el
                token original, solo el resultado de cada ejecución.
              </span>
            </label>
            <div className="execute-row">
              <button type="button" className="button button--danger" onClick={onDeleteLocalData}>
                Eliminar datos locales
              </button>
              {deleteStatus === 'done' && (
                <span className="status-line" role="status">
                  Datos locales eliminados.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
