<!-- generated-by: $proyecto-portafolio; date: 2026-08-14 -->

# 09 · Plan de implementación

**Proyecto:** JWT Misconfiguration Lab  
**Decisión:** GO  
**Versión del paquete:** 0.1 · 2026-08-14

## Ruta crítica

Contrato → motor puro → fixture adversarial → experiencia 30/90 s → accesibilidad/pruebas → publicación → caso de estudio.

## Fases

### F0 — Base y contratos (2 h)

- <code>P11-T01</code> crear repositorio, TypeScript estricto, lint y tests.
- <code>P11-T02</code> implementar schemas de entrada/salida y fixtures mínimos.
- <code>P11-T03</code> montar shell visual y tokens.

### F1 — Corte vertical principal (35% de 8–12 h)

- `P11-T04` implementar P11-R1: decodificar tokens ficticios.
- `P11-T05` implementar P11-R2: validar exp nbf iss aud.
- Añadir caso feliz, error tipado y evidencia exportable.

### F2 — Robustez del dominio (25%)

- `P11-T06` implementar P11-R3: detectar algoritmos y claves inválidos.
- `P11-T07` implementar P11-R4: explicar sin exponer secretos.
- Añadir límites, cancelación, fixture adversarial y fallback.

### F3 — Experiencia pública (20%)

- Implementar recorrido 30/90 segundos y copy definitivo.
- Responsive, navegación por teclado, foco, estados y alternativa textual.
- Capturas automatizadas y guion de demo.

### F4 — Producción (20%)

- CI, pruebas completas, budgets de rendimiento y seguridad.
- Preview, smoke test, producción, rollback y caso de estudio.

## Dependencias

F1 depende de contratos; F2 puede avanzar junto a la UI únicamente después de estabilizar interfaces. Máximo tres workers: dominio, UI y calidad, sin compartir archivos en paralelo.

## Definición de listo

Requisito con ID, aceptación, fixture, contrato y diseño identificado.

## Definición de terminado

Código revisado, pruebas verdes, error/empty/loading, accesibilidad manual, evidencia generada, documentación y preview verificadas.

## Riesgos de ejecución

- **usuarios pegando tokens reales:** disparador observable; mitigación: fixture adversarial, validación explícita, mensaje accionable y prueba de regresión.
- **mensaje que sugiera seguridad completa:** disparador observable; mitigación: fixture adversarial, validación explícita, mensaje accionable y prueba de regresión.
- **algoritmos no soportados:** disparador observable; mitigación: fixture adversarial, validación explícita, mensaje accionable y prueba de regresión.
- **tiempo local inconsistente:** disparador observable; mitigación: fixture adversarial, validación explícita, mensaje accionable y prueba de regresión.
- **contenido sensible en URLs:** disparador observable; mitigación: procesamiento local, aviso previo, no telemetría de payloads y borrado explícito.

## Primera tarea exacta

Crear el repositorio de <code>jwt-misconfiguration-lab</code>, configurar TypeScript estricto y convertir <code>contracts/input.schema.json</code> y <code>contracts/output.schema.json</code> en tipos validados con un fixture feliz y uno inválido.
