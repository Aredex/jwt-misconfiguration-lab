import { expect, test, type Page } from '@playwright/test'

const MOBILE_VIEWPORT = { width: 390, height: 844 }

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
}

test.use({ viewport: MOBILE_VIEWPORT })

test('la vista móvil no desborda antes ni después del CTA principal', async ({ page }) => {
  await page.goto('/')

  await expectNoHorizontalOverflow(page)

  await page.getByRole('button', { name: 'Ir al laboratorio' }).click()
  await expect(page.getByRole('heading', { name: 'Entrada y escenario' })).toBeInViewport()
  await expectNoHorizontalOverflow(page)
})
