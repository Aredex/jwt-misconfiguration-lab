import type { EngineOutput, Finding } from '../contracts/types'
import { redactDeep } from './redact'

/** Forma de exportación (06-modelo-datos.md: "export: runId, summary,
 * findings, assumptions; nunca secretos"). */
export interface ExportPayload {
  readonly runId: string
  readonly scenarioId: string
  readonly rulesVersion: string
  readonly status: EngineOutput['status']
  readonly summary: string
  readonly findings: readonly Finding[]
  readonly assumptions: readonly string[]
  readonly exportedAt: string
  readonly disclaimer: string
}

const DISCLAIMER =
  'Este informe proviene de un laboratorio educativo con tokens ficticios. No certifica la seguridad de ningún sistema real; reporta únicamente los hallazgos de las comprobaciones deterministas ejecutadas.'

export function buildExportPayload(output: EngineOutput): ExportPayload {
  const assumptions = [
    'El tiempo de referencia usado para exp/nbf/iat es determinista (fijado por el escenario), no la hora real del visitante.',
    'La verificación de firma solo cubre algoritmos HMAC (HS256/HS384/HS512) sobre fixtures propios; los algoritmos asimétricos no se verifican criptográficamente en esta demo estática.',
    'Ningún secreto, clave real ni token aportado por el visitante se incluye en este informe.',
  ]

  const payload: ExportPayload = {
    runId: output.runId,
    scenarioId: output.evidence.scenarioId,
    rulesVersion: output.evidence.rulesVersion,
    status: output.status,
    summary: output.summary,
    findings: output.findings,
    assumptions,
    exportedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  }

  return redactDeep(payload)
}

export function exportPayloadToJson(payload: ExportPayload): string {
  return JSON.stringify(payload, null, 2)
}

export function exportPayloadToMarkdown(payload: ExportPayload): string {
  const lines: string[] = []
  lines.push(`# Informe de ejecución — ${payload.scenarioId}`)
  lines.push('')
  lines.push(`- **runId:** ${payload.runId}`)
  lines.push(`- **Estado:** ${payload.status}`)
  lines.push(`- **Versión de reglas:** ${payload.rulesVersion}`)
  lines.push(`- **Exportado:** ${payload.exportedAt}`)
  lines.push('')
  lines.push(`## Resumen`)
  lines.push('')
  lines.push(payload.summary)
  lines.push('')
  lines.push(`## Hallazgos`)
  lines.push('')
  if (payload.findings.length === 0) {
    lines.push('_Sin hallazgos._')
  } else {
    for (const finding of payload.findings) {
      lines.push(`### [${finding.severity.toUpperCase()}] ${finding.ruleId}`)
      lines.push('')
      lines.push(finding.message)
      if (finding.evidencePath) lines.push(`- Evidencia: \`${finding.evidencePath}\``)
      if (finding.suggestion) lines.push(`- Sugerencia: ${finding.suggestion}`)
      lines.push('')
    }
  }
  lines.push(`## Supuestos`)
  lines.push('')
  for (const assumption of payload.assumptions) lines.push(`- ${assumption}`)
  lines.push('')
  lines.push(`---`)
  lines.push('')
  lines.push(`_${payload.disclaimer}_`)
  lines.push('')
  return lines.join('\n')
}
