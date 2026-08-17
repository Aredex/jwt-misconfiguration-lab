import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

test('la publicación no emite directivas que bloqueen la indexación', async ({ page }) => {
  const response = await page.goto('/')

  expect(response?.headers()['x-robots-tag'] ?? '').not.toMatch(/noindex/i)
  await expect(page.locator('meta[name="robots"][content*="noindex" i]')).toHaveCount(0)

  const cloudflareHeaders = await readFile(new URL('../public/_headers', import.meta.url), 'utf8')
  expect(cloudflareHeaders).not.toMatch(/^\s*X-Robots-Tag:\s*.*\bnoindex\b/im)
})
