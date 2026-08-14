import { expect, test } from '@playwright/test'

/**
 * Recorrido principal de 30/90 segundos (03-ux-flujos-y-contenido.md) y
 * sustituto automático de las "cinco pruebas observadas" del playbook de
 * portafolio: no hubo usuarios humanos disponibles, así que este test
 * recorre el camino feliz completo de punta a punta.
 */
test.describe('Camino feliz', () => {
  test('ejecutar el fixture por defecto, abrir un hallazgo, cambiar de escenario y exportar', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'Haz visible lo que normalmente falla en silencio.' }),
    ).toBeVisible()

    const executeButton = page.getByRole('button', { name: 'Ejecutar escenario' })
    await expect(executeButton).toBeEnabled()
    await executeButton.click()

    await expect(page.getByText(/Estado: Completado\./)).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByText(/No se detectaron problemas en las comprobaciones ejecutadas/),
    ).toBeVisible()
    await expect(page.locator('.result-summary')).toContainText('no certifica seguridad')

    // 90s: abrir un hallazgo y revisar su evidencia.
    const firstFinding = page.locator('.finding summary').first()
    await firstFinding.click()
    await expect(page.locator('.finding[open] .finding-body')).toBeVisible()

    // 90s: cambiar de escenario (parámetro distinto) y volver a ejecutar.
    const textarea = page.getByLabel('Token (editable)')
    const original = await textarea.inputValue()
    await page.getByRole('radio', { name: /Audiencia incorrecta/ }).check()
    await expect(textarea).not.toHaveValue(original)
    await executeButton.click()
    await expect(page.getByText(/Se detectaron \d+ error/)).toBeVisible({ timeout: 10_000 })

    // Exportar evidencia sin crear cuenta.
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Exportar JSON' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^jwt-lab-run_wrong-audience_.*\.json$/)
  })
})
