import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ResultPanel } from '../../src/ui/ResultPanel'
import type { EngineOutput } from '../../src/contracts/types'

const sampleOutput: EngineOutput = {
  schemaVersion: '1.0.0',
  runId: 'run_happy-path_test1',
  status: 'completed',
  summary: 'No se detectaron problemas. Esta herramienta no certifica seguridad.',
  findings: [
    {
      ruleId: 'algorithm.ok',
      severity: 'info',
      message: 'El algoritmo HS256 está permitido.',
      evidencePath: '$.header.alg',
    },
    {
      ruleId: 'claims.token-expired',
      severity: 'error',
      message: 'El token expiró.',
      suggestion: 'Rechaza el token.',
    },
  ],
  evidence: { rulesVersion: '1.0.0', scenarioId: 'happy-path' },
}

describe('ResultPanel', () => {
  it('muestra el estado vacío antes de ejecutar', () => {
    render(
      <ResultPanel
        phase="idle"
        output={null}
        errorMessage={null}
        onExportJson={vi.fn()}
        onExportMarkdown={vi.fn()}
      />,
    )
    expect(screen.getByText(/Aún no hay resultado/)).toBeInTheDocument()
  })

  it('muestra el resumen, el conteo de severidades y permite abrir un hallazgo', async () => {
    const user = userEvent.setup()
    render(
      <ResultPanel
        phase="completed"
        output={sampleOutput}
        errorMessage={null}
        onExportJson={vi.fn()}
        onExportMarkdown={vi.fn()}
      />,
    )

    expect(screen.getByText(/Estado: Completado\./)).toBeInTheDocument()
    expect(screen.getByText(/1 error\(es\)/)).toBeInTheDocument()

    const summaryButton = screen.getByText('El token expiró.')
    await user.click(summaryButton)
    expect(screen.getByText('Rechaza el token.')).toBeVisible()
  })

  it('invoca los manejadores de exportación al pulsar los botones', async () => {
    const user = userEvent.setup()
    const onExportJson = vi.fn()
    const onExportMarkdown = vi.fn()
    render(
      <ResultPanel
        phase="completed"
        output={sampleOutput}
        errorMessage={null}
        onExportJson={onExportJson}
        onExportMarkdown={onExportMarkdown}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Exportar JSON' }))
    await user.click(screen.getByRole('button', { name: 'Exportar Markdown' }))
    expect(onExportJson).toHaveBeenCalledOnce()
    expect(onExportMarkdown).toHaveBeenCalledOnce()
  })

  it('muestra el mensaje de error tipado cuando la ejecución falla', () => {
    render(
      <ResultPanel
        phase="error"
        output={null}
        errorMessage="No pudimos procesar esta entrada."
        onExportJson={vi.fn()}
        onExportMarkdown={vi.fn()}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos procesar esta entrada.')
  })
})
