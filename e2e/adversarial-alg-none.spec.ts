import { expect, test } from '@playwright/test'

/**
 * Caso adversarial: ataque "alg: none" (P11-R3, riesgo "algoritmos no
 * soportados" de 08-seguridad-privacidad.md). Debe clasificarse como
 * crítico y nunca aceptarse silenciosamente.
 */
test('el fixture de ataque alg:none se marca como crítico', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('radio', { name: /Ataque "alg: none"/ }).check()
  await page.getByRole('button', { name: 'Ejecutar escenario' }).click()

  await expect(page.getByText(/Se detectaron \d+ hallazgo\(s\) crítico/)).toBeVisible({
    timeout: 10_000,
  })
  await expect(page.getByText(/bypass de autenticación conocido/)).toBeVisible()
  await expect(page.locator('.severity-dot--critical').first()).toBeVisible()
})
