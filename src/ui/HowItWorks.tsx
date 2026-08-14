export function HowItWorks() {
  return (
    <section id="como-funciona" className="section" aria-labelledby="how-heading">
      <div className="container">
        <h2 id="how-heading">Cómo funciona</h2>
        <div className="section-grid section-grid--two">
          <div>
            <h3>Contrato</h3>
            <p>
              La entrada y la salida siguen <code>contracts/input.schema.json</code> y{' '}
              <code>contracts/output.schema.json</code> (JSON Schema, versionados con{' '}
              <code>schemaVersion</code>). El motor de dominio es un conjunto de funciones puras:{' '}
              <code>inspectToken</code>, <code>validateClaims</code>,{' '}
              <code>detectAlgorithmIssues</code> y <code>verifyFixtureSignature</code>.
            </p>
            <h3>Arquitectura</h3>
            <p>
              React coordina la interfaz; toda la validación corre en un Web Worker dedicado, fuera
              del hilo principal, para poder cancelar una ejecución sin bloquear la página. No
              existe backend propio: no hay datos que salgan de tu dispositivo en el modo
              determinista.
            </p>
          </div>
          <div>
            <h3>Límites honestos</h3>
            <ul className="limits-list">
              <li>
                Solo verifica firmas HMAC (HS256/HS384/HS512) con Web Crypto; RS256/ES256 se
                detectan y clasifican, pero no se verifican criptográficamente en esta demo
                estática.
              </li>
              <li>
                El tiempo de referencia de cada fixture es fijo (determinista), no la hora real: los
                resultados no cambian con el paso del tiempo.
              </li>
              <li>
                La exportación limita a 1000 hallazgos y 5&nbsp;MB, y usa el atributo{' '}
                <code>download</code> del navegador como equivalente estático de{' '}
                <code>Content-Disposition: attachment</code>.
              </li>
              <li>
                No certifica seguridad de ningún sistema real; es un laboratorio educativo con
                tokens ficticios.
              </li>
            </ul>
            <h3>Repositorio</h3>
            <p>
              Código, contratos, pruebas y decisiones en{' '}
              <a
                href="https://github.com/Aredex/jwt-misconfiguration-lab"
                target="_blank"
                rel="noreferrer"
              >
                github.com/Aredex/jwt-misconfiguration-lab
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
