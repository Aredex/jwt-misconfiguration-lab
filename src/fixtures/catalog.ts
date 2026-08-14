import type { Scenario } from './types'

const ISSUER = 'https://issuer.demo.jwt-lab.dev'
const AUDIENCE = 'https://api.demo.jwt-lab.dev'

/**
 * Catálogo de escenarios versionados (fixtures) de RFC 7519. Cada token fue
 * generado y firmado con un secreto de fixture propio (nunca real) usando el
 * mismo esquema HMAC-SHA256 que verifica `domain/signature.ts`; ver el
 * generador en las notas de `09-plan-implementacion.md`.
 *
 * `policy.referenceTimeEpochSeconds` fija el "ahora" de cada escenario: los
 * resultados son deterministas y no cambian con el paso del tiempo real.
 */
export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'happy-path',
    label: 'Camino feliz',
    description:
      'Token bien formado, firmado, sin expirar y con emisor/audiencia correctos. Ninguna comprobación falla.',
    category: 'happy-path',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRlbW8ta2V5LTEifQ.eyJpc3MiOiJodHRwczovL2lzc3Vlci5kZW1vLmp3dC1sYWIuZGV2Iiwic3ViIjoidXNlcl8xMjM0IiwiYXVkIjoiaHR0cHM6Ly9hcGkuZGVtby5qd3QtbGFiLmRldiIsImlhdCI6MTc4NjcwODgwMCwibmJmIjoxNzg2NzA4ODAwLCJleHAiOjE3ODY3MTI0MDB9.HKCUtKBOy4qF0Vqa2Y98NwbnGOx-_QZrVWcVFju7GFk',
    fixtureSecret: 'fixture-happy-path-secret-do-not-use',
    policy: {
      expectedIssuer: ISSUER,
      expectedAudience: AUDIENCE,
      allowedAlgorithms: ['HS256'],
      requireKid: true,
      clockSkewSeconds: 30,
      referenceTimeEpochSeconds: 1786708860,
    },
  },
  {
    id: 'expired-token',
    label: 'Token expirado',
    description:
      'Firma y claims correctos, pero el tiempo de referencia es dos horas posterior a "exp": el token ya no debería aceptarse.',
    category: 'boundary',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRlbW8ta2V5LTEifQ.eyJpc3MiOiJodHRwczovL2lzc3Vlci5kZW1vLmp3dC1sYWIuZGV2Iiwic3ViIjoidXNlcl8xMjM0IiwiYXVkIjoiaHR0cHM6Ly9hcGkuZGVtby5qd3QtbGFiLmRldiIsImlhdCI6MTc4NjcwODgwMCwibmJmIjoxNzg2NzA4ODAwLCJleHAiOjE3ODY3MTI0MDB9.xbFHkjbfWLQJjkxXmx2moRxDRLUph3lB2SY9EMz0jhE',
    fixtureSecret: 'fixture-expired-token-secret-do-not-use',
    policy: {
      expectedIssuer: ISSUER,
      expectedAudience: AUDIENCE,
      allowedAlgorithms: ['HS256'],
      requireKid: true,
      clockSkewSeconds: 30,
      referenceTimeEpochSeconds: 1786716000,
    },
  },
  {
    id: 'wrong-audience',
    label: 'Audiencia incorrecta',
    description:
      'El token es válido y está vigente, pero fue emitido para otro servicio ("aud" distinto al esperado).',
    category: 'boundary',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRlbW8ta2V5LTEifQ.eyJpc3MiOiJodHRwczovL2lzc3Vlci5kZW1vLmp3dC1sYWIuZGV2Iiwic3ViIjoidXNlcl8xMjM0IiwiYXVkIjoiaHR0cHM6Ly9vdGhlci1zZXJ2aWNlLmRlbW8uand0LWxhYi5kZXYiLCJpYXQiOjE3ODY3MDg4MDAsIm5iZiI6MTc4NjcwODgwMCwiZXhwIjoxNzg2NzEyNDAwfQ._t5Z7_5vb9Lq0jgkp82gUTjVe0h_ESvy_xVM5WIkx0o',
    fixtureSecret: 'fixture-wrong-audience-secret-do-not-use',
    policy: {
      expectedIssuer: ISSUER,
      expectedAudience: AUDIENCE,
      allowedAlgorithms: ['HS256'],
      requireKid: true,
      clockSkewSeconds: 30,
      referenceTimeEpochSeconds: 1786708860,
    },
  },
  {
    id: 'alg-none-attack',
    label: 'Ataque "alg: none"',
    description:
      'Fixture adversarial: header con "alg":"none" y firma vacía. Reproduce un bypass histórico de autenticación en librerías JWT.',
    category: 'adversarial',
    token:
      'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpc3MiOiJodHRwczovL2lzc3Vlci5kZW1vLmp3dC1sYWIuZGV2Iiwic3ViIjoiYXR0YWNrZXIiLCJhdWQiOiJodHRwczovL2FwaS5kZW1vLmp3dC1sYWIuZGV2IiwiaWF0IjoxNzg2NzA4ODAwLCJuYmYiOjE3ODY3MDg4MDAsImV4cCI6MTc4NjcxMjQwMH0.',
    fixtureSecret: null,
    policy: {
      expectedIssuer: ISSUER,
      expectedAudience: AUDIENCE,
      allowedAlgorithms: ['HS256'],
      requireKid: false,
      clockSkewSeconds: 30,
      referenceTimeEpochSeconds: 1786708860,
    },
  },
  {
    id: 'algorithm-confusion',
    label: 'Confusión de algoritmo',
    description:
      'Fixture adversarial: token bien firmado con HS256, pero este verificador solo permite RS256. Un algoritmo "correcto" no basta si no es el esperado.',
    category: 'adversarial',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRlbW8ta2V5LTEifQ.eyJpc3MiOiJodHRwczovL2lzc3Vlci5kZW1vLmp3dC1sYWIuZGV2Iiwic3ViIjoidXNlcl8xMjM0IiwiYXVkIjoiaHR0cHM6Ly9hcGkuZGVtby5qd3QtbGFiLmRldiIsImlhdCI6MTc4NjcwODgwMCwibmJmIjoxNzg2NzA4ODAwLCJleHAiOjE3ODY3MTI0MDB9.xwU-H4EBlR0nTvpbCJf0dGhgAqqY0JKCW_NmwfC0qsA',
    fixtureSecret: 'fixture-algorithm-confusion-secret-do-not-use',
    policy: {
      expectedIssuer: ISSUER,
      expectedAudience: AUDIENCE,
      allowedAlgorithms: ['RS256'],
      requireKid: true,
      clockSkewSeconds: 30,
      referenceTimeEpochSeconds: 1786708860,
    },
  },
  {
    id: 'boundary-exp',
    label: 'Frontera exacta de expiración',
    description:
      'El tiempo de referencia coincide exactamente con "exp". RFC 7519 exige rechazar el token en o después de ese instante (frontera inclusiva).',
    category: 'boundary',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRlbW8ta2V5LTEifQ.eyJpc3MiOiJodHRwczovL2lzc3Vlci5kZW1vLmp3dC1sYWIuZGV2Iiwic3ViIjoidXNlcl8xMjM0IiwiYXVkIjoiaHR0cHM6Ly9hcGkuZGVtby5qd3QtbGFiLmRldiIsImlhdCI6MTc4NjcwODgwMCwibmJmIjoxNzg2NzA4ODAwLCJleHAiOjE3ODY3MTA2MDB9.7DEYPj2UH6852jVbrn2qKBX-Kx6_GAyIN4KvNsL8ku0',
    fixtureSecret: 'fixture-boundary-exp-secret-do-not-use',
    policy: {
      expectedIssuer: ISSUER,
      expectedAudience: AUDIENCE,
      allowedAlgorithms: ['HS256'],
      requireKid: true,
      clockSkewSeconds: 0,
      referenceTimeEpochSeconds: 1786710600,
    },
  },
  {
    id: 'invalid-structure',
    label: 'Entrada inválida',
    description:
      'Cadena que no tiene la estructura de tres segmentos que exige un JWT. Debe fallar de forma controlada y explicada, sin bloquear la interfaz.',
    category: 'invalid-input',
    token: 'esto-no-tiene.estructura-de-jwt',
    fixtureSecret: null,
    policy: {
      allowedAlgorithms: ['HS256'],
      clockSkewSeconds: 30,
      referenceTimeEpochSeconds: 1786708860,
    },
  },
  {
    id: 'external-adapter-disabled',
    label: 'Verificación con emisor real (desactivada)',
    description:
      'Simula pedir la verificación a un adaptador externo real. Está desactivado por diseño (kill switch): la demo cae automáticamente al modo determinista.',
    category: 'dependency-down',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRlbW8ta2V5LTEifQ.eyJpc3MiOiJodHRwczovL2lzc3Vlci5kZW1vLmp3dC1sYWIuZGV2Iiwic3ViIjoidXNlcl8xMjM0IiwiYXVkIjoiaHR0cHM6Ly9hcGkuZGVtby5qd3QtbGFiLmRldiIsImlhdCI6MTc4NjcwODgwMCwibmJmIjoxNzg2NzA4ODAwLCJleHAiOjE3ODY3MTI0MDB9.0tqrlLcsEDCGRLk7OsFtdyZKC6ism2zNr4yft1M1fZE',
    fixtureSecret: 'fixture-adapter-demo-secret-do-not-use',
    requiresAdapter: true,
    policy: {
      expectedIssuer: ISSUER,
      expectedAudience: AUDIENCE,
      allowedAlgorithms: ['HS256'],
      requireKid: true,
      clockSkewSeconds: 30,
      referenceTimeEpochSeconds: 1786708860,
    },
  },
] as const

export function findScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((scenario) => scenario.id === id)
}

export const DEFAULT_SCENARIO_ID = 'happy-path'
