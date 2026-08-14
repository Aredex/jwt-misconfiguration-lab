import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Workbench } from '../../src/ui/Workbench'
import { SCENARIOS } from '../../src/fixtures/catalog'

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function baseProps() {
  return {
    scenarios: SCENARIOS,
    selectedScenarioId: 'happy-path',
    onSelectScenario: vi.fn(),
    token: SCENARIOS.find((s) => s.id === 'happy-path')?.token ?? '',
    onTokenChange: vi.fn(),
    isCustomMode: false,
    onToggleCustomMode: vi.fn(),
    customConsentGiven: false,
    onCustomConsentChange: vi.fn(),
    expectedIssuer: '',
    onExpectedIssuerChange: vi.fn(),
    expectedAudience: '',
    onExpectedAudienceChange: vi.fn(),
    phase: 'idle' as const,
    onExecute: vi.fn(),
    onCancel: vi.fn(),
  }
}

describe('Workbench', () => {
  it('lista todos los escenarios y marca el seleccionado', () => {
    render(<Workbench {...baseProps()} />)
    for (const scenario of SCENARIOS) {
      expect(
        screen.getByRole('radio', { name: new RegExp(escapeRegExp(scenario.label)) }),
      ).toBeInTheDocument()
    }
    expect(screen.getByRole('radio', { name: /Camino feliz/ })).toBeChecked()
  })

  it('el botón ejecutar está habilitado con un token de fixture válido', () => {
    render(<Workbench {...baseProps()} />)
    expect(screen.getByRole('button', { name: 'Ejecutar escenario' })).toBeEnabled()
  })

  it('muestra un error de entrada inválida y deshabilita ejecutar con texto mal formado', () => {
    render(<Workbench {...baseProps()} token="no-es-un-jwt" />)
    expect(screen.getByRole('alert')).toHaveTextContent(/Entrada inválida/)
    expect(screen.getByRole('button', { name: 'Ejecutar escenario' })).toBeDisabled()
  })

  it('el modo avanzado exige consentimiento antes de habilitar la ejecución', async () => {
    const user = userEvent.setup()
    const onToggleCustomMode = vi.fn()
    render(
      <Workbench {...baseProps()} isCustomMode token="" onToggleCustomMode={onToggleCustomMode} />,
    )

    expect(screen.getByText(/No pegues tokens reales de producción/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ejecutar escenario' })).toBeDisabled()

    await user.click(screen.getByLabelText('Avanzado: pegar un token propio en vez de un fixture'))
    expect(onToggleCustomMode).toHaveBeenCalledWith(false)
  })

  it('muestra "Cancelar" y deshabilita el botón mientras procesa', () => {
    render(<Workbench {...baseProps()} phase="processing" />)
    expect(screen.getByRole('button', { name: 'Procesando…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled()
  })
})
