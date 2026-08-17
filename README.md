# JWT Misconfiguration Lab

Laboratorio interactivo para inspeccionar tokens JWT **ficticios** y observar, paso a paso, cada
validación —decodificación, `exp`/`nbf`/`iss`/`aud`, algoritmo y firma— y su fallo. Separa
"decodificar", "validar claims" y "verificar firma" en pasos explícitos, sin procesar secretos
reales.

**Demo:** https://jwt-misconfiguration-lab.pages.dev (se activará `https://jwt-misconfiguration-lab.alexcuesta.dev` cuando el dominio quede enlazado)
**Repositorio:** https://github.com/Aredex/jwt-misconfiguration-lab

## El problema

Un JWT bien formado —estructura correcta, JSON válido, incluso firmado— puede aceptarse igual con
el emisor, la audiencia, el algoritmo o los tiempos equivocados. Son fallos que no lanzan una
excepción visible: el token "parece" válido hasta que alguien revisa cada comprobación por
separado. Esta demo hace ese proceso visible y reproducible.

## Aviso de seguridad (léelo antes de pegar un token)

Esta herramienta usa por defecto **fixtures propios**: tokens ficticios, firmados con secretos de
prueba que nunca son reales. El modo avanzado permite pegar un token propio, pero antes exige un
aviso explícito y una casilla de consentimiento, y en ese modo:

- **Nunca se verifica la firma** de un token pegado (no se procesan secretos reales).
- La aplicación **nunca certifica seguridad**. Solo reporta los hallazgos de las comprobaciones
  deterministas que efectivamente ejecutó (estructura, claims, algoritmo).
- Todo el procesamiento ocurre en tu navegador, en un Web Worker; nada se envía a un servidor.

Este es el riesgo más importante del proyecto: que alguien pegue un token real y confíe en un
mensaje que sugiera "seguridad completa". El resumen de cada ejecución termina siempre con el
mismo recordatorio: _"Esta herramienta no certifica seguridad: solo reporta los hallazgos de las
comprobaciones deterministas que ejecutó."_

## Demo de 30/90 segundos

- **30 s:** abre la app, hay un fixture precargado (`happy-path`) y un CTA "Ejecutar escenario".
  Al ejecutar, ves cada decisión (estructura, algoritmo, claims, firma) con su severidad.
- **90 s:** abre un hallazgo para ver su evidencia y sugerencia, cambia de escenario (o edita el
  token) para ver un resultado distinto, y exporta el informe en JSON o Markdown.

## Inicio local

Requiere Node 24 y pnpm 10 (`packageManager` fijado en `package.json`).

```bash
pnpm install
pnpm dev            # http://localhost:5173
pnpm build           # build de producción a dist/
pnpm preview          # sirve dist/ en 127.0.0.1:20463
pnpm typecheck        # tsc -b (proyectos referenciados: app/worker/tests/e2e/node)
pnpm lint             # eslint (typescript-eslint + jsx-a11y + react-hooks)
pnpm test              # vitest: unitarias + contrato + componentes
pnpm test:e2e            # playwright (compila y sirve dist/ primero)
```

## Arquitectura

Aplicación 100% estática: sin backend propio, sin datos que salgan del dispositivo en el modo
determinista.

```
Visitante → React (workbench) → Web Worker (motor de dominio) → fixtures versionados
```

- `src/domain/*`: funciones puras del dominio JWT — `inspectToken` (decodificación estructural,
  RFC 7519), `validateClaims` (exp/nbf/iat/iss/aud contra una política determinista),
  `detectAlgorithmIssues` (alg:none, confusión de algoritmo, `kid`) y `verifyFixtureSignature`
  (HMAC-SHA256 vía Web Crypto `SubtleCrypto`).
- `src/worker/`: el motor corre en un Web Worker dedicado (`engine.worker.ts`), cancelable, para no
  bloquear el hilo principal ni la interfaz.
- `src/fixtures/catalog.ts`: escenarios versionados (RFC 7519), cada uno con su propio secreto de
  fixture (nunca real) y un tiempo de referencia determinista (no `Date.now()`), así los resultados
  no cambian con el paso del tiempo.
- `src/contracts/`: tipos y validadores manuales de `contracts/input.schema.json` y
  `contracts/output.schema.json` (ver más abajo por qué no usan `ajv` en producción).
- `src/ui/`: componentes de interfaz (React), sin decisiones de dominio.
- `src/storage/localHistory.ts`: historial local opcional en IndexedDB, bajo consentimiento
  explícito, con botón "Eliminar datos locales".

## Fixtures incluidos

| Escenario                   | Categoría         | Qué demuestra                                                        |
| --------------------------- | ----------------- | -------------------------------------------------------------------- |
| `happy-path`                | camino feliz      | token válido: sin hallazgos bloqueantes                              |
| `expired-token`             | frontera          | firma y claims correctos, pero `exp` ya pasó                         |
| `wrong-audience`            | frontera          | `aud` no coincide con el servicio esperado                           |
| `alg-none-attack`           | adversarial       | ataque clásico `alg: none` (bypass de firma)                         |
| `algorithm-confusion`       | adversarial       | firma HMAC válida, pero algoritmo no permitido                       |
| `boundary-exp`              | frontera          | `exp` exactamente igual al tiempo de referencia (frontera inclusiva) |
| `invalid-structure`         | entrada inválida  | cadena sin la estructura de tres segmentos de un JWT                 |
| `external-adapter-disabled` | dependencia caída | adaptador real desactivado (kill switch) → fallback determinista     |

## Contratos

`contracts/input.schema.json` y `contracts/output.schema.json` son la fuente de verdad. El motor
usa validadores manuales (`src/contracts/validateInput.ts`, `validateOutput.ts`) en vez de `ajv` en
producción: `ajv.compile()` genera código con `new Function(...)`, incompatible con la CSP estricta
de `public/_headers` (`script-src 'self'`, sin `unsafe-eval`). `ajv` sí se usa —solo en pruebas—
para verificar que los validadores manuales no diverjan del JSON Schema
(`tests/contract/schema-fixtures.test.ts`).

## Seguridad

- CSP restrictiva, `frame-ancestors 'none'`, `nosniff` y `Referrer-Policy` en `public/_headers`
  (convención de Cloudflare Pages).
- Nunca se usa `innerHTML` con entrada del visitante ni se ejecuta código pegado.
- Nunca se registran payloads, tokens ni cabeceras (ni en consola, ni en analítica: esta demo no
  tiene analítica de terceros).
- La exportación redacta cualquier cadena con forma de JWT como defensa en profundidad
  (`src/lib/redact.ts`) y descarga vía el atributo `download` del navegador (equivalente estático
  de `Content-Disposition: attachment`; no hay servidor propio que fije esa cabecera).
- Límite de frecuencia del lado del cliente y timeout duro sobre la ejecución del Worker
  (`src/worker/workerClient.ts`); el adaptador externo opcional queda desactivado por diseño
  (`src/adapter/externalAdapter.ts`, kill switch sin UI para reactivarlo).
- Dependencias fijadas vía `pnpm-lock.yaml` (comiteado).

## Accesibilidad

HTML nativo con landmarks y encabezados coherentes, foco visible, navegación completa por teclado,
`aria-live` para anunciar cambios de estado, resumen textual equivalente a cada severidad
(no depende solo del color) y `prefers-reduced-motion` respetado. Verificado con
`@axe-core/playwright` en CI (`e2e/accessibility.spec.ts`) contra violaciones críticas/serias.

## Límites honestos

- Solo verifica firmas HMAC (HS256/HS384/HS512) con Web Crypto sobre fixtures propios. Los
  algoritmos asimétricos (RS256/ES256) se detectan y clasifican, pero no se verifican
  criptográficamente en esta demo estática (no hay infraestructura de claves pública/privada).
- El tiempo de referencia de cada fixture es fijo; no refleja la hora real del visitante.
- No hay "cinco pruebas observadas" con usuarios humanos: el sustituto documentado es la suite E2E
  de Playwright (`e2e/`), que recorre el camino feliz de 30/90 s más los casos adversarial y de
  aviso de riesgo. Ver `13-presentacion-portafolio.md` para el detalle.
- Esta herramienta **no certifica seguridad ni anonimización** de ningún sistema real.

## Decisiones

- **Sin VPS:** Cloudflare Pages; GitHub Pages como salida alternativa. Menor carga operativa a
  cambio de límites de plataforma (ADR-001, `05-arquitectura-tecnica.md`).
- **Núcleo funcional puro:** las reglas de dominio son funciones TS puras y tipadas; React solo
  orquesta la interacción (ADR-002).
- **Fixtures como fallback:** cuando el adaptador real está desactivado (siempre, en esta demo), la
  app cae automáticamente al modo determinista (ADR-003).
- **Sin cuentas en v1:** menor riesgo y tiempo de desarrollo (ADR-004).

El paquete de especificación completo (`00`–`16`) y los contratos (`contracts/`) se mantienen en
este repositorio como documentación de diseño; el orden de lectura sugerido está en
`16-plan-maestro.md`.

## Licencia

Proyecto de portafolio personal. Código disponible para revisión técnica.
