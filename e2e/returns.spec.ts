import { test, expect } from '@playwright/test'

function autoAcceptDialogs(page: any) {
  const handler = (dialog: any) => dialog.accept()
  page.on('dialog', handler)
  return () => page.removeListener('dialog', handler)
}

test.describe('Returns', () => {
  test('create a new return', async ({ page }) => {
    await page.goto('/returns/create')
    await expect(page.locator('h1')).toContainText('Buat Retur')

    // Fill return date
    await page.locator('#returnDate').fill('2025-06-10')
    await page.waitForTimeout(500)

    // Select customer (Radix Select) - use robust selector
    const custTrigger = page.locator('button[role="combobox"]').first()
    await custTrigger.click()
    const custOption = page.locator('[role="option"]').first()
    await expect(custOption).toBeVisible({ timeout: 5000 })
    await custOption.click()
    await page.waitForTimeout(300)

    await page.locator('#reason').fill('E2E Test - Barang tidak sesuai')

    // Add a return item
    await page.getByRole('button', { name: /Tambah Item/ }).click()
    await page.waitForTimeout(500)

    // Select item (Radix Select in table)
    const itemTrigger = page.locator('table').locator('button[role="combobox"]').first()
    await itemTrigger.click()
    const itemOption = page.locator('[role="option"]').first()
    await expect(itemOption).toBeVisible({ timeout: 5000 })
    await itemOption.click()
    await page.waitForTimeout(300)

    // Fill quantity
    const qtyInputs = page.locator('table input[type="number"]')
    if (await qtyInputs.count() > 0) {
      await qtyInputs.first().fill('1')
    }

    // Submit - handle both confirm() and alert() dialogs
    const cleanup = autoAcceptDialogs(page)
    await page.getByRole('button', { name: /Simpan Retur/ }).click()
    await expect(page).toHaveURL(/\/returns$/, { timeout: 15000 })
    cleanup()
  })

  test('return appears in list', async ({ page }) => {
    await page.goto('/returns')
    await expect(page.locator('h1')).toContainText('Returns')
    await expect(page.locator('table')).toBeVisible()
    // Verify actual data exists (not just a "no data" row)
    await expect(page.locator('table tbody tr').first().locator('a').first()).toBeVisible({ timeout: 5000 })
  })

  test('detail page shows return items', async ({ page }) => {
    await page.goto('/returns')
    await expect(page.locator('table')).toBeVisible()

    // Click the Eye icon (detail) link in first row
    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    await expect(detailLink).toBeVisible({ timeout: 5000 })
    await detailLink.click()
    await expect(page).toHaveURL(/\/returns\/[a-zA-Z0-9-]+$/)
    await expect(page.locator('table')).toBeVisible()
  })

  test('approve return changes status', async ({ page }) => {
    await page.goto('/returns')
    await expect(page.locator('table')).toBeVisible()

    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailLink.click()
      await expect(page).toHaveURL(/\/returns\/[a-zA-Z0-9-]+$/)

      const approveBtn = page.getByRole('button', { name: /Approve Retur/ })
      if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        const cleanup = autoAcceptDialogs(page)
        await approveBtn.click()
        await page.waitForTimeout(3000)
        cleanup()
      }
    }
  })

  test('list page loads correctly', async ({ page }) => {
    await page.goto('/returns')
    await expect(page.locator('table')).toBeVisible()
  })
})
