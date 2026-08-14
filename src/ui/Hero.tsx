interface HeroProps {
  readonly onPrimaryAction: () => void
}

export function Hero({ onPrimaryAction }: HeroProps) {
  return (
    <section className="hero">
      <div className="container">
        <h1 className="hero__title">Haz visible lo que normalmente falla en silencio.</h1>
        <p className="hero__lede">
          Un token JWT bien formado puede aceptarse igual con el issuer, la audiencia, el algoritmo
          o los tiempos equivocados. Selecciona un token ficticio y observa cada validación —y su
          fallo— paso a paso: decodificación, claims, algoritmo y firma.
        </p>
        <p className="field-hint">
          Usa el ejemplo incluido o carga datos propios. El modo local no los envía a ningún
          servidor.
        </p>
        <div className="hero__actions">
          <button type="button" className="button button--primary" onClick={onPrimaryAction}>
            Ir al laboratorio
          </button>
          <a className="button button--secondary" href="#como-funciona">
            Cómo funciona
          </a>
        </div>
      </div>
    </section>
  )
}
