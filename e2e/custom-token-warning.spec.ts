import { expect, test } from '@playwright/test'

/**
 * Riesgo ALTO del proyecto (16-plan-maestro.md): "usuarios pegando tokens
 * reales / mensaje que sugiera seguridad completa". El modo avanzado debe
 * exigir un aviso explícito antes de aceptar un token propio, y el botón de
 * ejecutar debe permanecer deshabilitado hasta que el consentimiento se dé
 * y la entrada sea estructuralmente válida.
 */
test('el modo avanzado exige consentimiento explícito antes de aceptar un token propio', async ({
  page,
}) => {
  await page.goto('/')

  const executeButton = page.getByRole('button', { name: 'Ejecutar escenario' })
  const customToggle = page.getByLabel('Avanzado: pegar un token propio en vez de un fixture')

  await customToggle.check()

  await expect(page.getByText(/No pegues tokens reales de producción/)).toBeVisible()
  await expect(page.getByText(/nunca certifica seguridad/)).toBeVisible()
  await expect(executeButton).toBeDisabled()

  const consentCheckbox = page.getByLabel(
    'Entiendo el aviso y quiero continuar con un token propio',
  )
  await consentCheckbox.check()

  // Sin texto en el campo todavía: sigue deshabilitado.
  await expect(executeButton).toBeDisabled()

  const textarea = page.getByLabel('Token (editable)')
  await textarea.fill('esto-no-es.un-jwt-valido')
  await expect(page.getByRole('alert')).toContainText('Entrada inválida')
  await expect(executeButton).toBeDisabled()
})
