<!-- generated-by: $proyecto-portafolio; date: 2026-08-14 -->

# 00 · Resumen ejecutivo

**Proyecto:** JWT Misconfiguration Lab  
**Decisión:** GO  
**Versión del paquete:** 0.1 · 2026-08-14

## Propuesta

**JWT Misconfiguration Lab** permite a desarrolladores que emiten o validan JWT seleccionar un token ficticio y observar cada validación y su fallo, para resolver que tokens bien formados pueden aceptarse con issuer, audience, algoritmo o tiempos incorrectos.

## Diferenciación

separa decodificar, validar claims y verificar firma sin procesar secretos reales. No compite por cantidad de funciones: convierte una capacidad técnica difícil de comprobar en una acción pública reproducible.

## Encaje con el portafolio

- Refuerza el posicionamiento en backend, APIs, cloud, automatización e IA.
- Complementa Briefline: aquí la evidencia central es ingeniería y comportamiento adversarial, no otro SaaS CRUD.
- Stack previsto: React, TypeScript, Web Crypto, RFC 7519 fixtures.
- Evidencia de ofertas: `2086993066487238011`, `2086936446747449366`.
- Estimación MVP: **8–12 horas**.

## Decisión

**GO.** El problema es demostrable con un alcance pequeño, una experiencia pública clara y operación cercana a cero.

## Resultado público

En 30 segundos el visitante podrá seleccionar un token ficticio y observar cada validación y su fallo. En 90 segundos podrá revisar la explicación, cambiar un parámetro y exportar evidencia.
